export default function handler(req, res) {
  if (req.method === 'GET') {
    const { code } = req.query;

    if (code) {
      // In a real app, exchange code for token
      // For now, simulate
      const ssoToken = 'simulated-sso-token-' + Date.now();
      const userName = 'Nikola Andrić'; // Simulate
      const userEmail = 'nikola@valens.dev';

      // Redirect to frontend with params
      const frontendUrl = `https://${req.headers.host}?sso_token=${ssoToken}&user_name=${encodeURIComponent(userName)}&user_email=${userEmail}`;
      res.redirect(frontendUrl);
    } else {
      res.status(400).json({ error: 'No code provided' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}