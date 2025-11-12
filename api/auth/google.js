export default function handler(req, res) {
  if (req.method === 'GET') {
    // Redirect to Google OAuth
    const clientId = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
    const redirectUri = `${req.headers.host}/api/auth/google/callback`;
    const scope = 'profile email';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline`;

    res.redirect(authUrl);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}