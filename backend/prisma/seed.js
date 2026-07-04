const prisma = require('../src/db');
const { seedWorld } = require('../src/services/seed');

seedWorld(prisma)
  .then((seeded) => {
    console.log('Seed complete:', seeded);
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
