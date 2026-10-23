# ECHO MAZE — AI Agent Project Guide

> Purpose: Instructions for AI coding agents (especially Antigravity) working on ECHO MAZE.
> Keep this file at the project root as `AI.md` (or copy its contents into the instruction file your agent uses).

## 1. Project Overview

ECHO MAZE is a top-down, grid-based puzzle maze game built around time loops:
- The player records movement/actions during a loop.
- When a loop ends, a ghost replays that recording.
- Ghosts can activate pressure plates and help the player solve puzzles.
- The game uses a colorful, rich pixel-art style inspired by a futuristic temple inside a magical crystal cavern.

**Primary design goal:** Every level must genuinely require at least one ghost. A ghost merely appearing in a level does not count as ghost necessity.

## 2. Current Asset Availability

Currently available:
- **Player:** Directional character sprites for all 8 directions.
- **Ghost 1:** Directional character sprites for all 8 directions.
- **Environment:** Reusable environment components/skeleton, such as walkable floors, walls, boundaries, decorative trims, props, crystals, and mechanism tiles.

Not currently available:
- **Ghost 2 artwork.**
- A complete, finished environment/maze map from PixelLab.
- Do not assume sprite animation sheets, rig files, or metadata exist until you inspect the assets.

### Suggested asset organization

```text
pixellab-assets/
├── player/
│   └── [player ZIP and/or extracted assets]
├── ghosts/
│   └── ghost1/
│       └── [Ghost 1 ZIP and/or extracted assets]
└── environment/
    └── [environment ZIP and/or extracted assets]
```

Keep original ZIPs as backups. Extract them into clearly named subfolders for inspection and integration. Preserve JSON, metadata, sprite sheets, and project files. Avoid duplicate/unstructured asset copies.

## 3. Agent Workflow

Before changing code:
1. Inspect the repository structure, current rendering pipeline, level format, collision system, ghost recording/replay logic, and tests.
2. Inspect `pixellab-assets` recursively. Identify file formats, dimensions, transparency, directional mapping, tile dimensions, atlas layouts, and metadata.
3. Summarize the discovered assets and propose how they map to the current game.
4. Identify a small, safe implementation plan.

Then work incrementally:
1. Integrate the player and Ghost 1 artwork.
2. Build and validate **one** environment/level using the available components.
3. Confirm visual quality, grid alignment, collision, and puzzle solvability.
4. Only after the first level is verified, apply the visual/layout approach to the remaining levels.
5. Run relevant tests and report what passed, failed, or could not be run.

Do not rebuild the game from scratch.

## 4. Character Integration Rules

### Player
- Integrate the available 8 directional sprites.
- Determine the actual direction-to-file mapping by inspecting filenames, previews, or metadata; do not guess silently.
- Use the appropriate sprite for the player's facing/movement direction.
- Preserve existing controls and movement behavior.

### Ghost 1
- Integrate the available 8 directional sprites.
- Use the correct directional sprite during ghost playback.
- Keep the ghost aligned to the same grid/tile coordinate system as the player.
- If a ghost idle/movement animation exists, inspect and use it only if the format is supported.
- If only static directional sprites exist, use those without inventing nonexistent animation frames.

### Future additional ghosts
- Do not assume Ghost 2 assets exist.
- Keep the rendering mapping extensible for future ghost characters.
- If gameplay currently supports multiple ghost instances, preserve that capability.
- A temporary Ghost 1 visual fallback for additional ghost instances is optional only if needed and compatible; do not break or silently remove multiple-ghost gameplay.

### Rendering quality
- Preserve transparency and sprite proportions.
- Use nearest-neighbor scaling or the project's equivalent pixel-art rendering settings.
- Avoid blur, unwanted smoothing, stretching, or inconsistent character sizes.
- Ensure sprites remain visually centered and readable.
- Do not let visual animation change gameplay movement timing or positions.

## 5. Environment Assembly

There is no finished maze map supplied. Construct environments and maze layouts from the available reusable components.

Visual direction:
- Colorful, rich pixel art.
- Mysterious futuristic temple in a magical crystal cavern.
- Turquoise/teal walkable floors.
- Deep navy/blue walls and boundaries.
- Purple/lavender energy and rune accents.
- Gold decorative accents.
- Cyan crystal props used sparingly.

Assembly requirements:
- Inspect actual tile sizes and variants before placement.
- Keep all tiles grid-aligned and consistent.
- Create clean wall runs, corners, intersections, corridor transitions, and room boundaries using compatible pieces.
- Prefer a coherent main floor style; reserve patterned/rune tiles for meaningful puzzle rooms or focal areas.
- Use cracked tiles and crystals as selective decoration.
- Keep decorative props out of paths, interaction cells, and important visual cues.
- Separate visual decoration from collision logic.
- Make walkable floors and solid walls easy to distinguish.
- Do not stretch unrelated tiles or assemble incompatible fragments.
- Reuse assets efficiently and maintain performance.

## 6. Level Design & Puzzle Rules

Current core mechanic:
- Record a route/action sequence.
- End the loop and allow the ghost to replay it.
- Use ghost replay to activate pressure plates and open passages.

One additional mechanic approved:
- **Keys and locked doors.**
- The player collects a key to unlock its corresponding door.
- Make key collection and door states visually clear.
- Preserve existing pressure-plate behavior.
- Do not add switches, lasers, timers, or other new mechanics unless explicitly requested.

### Mandatory ghost-necessity rule
Every level must be impossible to complete without at least one ghost performing an essential action.

For every level:
1. State the intended solution route and loop sequence.
2. Identify the ghost's essential action.
3. Verify the player cannot bypass the mechanism through an unintended path.
4. Check that the level is solvable within actual loop/step limits.
5. Test collision, keys, doors, plate activation, reset, and replay transitions as applicable.

A valid ghost-dependent example:
- Record a route that places the ghost on a pressure plate.
- Start/replay the loop.
- The ghost holds the plate while the player takes a newly available route, collects a key, or reaches the exit.

This is only a pattern, not a guaranteed solution for every map. Validate each actual layout.

### Level progression suggestion
Use this as a starting point, not a rigid requirement:
- **Level 1 — Learn to Cooperate:** A pressure-plate puzzle that requires the ghost.
- **Level 2 — The Missing Key:** Combine a necessary ghost-operated plate with key collection and a locked exit.
- **Level 3 — The Wrong Turn:** More complex navigation using a ghost-operated mechanism and key/door, with purposeful route planning.

Avoid repeating the same puzzle with only a different map skin. Prefer a small number of strong, tested levels over many weak ones.

### Solvability validation
- Attempt to solve every level without using any ghost; if possible, redesign it.
- Test the intended solution using the actual game rules.
- Prefer automated solvability checks or scripted test sequences when practical.
- Do not claim a level is verified unless it was actually tested.
- If no solver/test harness exists, document the manual validation method and limitations.

## 7. Gameplay Invariants — Do Not Break

Preserve:
- Existing movement controls and core game architecture.
- Deterministic ghost recording and replay.
- Loop/step limits and their established semantics.
- Pressure plate interactions.
- Key/locked-door logic if already implemented.
- Undo, restart, level progression, and UI behavior.
- Existing gameplay timing and collision rules.

Do not modify game logic solely to make visual integration easier. If a gameplay change is necessary, explain why and test it.

## 8. Testing Checklist

### Visual/assets
- [ ] Asset formats and dimensions inspected.
- [ ] Player 8-direction mapping verified.
- [ ] Ghost 1 8-direction mapping verified.
- [ ] Transparency, scale, and crisp rendering checked.
- [ ] Environment tile dimensions and alignment checked.
- [ ] Fallback works if an asset is missing.

### Gameplay
- [ ] Every level is solvable.
- [ ] Every level genuinely requires a ghost.
- [ ] No unintended route bypasses the required mechanism.
- [ ] Ghost replay remains deterministic.
- [ ] Collision and walkability match visuals.
- [ ] Pressure plates and doors behave correctly.
- [ ] Keys and locked doors behave correctly where present.
- [ ] Restart/reset and level progression work.
- [ ] Loop/step limits remain correct.

## 9. Final Report Required

After changes, report:
1. Summary of changes.
2. Assets discovered and integrated.
3. Maps/levels created or changed.
4. Files modified.
5. Tests run and their actual outcomes.
6. Known issues, missing assets, and assumptions.
7. Any manual steps still needed.

Be precise: distinguish verified results from assumptions or untested behavior.
