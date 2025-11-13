const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!CLIENT_ID || !REDIRECT_URI || CLIENT_ID === 'your-discord-client-id-here' || CLIENT_ID.includes('demo') || !/^\d+$/.test(CLIENT_ID)) {
    return res.status(500).json({ error: 'Discord credentials not properly configured. Please set a valid Discord Client ID.' });
  }

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;
  
  res.redirect(discordAuthUrl);
}
