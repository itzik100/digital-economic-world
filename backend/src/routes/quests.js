const express = require('express');
const prisma = require('../db');
const { sendError } = require('../utils/validation');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const quests = await prisma.playerQuest.findMany({
      where: { playerId: req.player.id },
      include: { quest: true }
    });
    res.json(quests);
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/complete/:questId', async (req, res) => {
  const { questId } = req.params;

  try {
    const playerQuest = await prisma.playerQuest.findFirst({
      where: { playerId: req.player.id, questId, status: 'active' },
      include: { quest: true }
    });
    if (!playerQuest) return res.status(404).json({ error: 'Quest not found or already completed' });

    await prisma.$transaction([
      prisma.playerQuest.update({
        where: { id: playerQuest.id },
        data: { status: 'completed', completedAt: new Date() }
      }),
      prisma.player.update({
        where: { id: req.player.id },
        data: {
          tokens: { increment: playerQuest.quest.reward },
          xp: { increment: playerQuest.quest.xpReward }
        }
      }),
      prisma.transaction.create({
        data: {
          playerId: req.player.id,
          type: 'quest_reward',
          amount: playerQuest.quest.reward,
          reason: `Completed quest: ${playerQuest.quest.name}`
        }
      })
    ]);

    res.json({ ok: true, tokensEarned: playerQuest.quest.reward, xpEarned: playerQuest.quest.xpReward });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
