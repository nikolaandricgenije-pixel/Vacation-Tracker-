import { db } from '../drizzle/db.js';
import { users } from '../drizzle/schema.js';

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const allUsers = await db.select().from(users);
      res.status(200).json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'POST') {
    try {
      const newUser = await db.insert(users).values(req.body).returning();
      res.status(201).json(newUser[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}