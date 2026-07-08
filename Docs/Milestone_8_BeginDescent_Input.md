# Milestone 8 — Begin Descent Input Wiring

Date: 2026-07-08

## Current status

PlanetView is now configured as the startup map for both the Unreal Editor and the game.

Configured in:

- `game-client-unreal/Config/DefaultEngine.ini`
- `game-client-unreal/Config/DefaultInput.ini`

Current startup map:

- `/Game/Maps/PlanetView.PlanetView`

Current GameMode:

- `/Game/PlanetView/BP_PlanetViewGameMode.BP_PlanetViewGameMode_C`

Current input mapping:

- Action Name: `BeginDescent`
- Key: `Enter`

Current cinematic asset:

- `/Game/PlanetView/Cinematics/LS_PlanetView_BeginDescent`

## Important note

At this milestone, `Enter` is mapped in config, but the Blueprint does not yet listen to the `BeginDescent` action.

This means:

- The input action exists.
- The startup map is correct.
- The custom PlanetView GameMode is configured.
- The actual Blueprint logic still needs to be wired in Unreal Editor.

## Required Unreal Editor wiring

Recommended implementation path:

1. Open `BP_PlanetViewGameMode`.
2. Create a dedicated PlayerController later if needed:
   - Suggested name: `BP_PlanetViewPlayerController`
   - Suggested location: `/Game/PlanetView/Input/`
3. Bind the `BeginDescent` input action.
4. On `BeginDescent`:
   - Prevent repeated triggering with a boolean such as `bDescentStarted`.
   - Play `LS_PlanetView_BeginDescent`.
   - Hide or fade the idle overlay text.
   - Show descent state text.
5. Future milestone:
   - On sequence finished, call `Open Level` with target map:
     - `PlanetGenesis`

## MVP behavior target

When the player starts the game:

1. Game opens directly into `PlanetView`.
2. Player sees the planet / transition screen.
3. Player presses `Enter`.
4. Descent cinematic starts.
5. Text indicates the target is `PlanetGenesis`.
6. Later milestone loads `PlanetGenesis`.

## Do not do yet

Do not force-edit `.uasset` Blueprint files directly from terminal.

Blueprint binary files should be changed through Unreal Editor unless a safe automation path is available.
