export default function handler(req, res) {
  if (req.method === 'GET') {
    // In serverless, no session to destroy, just return success
    res.status(200).json({ success: true, message: 'Logged out' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}