const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const prisma = require('../db');
const { seedWorld } = require('../services/seed');
const { positiveInt, sendError } = require('../utils/validation');

const router = express.Router();

router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [players, transactions, listings] = await Promise.all([
      prisma.player.count(),
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.marketListing.count({ where: { status: 'active' } })
    ]);
    res.json({ players, totalTokensCirculated: transactions._sum.amount || 0, activeListings: listings });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/players', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      select: { id: true, username: true, email: true, tokens: true, level: true, createdAt: true }
    });
    res.json(players);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/give-tokens', async (req, res) => {
  const { playerId, amount, reason } = req.body;
  try {
    const grantAmount = positiveInt(amount, 'amount', { max: 1000000 });
    await prisma.$transaction([
      prisma.player.update({ where: { id: playerId }, data: { tokens: { increment: grantAmount } } }),
      prisma.transaction.create({
        data: { playerId, type: 'admin_grant', amount: grantAmount, reason: reason || 'Admin grant' }
      })
    ]);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/seed-resources', async (req, res) => {
  try {
    const seeded = await seedWorld(prisma);
    res.json({ ok: true, seeded });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
