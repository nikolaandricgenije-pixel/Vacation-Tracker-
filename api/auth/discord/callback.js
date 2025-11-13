import { db } from '../../drizzle/db.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = process.env.DISCORD_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Discord credentials');
      return res.status(500).json({ error: 'Discord credentials not configured' });
    }

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Discord token exchange failed:', tokenData);
      return res.status(500).json({ error: 'Failed to get Discord token', details: tokenData });
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Discord user fetch failed:', userData);
      return res.status(500).json({ error: 'Failed to get Discord user', details: userData });
    }

    let user = await db.select().from(users).where(eq(users.discordId, userData.id)).limit(1);

    if (user.length === 0) {
      const newUser = {
        name: userData.username,
        email: userData.email || `${userData.username}@discord.user`,
        discordId: userData.id,
        roles: ['Employee'],
        vacationDays: 20,
        paidLeaveDays: 7,
      };

      if (newUser.email === 'nikola@valens.dev') {
        newUser.roles = ['Admin', 'Employee'];
        newUser.vacationDays = 25;
      }

      const inserted = await db.insert(users).values(newUser).returning();
      user = inserted;
    } else {
      user = user[0];
    }

    const clientUrl = process.env.CLIENT_URL || `https://${req.headers.host}`;
    const frontendUrl = `${clientUrl}?discord_login=success&user_email=${encodeURIComponent(user.email)}`;
    
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('Discord OAuth error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
