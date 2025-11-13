export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { code } = req.query;

    if (code) {
      try {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        const redirectUri = `https://${req.headers.host}/api/auth/discord/callback`;

        if (!clientId || !clientSecret) {
          return res.status(500).json({ error: 'Discord credentials not configured' });
        }

        // Exchange code for access token
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
          return res.status(500).json({ error: 'Failed to get Discord token' });
        }

        // Get user info
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
          console.error('Discord user fetch failed:', userData);
          return res.status(500).json({ error: 'Failed to get Discord user' });
        }

        // Store Discord connection in database
        const { db } = require('../../../drizzle/db.js');
        const { users } = require('../../../drizzle/schema.js');
        const { eq } = require('drizzle-orm');

        // Find or create user
        let user = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);

        if (user.length === 0) {
          // Create new user
          const newUser = await db.insert(users).values({
            name: userData.username,
            email: userData.email,
            roles: ['Employee'],
            vacationDays: 20,
            paidLeaveDays: 7,
          }).returning();
          user = newUser;
        }

        // Update with Discord ID
        await db.update(users)
          .set({ discordId: userData.id })
          .where(eq(users.id, user[0].id));

        // Redirect to frontend with success
        const frontendUrl = `https://${req.headers.host}?discord_login=success&user_email=${encodeURIComponent(userData.email)}`;
        res.redirect(frontendUrl);

      } catch (error) {
        console.error('Discord OAuth error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(400).json({ error: 'No code provided' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}