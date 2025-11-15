const { pgTable, text, integer, timestamp, boolean, jsonb, serial } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  discordId: text('discord_id'),
  roles: jsonb('roles').notNull(),
  vacationDays: integer('vacation_days').notNull(),
  paidLeaveDays: integer('paid_leave_days').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const vacationRequests = pgTable('vacation_requests', {
  id: serial('id').primaryKey(),
  employeeName: text('employee_name').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  days: integer('days').notNull(),
  status: text('status').notNull(),
  type: text('type').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  employeeName: text('employee_name').notNull(),
  date: timestamp('date').notNull(),
  workType: text('work_type').notNull(),
  lastClockIn: timestamp('last_clock_in'),
  isClockedIn: boolean('is_clocked_in').notNull(),
  breaks: jsonb('breaks'),
  offs: jsonb('offs'),
  totalWorkingMinutes: integer('total_working_minutes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  type: text('type').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = {
  users,
  vacationRequests,
  timeEntries,
  notifications,
};
