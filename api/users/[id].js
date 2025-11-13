import { db } from '../../drizzle/db.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { firstName, lastName, vacationDays, paidLeaveDays } = req.body;

      const updatedUser = await db.update(users)
        .set({
          firstName,
          lastName,
          vacationDays,
          paidLeaveDays,
        })
        .where(eq(users.id, parseInt(id)))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(updatedUser[0]);
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}