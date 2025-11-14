export function ensureDiscordConfig() {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL;
import { db } from '../../drizzle/db.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

  if (!CLIENT_ID || !REDIRECT_URI || CLIENT_ID === 'your-discord-client-id-here' || CLIENT_ID.includes('demo') || !/^\d+$/.test(CLIENT_ID)) {
    return {
      ok: false,
      error: 'Discord credentials not properly configured. Please set a valid Discord Client ID.',
      status: 500
    };
  }

  return {
    ok: true,
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    url: `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`
  };
}

export async function handleDiscordRedirect(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const config = ensureDiscordConfig();

  if (!config.ok) {
    return res.status(config.status).json({ error: config.error });
  }

  return res.redirect(config.url);
}

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'GET' && action === 'discord') {
    return handleDiscordRedirect(req, res);
  } else if (req.method === 'GET' && action === 'logout') {
    // Logout
    res.status(200).json({ message: 'Logged out successfully' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
