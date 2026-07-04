const jwt = require('jsonwebtoken');
const prisma = require('../db');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    req.player = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: req.player?.id },
      select: { isAdmin: true }
    });
    if (!player?.isAdmin) return res.status(403).json({ error: 'Admin only' });
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { authenticateToken, requireAdmin };
