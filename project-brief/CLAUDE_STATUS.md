# Claude Status Log

## עדכון אחרון: 2026-07-04

### מה בנינו עד כה

- Backend: Node.js + Express + Prisma + Socket.IO
  - Auth (רישום / התחברות / JWT)
  - Routes: player, market, farm, inventory, quests, robots, admin
  - Prisma schema + migration ראשונית + seed data
  - Docker Compose ל-PostgreSQL
- Frontend: Vite + Vanilla JS
  - index.html, main.js, api.js
  - hud.js, panels.js, world.js
  - market.js, robot.js, building.js, avatar.js
  - Pixel Streaming stub (ue5)
- UE5: תיקיית Blueprints + מדריך התקנה

### קבצים מרכזיים

- `backend/src/index.js` — שרת ראשי
- `backend/prisma/schema.prisma` — מודל DB
- `frontend/src/main.js` — כניסה לאפליקציה
- `frontend/src/api.js` — תקשורת עם Backend

### מה עובד

- מבנה הפרויקט מוגדר
- Repo מחובר לגיטהאב

### מה לא עובד / לא נבדק

- לא הורצה הסביבה המלאה עם Docker
- לא נבדק flow שלם של שחקן (רישום → כניסה → שוק)

### איך מריצים

```bash
# Backend
cd backend
cp .env.example .env
docker-compose up -d
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### משימה הבאה

- הרצת הסביבה המלאה ובדיקת flow בסיסי
- תיקון באגים ראשוניים

---
*קובץ זה מתעדכן על ידי Claude בכל התקדמות משמעותית*
