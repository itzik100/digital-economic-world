const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { sendError } = require('../utils/validation');

const router = express.Router();

const STARTER_RESOURCES = [
  { name: 'wood', quantity: 10 },
  { name: 'stone', quantity: 5 },
  { name: 'water', quantity: 20 },
];

router.post('/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const player = await prisma.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: { username, email, passwordHash }
      });

      const resources = await tx.resource.findMany({
        where: { name: { in: STARTER_RESOURCES.map((r) => r.name) } }
      });

      for (const starter of STARTER_RESOURCES) {
        const resource = resources.find((r) => r.name === starter.name);
        if (resource) {
          await tx.inventoryItem.create({
            data: { playerId: created.id, resourceId: resource.id, quantity: starter.quantity }
          });
        }
      }

      const starterQuests = await tx.quest.findMany({ where: { type: 'starter' } });
      for (const quest of starterQuests) {
        await tx.playerQuest.create({ data: { playerId: created.id, questId: quest.id } });
      }

      return created;
    });

    const token = jwt.sign(
      { id: player.id, username: player.username, isAdmin: player.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, player: { id: player.id, username: player.username, tokens: player.tokens, level: player.level } });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Username or email already exists' });
    sendError(res, err);
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const player = await prisma.player.findUnique({ where: { email } });
    if (!player || !await bcrypt.compare(password, player.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: player.id, username: player.username, isAdmin: player.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, player: { id: player.id, username: player.username, tokens: player.tokens, level: player.level } });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
