export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { code } = req.query;

    if (code) {
      // In a real app, exchange code for token and get user info
      // For now, simulate
      const discordToken = 'simulated-discord-token-' + Date.now();
      const userName = 'Discord User'; // Simulate
      const userEmail = 'user@discord.com';

      // Redirect to frontend with params
      const frontendUrl = `https://${req.headers.host}?discord_token=${discordToken}&user_name=${encodeURIComponent(userName)}&user_email=${userEmail}`;
      res.redirect(frontendUrl);
    } else {
      res.status(400).json({ error: 'No code provided' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}