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
          case 'vacation-status':
            const discordUserId = user?.id;
            if (!discordUserId) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Could not identify Discord user.',
                  flags: 64
                }
              });
            }

            const dbUser = await db.select().from(users).where(eq(users.discordId, discordUserId)).limit(1);

            if (dbUser.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked to Vacation Tracker. Please login via Discord OAuth first.',
                  flags: 64
                }
              });
            }

            const userData = dbUser[0];

            const approvedRequests = await db.select()
              .from(vacationRequests)
              .where(and(
                eq(vacationRequests.employeeName, userData.name),
                eq(vacationRequests.status, 'Approved')
              ));

            const totalApprovedDays = approvedRequests.reduce((sum, req) => sum + req.days, 0);
            const remainingDays = userData.vacationDays - totalApprovedDays;

            return res.status(200).json({
              type: 4,
              data: {
                embeds: [{
                  title: '🏖️ Vacation Status',
                  description: `**${userData.name}**'s vacation information`,
                  fields: [
                    { name: 'Total Vacation Days', value: userData.vacationDays.toString(), inline: true },
                    { name: 'Used Days', value: totalApprovedDays.toString(), inline: true },
                    { name: 'Remaining Days', value: remainingDays.toString(), inline: true },
                  ],
                  color: 0x00ff00,
                  timestamp: new Date().toISOString(),
                }],
                flags: 64
              }
            });

          case 'request-vacation':
            const startDate = options?.find(opt => opt.name === 'start_date')?.value;
            const endDate = options?.find(opt => opt.name === 'end_date')?.value;
            const days = options?.find(opt => opt.name === 'days')?.value;
            const reason = options?.find(opt => opt.name === 'reason')?.value;

            if (!startDate || !endDate || !days) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Please provide start date, end date, and number of days.',
                  flags: 64
                }
              });
            }

            const discordUserId2 = user?.id;
            const dbUser2 = await db.select().from(users).where(eq(users.discordId, discordUserId2)).limit(1);

            if (dbUser2.length === 0) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Your Discord account is not linked.',
                  flags: 64
                }
              });
            }

            const newRequest = await db.insert(vacationRequests).values({
              employeeName: dbUser2[0].name,
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              days: parseInt(days),
              status: 'Pending',
              type: 'Vacation',
              notes: reason || '',
            }).returning();

            return res.status(200).json({
              type: 4,
              data: {
                content: `✅ Vacation request submitted! ${days} days from ${startDate} to ${endDate}`,
                flags: 64
              }
            });

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

          case 'clock-in':
            const workType = options?.find(opt => opt.name === 'work_type')?.value || 'Office';
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
                .set({ isClockedIn: true, lastClockIn: new Date(), workType })
                .where(eq(timeEntries.id, existingEntry[0].id));
            } else {
              await db.insert(timeEntries).values({
                employeeName: dbUser4[0].name,
                date: today,
                workType,
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
                content: `✅ Clocked in successfully! Work type: ${workType}`,
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
