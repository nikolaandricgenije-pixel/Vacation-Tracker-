import { db } from '../drizzle/db.js';
import { vacationRequests } from '../drizzle/schema.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const requests = await db.select().from(vacationRequests).orderBy(desc(vacationRequests.createdAt));
      res.status(200).json(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  } else if (req.method === 'POST') {
    try {
      const { employeeName, startDate, endDate, days, status, type, notes } = req.body;
      const newRequest = await db.insert(vacationRequests).values({
        employeeName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        status,
        type,
        notes,
      }).returning();
      res.status(201).json(newRequest[0]);
    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({ error: 'Failed to create request' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}