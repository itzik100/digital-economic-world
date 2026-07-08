# Milestone 12 — First Playable Genesis Loop

Goal: open **PlanetGenesis**, press **Play**, walk to the Stone, press **E**, and see it
collected with the counter going `Stone: 0` → `Stone: 1`.

## What is already done (headless, committed)

These are real, in the map, and testable right now:

1. **Walkable map.** `PlanetGenesis` already overrides its GameMode to
   `BP_ThirdPersonGameMode` (pawn = `BP_ThirdPersonCharacter`). Pressing Play spawns a
   walkable third-person character with WASD + mouse look. No change was needed here.
2. **Editor startup map** → `PlanetGenesis` (`Config/DefaultEngine.ini`), so the project
   opens directly in the playable zone. (Packaged `GameDefaultMap` is still `PlanetView`
   intro — unchanged.)
3. **Interact input** = **E** — legacy `ActionMapping "Interact"` in `Config/DefaultInput.ini`.
4. **Stone resource placed** near the PlayerStart:
   - `Stone_Resource` — `StaticMeshActor` (SM_Rock, scale 2), at `(1500, 1110, 0)`.
     PlayerStart is at `(900, 1110, 92)` facing +X, so the rock is straight ahead.
   - `Label_Stone` — TextRender "**Stone - Press E**" above the rock, facing spawn.
   - `HUD_StoneCounter` — TextRender "**Stone: 0**" (in-world HUD placeholder), facing spawn.

So right now: Play → you walk up to a labeled rock with a `Stone: 0` sign. **E does nothing yet.**

## The one remaining step — wire the collect logic (~5 min in the editor)

This is graph work. It **cannot** be scripted headlessly in this setup: Unreal exposes no
API to author Blueprint/Level-Blueprint event-graph nodes from Python, and C++ can't compile
on this machine (Xcode/UE 5.4 SDK cap). So this single step is manual — everything feeding
into it is already built.

**Recommended: do it in the Level Blueprint (no new asset, smallest change).**

1. Open `PlanetGenesis` → toolbar **Blueprints ▸ Open Level Blueprint**.
2. In the **outliner** click `Stone_Resource`, then in the Level Blueprint right-click empty
   space → **Add Reference to Selected Actor**. Repeat for `Label_Stone` and `HUD_StoneCounter`.
3. Right-click → search **Interact** → add the **Interact** input action event (from the
   legacy mapping). Use its **Pressed** exec pin.
4. Build a proximity check so E only works near the rock:
   - `Get Player Pawn` → `GetActorLocation`.
   - `Stone_Resource` ref → `GetActorLocation`.
   - `Vector Distance` (or `Get Distance To`) between them → `<` (less than) `400.0` → `Branch`.
5. On **Branch ▸ True**:
   - `HUD_StoneCounter` ref → drag → `Get Text Render` component → `Set Text` = `Stone: 1`.
   - `Stone_Resource` ref → `DestroyActor`.
   - `Label_Stone` ref → `DestroyActor`.
6. **Compile** and **Save**.

That is the whole loop: walk within 400 units, press E, rock + label vanish, sign reads `Stone: 1`.

### Notes / fallbacks
- If the `Interact` event never fires (legacy action not picked up under Enhanced Input),
  add an Enhanced Input Action `IA_Interact`, map **E** in `IMC_Default`, and use an
  `EnhancedInputAction IA_Interact` node in `BP_ThirdPersonCharacter` instead — same True branch.
- Prefer a reusable actor? Make `BP_CollectibleResource` (StaticMesh + SphereCollision +
  `ResourceType` name var), move the logic onto it with `OnComponentBeginOverlap`/`EndOverlap`
  to set an `bInRange` bool, then the `Interact` event branches on `bInRange`. Kept out of scope
  here to keep the change small (one Stone).

## How to test
1. Open the project (opens on `PlanetGenesis`).
2. Press **Play**.
3. Walk forward (W) to the rock with the "Stone - Press E" sign.
4. Press **E** → rock + label disappear, sign changes to `Stone: 1`. No crash.

## Next milestone
- Real incrementing counter (int in `GameInstance`) across many resources.
- Add Wood + Iron resource types via `BP_CollectibleResource`.
- Proper UMG HUD instead of the in-world TextRender counter.
