# UNREAL ENGINE MVP PLAN
## עולם דיגיטלי כלכלי קהילתי — Unreal Engine 5

---

## 1. חזון המשחק

משחק עולם פתוח ברמה ויזואלית של GTA / RDR2.
כלכלה קפיטליסטית אמיתית: טבע → משאבים → בנייה → עסקים → שוק → כלכלה.
הכל מתחיל ממנקודת מבט של כדור הארץ ומתקרב לאזור המשחק הראשון.

---

## 2. Opening Sequence — Earth → Genesis Zone

### שלב א: Earth View
- פתיחת המשחק: כדור ארץ מסתובב במרחב
- מצלמה מרחוק — תחושת לוויין
- אזורי משחק מסומנים על הגלובוס (glowing markers)
- ממשק: כפתורי בחירת אזור, Zoom In, Zoom Out

### שלב ב: Zoom In לאזור
- אנימציית מצלמה חלקה מהחלל לתוך האזור
- תחושת כניסה לאטמוספרה (heat blur + fog)
- Landing על נקודת הפתיחה של האזור

### שלב ג: Genesis Zone
- Terrain טבעי (ראה סעיף 4)
- האווטאר עומד על השביל
- מצלמה מאחורי השחקן (Third Person)

---

## 3. Genesis Zone — עולם פתוח ראשוני

### Terrain
- שטח: 2km × 2km (Landscape Component)
- Heightmap: ייבוא מ-World Creator / Gaea / Terragen
- Biome: ירוק, אירופי, דומה לטבע ישראלי/ים-תיכוני
- Layers:
  - דשא (Grass) — פלטפורמה ראשית
  - אדמה / חצץ — שביל ראשי
  - סלע — שיפועים ואזורי גובה
  - חול / נהר — ליד המים

### שביל עפר / חצץ
- שביל ראשי שחוצה את האזור (Spline Road)
- חצץ בהיר בצידי הדרך
- אבנים קטנות על שולי השביל
- עקבות גלגלים בדרט — Decal system

### עצים ו-Foliage
- סוגי עצים: אלון, אורן, ברוש
- Foliage Paint: יער בצפון + מרעה פתוח בדרום
- LOD אוטומטי של Unreal (Nanite)
- Dynamic wind (Simple Grass Wind material)

### מים
- נהר / אגם באזור נפרד (דרום-מזרח)
- Water Plugin של Unreal
- נפרד מאזור ההתחלה — השחקן עומד על קרקע יבשה

---

## 4. אווטאר ושליטה

### אווטאר
- UE5 Mannequin כבסיס
- החלפה עתידית ב-MetaHuman
- Skeletal Mesh + AnimBP
- Run / Walk / Idle / Jump animations

### מצלמה
- Third Person Camera (Spring Arm + Camera)
- Lag על הסיבוב (Camera Lag = 0.15)
- Zoom In/Out עם גלגל עכבר
- Camera collision עם Terrain

### שליטה
- WASD = הליכה
- Shift = ריצה
- E = אינטראקציה / איסוף
- F = כניסה לרכב
- M = פתיחת מפה / Globe
- Tab = תיק + HUD
- Escape = תפריט

---

## 5. רכב בסיסי

### כלי רכב ראשון: Truck / Pickup
- Physics Asset מ-Chaos Vehicle Plugin
- תנועה על Terrain + שביל
- מצב נהג: מצלמה עוברת לנהיגה
- כניסה: F ליד הרכב → Animation → Camera Blend
- יציאה: F שוב → Animation → חזרה ל-Third Person

### מסלול בדיקה
- שביל חצץ של 500 מטר
- סיבוב בין עצים
- כניסה לאזור הכפר (בשלב הבא)

---

## 6. HUD ראשוני

### אלמנטים:
- טוקנים (מספר + אייקון)
- משאבים: עץ, אבן, ברזל, מים, חיטה
- מיני-מפה (טקסטורת terrain עם נקודת שחקן)
- כיוון / Compass
- ממשק אינטראקציה: "[E] — אסוף עץ"

### עיצוב:
- RTL support (Widget Blueprint)
- צבע: כהה + accent כחול/זהב
- אנימציית כניסה (Fade in)

---

## 7. Backend Connection

### חיבור ל-Node.js Backend הקיים:
- REST API דרך HTTP Plugin של UE5
- WebSocket לעדכונים Real-Time (Socket.IO / UE WebSocket Plugin)
- Player Auth: טוקן מ-Google OAuth
- Sync: inventory, tokens, buildings, market prices

### זרימת חיבור:
```
UE Client → POST /auth/verify-token → Player Session
UE Client → GET /player/me → Load inventory
UE Client → Socket.IO → Real-time market updates
```

---

## 8. סדר פיתוח — Sprint Plan

| Sprint | משימה | משך |
|--------|-------|-----|
| 1 | UE5 Project Setup + Landscape + Lighting | 1 שבוע |
| 2 | Terrain + Textures + Foliage | 1 שבוע |
| 3 | Avatar + Third Person Camera | 1 שבוע |
| 4 | Vehicle + Entry/Exit | 1 שבוע |
| 5 | Earth Globe Opening Sequence | 1 שבוע |
| 6 | HUD + Inventory Widget | 1 שבוע |
| 7 | Backend Connection + Auth | 1 שבוע |
| 8 | Market Panel + Resource Collection | 1 שבוע |
| 9 | Polish + QA | 1 שבוע |

---

## 9. פלטפורמת שחרור

- פרוטוטייפ ראשון: PC (Windows 64-bit)
- בשלב הבא: Pixel Streaming → דפדפן (ה-web-prototype נשאר לדשבורד/ממשק)
- מובייל: שלב מאוחר יותר

---

## 10. Unreal Engine Version

- UE 5.4+ (Lumen + Nanite + Water Plugin)
- Plugins נדרשים:
  - Chaos Vehicles
  - Water
  - Enhanced Input
  - HTTP / WebSockets
  - MetaHuman (שלב מאוחר)
