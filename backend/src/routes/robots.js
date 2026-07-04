const express = require('express');
const prisma = require('../db');
const { positiveInt, sendError } = require('../utils/validation');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const robots = await prisma.robot.findMany();
    res.json(robots);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/rent/:robotId', async (req, res) => {
  const { robotId } = req.params;
  try {
    const hours = positiveInt(req.body.hours || 1, 'hours', { max: 24 });
    const robot = await prisma.robot.findUnique({ where: { id: robotId } });
    if (!robot) return res.status(404).json({ error: 'Robot not found' });
    if (!robot.available) return res.status(400).json({ error: 'Robot already rented' });

    const totalCost = robot.rentalPrice * hours;
    const endsAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      const playerUpdate = await tx.player.updateMany({
        where: { id: req.player.id, tokens: { gte: totalCost } },
        data: { tokens: { decrement: totalCost } }
      });
      if (playerUpdate.count !== 1) {
        const error = new Error('Not enough tokens');
        error.status = 400;
        throw error;
      }

      const robotUpdate = await tx.robot.updateMany({
        where: { id: robotId, available: true },
        data: { available: false }
      });
      if (robotUpdate.count !== 1) {
        const error = new Error('Robot already rented');
        error.status = 400;
        throw error;
      }

      await tx.robotRental.create({
        data: { robotId, playerId: req.player.id, endsAt }
      });
    });

    res.json({ ok: true, endsAt, cost: totalCost });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/my-rentals', async (req, res) => {
  try {
    const rentals = await prisma.robotRental.findMany({
      where: { playerId: req.player.id, status: 'active' },
      include: { robot: true }
    });
    res.json(rentals);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
