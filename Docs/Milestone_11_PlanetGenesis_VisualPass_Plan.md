# Milestone 11 — PlanetGenesis Sky and Landing Zone Visual Pass

Date: 2026-07-08

## Current repository state

- **Repo path:** `/Users/yitzchak/Documents/digital-world`
- **Unreal project:** `game-client-unreal/MyProject.uproject` (Unreal Engine 5.4)
- **Branch:** `main`
- **Working tree:** clean (nothing to commit) at start of this milestone
- **Latest commit:** `1094c60 Document Unreal visual validation findings`
- Recent history matches expectations:
  - `1094c60` Document Unreal visual validation findings
  - `6d87693` Document PlanetGenesis landing zone
  - `d5752f1` Document PlanetView descent input wiring
  - `fd1718d` Configure PlanetView startup and descent input
  - `682df09` Add PlanetView descent cinematic placeholder
  - `37362bd` Add PlanetView begin descent overlay
  - `8de3f2e` Add PlanetView cinematic rotation experience

## Confirmed existing files

- PlanetView map: `game-client-unreal/Content/Maps/PlanetView.umap` ✅
- PlanetGenesis map: `game-client-unreal/Content/Maps/PlanetGenesis.umap` ✅
- PlanetView GameMode: `game-client-unreal/Content/PlanetView/BP_PlanetViewGameMode.uasset` ✅
- Descent Level Sequence: `game-client-unreal/Content/PlanetView/Cinematics/LS_PlanetView_BeginDescent.uasset` ✅
- Docs present: `Docs/Milestone_8_BeginDescent_Input.md`, `Docs/Milestone_9_PlanetGenesis_LandingZone.md`, `Docs/Milestone_10_VisualValidation.md`

## Startup and input configuration (verified)

Confirmed in `game-client-unreal/Config/DefaultEngine.ini`:
- `EditorStartupMap=/Game/Maps/PlanetView.PlanetView` ✅
- `GameDefaultMap=/Game/Maps/PlanetView.PlanetView` ✅
- `GlobalDefaultGameMode=/Game/PlanetView/BP_PlanetViewGameMode.BP_PlanetViewGameMode_C` ✅

Confirmed in `game-client-unreal/Config/DefaultInput.ini`:
- `+ActionMappings=(ActionName="BeginDescent",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=Enter)` ✅

> Note: the *global* default GameMode is `BP_PlanetViewGameMode`, but the PlanetGenesis map appears to carry its own GameMode override (see findings below). No config change is needed for this milestone.

## Existing PlanetGenesis / natural assets found

### GenesisZone
- `Content/GenesisZone/BP_GenesisGround.uasset` — Genesis ground blueprint
- `Content/GenesisZone/BP_GenesisMarker.uasset` — Genesis marker blueprint

### Environment
- `Content/Environment/` — **empty** (no assets)

### Meshes
- `Content/Meshes/` — **empty** (no assets)

### Materials
- `Content/Materials/M_PlanetGenesis_Planet.uasset` (space-view planet surface)
- `Content/Materials/M_PlanetGenesis_Clouds.uasset`
- `Content/Materials/M_PlanetGenesis_Atmosphere.uasset`
- `Content/Materials/M_SpaceBackground.uasset`
- Textures: `T_PlanetGenesis_Surface`, `T_PlanetGenesis_CloudMask`, `T_PlanetGenesis_Stars`
  > These are for the **space view (PlanetView)**, not the ground. They are not surface/ground materials for the landing zone.

### Natural asset candidates (usable for the Landing Zone — mostly StarterContent)
- **Rocks:** `Content/StarterContent/Props/SM_Rock.uasset` (+ `M_Rock`), rock materials `M_Rock_Basalt`, `M_Rock_Sandstone`, `M_Rock_Slate`, `M_Rock_Marble_Polished`
- **Nature / foliage placeholder:** `Content/StarterContent/Props/SM_Bush.uasset` (+ `M_Bush`) — usable as a "tree/plant" placeholder (no real tree mesh exists yet)
- **Ground materials:** `M_Ground_Grass`, `M_Ground_Gravel`, `M_Ground_Moss` (StarterContent) — good for painting the landscape / a ground plane
- **Cobblestone / stone materials:** `M_CobbleStone_Pebble/Rough/Smooth`, `M_Brick_Cut_Stone`, `M_Brick_Hewn_Stone`
- **Water:** `M_Water_Lake`, `M_Water_Ocean` (StarterContent) — for a water indication
- **Basic shapes (for markers / ground plane):** `Content/StarterContent/Shapes/Shape_Plane`, `Shape_Sphere`, `Shape_Cube`, `Shape_Cone`, `Shape_Cylinder`; engine `/Engine/BasicShapes/*`
- **Sky material:** `Content/StarterContent/Blueprints/Assets/Skybox.uasset`, `M_LightStage_Skybox_*` (StarterContent) — reference only; PlanetGenesis already uses the engine sky stack
- **Landing marker:** `BP_GenesisMarker` (existing), `BP_GenesisGround` (existing)

> There are **no dedicated tree, terrain-splat, ore, or mountain assets** in the project. For a first pass, SM_Rock + SM_Bush + StarterContent ground/water materials are the realistic building blocks.

## PlanetGenesis map findings (from `strings`, read-only — verify in Editor)

`PlanetGenesis.umap` is a **World Partition / One-File-Per-Actor** map. External actors: **50 files** under `Content/__ExternalActors__/Maps/PlanetGenesis/`.

- **Landscape:** ✅ real Landscape present — 1 `Landscape` + **16 `LandscapeStreamingProxy`** tiles (+ heightfield collision + landscape material instances)
- **PlayerStart:** ✅ present
- **SM_SkySphere:** ✅ present (engine sky dome mesh) — **likely source of the SkyDome warning**
- **SkyAtmosphere:** ✅ present
- **DirectionalLight:** ✅ present
- **SkyLight:** ✅ present
- **VolumetricCloud:** ✅ present
- **ExponentialHeightFog:** ✅ present
- **PostProcessVolume:** ✅ present
- **StaticMeshActors:** ~21 present — identity not certain from strings (could include SM_SkySphere and possibly leftover `LevelPrototyping` blockout or landing props). **Must be inspected in the Editor Outliner.**
- **BP_GenesisGround / BP_GenesisMarker:** referenced in GenesisZone; presence in-map to be confirmed in Editor.
- **GameMode:** ⚠️ the map references **`/Game/ThirdPerson/Blueprints/BP_ThirdPersonGameMode`** (`DefaultGameMode`) — i.e. PlanetGenesis very likely has a **World Settings GameMode Override = BP_ThirdPersonGameMode**. This is why a ThirdPerson character spawns/walks there. Also carries a legacy `ThirdPersonExampleMap` reference.

## Visual issues to address

1. **SkyDome warning** — "YOUR SCENE CONTAINS A SKYDOME MESH WITH A SKY MATERIAL BUT IT DOES NOT COVER THAT PART OF THE SCREEN". Caused by `SM_SkySphere` (sky-material dome) coexisting with `SkyAtmosphere` and/or not covering the view.
2. **Black / too-dark sky** — likely the DirectionalLight is weak/misaimed, and/or the SkySphere dome overrides the SkyAtmosphere, so the atmosphere isn't lighting the sky as daylight.
3. **Blue / simple ground** — the landscape appears as a flat blue-ish surface; it needs a proper ground material (grass/gravel/moss) and some relief/props.
4. **Landing zone not visually rich** — no rocks, nature, water, or clear "first safe landing point" framing around PlayerStart yet.
5. **ThirdPerson GameMode override on PlanetGenesis** — acceptable temporarily (gives a playable character), but should later be a dedicated `BP_PlanetGenesisGameMode`.
6. **(Secondary) PlanetView text clipping** — TextRenderActor overlay is too large/close and clips on the left.

## Safe sub-milestones

### Milestone 11.1 — Sky setup cleanup
**Goal:** Make the PlanetGenesis sky readable and remove/reduce the SkyDome warning.
**Safe approach:**
- Open the Unreal Editor.
- Inspect `SM_SkySphere` in the Outliner.
- Prefer the `SkyAtmosphere` + `DirectionalLight` + `SkyLight` + `VolumetricCloud` stack (already present). Either hide/remove the `SM_SkySphere` dome, or give it a proper sky material — decide visually.
- Ensure the DirectionalLight faces the scene and has daylight intensity; let SkyLight recapture.
- **Do not** terminal-edit `.uasset` / `.umap`. Save only after visual confirmation.
**Expected result:** sky no longer black; SkyDome warning reduced or gone; scene feels like daylight/atmosphere.

### Milestone 11.2 — Landing Zone visual foundation
**Goal:** Make the PlayerStart area feel like the first safe landing point on a natural planet.
**Elements (from available assets):**
- A proper ground material on the landscape (e.g. `M_Ground_Grass` / `M_Ground_Gravel` / `M_Ground_Moss`).
- A landing marker (reuse `BP_GenesisMarker`).
- 3–5 rocks (`SM_Rock`, scaled/rotated variants).
- 2–3 nature placeholders (`SM_Bush`) — stand-ins until real trees exist.
- Optional water indication using `M_Water_Lake`/`M_Water_Ocean` on a `Shape_Plane`.
- Clear directional framing from the spawn point.
**Expected result:** pressing Play in PlanetGenesis, the player immediately sees a believable first landing area.

### Milestone 11.3 — PlanetGenesis GameMode review
**Goal:** Decide whether to keep ThirdPersonGameMode temporarily or create a dedicated GameMode.
**Recommendation:** For now, ThirdPerson can remain (it gives a playable character spawn). Later create `Content/PlanetGenesis/BP_PlanetGenesisGameMode.uasset` (subclass of the ThirdPerson GameMode) and set it as the map's World Settings override.

### Milestone 11.4 — PlanetView UI alignment pass
**Goal:** Fix clipped text in PlanetView.
**Safe approach:** Open PlanetView in the Editor; adjust the `UI_*` TextRenderActor scale/location (they are in-world text in front of `PlanetViewCamera`); confirm in Play; save only after visual confirmation.

## Do not do yet

- Do **not** add economy.
- Do **not** add crypto / token logic.
- Do **not** add multiplayer.
- Do **not** add inventory.
- Do **not** add mining.
- Do **not** add backend.
- Do **not** force-edit binary Unreal assets from the terminal.
- Do **not** mass-delete Sky actors without a visual backup / editor confirmation.

## Recommended next action

**A. Start with PlanetGenesis Sky cleanup in the Unreal Editor.**

Rationale: the sky/lighting stack already exists, so the fastest, safest visible win is resolving the SkyDome warning and lighting the sky (Milestone 11.1). A lit scene is also a prerequisite for judging the Landing Zone work (11.2). No new assets are required for 11.1.

## Exact next manual Unreal Editor checklist

1. Open `game-client-unreal/MyProject.uproject`.
2. Open the `PlanetGenesis` map.
3. Check the Outliner for `SM_SkySphere`, `SkyAtmosphere`, `SkyLight`, `DirectionalLight`, `VolumetricCloud`, `ExponentialHeightFog`, and the `~21 StaticMeshActors`.
4. Temporarily hide `SM_SkySphere` and check whether the SkyDome warning disappears and the SkyAtmosphere sky shows.
5. Adjust lighting/sky only if visually confirmed (DirectionalLight rotation/intensity; SkyLight recapture).
6. Press Play.
7. Validate the PlayerStart view (is the ground/sky believable?).
8. Save only if the improvement is clear.
9. Return to the terminal.
10. Run `git status` and review changed map / external-actor files.
11. Commit only the changed map / external actors if expected (and only after visual confirmation).

## Notes / open questions for the Editor pass

- Confirm the identity of the ~21 StaticMeshActors — if any are leftover `LevelPrototyping` blockout, they can be removed (with visual confirmation) as in earlier milestones.
- Confirm whether `BP_GenesisGround` / `BP_GenesisMarker` are actually placed in the PlanetGenesis map.
- Confirm the World Settings GameMode Override on PlanetGenesis is `BP_ThirdPersonGameMode`.
