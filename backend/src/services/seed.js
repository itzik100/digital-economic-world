const { resources, robots, quests } = require('../data/seedData');

async function seedWorld(prisma) {
  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { name: resource.name },
      update: resource,
      create: resource,
    });
  }

  for (const robot of robots) {
    await prisma.robot.upsert({
      where: { name: robot.name },
      update: robot,
      create: robot,
    });
  }

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { name: quest.name },
      update: quest,
      create: quest,
    });
  }

  return {
    resources: resources.length,
    robots: robots.length,
    quests: quests.length,
  };
}

module.exports = { seedWorld };
