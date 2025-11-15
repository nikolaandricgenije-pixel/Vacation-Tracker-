const { db } = require('../../../drizzle/db.js');
const { vacationRequests } = require('../../../drizzle/schema.js');
const { eq } = require('drizzle-orm');

const parsePatch = (body = {}) => {
  const payload = {};

  if (typeof body.status === 'string') {
    payload.status = body.status.trim();
  }

  if (typeof body.type === 'string') {
    payload.type = body.type.trim();
  }

  if (body.notes !== undefined) {
    payload.notes = typeof body.notes === 'string' && body.notes.trim().length > 0
      ? body.notes.trim()
      : null;
  }

  if (body.days !== undefined) {
    const parsedDays = Number.parseInt(body.days, 10);
    if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
      throw new Error('days must be a positive integer');
    }
    payload.days = parsedDays;
  }

  return payload;
};

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const numericId = Number.parseInt(id, 10);

  if (!Number.isInteger(numericId)) {
    return res.status(400).json({ error: 'Invalid request id' });
  }

  if (req.method === 'PUT') {
    try {
      const payload = parsePatch(req.body);

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }

      const updatedRequest = await db.update(vacationRequests)
        .set(payload)
        .where(eq(vacationRequests.id, numericId))
        .returning();

      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.status(200).json(updatedRequest[0]);
    } catch (error) {
      if (error.message?.includes('days must be')) {
        return res.status(400).json({ error: error.message });
      }

      console.error('Error updating request:', error);
      res.status(500).json({ error: 'Failed to update request' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const deletedRequest = await db.delete(vacationRequests)
        .where(eq(vacationRequests.id, numericId))
        .returning();

      if (deletedRequest.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.status(200).json(deletedRequest[0]);
    } catch (error) {
      console.error('Error deleting request:', error);
      res.status(500).json({ error: 'Failed to delete request' });
    }
    return;
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};
