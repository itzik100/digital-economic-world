# Milestone 10 — Visual Validation

Date: 2026-07-08

## Purpose

Validate the current Unreal project visually after configuring PlanetView as the startup experience and documenting PlanetGenesis as the landing target.

## Result summary

The project opens successfully.

`PlanetView` opens automatically as the startup map.

`PlanetGenesis` opens successfully from the Content Browser.

Play mode works in both maps.

No crash was observed.

## PlanetView validation

Observed:

- Map opens automatically as `PlanetView`.
- Planet visual is visible.
- TextRender UI actors are present.
- Play mode works.
- Descent text appears.

Issues found:

- Text is too large / too close to camera.
- Some text is clipped off-screen.
- Lighting rebuild warning appears:
  - `LIGHTING NEEDS TO BE REBUILT`

Recommended follow-up:

- Create a PlanetView UI alignment pass.
- Reposition / resize TextRenderActors.
- Build lighting later when the visual layout stabilizes.

## PlanetGenesis validation

Observed:

- Map opens successfully.
- Play mode works.
- Character spawns successfully.
- Ground/floor exists.
- Lighting and sky actors exist in the Outliner.

Issues found:

- SkyDome / Sky Material warning appears repeatedly:
  - `YOUR SCENE CONTAINS A SKYDOME MESH WITH A SKY MATERIAL BUT IT DOES NOT COVER THAT PART OF THE SCREEN`
- The playable area is visually too basic.
- The landing zone does not yet feel like a natural Genesis planet.
- The sky appears too dark/black during play.
- The ground currently appears as a simple blue flat surface.
- PlanetGenesis still appears to use the ThirdPerson GameMode override.

Recommended follow-up:

- Fix or replace the SkySphere/SkyDome setup.
- Improve the first landing zone visually.
- Add natural MVP elements:
  - earth/terrain feel
  - rocks
  - trees
  - water indication
  - simple landing marker
- Review the GameMode override for PlanetGenesis.

## Current MVP route

Current intended route:

1. `PlanetView`
2. Begin Descent input
3. Descent cinematic placeholder
4. `PlanetGenesis`
5. Player spawns at the first landing area

## Next recommended milestone

Milestone 11 — PlanetGenesis Sky and Landing Zone Visual Pass

Goal:

Make PlanetGenesis look like the first real landing place on a new planet, without adding gameplay systems yet.
