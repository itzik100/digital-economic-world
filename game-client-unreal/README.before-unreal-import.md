# Game Client — Unreal Engine 5
## עולם דיגיטלי כלכלי קהילתי

---

## פתיחת הפרויקט

1. פתח **Epic Games Launcher**
2. לחץ **Launch** על UE 5.4+
3. פתח פרויקט קיים → נווט לתיקייה זו → בחר `DigitalWorld.uproject`
4. לחץ **Play** (Alt+P) להרצה

---

## מבנה תיקיות

```
game-client-unreal/
├── DigitalWorld.uproject     ← קובץ פרויקט ראשי (נוצר ב-UE5 Editor)
├── Content/
│   ├── Maps/
│   │   └── GenesisZone_01   ← Map ראשית
│   ├── Characters/
│   │   ├── Player/
│   │   └── Animations/
│   ├── Vehicles/
│   ├── Environment/
│   │   ├── Terrain/         ← Materials + Textures
│   │   ├── Trees/
│   │   ├── Rocks/
│   │   └── Foliage/
│   ├── UI/
│   └── Audio/
├── Config/                   ← Project settings
├── Screenshots/              ← צילומי מסך לכל Sprint
└── Source/                   ← C++ (שלב עתידי)
```

---

## Sprint נוכחי

**Sprint 1** — UE5 Foundation
ראה: `../project-brief/SPRINT_1_CHECKLIST.md`

---

## Plugins פעילים

| Plugin | מטרה | סטטוס |
|--------|------|--------|
| Enhanced Input | שליטה | ✅ Sprint 1 |
| Modeling Tools | עריכת terrain | ✅ Sprint 1 |
| Water | מים (עתידי) | ⬜ Sprint 3 |
| Chaos Vehicles | רכבים | ⬜ Sprint 4 |
| HTTP | Backend | ⬜ Sprint 7 |

---

## Rendering

- Lumen GI + Reflections
- Virtual Shadow Maps
- TSR Anti-Aliasing
- Sky Atmosphere

---

## Backend

Backend נפרד: `../backend/`
חיבור: Sprint 7 (HTTP Plugin + WebSocket)
