# Digital World Backend

## Local setup

```bash
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm start
```

Health check:

```bash
curl http://localhost:4000/health
```

The default local API URL is `http://localhost:4000/api`.

## Admin access

Admin routes require `Player.isAdmin = true`. After creating a user, set it directly in Prisma Studio or SQL during development:

```bash
npm run db:studio
```

Seeded world data includes resources, starter quests, and rentable robots.
