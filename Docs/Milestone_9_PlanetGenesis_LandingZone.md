# Milestone 9 — PlanetGenesis Landing Zone

Date: 2026-07-08

## Current status

`PlanetGenesis` exists and is a valid landing target map.

Map path:

- `/Game/Maps/PlanetGenesis.PlanetGenesis`

Current detected map elements:

- Landscape
- PlayerStart_0
- DirectionalLight_0
- SkyLight_1
- SkyAtmosphere_0
- VolumetricCloud_0
- ExponentialHeightFog_0
- PostProcessVolume_0
- BP_GenesisGround
- BP_GenesisMarker
- TextRenderActor_1
- Multiple StaticMeshActors

## Purpose

PlanetGenesis is the first playable world surface.

It represents the beginning of the new settled planet:
natural land, sky, terrain, basic markers, and the first landing location.

## MVP landing behavior

Future flow:

1. Player starts in `PlanetView`.
2. Player presses `Enter`.
3. Descent cinematic begins.
4. Game transitions to `PlanetGenesis`.
5. Player appears at `PlayerStart_0`.
6. Player sees the Genesis landing area.

## Landing Zone definition

The initial landing area should be treated as the player's first safe zone.

Suggested name:

- Genesis Landing Zone

Core elements:

- Clear ground/floor
- Visible sky and atmosphere
- PlayerStart
- Marker or text indicating arrival
- Room for future resource objects:
  - trees
  - stones
  - iron
  - water
  - mountain/terrain features

## Do not build yet

Do not add economy systems yet.

Do not add crypto/token logic yet.

Do not add multiplayer yet.

Do not add inventory yet.

First priority is making the player journey clear:

PlanetView -> Descent -> PlanetGenesis landing.

## Next technical target

Milestone 10 should focus on either:

Option A:
Wire `BeginDescent` in Unreal Editor so Enter plays the cinematic.

Option B:
Open `PlanetGenesis` in Unreal Editor and visually confirm the Landing Zone, PlayerStart, lighting, and marker placement.

Recommended next step:

Use Unreal Editor for a visual validation pass before changing binary map assets again.
