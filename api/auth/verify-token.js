export default function handler(req, res) {
  if (req.method === 'POST') {
    // In a real app, verify JWT
    // For now, assume valid
    res.status(200).json({ valid: true, user: { name: 'Nikola Andrić' } });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}