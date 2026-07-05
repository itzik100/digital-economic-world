# ASSET PROMPTS
## עולם דיגיטלי כלכלי קהילתי

פרומפטים מדויקים לייצור כל נכס.
כל פרומפט כולל: תיאור, שימוש, הגדרות טכניות, ממה להימנע.

---

## הוראות שימוש

- **Midjourney / Stable Diffusion XL** → לטקסטורות (tileable)
- **Meshy.ai / Luma AI / CSM.ai** → למודלים 3D (FBX)
- **Mixamo** → לאנימציות (מחובר ל-character FBX)
- **Fab.com / Quixel Bridge** → לקנייה ישירה (העדפה ראשונה)

---

## BATCH 1 — Terrain Textures

---

### נכס #1 — Grass_Meadow

**שימוש במשחק:** שכבת בסיס לשטח הפתוח — דשא ים-תיכוני
**תיקייה:** `Content/Environment/Terrain/`
**פורמט:** PNG 4K: Albedo + Normal + Roughness + AO

**פרומפט (Midjourney / SDXL):**
```
seamless tileable texture, Mediterranean meadow grass, natural green with dry patches,
realistic PBR material, top-down orthographic view, no shadows, 4K resolution,
daylight, dry climate, mixed short and medium height grass, Israeli hillside style,
photorealistic, no cartoon, no stylized, flat lighting for texture baking
--ar 1:1 --style raw --v 6
```

**Normal Map:** generate via NormalMap-Online.com or Materialize (free tool)
**Roughness:** 0.7–0.85 (grass is matte)
**Tiling:** 4m × 4m world space

**לא לכלול:** cartoon look, too uniform color, bright neon green, watercolor, illustration style

---

### נכס #2 — Dirt_Path

**שימוש במשחק:** שכבת שביל עפר ראשי שחוצה את ה-Genesis Zone
**תיקייה:** `Content/Environment/Terrain/`
**פורמט:** PNG 4K: Albedo + Normal + Roughness + AO

**פרומפט:**
```
seamless tileable texture, worn dirt path, compacted earth, dry Mediterranean soil,
light brown and tan colors, small pebbles embedded, subtle tyre track marks,
realistic PBR, top-down orthographic, flat lighting, no shadows,
photorealistic ground texture, 4K, Israeli countryside road style
--ar 1:1 --style raw --v 6
```

**Normal Map:** medium depth (surface pebbles visible)
**Roughness:** 0.85–0.95 (very matte dry soil)
**Tiling:** 2m × 2m world space (more detail per meter)

**לא לכלול:** mud, wet soil, dark brown, pavement, asphalt

---

### נכס #3 — Gravel_Road

**שימוש במשחק:** שביל חצץ ראשי — נסיעת רכב + הליכה
**תיקייה:** `Content/Environment/Terrain/`
**פורמט:** PNG 4K: Albedo + Normal + Roughness + AO

**פרומפט:**
```
seamless tileable texture, gravel road surface, mixed small and medium grey-beige stones,
compacted gravel, dry dusty appearance, realistic PBR material, top-down view,
flat orthographic lighting, no shadows, 4K, Israeli road gravel style, photorealistic,
slight variation in stone color (grey, white, light brown)
--ar 1:1 --style raw --v 6
```

**Normal Map:** strong depth (individual stones clearly visible)
**Roughness:** 0.8–0.9
**Tiling:** 3m × 3m world space

**לא לכלול:** asphalt, concrete, uniform grey, cartoon stones

---

### נכס #4 — Rock_Surface

**שימוש במשחק:** שכבת סלע על שיפועים ואזורי גובה
**תיקייה:** `Content/Environment/Terrain/`
**פורמט:** PNG 4K: Albedo + Normal + Roughness + AO

**פרומפט:**
```
seamless tileable texture, natural rock surface, Mediterranean limestone, grey-beige stone,
natural cracks and weathering, realistic PBR material, top-down orthographic, flat lighting,
4K resolution, photorealistic, rough stone texture, dry climate erosion marks
--ar 1:1 --style raw --v 6
```

**Normal Map:** strong (deep cracks)
**Roughness:** 0.9–1.0 (stone is very matte)
**Tiling:** 5m × 5m world space (large scale rock)

---

### נכס #5 — Grass_Dry

**שימוש במשחק:** שכבת דשא יבש — אזורי קיץ / חום, פיזור על שיפועים
**תיקייה:** `Content/Environment/Terrain/`
**פורמט:** PNG 4K: Albedo + Normal + Roughness

**פרומפט:**
```
seamless tileable texture, dry summer grass, straw yellow and light brown,
Mediterranean dry season, natural variation, flat and short grass texture,
realistic PBR, top-down orthographic, flat lighting, no shadows, 4K, photorealistic
--ar 1:1 --style raw --v 6
```

**Roughness:** 0.85–0.9
**Tiling:** 4m × 4m

---

## BATCH 2 — Vegetation

---

### נכס #6 — Oak_Tree

**שימוש במשחק:** עץ עיקרי — מפוזר ביער, ליד השביל, נותן צל
**תיקייה:** `Content/Environment/Trees/`
**פורמט:** FBX + LODs (0–3) + Texture Atlas PNG 4K

**מקור מועדף:** Quixel Megascans → search "Oak Tree" | Fab.com

**פרומפט (Meshy.ai / CSM.ai):**
```
realistic Mediterranean oak tree, Quercus ithaburensis style, full canopy,
medium age tree 8–12 meters tall, natural trunk with bark texture,
realistic leaves cluster, summer foliage green, PBR materials,
FBX format, 4 LODs, wind-ready (vertex color for wind animation),
photorealistic, not cartoon, not stylized, game-ready asset
```

**מידות:** גובה 8–12m, רוחב כותרת 6–9m
**LOD0:** ~8,000 polygons | LOD1: ~3,000 | LOD2: ~1,000 | LOD3: billboard
**Wind:** Simple Grass Wind material (vertex color R = wind intensity)

---

### נכס #7 — Pine_Tree

**שימוש במשחק:** עצי אורן — יחד עם אלונים, נותנים גיוון לגובה
**תיקייה:** `Content/Environment/Trees/`
**פורמט:** FBX + LODs + Texture Atlas 4K

**פרומפט:**
```
realistic Mediterranean pine tree, Pinus brutia / Turkish pine style,
tall slender trunk, irregular branching pattern, 10–15 meters tall,
dark green needles, realistic bark texture, PBR materials, game-ready FBX,
4 LODs, wind vertex colors, photorealistic, not cartoon
```

**מידות:** גובה 10–15m, רוחב 3–5m
**LOD0:** ~6,000 polygons

---

### נכס #8 — Olive_Tree

**שימוש במשחק:** עצי זית — ייחודי לאזור ים-תיכוני, ליד שבילים ובחלקות חקלאיות
**תיקייה:** `Content/Environment/Trees/`
**פורמט:** FBX + LODs + Texture 4K

**פרומפט:**
```
realistic old olive tree, gnarled twisted trunk, silver-green leaves,
Mediterranean ancient olive, 4–6 meters tall, wide low canopy,
photorealistic PBR, game-ready FBX, LODs x4, bark texture detailed,
not stylized, not cartoon, natural aged appearance
```

**מידות:** גובה 4–6m, רוחב כותרת 4–7m
**הערה:** הגזע מפותל — נותן אופי ים-תיכוני ייחודי

---

### נכס #9 — Bush_Green

**שימוש במשחק:** שיחים ירוקים — פיזור ליד השביל, מילוי בין עצים
**תיקייה:** `Content/Environment/Foliage/`
**פורמט:** FBX + LOD (2 levels) + Texture 2K

**פרומפט:**
```
realistic Mediterranean shrub, maquis vegetation style, dense green bush,
0.8–1.5 meters tall, natural irregular shape, mix of small leaves,
PBR materials, game-ready FBX, 2 LODs, wind vertex colors,
photorealistic, not cartoon, common Israeli hillside bush
```

**מידות:** גובה 0.8–1.5m, רוחב 1–2m
**כמות בסצנה:** 150–300 (Foliage Painter)

---

### נכס #10 — Grass_Clump

**שימוש במשחק:** גושי עשב — מילוי על הטרריין, תנועת רוח
**תיקייה:** `Content/Environment/Foliage/`
**פורמט:** FBX Foliage + Texture 2K (alpha)

**פרומפט:**
```
realistic grass clump, Mediterranean mixed grass, 30–60cm tall,
natural irregular shape, green with slight dry tips, alpha transparency texture,
game-ready FBX foliage, wind-ready vertex colors, PBR,
photorealistic, not cartoon, dense clump shape
```

**הערה:** חיוני שיהיה Alpha channel לעלים — אחרת נראה כמו בלוק

---

## BATCH 3 — Rocks & Boulders

---

### נכס #11 — Boulder_Large

**שימוש במשחק:** סלעים גדולים — ליד שיפועים, אלמנט נוף עיקרי
**תיקייה:** `Content/Environment/Rocks/`
**פורמט:** FBX + LODs (3) + Texture 4K

**מקור מועדף:** Quixel Megascans → "Limestone Boulder"

**פרומפט (Meshy.ai):**
```
realistic large limestone boulder, Mediterranean rock, 2–3 meters tall,
natural weathering and erosion marks, mossy patches on north side,
beige-grey color, photorealistic PBR textures, FBX game-ready,
3 LODs, natural irregular shape, not round, not cartoon
```

**מידות:** גובה 2–3m, משקל ויזואלי: ראשי
**LOD0:** ~3,000 polygons

---

### נכס #12 — Boulder_Medium

**שימוש במשחק:** סלעים בינוניים — פיזור על שולי השביל ובשיפועים
**תיקייה:** `Content/Environment/Rocks/`
**פורמט:** FBX + LODs (2) + Texture 4K

**פרומפט:**
```
realistic medium limestone rock, 0.8–1.5 meters, Mediterranean style,
natural cracks, dry climate weathering, beige-grey color,
photorealistic PBR, game-ready FBX, 2 LODs, irregular natural shape
```

**כמות בסצנה:** 50–100 (scatter)

---

### נכס #13 — Stone_Small_Set

**שימוש במשחק:** אבנים קטנות — scatter על שולי הדרך, ליד שיחים
**תיקייה:** `Content/Environment/Rocks/`
**פורמט:** FBX pack (6–8 variations) + Texture Atlas 2K

**פרומפט:**
```
realistic small stone collection, 5–30cm size, Mediterranean limestone,
6 different shapes, natural variation in color (grey, beige, white),
photorealistic PBR texture atlas, game-ready FBX, single LOD,
natural dry weathering, not cartoon, scatter-ready pack
```

**הערה:** חשוב שיהיו וריאציות — אחרת הפיזור נראה חוזר

---

## BATCH 4 — Props & Infrastructure

---

### נכס #14 — Wooden_Fence

**שימוש במשחק:** גדר עץ — גבול חלקות, שולי שביל, מגדיר מרחב
**תיקייה:** `Content/Environment/Props/`
**פורמט:** FBX Spline Mesh + Texture 2K

**פרומפט:**
```
realistic old wooden fence, Mediterranean countryside style, weathered grey-brown wood,
simple post and rail design, 1.2 meters tall, natural aging and weathering,
photorealistic PBR, game-ready FBX spline mesh, 2 LODs,
not painted white, not cartoon, rustic farmland fence
```

**הרכב:** עמוד + קורה × 2 (spline ready)
**UV:** unwrapped for spline deformation

---

### נכס #15 — Dirt_Road_Tire_Tracks

**שימוש במשחק:** Decal — עקבות גלגלים על השביל, מעניק realism
**תיקייה:** `Content/Environment/Decals/`
**פורמט:** Decal PNG 2K (Albedo + Normal + Roughness)

**פרומפט:**
```
realistic tire tracks decal texture, dry dirt road, parallel wheel marks,
2 tracks width 1.5m apart, natural depth and shadow, top-down view,
transparent edges for blending, PBR decal, photorealistic, not cartoon
```

**שימוש ב-UE5:** Deferred Decal Actor, blend mode = Translucent

---

### נכס #16 — Wooden_Crate

**שימוש במשחק:** ארגז עץ — prop בסיסי ליד מחסנים ונקודות איסוף
**תיקייה:** `Content/Props/`
**פורמט:** FBX + Texture 2K

**פרומפט:**
```
realistic wooden crate, old storage box, worn wood planks with metal corners,
60cm × 60cm × 50cm, natural wood grain, aged and weathered,
photorealistic PBR, game-ready FBX, 2 LODs, not cartoon, rustic style
```

---

## BATCH 5 — Characters & Avatar

---

### נכס #17 — Base_Player_Character

**שימוש במשחק:** דמות שחקן ראשית — Third Person, גוף מלא
**תיקייה:** `Content/Characters/Player/`
**פורמט:** Skeletal Mesh FBX + Texture 4K + PhysicsAsset

**מקור:** UE5 Mannequin (קיים) → החלפה עתידית ב-MetaHuman

**פרומפט (Meshy.ai / Ready Player Me):**
```
realistic human male character, casual worker outfit, Mediterranean appearance,
jeans and work shirt, boots, average build, no fantasy armor, no weapons,
photorealistic PBR textures, game-ready skeletal mesh FBX,
UE5 compatible skeleton, T-pose, realistic face, not cartoon
```

**גובה:** 180cm (standard UE5 scale)
**Skeleton:** UE5 Mannequin compatible (required for Mixamo animations)

---

### נכס #18 — Idle_Animation

**שימוש במשחק:** אנימציית עמידה בסיסית — breath, subtle weight shift
**תיקייה:** `Content/Characters/Animations/`
**פורמט:** FBX Animation (looping)

**מקור:** Mixamo → "Breathing Idle" / "Standing Idle"
**חיפוש ב-Mixamo:** `idle`, `standing idle`, `breathing idle`

**הגדרות:**
- Loop: Yes
- In-place: Yes (no root motion drift)
- FPS: 30
- Blend: עם Walk/Run

---

### נכס #19 — Walk_Run_Animation

**שימוש במשחק:** הליכה וריצה — WASD control
**תיקייה:** `Content/Characters/Animations/`
**פורמט:** FBX Animation (looping, in-place)

**מקור:** Mixamo → "Walking" + "Running"
**חיפוש ב-Mixamo:** `standard walk`, `fast run`

**הגדרות:**
- 2 קבצים נפרדים: Walk (normal) + Run (Shift)
- In-place: Yes (root motion handled by UE5 CharacterMovement)
- FPS: 30
- Speed Walk: 200 cm/s | Speed Run: 550 cm/s

---

## BATCH 6 — Vehicles

---

### נכס #20 — Pickup_Truck

**שימוש במשחק:** רכב שטח ראשי — הובלת משאבים, ניידות בשטח
**תיקייה:** `Content/Vehicles/`
**פורמט:** FBX + Texture 4K + PhysicsAsset (Chaos Vehicle ready)

**מקור מועדף:** Fab.com → חפש "pickup truck game ready UE5 chaos vehicle"
**תקציב מוצע:** $30–$80

**מה לחפש:**
```
UE5 Chaos Vehicle compatible pickup truck, realistic exterior and interior,
separated wheels (4 meshes), proper physics asset, LODs x3,
4K PBR textures (Albedo, Normal, Roughness, Metallic),
door bones for animation, 4WD offroad capable model
```

**דרישות טכניות:**
- גלגלים: 4 Skeletal Bones (FL, FR, RL, RR)
- Wheel Collision: sphere per wheel
- Suspension: Chaos Vehicle Plugin settings
- Interior: basic cockpit visible from driver seat

---

## סיכום — סדר רכישה/ייצור מומלץ

```
שלב א (השבוע):
  #1  Grass_Meadow     → Quixel Bridge (חינם)
  #2  Dirt_Path        → Quixel Bridge (חינם)
  #3  Gravel_Road      → Quixel Bridge (חינם)
  #4  Rock_Surface     → Quixel Bridge (חינם)
  #17 Base_Character   → UE5 Mannequin (קיים)
  #18 Idle_Animation   → Mixamo (חינם)
  #19 Walk_Run         → Mixamo (חינם)

שלב ב (שבוע הבא — אחרי אישור סגנון):
  #6  Oak_Tree         → Quixel / Fab
  #7  Pine_Tree        → Quixel / Fab
  #11 Boulder_Large    → Quixel / Fab
  #20 Pickup_Truck     → Fab.com (רכישה)

שלב ג (אחרי 20 מאושרים → API):
  וריאציות, seasons, damage states
```
