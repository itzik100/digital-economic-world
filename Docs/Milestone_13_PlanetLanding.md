# Milestone 13 — Interactive Planet Landing MVP

Target experience: open **PlanetView** → see a rotating planet with visible landing beacons →
click a beacon → descend → land in a natural-looking **PlanetGenesis**.

## What is already built (headless, committed as the visual layer)

### PlanetView
- Planet (`PlanetGenesis_VisualPlanet` + Cloud + Atmosphere) at origin — **already auto-rotates**
  (RotatingMovementComponent). So "rotate the planet" is satisfied in its fallback form on Play.
- **3 landing beacons** on the camera-facing side of the planet:
  `LandingPoint_Genesis_01 / _02 / _03` — glowing green spheres (unlit emissive
  `M_LandingMarker_Glow`), collision = BlockAll so they are **clickable**.
- **3 labels** `LandingLabel_Genesis_01 / _02 / _03` ("Landing 01/02/03") facing the camera.

### PlanetGenesis (natural world)
- Existing: Landscape (with collision), DirectionalLight, SkyLight, SkyAtmosphere,
  VolumetricCloud, ExponentialHeightFog, PostProcessVolume — sky + light already there.
- Added: `Genesis_Water_Pool` (M_Water_Lake plane), `Genesis_Bush_01..04`,
  `Genesis_Tree_01/02` (scaled-up bushes), `Genesis_Rock_01..03`.
- PlayerStart at `(900, 1110, 92)` on the landscape → stable spawn, no fall.

**Right now:** Play PlanetView → rotating planet + 3 glowing beacons. **Clicking does nothing yet.**
Play PlanetGenesis → walkable natural area (ground, water, bushes, rocks, trees).

## The one manual step — wire click → transition (~5 min, in the editor)

Graph nodes can't be scripted headlessly here (no Python K2-graph API; C++ won't compile on this
machine). So this is done by hand. Everything it needs is already placed.

Open `PlanetView` → **Blueprints ▸ Open Level Blueprint**:

1. **Event BeginPlay** → `Get Player Controller` → drag off → **Set Show Mouse Cursor** = ✔ true.
   From the same controller → **Set Enable Click Events** = ✔ true.
2. For **each** of `LandingPoint_Genesis_01/02/03`: click it in the outliner, then in the Level
   Blueprint right-click empty space → **Add Event ▸ On Clicked** (creates an OnClicked event
   node for that actor).
3. From each **On Clicked** exec → **Open Level (by Name)**, Level Name = `PlanetGenesis`.
4. **Compile** + **Save**. Play → click a glowing beacon → PlanetGenesis loads.

### Optional polish (only if the above works first)
- **Descent cinematic before load:** the `PlanetViewDescentCinematic` (LevelSequenceActor with
  `LS_PlanetView_BeginDescent`) already exists. Select it → Details → **uncheck Auto Play**.
  Then in the graph: On Clicked → get `PlanetViewDescentCinematic` → `Get Sequence Player` →
  `Play` → `Delay` (≈ sequence length, ~3.5s) → `Open Level PlanetGenesis`.
- **If clicking a 3D beacon is fussy:** fallback that always works — the `BeginDescent` action
  (Enter key) is already mapped; wire `BeginDescent (Pressed)` → `Open Level PlanetGenesis`.
- **Mouse-drag rotation** (instead of auto): on the planet actors disable RotatingMovement, add a
  `Mouse X` axis mapping, and in the graph `AddActorLocalRotation` on the planet by the axis value.
  Not required — auto-rotation already covers the requirement.

## Test checklist
- **A.** Open PlanetView → Play → planet visible + rotating, 3 glowing beacons visible.
- **B.** Click a beacon → (optional cinematic →) PlanetGenesis loads, no crash.
- **C.** In PlanetGenesis → player stands (does not fall), sees ground, water, bushes/trees, rocks;
  feels like a first landing.

## Git
Visual layer committed locally now. After you wire the transition and confirm it in Play, tell me
and I push. (Per your rule: push only when it works end-to-end.)
