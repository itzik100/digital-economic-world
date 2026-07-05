# ASSET SHOPPING LIST
## עולם דיגיטלי כלכלי קהילתי — שלב 1: סגנון ויזואלי

**כלל:** לא מייצרים בכמויות לפני אישור סגנון.
**מטרה ראשונה:** 20 נכסים מאושרים → הגדרת שפה ויזואלית → ייצור בסיוע API.

**סגנון מחייב לכל נכס:**
- Realistic open-world (לא קרטון, לא low-poly)
- Google Earth inspired — כאילו צמנו מהאוויר לתוך הנוף
- Mediterranean / Israeli terrain: ירוק + יבש + חצץ
- תאורה: Lumen day light, no HDR bloom excess
- רזולוציה: 4K textures / FBX with LODs

---

## BATCH 1 — Terrain Textures (עדיפות: קריטי)
> בסיס הנוף — לא מתקדמים בלי אלה.

| # | שם נכס | תיקייה | פורמט | עדיפות | סטטוס |
|---|---------|---------|--------|--------|--------|
| 1 | Grass_Meadow | Environment/Terrain | PNG 4K + Normal | 🔴 קריטי | ⬜ |
| 2 | Dirt_Path | Environment/Terrain | PNG 4K + Normal + Roughness | 🔴 קריטי | ⬜ |
| 3 | Gravel_Road | Environment/Terrain | PNG 4K + Normal | 🔴 קריטי | ⬜ |
| 4 | Rock_Surface | Environment/Terrain | PNG 4K + Normal | 🔴 קריטי | ⬜ |
| 5 | Grass_Dry | Environment/Terrain | PNG 4K | 🟠 גבוה | ⬜ |

## BATCH 2 — Vegetation (עדיפות: גבוה)
> עצים ושיחים — גבול בין שביל ויער.

| # | שם נכס | תיקייה | פורמט | עדיפות | סטטוס |
|---|---------|---------|--------|--------|--------|
| 6 | Oak_Tree | Environment/Trees | FBX + LODs (0-3) | 🔴 קריטי | ⬜ |
| 7 | Pine_Tree | Environment/Trees | FBX + LODs (0-3) | 🟠 גבוה | ⬜ |
| 8 | Olive_Tree | Environment/Trees | FBX + LODs (0-3) | 🟠 גבוה | ⬜ |
| 9 | Bush_Green | Environment/Foliage | FBX + LOD | 🟠 גבוה | ⬜ |
| 10 | Grass_Clump | Environment/Foliage | FBX Foliage | 🟡 בינוני | ⬜ |

## BATCH 3 — Rocks & Boulders (עדיפות: גבוה)
> פיזור על השטח — depth ו-realism.

| # | שם נכס | תיקייה | פורמט | עדיפות | סטטוס |
|---|---------|---------|--------|--------|--------|
| 11 | Boulder_Large | Environment/Rocks | FBX + LODs | 🟠 גבוה | ⬜ |
| 12 | Boulder_Medium | Environment/Rocks | FBX + LODs | 🟠 גבוה | ⬜ |
| 13 | Stone_Small_Set | Environment/Rocks | FBX (scatter pack) | 🟡 בינוני | ⬜ |

## BATCH 4 — Props & Infrastructure (עדיפות: בינוני)

| # | שם נכס | תיקייה | פורמט | עדיפות | סטטוס |
|---|---------|---------|--------|--------|--------|
| 14 | Wooden_Fence | Environment/Props | FBX Spline | 🟡 בינוני | ⬜ |
| 15 | Dirt_Road_Tire_Tracks | Environment/Decals | Decal PNG | 🟡 בינוני | ⬜ |
| 16 | Wooden_Crate | Props | FBX + LOD | 🟡 בינוני | ⬜ |

## BATCH 5 — Characters & Avatar (עדיפות: גבוה)

| # | שם נכס | תיקייה | פורמט | עדיפות | סטטוס |
|---|---------|---------|--------|--------|--------|
| 17 | Base_Player_Character | Characters/Player | Skeletal Mesh FBX | 🔴 קריטי | ⬜ |
| 18 | Idle_Animation | Characters/Animations | FBX Anim | 🔴 קריטי | ⬜ |
| 19 | Walk_Run_Animation | Characters/Animations | FBX Anim | 🔴 קריטי | ⬜ |

## BATCH 6 — Vehicles (עדיפות: גבוה)

| # | שם נכס | תיקייה | פורמט | עדיפות | סטטוס |
|---|---------|---------|--------|--------|--------|
| 20 | Pickup_Truck | Vehicles | FBX + Physics Asset | 🔴 קריטי | ⬜ |

---

## הערות לשלב הבא

אחרי אישור 20 הנכסים → נעביר לייצור API:
- Terrain textures: Midjourney / Stable Diffusion XL (תבנית נפרדת)
- Trees / Rocks: Instant Meshes / Meshy.ai / Luma AI
- Animations: Mixamo (חינם, Adobe account)
- Vehicles: Fab.com / Sketchfab

**לא** מתחילים ייצור API לפני שה-20 הראשונים עברו בדיקת סגנון.
