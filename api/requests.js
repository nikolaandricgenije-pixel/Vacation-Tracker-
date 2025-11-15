const { db } = require('../drizzle/db.js');
const { vacationRequests } = require('../drizzle/schema.js');
const { desc } = require('drizzle-orm');

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const requests = await db.select().from(vacationRequests).orderBy(desc(vacationRequests.createdAt));
      res.status(200).json(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { employeeName, startDate, endDate, days, status, type, notes } = req.body ?? {};

      if (!employeeName || typeof employeeName !== 'string') {
        return res.status(400).json({ error: 'employeeName is required.' });
      }

      const parsedStart = parseDate(startDate);
      const parsedEnd = parseDate(endDate);
      if (!parsedStart || !parsedEnd) {
        return res.status(400).json({ error: 'startDate and endDate must be valid ISO dates.' });
      }

      const totalDays = Number.parseInt(days, 10);
      if (!Number.isInteger(totalDays) || totalDays <= 0) {
        return res.status(400).json({ error: 'days must be a positive integer.' });
      }

      const newRequest = await db.insert(vacationRequests).values({
        employeeName: employeeName.trim(),
        startDate: parsedStart,
        endDate: parsedEnd,
        days: totalDays,
        status: typeof status === 'string' ? status.trim() : 'pending',
        type: typeof type === 'string' ? type.trim() : 'vacation',
        notes: typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null,
      }).returning();

      res.status(201).json(newRequest[0]);
    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({ error: 'Failed to create request' });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};
