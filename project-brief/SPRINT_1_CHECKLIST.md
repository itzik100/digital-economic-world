# SPRINT 1 — UE5 Foundation
## Checklist מדויק לביצוע

**מטרה:** פרויקט Unreal Engine עובד עם Landscape, תאורה טבעית, חומרי קרקע, שחקן Third Person רץ ב-PIE.

**DoD (Definition of Done)** — כולם חייבים להיות ✅ לפני שהספרינט נסגר.

---

## שלב 1 — יצירת פרויקט

- [ ] פתח Unreal Engine 5.4+ (Epic Games Launcher)
- [ ] New Project → **Games** → **Third Person**
- [ ] Blueprint (לא C++ — בשלב זה מהיר יותר)
- [ ] Quality Preset: **Scalable** (אפשר לשדרג אחר כך)
- [ ] Target Platform: **Desktop**
- [ ] Starter Content: **כן** (כולל materials בסיסיים)
- [ ] שם פרויקט: `DigitalWorld`
- [ ] מיקום: בחר את התיקייה `game-client-unreal/`
- [ ] לחץ **Create**

> לאחר יצירה, הפרויקט ייפתח אוטומטית עם Third Person map לדוגמה. **אל תמחק** אותה עדיין.

---

## שלב 2 — Plugins (Edit → Plugins)

### להפעיל עכשיו:
- [ ] **Enhanced Input** — Search: "Enhanced Input" → Enable → Restart
- [ ] **Modeling Tools Editor Mode** — Enable (לעריכת terrain ב-editor)
- [ ] **Fab** — אם זמין (Quixel Bridge integration)
- [ ] **Water** — Enable (לא בונים מים עכשיו, אבל מוכן לעתיד)

### לא לגעת עכשיו:
- Chaos Vehicles — Sprint 4
- HTTP Plugin — Sprint 7
- WebSockets — Sprint 7

> לאחר הפעלת Plugins → **Restart Editor**

---

## שלב 3 — Rendering Settings (Edit → Project Settings → Engine → Rendering)

- [ ] **Dynamic Global Illumination:** Lumen
- [ ] **Reflections:** Lumen
- [ ] **Shadow Map Method:** Virtual Shadow Maps (VSM)
- [ ] **Anti-Aliasing:** TSR (Temporal Super Resolution)
- [ ] **Bloom:** Enabled (Intensity: 0.5 — לא מוגזם)
- [ ] **Auto Exposure:** Min Brightness 0.7, Max Brightness 2.0
- [ ] שמור → Restart אם נדרש

---

## שלב 4 — יצירת Map חדשה לספרינט

- [ ] File → New Level → **Open World** (לא Empty, לא Basic)
- [ ] שמור: `Content/Maps/GenesisZone_01`
- [ ] **מחק** את ה-ThirdPersonExampleMap (לא צריך אותה)

---

## שלב 5 — Landscape Actor

- [ ] פתח **Landscape Mode** (Shift+3 או כפתור בשמאל)
- [ ] **New Landscape**:
  - Section Size: **63 × 63**
  - Sections Per Component: **2 × 2**
  - Number of Components: **8 × 8**
  - Total Resolution: ~1009 × 1009 ≈ **2km × 2km**
  - Location: 0, 0, 0
  - Scale: X=100, Y=100, Z=100
- [ ] לחץ **Create**

### עיצוב Heightmap בסיסי (Sculpt Mode):
- [ ] בחר כלי **Sculpt** → ציור גבעות עדינות בצדדים
- [ ] אזור מרכז (התחלה): **שטוח** — גובה 0 בערך
- [ ] הוסף **Smooth** על כל השטח (מנע קצוות חדים)
- [ ] לא ליצור הרים דרמטיים — terrain עדין ופתוח

---

## שלב 6 — Materials (קרקע)

### שלב 6א — ייבוא מ-Fab / Quixel Bridge
- [ ] פתח **Quixel Bridge** (Window → Quixel Bridge)
- [ ] התחבר עם Epic/Unreal חשבון
- [ ] חפש והורד לפרויקט (Add to Project):
  - [ ] **Grass** — חפש "meadow grass surface"
  - [ ] **Dirt** — חפש "dirt ground path"
  - [ ] **Gravel** — חפש "gravel road surface"
- [ ] ייבוא: בחר Material Preset ← **Surface** ← 4K

### שלב 6ב — Landscape Material
- [ ] Content Browser → `Content/Environment/Terrain/`
- [ ] Right-click → Material → שם: `M_Landscape_Base`
- [ ] פתח Material Editor:

```
Layer Blend (LandscapeLayerBlend node):
  Layer: Grass   → חבר ל-Albedo של grass texture
  Layer: Dirt    → חבר ל-Albedo של dirt texture
  Layer: Gravel  → חבר ל-Albedo של gravel texture
הוצא → Base Color של Material
```

- [ ] חזור ל-Landscape → Details → **Landscape Material** → בחר `M_Landscape_Base`

### שלב 6ג — ציור שכבות (Paint Mode)
- [ ] Landscape Mode → **Paint**
- [ ] Create Layer Info → לכל שכבה: Grass, Dirt, Gravel
- [ ] ציור:
  - רוב השטח: **Grass**
  - שביל אלכסוני מרכז → **Dirt**
  - שולי השביל → **Gravel** (פס צר)

---

## שלב 7 — תאורה

- [ ] מחק את ה-Sky Light ו-Directional Light הקיימים אם לא מתנהגים כמו שצריך
- [ ] הוסף: **Directional Light** → Intensity: 10 lux, Rotation: X=-45, Y=30, Z=0
- [ ] הוסף: **Sky Atmosphere** (אם לא קיים)
- [ ] הוסף: **Sky Light** → Real Time Capture: ON
- [ ] הוסף: **Exponential Height Fog**:
  - Fog Density: 0.02 (עדין מאוד)
  - Fog Height Falloff: 0.2
  - Start Distance: 2000
- [ ] Directional Light → **Atmosphere Sun Light: ON**
- [ ] Directional Light → **Cast Ray Traced Shadows: ON**

---

## שלב 8 — Player Spawn

- [ ] Place Mode → חפש **Player Start**
- [ ] שים אותו על ה-Landscape, גובה מעט מעל הקרקע (Z = +200 בערך, תלוי בסקייל)
- [ ] ודא שה-Game Mode הוא **BP_ThirdPersonGameMode** (World Settings)

---

## שלב 9 — Play In Editor (PIE) — בדיקה

- [ ] לחץ **Play** (Alt+P)
- [ ] ודא:
  - [ ] שחקן מופיע על הקרקע
  - [ ] WASD מזיז את השחקן
  - [ ] יש שמש ושמיים
  - [ ] הקרקע נראית כמו terrain אמיתי (לא אפור אחיד)
  - [ ] 3 שכבות קרקע נראות (Grass, Dirt, Gravel)
  - [ ] אין קריסה / crash

---

## שלב 10 — צילום מסך + תיעוד

- [ ] PIE פתוח → **F11** (Full Screen) → **PrtScrn**
- [ ] שמור בתוך: `game-client-unreal/Screenshots/sprint_1_result.png`
- [ ] צור תיקייה: `game-client-unreal/Screenshots/`

---

## DoD — Checklist סופי

```
✅ הפרויקט נפתח מ-game-client-unreal/
✅ Play In Editor עובד
✅ שחקן Third Person מופיע על הקרקע
✅ WASD מזיז את השחקן
✅ יש שמש, שמיים, תאורה טבעית
✅ קרקע נראית כמו terrain — לא צבע אחיד
✅ 3 שכבות: Grass, Dirt, Gravel
✅ צילום מסך נשמר
✅ README עודכן
✅ לא נוספו פיצ׳רים מעבר לספרינט
```

---

## מה לא לגעת בו בספרינט זה

- ❌ Chaos Vehicles
- ❌ HTTP / Backend
- ❌ Water system
- ❌ MetaHuman
- ❌ Blueprints מעבר ל-ThirdPerson default
- ❌ שינוי camera system
- ❌ Multiplayer
- ❌ UI / HUD
- ❌ Sound

---

## Sprint 2 — מה הולך לשם

- עצים ושיחים (Foliage Paint)
- סלעים (Scatter)
- Spline Road (שביל עפר)
- שמיים יפים יותר (Time of Day)
- Nanite activation on imported meshes
