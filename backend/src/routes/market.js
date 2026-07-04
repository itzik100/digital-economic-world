const express = require('express');
const prisma = require('../db');
const { positiveInt, sendError } = require('../utils/validation');

const router = express.Router();

router.get('/listings', async (req, res) => {
  try {
    const listings = await prisma.marketListing.findMany({
      where: { status: 'active' },
      include: { resource: true, seller: { select: { username: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(listings);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/sell', async (req, res) => {
  const resourceName = String(req.body.resourceName || '').trim();
  if (!resourceName || req.body.quantity === undefined || req.body.price === undefined) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const quantity = positiveInt(req.body.quantity, 'quantity', { max: 10000 });
    const price = positiveInt(req.body.price, 'price', { max: 1000000 });
    const resource = await prisma.resource.findUnique({ where: { name: resourceName } });
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const listing = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.updateMany({
        where: { playerId: req.player.id, resourceId: resource.id, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } }
      });
      if (updated.count !== 1) {
        const error = new Error('Not enough resources');
        error.status = 400;
        throw error;
      }

      return tx.marketListing.create({
        data: { sellerId: req.player.id, resourceId: resource.id, quantity, price }
      });
    });

    res.json(listing);
    // Broadcast to all players that market has a new listing
    req.app.get('io')?.emit('market:refresh');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/buy/:listingId', async (req, res) => {
  const { listingId } = req.params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.marketListing.findUnique({
        where: { id: listingId },
        include: { resource: true }
      });
      if (!listing || listing.status !== 'active') {
        const error = new Error('Listing not found');
        error.status = 404;
        throw error;
      }
      if (listing.sellerId === req.player.id) {
        const error = new Error('Cannot buy your own listing');
        error.status = 400;
        throw error;
      }

      const buyQty = req.body.quantity === undefined
        ? listing.quantity
        : positiveInt(req.body.quantity, 'quantity', { max: 10000 });
      if (listing.quantity < buyQty) {
        const error = new Error('Not enough stock');
        error.status = 400;
        throw error;
      }

      const totalCost = listing.price * buyQty;
      const buyerUpdate = await tx.player.updateMany({
        where: { id: req.player.id, tokens: { gte: totalCost } },
        data: { tokens: { decrement: totalCost } }
      });
      if (buyerUpdate.count !== 1) {
        const error = new Error('Not enough tokens');
        error.status = 400;
        throw error;
      }

      await tx.player.update({ where: { id: listing.sellerId }, data: { tokens: { increment: totalCost } } });
      await tx.inventoryItem.upsert({
        where: { playerId_resourceId: { playerId: req.player.id, resourceId: listing.resourceId } },
        update: { quantity: { increment: buyQty } },
        create: { playerId: req.player.id, resourceId: listing.resourceId, quantity: buyQty }
      });
      await tx.marketListing.update({
        where: { id: listingId },
        data: {
          quantity: { decrement: buyQty },
          status: listing.quantity - buyQty === 0 ? 'sold' : 'active'
        }
      });
      await tx.marketPurchase.create({
        data: { listingId, buyerId: req.player.id, quantity: buyQty, totalCost }
      });

      return { spent: totalCost, quantity: buyQty };
    });

    res.json({ ok: true, ...result });
    req.app.get('io')?.emit('market:refresh');
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
