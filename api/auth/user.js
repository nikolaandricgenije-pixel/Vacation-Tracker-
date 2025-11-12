export default function handler(req, res) {
  if (req.method === 'GET') {
    // In a real app, get from session
    // For now, return a user
    res.status(200).json({ name: 'Nikola Andrić', email: 'nikola@valens.dev' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}