# ASSET SHOPPING LIST - GENESIS ZONE

Purpose: asset list for the first visual slice of the game.

Goal: build a high quality first playable area with earth zoom, natural ground, path, trees, rocks, water, avatar, first vehicle, basic buildings, UI and sound.

Important rule: do not use assets copied from other games. Use only owned, purchased, free licensed, or custom made assets.

## Priority levels

P0 = must have for first visual slice
P1 = important after first slice works
P2 = later expansion

## 1. Earth and Globe

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Earth sphere material | asset-library/00_references/google-earth | PNG / material | 2K-4K | P0 | Missing | For opening globe view |
| Cloud layer texture | asset-library/01_environment/sky | PNG | 2K | P0 | Missing | Transparent cloud layer |
| Atmosphere shader/material | asset-library/01_environment/sky | Unreal material | High | P0 | Missing | Blue glow around earth |
| Stars background | asset-library/01_environment/sky | HDRI / texture | 2K-4K | P1 | Missing | Space feeling |
| Region marker icons | asset-library/08_ui_hud/globe-map | SVG / PNG | UI ready | P0 | Missing | For selectable areas |

## 2. Terrain and Ground

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Dirt ground texture set | asset-library/01_environment/terrain-textures/dirt | PNG / material | 2K-4K PBR | P0 | Missing | Base dry ground |
| Gravel path texture set | asset-library/01_environment/terrain-textures/gravel | PNG / material | 2K-4K PBR | P0 | Missing | Main visible path |
| Grass texture set | asset-library/01_environment/terrain-textures/grass | PNG / material | 2K-4K PBR | P0 | Missing | Around path |
| Rock texture set | asset-library/01_environment/terrain-textures/rock | PNG / material | 2K-4K PBR | P0 | Missing | Slopes and cliffs |
| Sand texture set | asset-library/01_environment/terrain-textures/sand | PNG / material | 2K | P1 | Missing | Near water only |
| Mud texture set | asset-library/01_environment/terrain-textures/mud | PNG / material | 2K | P2 | Missing | Wet areas later |
| Terrain blend material | asset-library/01_environment/terrain-textures | Unreal material | High | P0 | Missing | Blend dirt, grass, gravel, rock |
| Landscape heightmap | asset-library/02_world_regions/israel-start-zone | PNG / RAW | 1K-4K | P1 | Missing | For more natural terrain |

## 3. Path and Road

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Dirt road spline mesh | asset-library/01_environment/paths | FBX / GLB | Game ready | P0 | Missing | Clear path through first area |
| Gravel road decals | asset-library/01_environment/paths | PNG / decal | 2K | P0 | Missing | Details on path |
| Tire marks | asset-library/01_environment/paths | PNG / decal | 1K-2K | P1 | Missing | For vehicle feeling |
| Small roadside stones | asset-library/01_environment/paths | FBX / GLB | Low-mid poly | P0 | Missing | Natural path edges |
| Road sign placeholder | asset-library/03_buildings/city-props | FBX / GLB | Low-mid poly | P2 | Missing | Later navigation |

## 4. Trees and Vegetation

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Pine tree pack | asset-library/01_environment/trees | FBX / GLB | Game ready | P0 | Missing | Several sizes |
| Oak / broadleaf tree pack | asset-library/01_environment/trees | FBX / GLB | Game ready | P0 | Missing | Natural forest look |
| Small bushes | asset-library/01_environment/bushes | FBX / GLB | Game ready | P0 | Missing | Along path |
| Tall grass clumps | asset-library/01_environment/bushes | FBX / GLB | Game ready | P0 | Missing | Around ground |
| Flowers / small plants | asset-library/01_environment/bushes | FBX / GLB | Low poly | P2 | Missing | Later polish |
| Tree bark material | asset-library/01_environment/trees | PNG / material | 2K | P1 | Missing | Better close look |
| Leaf material | asset-library/01_environment/trees | PNG / material | 2K | P1 | Missing | Better close look |

## 5. Rocks, Stones and Mining

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Small stone pack | asset-library/01_environment/rocks | FBX / GLB | Game ready | P0 | Missing | Collectible stone resources |
| Large rock pack | asset-library/01_environment/rocks | FBX / GLB | Game ready | P0 | Missing | Environment detail |
| Cliff / boulder pack | asset-library/01_environment/rocks | FBX / GLB | Mid poly | P1 | Missing | Terrain depth |
| Iron ore rock | asset-library/01_environment/rocks | FBX / GLB | Game ready | P0 | Missing | First mining resource |
| Mining highlight VFX | asset-library/08_ui_hud/icons | PNG / VFX | Simple | P1 | Missing | Show interactable resource |

## 6. Water and Sky

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Lake water material | asset-library/01_environment/water | Unreal material | High | P0 | Missing | Water only in defined lake/river |
| River material | asset-library/01_environment/water | Unreal material | High | P1 | Missing | Later expansion |
| Shoreline stones | asset-library/01_environment/water | FBX / GLB | Game ready | P1 | Missing | Natural water edge |
| Sky HDRI | asset-library/01_environment/sky | HDRI | 4K | P0 | Missing | Natural light |
| Cloud cards | asset-library/01_environment/sky | PNG / mesh | 2K | P1 | Missing | Better atmosphere |

## 7. Avatar

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Base male avatar | asset-library/05_avatars/base-character | FBX / GLB | Rigged | P0 | Missing | First playable character |
| Base female avatar | asset-library/05_avatars/base-character | FBX / GLB | Rigged | P1 | Missing | Later option |
| Idle animation | asset-library/06_animations/idle | FBX | Rig compatible | P0 | Missing | Must look natural |
| Walk animation | asset-library/06_animations/walk | FBX | Rig compatible | P0 | Missing | Third person movement |
| Run animation | asset-library/06_animations/run | FBX | Rig compatible | P0 | Missing | Sprint |
| Collect resource animation | asset-library/06_animations/collect | FBX | Rig compatible | P1 | Missing | Pick up wood/stone |
| Enter vehicle animation | asset-library/06_animations/enter-vehicle | FBX | Rig compatible | P1 | Missing | Later polish |

## 8. Vehicle

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| First basic car | asset-library/04_vehicles/cars | FBX / GLB | Game ready | P0 | Missing | One drivable vehicle |
| Wheel mesh | asset-library/04_vehicles/vehicle-parts | FBX / GLB | Game ready | P0 | Missing | If car is modular |
| Vehicle material set | asset-library/04_vehicles/cars | material | High | P1 | Missing | Paint, glass, rubber |
| Engine sound loop | asset-library/09_audio/vehicles | WAV / OGG | Clean loop | P0 | Missing | Basic driving feedback |
| Tire sound | asset-library/09_audio/vehicles | WAV / OGG | Clean loop | P1 | Missing | Dirt/gravel driving |

## 9. First Buildings and Economy Objects

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Small starter house | asset-library/03_buildings/houses | FBX / GLB | Game ready | P0 | Missing | First built property |
| Small market stand | asset-library/03_buildings/shops | FBX / GLB | Game ready | P0 | Missing | Sell resources |
| Small garage | asset-library/03_buildings/garages | FBX / GLB | Game ready | P1 | Missing | Vehicle area |
| Farm plot model | asset-library/03_buildings/farms | FBX / GLB | Game ready | P0 | Missing | Farming start |
| Construction station | asset-library/07_tools-and-machines/workshop-machines | FBX / GLB | Game ready | P0 | Missing | Represents automated building system |
| Concrete printer | asset-library/07_tools-and-machines/concrete-printer | FBX / GLB | Game ready | P1 | Missing | Later feature, not roaming robot |

## 10. Resource Icons and UI

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Wood icon | asset-library/08_ui_hud/icons | SVG / PNG | UI ready | P0 | Missing | HUD inventory |
| Stone icon | asset-library/08_ui_hud/icons | SVG / PNG | UI ready | P0 | Missing | HUD inventory |
| Iron icon | asset-library/08_ui_hud/icons | SVG / PNG | UI ready | P0 | Missing | HUD inventory |
| Water icon | asset-library/08_ui_hud/icons | SVG / PNG | UI ready | P0 | Missing | HUD inventory |
| Token icon | asset-library/08_ui_hud/icons | SVG / PNG | UI ready | P0 | Missing | Economy |
| Zoom In button | asset-library/08_ui_hud/buttons | SVG / PNG | UI ready | P0 | Missing | Globe feature |
| Zoom Out button | asset-library/08_ui_hud/buttons | SVG / PNG | UI ready | P0 | Missing | Globe feature |
| Enter Region button | asset-library/08_ui_hud/buttons | SVG / PNG | UI ready | P0 | Missing | Globe feature |
| Back to Globe button | asset-library/08_ui_hud/buttons | SVG / PNG | UI ready | P0 | Missing | Globe feature |
| Minimap frame | asset-library/08_ui_hud/minimap | SVG / PNG | UI ready | P1 | Missing | Navigation |

## 11. Sound

| Asset | Folder | Format | Quality | Priority | Status | Notes |
|---|---|---|---|---|---|---|
| Forest ambience | asset-library/09_audio/ambience | WAV / OGG | Loop | P0 | Missing | Wind, birds, nature |
| Footsteps dirt | asset-library/09_audio/footsteps | WAV / OGG | Short clips | P0 | Missing | Walking feedback |
| Footsteps gravel | asset-library/09_audio/footsteps | WAV / OGG | Short clips | P0 | Missing | Path feedback |
| Resource collect sound | asset-library/09_audio/ui | WAV / OGG | Short | P0 | Missing | When collecting |
| Token reward sound | asset-library/09_audio/ui | WAV / OGG | Short | P0 | Missing | Reward feedback |
| UI click sound | asset-library/09_audio/ui | WAV / OGG | Short | P1 | Missing | Buttons |

## 12. MVP Minimum Asset Pack

For the first serious visual slice, do not buy or create hundreds of assets. Start with this minimum:

- 5 terrain material sets: dirt, gravel, grass, rock, water
- 1 sky/HDRI setup
- 8 to 12 trees
- 8 to 12 stones/rocks
- 6 to 10 bushes/grass props
- 1 base avatar with idle/walk/run
- 1 basic car
- 1 starter house
- 1 market stand
- 1 farm plot
- 1 construction station
- 10 UI icons/buttons
- 5 to 8 basic sounds

## 13. Asset acceptance rules

An asset is accepted only if:

1. License is clear.
2. It is not copied from another commercial game.
3. It has a source link or creator record.
4. It is optimized for real-time use.
5. It has correct scale.
6. It works in Unreal or can be converted.
7. It matches the natural realistic style.
8. It does not make the first area look cartoonish unless we choose that style intentionally.

## 14. Next task for Claude or developer

Create the folder structure for asset-library, then fill ASSET_MANIFEST.md with every asset that is downloaded or purchased.

Do not add new gameplay features before the Genesis Zone visual standard is fixed.
