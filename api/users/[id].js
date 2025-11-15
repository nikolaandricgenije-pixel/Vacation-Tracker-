const { db } = require('../../../drizzle/db.js');
const { users } = require('../../../drizzle/schema.js');
const { eq } = require('drizzle-orm');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const numericId = Number.parseInt(id, 10);

  if (!Number.isInteger(numericId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (req.method === 'PUT') {
    try {
      const { firstName, lastName, vacationDays, paidLeaveDays } = req.body ?? {};

      const payload = {
        ...(typeof firstName === 'string' ? { firstName: firstName.trim() } : {}),
        ...(typeof lastName === 'string' ? { lastName: lastName.trim() } : {}),
      };

      if (vacationDays !== undefined) {
        const parsed = Number.parseInt(vacationDays, 10);
        if (!Number.isFinite(parsed)) {
          return res.status(400).json({ error: 'vacationDays must be a number' });
        }
        payload.vacationDays = parsed;
      }

      if (paidLeaveDays !== undefined) {
        const parsed = Number.parseInt(paidLeaveDays, 10);
        if (!Number.isFinite(parsed)) {
          return res.status(400).json({ error: 'paidLeaveDays must be a number' });
        }
        payload.paidLeaveDays = parsed;
      }

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ error: 'No update fields provided' });
      }

      const updatedUser = await db.update(users)
        .set(payload)
        .where(eq(users.id, numericId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(updatedUser[0]);
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.setHeader('Allow', ['PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};
