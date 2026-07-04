const { PrismaClient } = require('@prisma/client');

const prisma = global.__digitalWorldPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__digitalWorldPrisma = prisma;
}

module.exports = prisma;
