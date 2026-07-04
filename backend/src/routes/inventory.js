const express = require('express');
const prisma = require('../db');
const { positiveInt, sendError } = require('../utils/validation');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { playerId: req.player.id },
      include: { resource: true }
    });
    res.json(items);
  } catch (err) {
    sendError(res, err);
  }
});

// Called by UE5 when player collects a resource in-world
router.post('/collect', async (req, res) => {
  const resourceName = String(req.body.resourceName || '').trim();
  if (!resourceName || req.body.quantity === undefined) return res.status(400).json({ error: 'Missing fields' });

  try {
    const quantity = positiveInt(req.body.quantity, 'quantity', { max: 1000 });
    const resource = await prisma.resource.findUnique({ where: { name: resourceName } });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const xpGain = quantity * 2;
    const tokensGain = quantity * 2;

    const item = await prisma.$transaction(async (tx) => {
      const inventoryItem = await tx.inventoryItem.upsert({
        where: { playerId_resourceId: { playerId: req.player.id, resourceId: resource.id } },
        update: { quantity: { increment: quantity } },
        create: { playerId: req.player.id, resourceId: resource.id, quantity }
      });

      await tx.player.update({
        where: { id: req.player.id },
        data: {
          xp: { increment: xpGain },
          tokens: { increment: tokensGain }
        }
      });

      await tx.transaction.create({
        data: {
          playerId: req.player.id,
          type: 'resource_collect',
          amount: tokensGain,
          reason: `Collected ${quantity} ${resource.name}`
        }
      });

      return inventoryItem;
    });

    res.json({ item, xpGain, tokensGain });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
