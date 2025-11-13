export default function handler(req, res) {
  if (req.method === 'GET') {
    // Redirect to Discord OAuth
    const clientId = process.env.DISCORD_CLIENT_ID || 'your-discord-client-id';
    const redirectUri = `${req.headers.host}/api/auth/discord/callback`;
    const scope = 'identify email';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

    res.redirect(authUrl);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}