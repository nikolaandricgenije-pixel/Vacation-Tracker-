const { db } = require('../../drizzle/db.js');
const { users, vacationRequests, timeEntries } = require('../../drizzle/schema.js');
const { eq, and, gte, lt } = require('drizzle-orm');
const { webcrypto } = require('crypto');
const {
  normalizeDbTimeEntry,
  serializeIntervalsForStorage,
  startOfDayLocal,
} = require('../../lib/server/timeEntries.js');

const getDiscordUserId = (interaction) =>
  interaction?.user?.id || interaction?.member?.user?.id || interaction?.member?.id || null;

const getTodayRange = () => {
  const start = startOfDayLocal(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

async function findLinkedUser(discordUserId) {
  if (!discordUserId) {
    return null;
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordUserId))
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

async function findTodayEntry(employeeName) {
  if (!employeeName) {
    return null;
  }

  const { start, end } = getTodayRange();

  const rows = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.employeeName, employeeName),
        gte(timeEntries.date, start),
        lt(timeEntries.date, end)
      )
    )
    .limit(1);

  return rows.length > 0 ? normalizeDbTimeEntry(rows[0]) : null;
}

async function verifySignature(publicKey, signature, message) {
  try {
    const publicKeyBytes = Buffer.from(publicKey, 'hex');
    const signatureBytes = Buffer.from(signature, 'hex');
    const messageBytes = Buffer.from(message, 'utf8');

    const key = await webcrypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519'
      },
      false,
      ['verify']
    );

    const isValid = await webcrypto.subtle.verify(
      'Ed25519',
      key,
      signatureBytes,
      messageBytes
    );

    return isValid;
  } catch (error) {
    console.error('[DISCORD] Signature verification error:', error);
    return false;
  }
}

module.exports = async function handler(req, res) {
  // Handle Discord endpoint verification (GET request)
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Discord interactions endpoint is active' });
  }

  if (req.method === 'POST') {
    try {
      const { type, data } = req.body;

      const interactionUserId = getDiscordUserId(req.body);

      const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
      if (!PUBLIC_KEY) {
        console.error('[DISCORD] Missing DISCORD_PUBLIC_KEY');
        return res.status(401).json({ error: 'Discord public key not configured' });
      }

      const signature = req.headers['x-signature-ed25519'];
      const timestamp = req.headers['x-signature-timestamp'];

      console.log('[DISCORD] Headers check:', {
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        signature: signature?.substring(0, 10) + '...',
        timestamp
      });

      if (!signature || !timestamp) {
        console.error('[DISCORD] Missing signature headers');
        return res.status(401).json({ error: 'Missing signature headers' });
      }

      const message = timestamp + JSON.stringify(req.body);
      console.log('[DISCORD] Verifying signature for message length:', message.length);

      const isValid = await verifySignature(PUBLIC_KEY, signature, message);

      if (!isValid) {
        console.error('[DISCORD] Invalid signature - this is a security issue');
        return res.status(401).json({ error: 'Invalid request signature' });
      }

      console.log('[DISCORD] Request signature verified successfully');

      if (type === 1) {
        return res.status(200).json({ type: 1 });
      }

      if (type === 2 && data) {
        const { name, options } = data;

        switch (name) {

          case 'check-hours':
            const linkedUser = await findLinkedUser(interactionUserId);

            if (!linkedUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + 1);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const weekEntriesRaw = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, linkedUser.name),
                gte(timeEntries.date, weekStart),
                lt(timeEntries.date, weekEnd)
              ));

            const weekEntries = weekEntriesRaw
              .map(normalizeDbTimeEntry)
              .filter((entry) => entry !== null);

            const totalMinutes = weekEntries.reduce((sum, entry) => sum + entry.totalWorkingMinutes, 0);
            const totalHours = Math.floor(totalMinutes / 60);
            const overtimeThreshold = parseInt(process.env.OVERTIME_THRESHOLD_HOURS || '40');

            return res.status(200).json({
              type: 4,
              data: {
                embeds: [{
                  title: '⏰ Weekly Hours Summary',
                  description: `${linkedUser.name}'s hours this week`,
                  fields: [
                    { name: 'Total Hours', value: `${totalHours}h ${totalMinutes % 60}m`, inline: true },
                    { name: 'Overtime', value: totalHours > overtimeThreshold ? `${totalHours - overtimeThreshold}h` : 'None', inline: true },
                    { name: 'Week Start', value: weekStart.toLocaleDateString(), inline: true },
                  ],
                  color: totalHours > overtimeThreshold ? 0xffa500 : 0x00ff00,
                  timestamp: new Date().toISOString(),
                }],
                flags: 64
              }
            });

          case 'wfo':
            const officeUser = await findLinkedUser(interactionUserId);

            if (!officeUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const existingEntry = await findTodayEntry(officeUser.name);

            if (existingEntry && existingEntry.isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are already clocked in today!',
                  flags: 64
                }
              });
            }

            if (existingEntry) {
              await db.update(timeEntries)
                .set({ isClockedIn: true, lastClockIn: new Date(), workType: 'Office' })
                .where(eq(timeEntries.id, existingEntry.id));
            } else {
              const today = startOfDayLocal(new Date());
              await db.insert(timeEntries).values({
                employeeName: officeUser.name,
                date: today,
                workType: 'Office',
                isClockedIn: true,
                lastClockIn: new Date(),
                breaks: serializeIntervalsForStorage([]),
                offs: serializeIntervalsForStorage([]),
                totalWorkingMinutes: 0,
              });
            }

            return res.status(200).json({
              type: 4,
              data: {
                content: `✅ Clocked in successfully! Work from office`,
                flags: 64
              }
            });

          case 'wfh':
            const homeUser = await findLinkedUser(interactionUserId);

            if (!homeUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const existingEntryb = await findTodayEntry(homeUser.name);

            if (existingEntryb && existingEntryb.isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are already clocked in today!',
                  flags: 64
                }
              });
            }

            if (existingEntryb) {
              await db.update(timeEntries)
                .set({ isClockedIn: true, lastClockIn: new Date(), workType: 'Home' })
                .where(eq(timeEntries.id, existingEntryb.id));
            } else {
              const today = startOfDayLocal(new Date());
              await db.insert(timeEntries).values({
                employeeName: homeUser.name,
                date: today,
                workType: 'Home',
                isClockedIn: true,
                lastClockIn: new Date(),
                breaks: serializeIntervalsForStorage([]),
                offs: serializeIntervalsForStorage([]),
                totalWorkingMinutes: 0,
              });
            }

            return res.status(200).json({
              type: 4,
              data: {
                content: `✅ Clocked in successfully! Work from home`,
                flags: 64
              }
            });

          case 'clock-out':
            const clockOutUser = await findLinkedUser(interactionUserId);

            if (!clockOutUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const currentEntry = await findTodayEntry(clockOutUser.name);

            if (!currentEntry || !currentEntry.isClockedIn || !currentEntry.lastClockIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            const clockOut = new Date();
            const sessionMinutes = Math.floor((clockOut.getTime() - currentEntry.lastClockIn.getTime()) / (1000 * 60));
            const newTotal = currentEntry.totalWorkingMinutes + sessionMinutes;

            await db.update(timeEntries)
              .set({ isClockedIn: false, totalWorkingMinutes: newTotal, lastClockIn: null })
              .where(eq(timeEntries.id, currentEntry.id));

            return res.status(200).json({
              type: 4,
              data: {
                content: `✅ Clocked out! Session: ${Math.floor(sessionMinutes / 60)}h ${sessionMinutes % 60}m`,
                flags: 64
              }
            });

          case 'start-off':
            const startOffUser = await findLinkedUser(interactionUserId);

            if (!startOffUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const entry2 = await findTodayEntry(startOffUser.name);

            if (!entry2 || !entry2.isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            if (entry2.offs.some(o => !o.end)) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are already in off-duty mode!',
                  flags: 64
                }
              });
            }

            const updatedOffs = serializeIntervalsForStorage([
              ...entry2.offs,
              { start: new Date() },
            ]);

            await db.update(timeEntries)
              .set({ offs: updatedOffs })
              .where(eq(timeEntries.id, entry2.id));

            return res.status(200).json({
              type: 4,
              data: {
                content: '⏸️ Started off-duty period. Timer paused.',
                flags: 64
              }
            });

          case 'end-off':
            const endOffUser = await findLinkedUser(interactionUserId);

            if (!endOffUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const entry3 = await findTodayEntry(endOffUser.name);

            if (!entry3 || !entry3.isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            const offs = [...entry3.offs];
            const lastOff = offs[offs.length - 1];

            if (!lastOff || lastOff.end) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not in off-duty mode!',
                  flags: 64
                }
              });
            }

            lastOff.end = new Date();

            await db.update(timeEntries)
              .set({ offs: serializeIntervalsForStorage(offs) })
              .where(eq(timeEntries.id, entry3.id));

            return res.status(200).json({
              type: 4,
              data: {
                content: '▶️ Ended off-duty period. Timer resumed.',
                flags: 64
              }
            });

          case 'off-sick':
            const sickReason = options?.find(opt => opt.name === 'reason')?.value || 'Not specified';
            const sickUser = await findLinkedUser(interactionUserId);

            if (!sickUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            // Create a sick leave request
            const today5 = new Date();
            await db.insert(vacationRequests).values({
              employeeName: sickUser.name,
              startDate: today5,
              endDate: today5, // Single day for now, can be extended
              days: 1,
              status: 'Approved', // Auto-approve sick leave
              type: 'SickLeave',
              notes: `Reported via Discord: ${sickReason}`,
            });

            return res.status(200).json({
              type: 4,
              data: {
                content: `🤒 Sick leave reported successfully. Reason: ${sickReason}`,
                flags: 64
              }
            });

          case 'break':
            const breakUser = await findLinkedUser(interactionUserId);

            if (!breakUser) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const entry4 = await findTodayEntry(breakUser.name);

            if (!entry4 || !entry4.isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            if (entry4.breaks.some(b => !b.end)) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are already on break!',
                  flags: 64
                }
              });
            }

            const breakStart = new Date();
            const breakEnd = new Date(breakStart.getTime() + 60 * 60 * 1000); // 60 minutes

            const updatedBreaks = serializeIntervalsForStorage([
              ...entry4.breaks,
              { start: breakStart, end: breakEnd },
            ]);

            await db.update(timeEntries)
              .set({ breaks: updatedBreaks })
              .where(eq(timeEntries.id, entry4.id));

            return res.status(200).json({
              type: 4,
              data: {
                content: '☕ Started 60-minute break. Will automatically end at ' + breakEnd.toLocaleTimeString(),
                flags: 64
              }
            });

          case 'who-is-online':
            try {
              // Get today's date
              const today = startOfDayLocal(new Date());
              const tomorrow = startOfDayLocal(new Date(today.getTime() + 24 * 60 * 60 * 1000));

              // Get all time entries for today
              const todayEntriesRaw = await db.select()
                .from(timeEntries)
                .where(and(
                  gte(timeEntries.date, today),
                  lt(timeEntries.date, tomorrow)
                ));

              const todayEntries = todayEntriesRaw
                .map(normalizeDbTimeEntry)
                .filter((entry) => entry !== null);

              // Get all users to map names
              const allUsers = await db.select().from(users);

              // Create user map for quick lookup
              const userMap = new Map(allUsers.map(user => [user.name, user]));

              // Categorize users
              const workingUsers = [];
              const breakUsers = [];
              const offUsers = [];

              todayEntries.forEach(entry => {
                const userRecord = userMap.get(entry.employeeName);
                const userName = userRecord?.name || entry.employeeName;

                if (entry.isClockedIn) {
                  const activeBreak = entry.breaks.find(b => !b.end);
                  const activeOff = entry.offs.find(o => !o.end);

                  if (activeBreak) {
                    // On break
                    breakUsers.push({
                      name: userName,
                      workType: entry.workType,
                      breakStart: activeBreak.start
                    });
                  } else if (activeOff) {
                    // Off duty
                    offUsers.push({
                      name: userName,
                      workType: entry.workType,
                      offStart: activeOff.start
                    });
                  } else {
                    // Actively working
                    workingUsers.push({
                      name: userName,
                      workType: entry.workType,
                      clockedInAt: entry.lastClockIn ? entry.lastClockIn.toLocaleTimeString() : 'Unknown'
                    });
                  }
                }
              });

              // Build response
              let content = '**👥 Team Status Today**\n\n';

              if (workingUsers.length > 0) {
                content += `**🟢 Currently Working:**\n${workingUsers.map(u => `• ${u.name} (${u.workType}) - Since ${u.clockedInAt}`).join('\n')}\n\n`;
              } else {
                content += '**🟢 Currently Working:**\n• No one currently working\n\n';
              }

              if (breakUsers.length > 0) {
                content += `**☕ On Break:**\n${breakUsers.map(u => `• ${u.name} (${u.workType}) - Break started ${u.breakStart ? u.breakStart.toLocaleTimeString() : 'Unknown'}`).join('\n')}\n\n`;
              }

              if (offUsers.length > 0) {
                content += `**⏸️ Off Duty:**\n${offUsers.map(u => `• ${u.name} (${u.workType}) - Off since ${u.offStart ? u.offStart.toLocaleTimeString() : 'Unknown'}`).join('\n')}\n\n`;
              }

              content += `*Total active today: ${workingUsers.length + breakUsers.length + offUsers.length} team members*`;

              return res.status(200).json({
                type: 4,
                data: {
                  embeds: [{
                    title: '👥 Team Online Status',
                    description: content,
                    color: 0x00ff00,
                    timestamp: new Date().toISOString(),
                    footer: {
                      text: 'Vacation Tracker'
                    }
                  }],
                  flags: 64
                }
              });

            } catch (error) {
              console.error('Error fetching online users:', error);
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ Error fetching team status. Please try again later.',
                  flags: 64
                }
              });
            }

          default:
            return res.status(200).json({
              type: 4,
              data: {
                content: 'Unknown command.',
                flags: 64
              }
            });
        }
      }

      res.status(400).json({ error: 'Invalid interaction type' });
    } catch (error) {
      console.error('Discord interaction error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

