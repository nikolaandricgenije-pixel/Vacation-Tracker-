import { db } from '../../drizzle/db.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'GET' && action === 'discord') {
    // Discord OAuth redirect
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL;

    if (!CLIENT_ID || !REDIRECT_URI || CLIENT_ID === 'your-discord-client-id-here' || CLIENT_ID.includes('demo') || !/^\d+$/.test(CLIENT_ID)) {
      return res.status(500).json({ error: 'Discord credentials not properly configured. Please set a valid Discord Client ID.' });
    }

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;

    res.redirect(discordAuthUrl);
  } else if (req.method === 'GET' && action === 'logout') {
    // Logout
    res.status(200).json({ message: 'Logged out successfully' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}