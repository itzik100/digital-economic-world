# Claude Status Log

## עדכון אחרון: 2026-07-04

---

## מה קיים בפרויקט

### Backend (`/backend`)
- `src/index.js` — שרת ראשי (Express + Socket.IO)
- `src/db.js` — חיבור Prisma ל-PostgreSQL
- `src/middleware/auth.js` — JWT authentication
- `src/routes/auth.js` — רישום והתחברות
- `src/routes/player.js` — נתוני שחקן
- `src/routes/market.js` — שוק פנימי
- `src/routes/farm.js` — חווה / איסוף משאבים
- `src/routes/inventory.js` — אינוונטורי
- `src/routes/quests.js` — משימות
- `src/routes/robots.js` — רובוטים
- `src/routes/admin.js` — ניהול
- `src/services/realtime.js` — Socket.IO events
- `src/services/robotJobs.js` — עבודות רובוטים אוטומטיות
- `src/services/seed.js` — זריעת נתוני עולם
- `src/data/seedData.js` — נתוני seed
- `src/utils/validation.js` — validations
- `prisma/schema.prisma` — מודל DB מלא
- `prisma/migrations/` — migration ראשונית
- `prisma/seed.js` — seed runner
- `docker-compose.yml` — PostgreSQL ב-Docker
- `.env.example` — משתני סביבה לדוגמה

### Frontend (`/frontend`)
- `src/index.html` — עמוד ראשי
- `src/main.js` — כניסה לאפליקציה, ניהול מצב
- `src/api.js` — תקשורת עם Backend
- `src/hud.js` — ממשק משתמש (HUD)
- `src/panels.js` — פאנלים (אינוונטורי, מפה, שוק)
- `src/world.js` — רינדור העולם
- `src/globemap.js` — מפת גלובוס
- `src/market.js` — ממשק שוק
- `src/avatar.js` — אווטאר שחקן
- `src/robot.js` — ממשק רובוטים
- `src/building.js` — בנייה
- `src/terrain-satellite.js` — שכבת טריין לוויני
- `src/pixelstream.js` — Pixel Streaming stub ל-UE5
- `src/styles/main.css` — עיצוב ראשי
- `vite.config.js` — הגדרות Vite

### UE5 (`/ue5-project`)
- `Blueprints/` — Blueprints בסיסיים
- `Documentation/UE5_SETUP_GUIDE.md` — מדריך התקנה

### תיעוד (`/project-brief`)
- `PROJECT_CONTEXT.md` — הקשר כללי
- `MVP_SCOPE.md` — מה נכנס ל-MVP
- `CLAUDE_STATUS.md` — קובץ זה
- `CHATGPT_REVIEW.md` — ביקורת ChatGPT

---

## מה עובד

- מבנה הפרויקט מלא ומאורגן
- כל הקוד עלה ל-GitHub (ריפו ציבורי)
- Prisma schema מוגדר עם כל הטבלאות
- כל ה-routes כתובים

## מה לא נבדק עדיין

- הרצת הסביבה המלאה עם Docker
- Flow שלם: רישום → כניסה → שוק → רובוט
- Socket.IO realtime בפועל

---

## איך מריצים

```bash
# 1. Backend
cd backend
cp .env.example .env        # ערוך את DATABASE_URL ו-JWT_SECRET
docker-compose up -d        # הרץ PostgreSQL
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                 # שרת על פורט 3001

# 2. Frontend
cd frontend
npm install
npm run dev                 # אפליקציה על פורט 5173
```

---

## משימה הבאה

- הרצת הסביבה המלאה ובדיקת flow בסיסי
- תיקון באגים ראשוניים שיתגלו בהרצה

---
*קובץ זה מתעדכן על ידי Claude בכל התקדמות משמעותית*
