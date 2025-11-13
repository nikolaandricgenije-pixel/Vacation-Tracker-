const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

import { db } from '../../../drizzle/db.js';
import { users } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === '/api/auth/discord') {
      // Redirect to Discord OAuth
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;
      res.redirect(discordAuthUrl);
    } else if (path === '/api/auth/discord/callback') {
      // Handle callback
      const code = url.searchParams.get('code');
      if (!code) {
        return res.status(400).json({ error: 'No code provided' });
      }

      try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
          }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
          return res.status(400).json({ error: 'Failed to get access token' });
        }

        // Get user info
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        const profile = await userResponse.json();

        // Find or create user in database
        let dbUser = await db.select().from(users).where(eq(users.discordId, profile.id)).limit(1);

        if (dbUser.length === 0) {
          // Create new user
          const newUser = {
            name: profile.username,
            email: profile.email,
            discordId: profile.id,
            roles: ['Employee'],
            vacationDays: 20,
            paidLeaveDays: 7
          };

          if (newUser.email === 'nikola@valens.dev') {
            newUser.roles = ['Admin', 'Employee'];
            newUser.vacationDays = 25;
          }

          const inserted = await db.insert(users).values(newUser).returning();
          dbUser = inserted;
        } else {
          dbUser = dbUser[0];
        }

        // Redirect back to client
        res.redirect(`${CLIENT_URL}?discord_login=success&user_name=${encodeURIComponent(dbUser.name)}&user_email=${encodeURIComponent(dbUser.email)}`);
      } catch (error) {
        console.error('Discord OAuth error:', error);
        res.status(500).json({ error: 'OAuth failed' });
      }
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}