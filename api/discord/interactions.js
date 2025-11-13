import { db } from '../drizzle/db.js';
import { users, vacationRequests, timeEntries } from '../drizzle/schema.js';
import { eq, and, gte } from 'drizzle-orm';
import { webcrypto } from 'crypto';

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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { type, data, member, user } = req.body;

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
            const discordUserId3 = user?.id;
            const dbUser3 = await db.select().from(users).where(eq(users.discordId, discordUserId3)).limit(1);

            if (dbUser3.length === 0) {
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

            const weekEntries = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, dbUser3[0].name),
                gte(timeEntries.date, weekStart)
              ));

            const totalMinutes = weekEntries.reduce((sum, entry) => sum + entry.totalWorkingMinutes, 0);
            const totalHours = Math.floor(totalMinutes / 60);
            const overtimeThreshold = parseInt(process.env.OVERTIME_THRESHOLD_HOURS || '40');

            return res.status(200).json({
              type: 4,
              data: {
                embeds: [{
                  title: '⏰ Weekly Hours Summary',
                  description: `${dbUser3[0].name}'s hours this week`,
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
            const discordUserId4 = user?.id;
            const dbUser4 = await db.select().from(users).where(eq(users.discordId, discordUserId4)).limit(1);

            if (dbUser4.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existingEntry = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, dbUser4[0].name),
                eq(timeEntries.date, today)
              )).limit(1);

            if (existingEntry.length > 0 && existingEntry[0].isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are already clocked in today!',
                  flags: 64
                }
              });
            }

            if (existingEntry.length > 0) {
              await db.update(timeEntries)
                .set({ isClockedIn: true, lastClockIn: new Date(), workType: 'Office' })
                .where(eq(timeEntries.id, existingEntry[0].id));
            } else {
              await db.insert(timeEntries).values({
                employeeName: dbUser4[0].name,
                date: today,
                workType: 'Office',
                isClockedIn: true,
                lastClockIn: new Date(),
                breaks: [],
                offs: [],
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
            const discordUserId4b = user?.id;
            const dbUser4b = await db.select().from(users).where(eq(users.discordId, discordUserId4b)).limit(1);

            if (dbUser4b.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const todayb = new Date();
            todayb.setHours(0, 0, 0, 0);
            const existingEntryb = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, dbUser4b[0].name),
                eq(timeEntries.date, todayb)
              )).limit(1);

            if (existingEntryb.length > 0 && existingEntryb[0].isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are already clocked in today!',
                  flags: 64
                }
              });
            }

            if (existingEntryb.length > 0) {
              await db.update(timeEntries)
                .set({ isClockedIn: true, lastClockIn: new Date(), workType: 'Home' })
                .where(eq(timeEntries.id, existingEntryb[0].id));
            } else {
              await db.insert(timeEntries).values({
                employeeName: dbUser4b[0].name,
                date: todayb,
                workType: 'Home',
                isClockedIn: true,
                lastClockIn: new Date(),
                breaks: [],
                offs: [],
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
            const discordUserId5 = user?.id;
            const dbUser5 = await db.select().from(users).where(eq(users.discordId, discordUserId5)).limit(1);

            if (dbUser5.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const today2 = new Date();
            today2.setHours(0, 0, 0, 0);
            const entry = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, dbUser5[0].name),
                eq(timeEntries.date, today2)
              )).limit(1);

            if (entry.length === 0 || !entry[0].isClockedIn || !entry[0].lastClockIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            const clockOut = new Date();
            const sessionMinutes = Math.floor((clockOut.getTime() - entry[0].lastClockIn.getTime()) / (1000 * 60));
            const newTotal = entry[0].totalWorkingMinutes + sessionMinutes;

            await db.update(timeEntries)
              .set({ isClockedIn: false, totalWorkingMinutes: newTotal })
              .where(eq(timeEntries.id, entry[0].id));

            return res.status(200).json({
              type: 4,
              data: {
                content: `✅ Clocked out! Session: ${Math.floor(sessionMinutes / 60)}h ${sessionMinutes % 60}m`,
                flags: 64
              }
            });

          case 'start-off':
            const discordUserId6 = user?.id;
            const dbUser6 = await db.select().from(users).where(eq(users.discordId, discordUserId6)).limit(1);

            if (dbUser6.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const today3 = new Date();
            today3.setHours(0, 0, 0, 0);
            const entry2 = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, dbUser6[0].name),
                eq(timeEntries.date, today3)
              )).limit(1);

            if (entry2.length === 0 || !entry2[0].isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            if (entry2[0].offs.some(o => !o.end)) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are already in off-duty mode!',
                  flags: 64
                }
              });
            }

            await db.update(timeEntries)
              .set({ offs: [...entry2[0].offs, { start: new Date() }] })
              .where(eq(timeEntries.id, entry2[0].id));

            return res.status(200).json({
              type: 4,
              data: {
                content: '⏸️ Started off-duty period. Timer paused.',
                flags: 64
              }
            });

          case 'end-off':
            const discordUserId7 = user?.id;
            const dbUser7 = await db.select().from(users).where(eq(users.discordId, discordUserId7)).limit(1);

            if (dbUser7.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const today4 = new Date();
            today4.setHours(0, 0, 0, 0);
            const entry3 = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, dbUser7[0].name),
                eq(timeEntries.date, today4)
              )).limit(1);

            if (entry3.length === 0 || !entry3[0].isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            const offs = [...entry3[0].offs];
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
              .set({ offs })
              .where(eq(timeEntries.id, entry3[0].id));

            return res.status(200).json({
              type: 4,
              data: {
                content: '▶️ Ended off-duty period. Timer resumed.',
                flags: 64
              }
            });

          case 'off-sick':
            const sickReason = options?.find(opt => opt.name === 'reason')?.value || 'Not specified';
            const discordUserId8 = user?.id;
            const dbUser8 = await db.select().from(users).where(eq(users.discordId, discordUserId8)).limit(1);

            if (dbUser8.length === 0) {
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
              employeeName: dbUser8[0].name,
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
            const discordUserId9 = user?.id;
            const dbUser9 = await db.select().from(users).where(eq(users.discordId, discordUserId9)).limit(1);

            if (dbUser9.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const today6 = new Date();
            today6.setHours(0, 0, 0, 0);
            const entry4 = await db.select()
              .from(timeEntries)
              .where(and(
                eq(timeEntries.employeeName, dbUser9[0].name),
                eq(timeEntries.date, today6)
              )).limit(1);

            if (entry4.length === 0 || !entry4[0].isClockedIn) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ You are not clocked in today!',
                  flags: 64
                }
              });
            }

            if (entry4[0].breaks.some(b => !b.end)) {
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

            await db.update(timeEntries)
              .set({ breaks: [...entry4[0].breaks, { start: breakStart, end: breakEnd }] })
              .where(eq(timeEntries.id, entry4[0].id));

            return res.status(200).json({
              type: 4,
              data: {
                content: '☕ Started 60-minute break. Will automatically end at ' + breakEnd.toLocaleTimeString(),
                flags: 64
              }
            });

          case 'who-is-online':
            // Get all users who are currently clocked in
            const allTimeEntries = await db.select().from(timeEntries);
            const onlineUsers = [];

            for (const entry of allTimeEntries) {
              const entryDate = new Date(entry.date);
              const today6 = new Date();
              today6.setHours(0, 0, 0, 0);

              if (entryDate.getTime() === today6.getTime() && entry.isClockedIn) {
                const userInfo = await db.select().from(users).where(eq(users.name, entry.employeeName)).limit(1);
                if (userInfo.length > 0) {
                  onlineUsers.push({
                    name: entry.employeeName,
                    workType: entry.workType,
                    clockedInAt: entry.lastClockIn ? new Date(entry.lastClockIn).toLocaleTimeString() : 'Unknown'
                  });
                }
              }
            }

            if (onlineUsers.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '👥 No one is currently clocked in.',
                  flags: 64
                }
              });
            }

            const onlineList = onlineUsers.map(u => `• ${u.name} (${u.workType}) - Since ${u.clockedInAt}`).join('\n');

            return res.status(200).json({
              type: 4,
              data: {
                embeds: [{
                  title: '👥 Currently Online',
                  description: onlineList,
                  color: 0x00ff00,
                  timestamp: new Date().toISOString(),
                }],
                flags: 64
              }
            });

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
