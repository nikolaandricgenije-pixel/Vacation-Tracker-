import { db } from './drizzle/db.js';
import { timeEntries } from './drizzle/schema.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const toDateOrNull = value => {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const ensureArray = value => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('[api/time-entries] Failed to parse JSON array', error);
        return [];
      }
    }

    return [];
  };

  try {
    const entries = await db.select().from(timeEntries);

    // Convert Date objects to ISO strings for JSON response
    const serializedEntries = entries.map(entry => {
      const breaks = ensureArray(entry.breaks);
      const offs = ensureArray(entry.offs);
      const entryDate = toDateOrNull(entry.date);
      const lastClockIn = toDateOrNull(entry.lastClockIn);

      return {
        ...entry,
        date: entryDate ? entryDate.toISOString().split('T')[0] : null, // YYYY-MM-DD format
        lastClockIn: lastClockIn ? lastClockIn.toISOString() : null,
        breaks: breaks.map(b => {
          const start = toDateOrNull(b?.start);
          const end = toDateOrNull(b?.end);
          return {
            ...b,
            start: start ? start.toISOString() : b?.start ?? null,
            end: end ? end.toISOString() : (b?.end ?? null),
          };
        }),
        offs: offs.map(o => {
          const start = toDateOrNull(o?.start);
          const end = toDateOrNull(o?.end);
          return {
            ...o,
            start: start ? start.toISOString() : o?.start ?? null,
            end: end ? end.toISOString() : (o?.end ?? null),
          };
        }),
      };
    });

    res.status(200).json(serializedEntries);
  } catch (error) {
    console.error('Time entries fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
