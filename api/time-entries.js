import { db } from './drizzle/db.js';
import { timeEntries } from './drizzle/schema.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const entries = await db.select().from(timeEntries);

    // Convert Date objects to ISO strings for JSON response
    const serializedEntries = entries.map(entry => ({
      ...entry,
      date: entry.date.toISOString().split('T')[0], // YYYY-MM-DD format
      lastClockIn: entry.lastClockIn ? entry.lastClockIn.toISOString() : null,
      breaks: entry.breaks.map(b => ({
        start: b.start.toISOString(),
        end: b.end ? b.end.toISOString() : null,
      })),
      offs: entry.offs.map(o => ({
        start: o.start.toISOString(),
        end: o.end ? o.end.toISOString() : null,
      })),
    }));

    res.status(200).json(serializedEntries);
  } catch (error) {
    console.error('Time entries fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}