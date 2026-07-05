# מדריך הגדרת Unreal Engine 5 — עולם דיגיטלי

## 1. פרויקט חדש

- פתח UE5 → New Project → Games → Open World
- Enable Nanite ✅ | Lumen ✅ | Virtual Shadow Maps ✅
- שם הפרויקט: `DigitalWorld`

## 2. פלאגינים נדרשים

Settings → Plugins → הפעל:
- **Pixel Streaming** ✅
- **Water** ✅
- **Procedural Content Generation** ✅
- **Landmass** ✅
- **Chaos Physics** ✅

## 3. מבנה תיקיות בפרויקט

```
Content/
├── Maps/
│   ├── MainMenu.umap
│   └── StartZone.umap
├── Characters/
│   ├── Player/
│   └── Robots/
├── Environment/
│   ├── Trees/
│   ├── Rocks/
│   ├── Water/
│   └── Terrain/
├── UI/
│   ├── HUD/
│   └── Widgets/
├── Economy/
│   ├── Resources/
│   └── Systems/
└── Blueprints/
    ├── BP_GameMode.uasset
    ├── BP_PlayerController.uasset
    └── BP_ResourceNode.uasset
```

## 4. World Composition — StartZone

1. פתח World Settings → World Partition → Enable
2. ייבא Landscape 8km × 8km
3. הוסף Foliage (עצים, שיחים) עם Procedural Foliage
4. הוסף Water Body (נהר/אגם)
5. הוסף Rock/Stone Static Meshes
6. Lumen Settings: Dynamic GI + Reflections

## 5. Pixel Streaming הגדרה

```bash
# הפעלת שרת ה-Signaling
cd Engine/Binaries/ThirdParty/EpicGames/PixelStreaming
./run_local.bat  # Windows
# או
./run_local.sh   # Linux

# הפעלת המשחק עם Pixel Streaming
DigitalWorld.exe -PixelStreamingIP=localhost -PixelStreamingPort=8888 -AllowPixelStreamingCommands
```

## 6. Blueprint מפתח — BP_GameMode

```
Event BeginPlay:
  → Call REST API: GET /api/player/me (HTTP Request)
  → Set Player Data (Token, Resources, Level)
  → Start World Simulation

Custom Event: OnResourceCollected (ResourceName: String, Qty: Int)
  → Call REST API: POST /api/inventory/collect
  → Send to Frontend via Pixel Streaming DataChannel:
     { "type": "resource_collected", "resource": name, "quantity": qty }

Custom Event: OnTokenEarned (Amount: Int)
  → Call REST API: PATCH /api/player/tokens
  → Send to Frontend: { "type": "token_earned", "amount": amount }
```

## 7. Blueprint — BP_ResourceNode (עץ/אבן/ברזל)

```
Variables:
  - ResourceType: String (wood / stone / iron)
  - Quantity: Int
  - RespawnTime: Float (60.0 seconds)
  - bCollected: Boolean

On Player Overlap (Sphere Collider):
  → if !bCollected:
      bCollected = true
      Play Collection Animation
      Trigger GameMode.OnResourceCollected(ResourceType, Quantity)
      Hide Mesh
      Set Timer: Respawn after RespawnTime

On Respawn Timer:
  → Show Mesh
  → bCollected = false
```

## 8. Blueprint — BP_Robot

```
Variables:
  - RobotType: Enum (Farm, Mining, Construction, Transport)
  - OwnerPlayerId: String
  - WorkRadius: Float
  - WorkInterval: Float (10.0 seconds)
  - bActive: Boolean

On Activated (from Frontend via DataChannel):
  → bActive = true
  → Start Work Timer

On Work Timer:
  → Find nearest ResourceNode in WorkRadius
  → Move To ResourceNode (AI Move To)
  → On Arrive: Collect Resource → GameMode.OnResourceCollected
  → Restart Timer
```

## 9. HTTP Requests מ-UE5 לBackend

```
UE5 HTTP Plugin Usage:

TSharedRef<IHttpRequest> Request = FHttpModule::Get().CreateRequest();
Request->SetURL("http://localhost:4000/api/inventory/collect");
Request->SetVerb("POST");
Request->SetHeader("Authorization", "Bearer " + PlayerToken);
Request->SetHeader("Content-Type", "application/json");
Request->SetContentAsString("{\"resourceName\":\"wood\",\"quantity\":5}");
Request->OnProcessRequestComplete().BindUObject(this, &AGameModeBase::OnCollectResponse);
Request->ProcessRequest();
```

## 10. Pixel Streaming — DataChannel Messages

### UE5 → Frontend
```json
{ "type": "resource_collected", "resource": "wood", "resourceName": "עץ", "quantity": 5 }
{ "type": "token_earned", "amount": 10 }
{ "type": "position_update", "x": 1234.5, "z": 678.9 }
{ "type": "quest_progress", "questId": "...", "progress": {} }
```

### Frontend → UE5
```json
{ "type": "player_auth", "token": "jwt..." }
{ "type": "robot_rented", "robotId": "..." }
{ "type": "open_market" }
{ "type": "build_request", "buildingType": "house", "model": "model_1" }
```

## 11. רשימת Asset Packs מומלצים (Marketplace)

- **Brushify** — Landscape & Foliage
- **KiteDemo Assets** — עצים ריאליסטיים
- **Automotive Materials** — לרכבים
- **City Sample** — רחובות ובניינים
- **Megascans** — קרקע, סלעים, עצים (חינמי עם UE5)
- **Modular Residential Buildings** — בתים
