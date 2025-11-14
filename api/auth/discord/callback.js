import { db } from '../../../drizzle/db.js';
import { users } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

module.exports = async function handler(req, res) {
  console.log('[DEBUG] Discord callback initiated with query:', req.query);

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { code } = req.query;

  if (!code) {
    console.error('[DEBUG] No authorization code provided in callback');
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    console.log('[DEBUG] Starting Discord OAuth callback process');

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = process.env.DISCORD_CALLBACK_URL;

    console.log('[DEBUG] Environment variables check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
      redirectUri,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing'
    });

    if (!process.env.DATABASE_URL) {
      console.error('[DEBUG] DATABASE_URL is missing!');
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('[DEBUG] Missing Discord credentials');
      return res.status(500).json({ error: 'Discord credentials not configured' });
    }

    console.log('[DEBUG] Exchanging code for token...');
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
    console.log('[DEBUG] Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      console.error('[DEBUG] Discord token exchange failed:', tokenData);
      return res.status(500).json({ error: 'Failed to get Discord token', details: tokenData });
    }

    console.log('[DEBUG] Fetching Discord user data...');
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    console.log('[DEBUG] Discord user data received for:', userData.username);

    if (!userResponse.ok) {
      console.error('[DEBUG] Discord user fetch failed:', userData);
      return res.status(500).json({ error: 'Failed to get Discord user', details: userData });
    }

    console.log('[DEBUG] Looking up user with Discord ID:', userData.id);
    let user = await db.select().from(users).where(eq(users.discordId, userData.id)).limit(1);
    console.log('[DEBUG] User lookup by Discord ID result:', user.length > 0 ? `Found user: ${user[0].name}` : 'No user found');

    if (user.length === 0) {
      if (userData.email) {
        console.log('[DEBUG] Checking for existing user with email:', userData.email);
        const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
        
        if (existingUser.length > 0) {
          console.log('[DEBUG] Found existing user by email, linking with Discord ID');
          
          const updatedUsers = await db.update(users)
            .set({ discordId: userData.id })
            .where(eq(users.email, userData.email))
            .returning();
          
          user = updatedUsers;
          console.log('[DEBUG] User linked with Discord ID:', user[0].name);
        }
      }

      if (user.length === 0) {
        const newUser = {
          name: userData.username || userData.global_name || `DiscordUser${userData.id.slice(-4)}`,
          email: userData.email || `${userData.id}@discord.local`,
          discordId: userData.id,
          roles: ['Employee'],
          vacationDays: parseInt(process.env.DEFAULT_VACATION_DAYS || '20'),
          paidLeaveDays: parseInt(process.env.DEFAULT_PAID_LEAVE_DAYS || '7'),
        };

        console.log('[DEBUG] Creating new Discord user:', newUser.name, newUser.email);

        if (newUser.email === 'nikola@valens.dev' || userData.email === 'nikola@valens.dev') {
          newUser.roles = ['Admin', 'Employee'];
          newUser.vacationDays = 25;
          console.log('[DEBUG] Granting admin privileges');
        }

        try {
          const inserted = await db.insert(users).values(newUser).returning();
          user = inserted;
          console.log('[DEBUG] New Discord user created successfully:', user[0].name);
        } catch (dbError) {
          console.error('[DEBUG] Database error creating user:', dbError);
          
          if (dbError.code === '23505') {
            console.log('[DEBUG] Race condition detected - user was created by another request');
            const existingUser = await db.select().from(users).where(eq(users.discordId, userData.id)).limit(1);
            if (existingUser.length > 0) {
              user = existingUser;
            } else {
              return res.status(500).json({ error: 'Failed to create user account - duplicate detected' });
            }
          } else {
            return res.status(500).json({ error: 'Failed to create user account' });
          }
        }
      }
    }

    const userRecord = Array.isArray(user) ? user[0] : user;
    
    if (!userRecord) {
      console.error('[DEBUG] No user object after all attempts');
      return res.status(500).json({ error: 'Failed to find or create user' });
    }
    
    console.log('[DEBUG] Final user for login:', userRecord.name, userRecord.email);

    const clientUrl = process.env.CLIENT_URL || `https://${req.headers.host}`;
    const frontendUrl = `${clientUrl}?discord_login=success&user_email=${encodeURIComponent(userRecord.email)}`;
    console.log('[DEBUG] Redirecting to frontend with user:', userRecord.name);

    res.redirect(frontendUrl);

  } catch (error) {
    console.error('Discord OAuth error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
