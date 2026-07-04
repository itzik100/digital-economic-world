// Robot passive income + expiry job
// Runs every 5 minutes:
//   1. Expire finished rentals → robot becomes available again
//   2. Generate resources for active rentals (ROI lesson)

const prisma = require('../db');

// Resources each robot type generates per 5-minute tick
const ROBOT_YIELD = {
  farm:         { resource: 'wheat', qty: 8 },
  mining:       { resource: 'stone', qty: 5 },
  construction: { resource: 'concrete', qty: 3 },
  transport:    { resource: 'iron', qty: 2 },
};

const TICK_MS = 5 * 60 * 1000; // 5 minutes

async function tick(io) {
  const now = new Date();

  try {
    // ── 1. Expire finished rentals ─────────────────────────────────────────
    const expired = await prisma.robotRental.findMany({
      where: { status: 'active', endsAt: { lte: now } },
      include: { robot: true },
    });

    for (const rental of expired) {
      await prisma.$transaction([
        prisma.robotRental.update({
          where: { id: rental.id },
          data:  { status: 'completed' },
        }),
        prisma.robot.update({
          where: { id: rental.robotId },
          data:  { available: true },
        }),
      ]);
      console.log(`Robot ${rental.robot.nameHe} returned (rental ${rental.id})`);
    }

    // ── 2. Generate passive income for active rentals ──────────────────────
    const active = await prisma.robotRental.findMany({
      where:   { status: 'active', endsAt: { gt: now } },
      include: { robot: true },
    });

    for (const rental of active) {
      const yield_ = ROBOT_YIELD[rental.robot.type];
      if (!yield_) continue;

      const resource = await prisma.resource.findUnique({
        where: { name: yield_.resource },
      });
      if (!resource) continue;

      await prisma.$transaction([
        prisma.inventoryItem.upsert({
          where:  { playerId_resourceId: { playerId: rental.playerId, resourceId: resource.id } },
          update: { quantity: { increment: yield_.qty } },
          create: { playerId: rental.playerId, resourceId: resource.id, quantity: yield_.qty },
        }),
        prisma.player.update({
          where: { id: rental.playerId },
          data:  { xp: { increment: 5 } },
        }),
        prisma.transaction.create({
          data: {
            playerId: rental.playerId,
            type:     'robot_income',
            amount:   yield_.qty,
            reason:   `${rental.robot.nameHe} — ייצר ${yield_.qty} ${yield_.resource}`,
          },
        }),
      ]);

      // Notify player via socket if connected
      io?.to(`player:${rental.playerId}`).emit('robot:income', {
        robotName:    rental.robot.nameHe,
        resource:     yield_.resource,
        qty:          yield_.qty,
        resourceIcon: resource.icon,
      });

      console.log(`Robot income: player ${rental.playerId} +${yield_.qty} ${yield_.resource}`);
    }
  } catch (err) {
    console.error('Robot job error:', err.message);
  }
}

function startRobotJobs(io) {
  console.log('🤖 Robot jobs started (tick every 5 min)');
  // Run once on startup, then every TICK_MS
  tick(io);
  setInterval(() => tick(io), TICK_MS);
}

module.exports = { startRobotJobs };
