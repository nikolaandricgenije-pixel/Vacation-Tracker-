import { db } from '../drizzle/db.js';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // In a real app, you'd get the current user from session/auth
    // For now, we'll check by email from query param (passed from frontend)
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isDiscordLinked = !!user[0].discordId;

    res.status(200).json({
      isDiscordLinked,
      discordUsername: user[0].discordId ? 'Linked' : null, // Could fetch actual username if needed
      user: {
        name: user[0].name,
        email: user[0].email
      }
    });

  } catch (error) {
    console.error('Discord status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}