const express = require('express');
const prisma = require('../db');
const { finiteNumber, sendError } = require('../utils/validation');

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: req.player.id },
      select: {
        id: true, username: true, email: true, avatarUrl: true,
        tokens: true, level: true, xp: true, position: true, worldZone: true,
        createdAt: true,
        inventory: { include: { resource: true } },
        ownedLand: true,
        ownedBuildings: true,
        quests: { include: { quest: true } }
      }
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/position', async (req, res) => {
  const { x, y, z, zone } = req.body;
  try {
    const position = {
      x: finiteNumber(x, 'x'),
      y: finiteNumber(y, 'y'),
      z: finiteNumber(z, 'z'),
    };
    await prisma.player.update({
      where: { id: req.player.id },
      data: { position, worldZone: zone || 'start_zone' }
    });
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
