# Asteroid Miner - Technical Architecture

## Technology Stack

### Core Technologies
- **Language**: HTML5 and TypeScript (compiled to JavaScript)
- **Rendering**: WebGL (vanilla, no heavy frameworks initially)
- **3D Library**:  Three.js 
- **Build System**: TypeScript compiler (tsc) + bundler (Vite or esbuild)
- **No backend required ** - fully client-side. Playable 

### File Structure
```
asteroid_miner/
├── docs/                      # Documentation
│   ├── spec.md
│   ├── architecture.md
│   ├── game-mechanics.md
│   ├── characters-factions.md
│   ├── assets.md
│   └── todo.md
├── src/
│   ├── main.ts               # Entry point
│   ├── core/                 # Core game engine
│   │   ├── GameState.ts      # Central game state manager
│   │   ├── SaveSystem.ts     # URL-based save/load
│   │   └── GameLoop.ts       # Main game loop
│   ├── rendering/            # 3D rendering
│   │   ├── SolarSystem.ts    # Solar system renderer
│   │   ├── Camera.ts         # Camera controls
│   │   ├── Ships.ts          # Ship rendering
│   │   └── UI.ts             # WebGL UI overlays
│   ├── physics/              # Orbital mechanics
│   │   ├── OrbitalMechanics.ts
│   │   ├── Trajectories.ts
│   │   └── DeltaV.ts
│   ├── data/                 # Data management
│   │   ├── AsteroidData.ts   # Fetch from NASA/Wikipedia
│   │   ├── CelestialBodies.ts
│   │   └── MarketData.ts
│   ├── game/                 # Game logic
│   │   ├── Contracts.ts
│   │   ├── Missions.ts
│   │   ├── TechTree.ts
│   │   ├── Economy.ts
│   │   └── Events.ts         # Pirates, anomalies, etc.
│   ├── ui/                   # UI components
│   │   ├── HUD.ts
│   │   ├── NewsTicker.ts     # Bottom scrolling news ticker
│   │   ├── Menus.ts
│   │   ├── ContractSelector.ts
│   │   └── MissionPlanner.ts
│   └── utils/                # Utilities
│       ├── Math.ts
│       ├── Formatters.ts
│       └── Constants.ts
├── assets/                   # Static assets
│   ├── textures/
│   ├── models/
│   └── sounds/
├── public/
│   └── index.html
├── tsconfig.json
├── package.json
└── README.md
```

## Core Systems

### 1. Game State Management
- Single source of truth for all game state
- Serializable to URL hash
- Reactive updates trigger UI/rendering changes
- State includes:
  - Player resources (money, inventory)
  - Active contracts and missions
  - Tech tree progress
  - Fleet composition
  - Market prices
  - Time/date in-game

### 2. Rendering Pipeline
- **Main 3D View**: Solar system with celestial bodies
- **Ships/Entities**: Real-time position updates based on orbital mechanics
- **Camera**: Free navigation, follow mode, jump-to-target
- **HUD Overlay**: 2D UI elements rendered on top
- **Performance**: LOD system for distant objects, instancing for fleets

### 3. Data Pipeline
```
External APIs → Cache Layer → Game Data Models → UI/Rendering
```
- Fetch from NASA JPL, Horizons, Wikipedia on demand
- Cache in localStorage/IndexedDB for performance
- Transform to game-friendly format
- Expose educational links to players

### 4. Physics Engine
- Simplified N-body simulation for display purposes
- Keplerian orbital elements for celestial bodies
- Hohmann transfer calculations for missions
- Delta-v budget tracking
- Time acceleration for long journeys

### 5. Save System Architecture
```
GameState → Serialize → Compress → Base64 → URL Hash
URL Hash → Base64 Decode → Decompress → Deserialize → GameState
```
- Use LZ-string or similar for compression
- Version header for migration support
- Checksum for integrity

### 6. News Ticker System
- **Location**: Bottom of screen, horizontal scrolling ticker (City Skylines-style)
- **Purpose**: Deliver game notifications and atmospheric flavor text
- **Message Types**:
  - **Critical Notifications** (red/orange) - Mission failures, pirate attacks, major events
  - **Important Updates** (yellow) - Contract completions, unlocks (e.g., "ULA will now accept contracts from [Player Name]")
  - **Market News** (blue) - Price changes, competitor actions
  - **Flavor Text** (gray) - Humorous irrelevant news, educational facts
- **Implementation**:
  - Message queue with priority system
  - Auto-scroll with pause on hover
  - Click to expand for full details
  - History log accessible via UI button
- **Message Generation**:
  - Game events trigger immediate notifications
  - Procedural flavor text generated periodically
  - Educational facts from Wikipedia/NASA APIs

## External APIs

### NASA JPL Small-Body Database (SBDB)
- **Endpoint**: https://ssd-api.jpl.nasa.gov/sbdb.api
- **Data**: Orbital elements, physical characteristics
- **Rate Limit**: Reasonable for client-side use

### NASA Horizons System
- **Endpoint**: https://ssd.jpl.nasa.gov/api/horizons.api
- **Data**: Precise ephemerides, positions over time
- **Use**: Mission planning, real-time positions

### Wikipedia API
- **Endpoint**: https://en.wikipedia.org/api/rest_v1/
- **Data**: Articles, summaries, links
- **Use**: Educational content, asteroid info

### Market Data (Simulated)
- Initially procedural/algorithmic
- Could integrate real commodity prices as baseline

## Performance Considerations
- Target 60 FPS for rendering
- Lazy load asteroid data (don't load all 1M+ asteroids)
- Spatial partitioning for entity management
- Web Workers for heavy calculations (orbital mechanics)
- Asset loading strategies (progressive, on-demand)

## Browser Compatibility
- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum: ES6, WebGL 2.0
- Fallback: WebGL 1.0 with reduced features

## Development Phases

### Phase 1: MVP Core
- Basic 3D solar system view
- Mission target selection UI
- Simple contract system
- URL save/load

### Phase 2: Gameplay Loop
- Complete mission execution
- Resource management
- Basic economy

### Phase 3: Depth
- Tech tree
- Pirates and events
- Full orbital mechanics

### Phase 4: Polish
- Tutorials
- More content
- Performance optimization
