const express = require('express');
const prisma = require('../db');
const { sendError } = require('../utils/validation');

const router = express.Router();

const CROPS = {
  wheat: { growMinutes: 30, yield: 15, seedCost: 5 },
  corn:  { growMinutes: 60, yield: 30, seedCost: 8 },
  tomato: { growMinutes: 45, yield: 20, seedCost: 6 },
};

router.get('/plots', async (req, res) => {
  try {
    const lands = await prisma.land.findMany({
      where: { ownerId: req.player.id },
      include: { farmPlots: true }
    });
    res.json(lands);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/plant', async (req, res) => {
  const { plotId, cropType } = req.body;
  const crop = CROPS[cropType];
  if (!crop) return res.status(400).json({ error: 'Unknown crop type' });

  try {
    const plot = await prisma.farmPlot.findUnique({
      where: { id: plotId },
      include: { land: true }
    });
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    if (plot.land.ownerId !== req.player.id) return res.status(403).json({ error: 'Not your plot' });
    if (plot.stage !== 'empty') return res.status(400).json({ error: 'Plot already in use' });

    const harvestAt = new Date(Date.now() + crop.growMinutes * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      const playerUpdate = await tx.player.updateMany({
        where: { id: req.player.id, tokens: { gte: crop.seedCost } },
        data: { tokens: { decrement: crop.seedCost } }
      });
      if (playerUpdate.count !== 1) {
        const error = new Error('Not enough tokens for seeds');
        error.status = 400;
        throw error;
      }

      await tx.farmPlot.update({
        where: { id: plotId },
        data: { cropType, stage: 'growing', plantedAt: new Date(), harvestAt, quantity: crop.yield }
      });
    });

    res.json({ ok: true, harvestAt, crop });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/harvest', async (req, res) => {
  const { plotId } = req.body;

  try {
    const plot = await prisma.farmPlot.findUnique({
      where: { id: plotId },
      include: { land: true }
    });
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    if (plot.land.ownerId !== req.player.id) return res.status(403).json({ error: 'Not your plot' });
    if (plot.stage !== 'growing') return res.status(400).json({ error: 'Nothing to harvest' });
    if (new Date() < plot.harvestAt) return res.status(400).json({ error: 'Crop not ready yet' });

    const resource = await prisma.resource.findUnique({ where: { name: plot.cropType } });

    await prisma.$transaction([
      ...(resource ? [
        prisma.inventoryItem.upsert({
          where: { playerId_resourceId: { playerId: req.player.id, resourceId: resource.id } },
          update: { quantity: { increment: plot.quantity } },
          create: { playerId: req.player.id, resourceId: resource.id, quantity: plot.quantity }
        })
      ] : []),
      prisma.farmPlot.update({
        where: { id: plotId },
        data: { stage: 'empty', cropType: null, plantedAt: null, harvestAt: null, quantity: 0 }
      }),
      prisma.player.update({ where: { id: req.player.id }, data: { xp: { increment: 10 } } })
    ]);

    res.json({ ok: true, harvested: plot.quantity, crop: plot.cropType });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
