const { db } = require('../drizzle/db.js');
const { timeEntries } = require('../drizzle/schema.js');
const { serializeTimeEntryForClient } = require('../lib/server/timeEntries.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const entries = await db.select().from(timeEntries);

    const serializedEntries = entries
      .map(entry => serializeTimeEntryForClient(entry))
      .filter((entry) => entry !== null);

    res.status(200).json(serializedEntries);
  } catch (error) {
    console.error('Time entries fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

