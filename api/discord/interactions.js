export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { type, data, member, user } = req.body;

      // Verify Discord request (in production, verify signature)
      const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
      if (!PUBLIC_KEY) {
        return res.status(401).json({ error: 'Discord public key not configured' });
      }

      // Handle ping
      if (type === 1) {
        return res.status(200).json({ type: 1 });
      }

      // Handle slash commands
      if (type === 2 && data) {
        const { name, options } = data;

        switch (name) {
          case 'vacation-status':
            // Get user's vacation status
            const discordUserId = user?.id;
            if (!discordUserId) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: 'Could not identify Discord user.',
                  flags: 64 // Ephemeral
                }
              });
            }

            // Find user in database
            const { db } = require('../../../drizzle/db.js');
            const { users, vacationRequests } = require('../../../drizzle/schema.js');
            const { eq, and, gte } = require('drizzle-orm');

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

            // Get approved vacation days
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
                flags: 64 // Ephemeral
              }
            });

          case 'request-vacation':
            // Handle vacation request command
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

            // Create vacation request
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
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}