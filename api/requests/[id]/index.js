const { db } = require('../../../drizzle/db.js');
const { vacationRequests } = require('../../../drizzle/schema.js');
const { eq } = require('drizzle-orm');

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const updatedRequest = await db.update(vacationRequests)
        .set(req.body)
        .where(eq(vacationRequests.id, parseInt(id)))
        .returning();
      if (updatedRequest.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
      res.status(200).json(updatedRequest[0]);
    } catch (error) {
      console.error('Error updating request:', error);
      res.status(500).json({ error: 'Failed to update request' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const deletedRequest = await db.delete(vacationRequests)
        .where(eq(vacationRequests.id, parseInt(id)))
        .returning();
      if (deletedRequest.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
      res.status(200).json(deletedRequest[0]);
    } catch (error) {
      console.error('Error deleting request:', error);
      res.status(500).json({ error: 'Failed to delete request' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}