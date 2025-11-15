const { db } = require('./db.js');
const { users } = require('./schema.js');

const seedUsers = [
  {
    name: 'Nikola Andrić',
    email: 'nikola@valens.dev',
    roles: ['Admin', 'Employee'],
    vacationDays: 25,
    paidLeaveDays: 7,
  },
  {
    name: 'Alice Smith',
    email: 'alice@company.com',
    roles: ['Project Manager', 'Employee'],
    vacationDays: 22,
    paidLeaveDays: 7,
  },
  {
    name: 'Bob Johnson',
    email: 'bob@company.com',
    roles: ['Employee'],
    vacationDays: 20,
    paidLeaveDays: 7,
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@company.com',
    roles: ['Employee'],
    vacationDays: 15,
    paidLeaveDays: 7,
  },
  {
    name: 'Eva Martinez',
    email: 'eva@company.com',
    roles: ['CEO', 'Admin'],
    vacationDays: 30,
    paidLeaveDays: 10,
  },
];

async function seed() {
  try {
    console.log('Seeding users...');
    await db.insert(users).values(seedUsers);
    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error seeding:', error);
    process.exitCode = 1;
  }
}

seed();

