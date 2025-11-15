const { db } = require('../drizzle/db.js');
const { users } = require('../drizzle/schema.js');

const normalizeRoles = (roles) => {
  if (!roles) {
    return ['Employee'];
  }

  if (!Array.isArray(roles)) {
    return null;
  }

  const sanitized = roles
    .map(role => (typeof role === 'string' ? role.trim() : ''))
    .filter(role => role.length > 0);

  return sanitized.length > 0 ? sanitized : ['Employee'];
};

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const allUsers = await db.select().from(users);
      res.status(200).json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { name, email, roles, vacationDays, paidLeaveDays, discordId } = req.body ?? {};

      if (!name || typeof name !== 'string' || !email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Name and email are required.' });
      }

      const normalizedRoles = normalizeRoles(roles);
      if (!normalizedRoles) {
        return res.status(400).json({ error: 'Roles must be an array of strings.' });
      }

      const normalizedVacationDays = Number.isFinite(Number(vacationDays))
        ? Number(vacationDays)
        : Number.parseInt(process.env.DEFAULT_VACATION_DAYS ?? '20', 10);

      const normalizedPaidLeaveDays = Number.isFinite(Number(paidLeaveDays))
        ? Number(paidLeaveDays)
        : Number.parseInt(process.env.DEFAULT_PAID_LEAVE_DAYS ?? '7', 10);

      const inserted = await db.insert(users).values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        roles: normalizedRoles,
        vacationDays: normalizedVacationDays,
        paidLeaveDays: normalizedPaidLeaveDays,
        ...(discordId ? { discordId: String(discordId) } : {}),
      }).returning();

      res.status(201).json(inserted[0]);
    } catch (error) {
      console.error('Error creating user:', error);

      if (error.code === '23505') {
        return res.status(409).json({ error: 'User with this email already exists.' });
      }

      res.status(500).json({ error: 'Failed to create user' });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};
