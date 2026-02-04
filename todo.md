# Asteroid Miner - Development Roadmap

## Phase 0: Project Setup ✓ COMPLETE
- [x] Create documentation structure
- [x] Initialize TypeScript project
- [x] Set up build system (Vite)
- [x] Create basic HTML template
- [x] Configure TypeScript compiler
- [x] Set up development server

## Phase 1: MVP - Solar System Viewer ✓ COMPLETE

### Rendering Foundation ✓
- [x] Set up WebGL context
- [x] Integrate Three.js
- [x] Create basic scene with camera
- [x] Implement camera controls (orbit, pan, zoom)
- [x] Add basic lighting
- [x] Render Sun with glow effect
- [x] Render planets with textures and orbits
- [x] Add starfield background
- [x] Labels on all objects
- [x] Click-to-zoom and focus tracking

### Data Integration ✓
- [x] Create NASA JPL API client
- [x] Fetch 18 Near-Earth Asteroids
- [x] Parse orbital elements
- [x] Cache data in localStorage (30-day)
- [x] Create asteroid data model with taxonomic types
- [x] Render asteroids with type-based colors

### UI Framework ✓
- [x] Create HUD layout (HTML/CSS overlay)
- [x] Top bar with game title
- [x] Left panel: Company status, Active Missions, Controls, Search
- [x] Right panel: Target information with diameter/mass
- [x] Click-to-select asteroids
- [x] Display asteroid info (name, type, size, composition)
- [x] Wikipedia links for all bodies
- [x] Time scale slider (6 levels)

### Mission System ✓
- [x] Contract selection from vendors
- [x] Target suggestions based on resource type
- [x] Launch provider selection (4 providers)
- [x] Crew selection (3 types)
- [x] Mission cost calculation
- [x] Ship rendering in 3D scene
- [x] Mission phase progression (10 phases)
- [x] Anomaly probability with reliability modifiers
- [x] Phase modal with images and descriptions
- [x] Terminal states (success/failure)
- [x] Payout on mission success

### Remaining Phase 1
- [ ] Dynamic news ticker (currently static)
- [ ] URL-based save system
- [ ] Copy Save URL button

## Phase 2: Tutorial & Educational Content (NEXT)

### Tutorial System
- [ ] Intro/welcome screen
- [ ] Guided first mission tutorial
- [ ] Orbital mechanics basics explanation
- [ ] Launch provider comparison guide
- [ ] Crew selection guide

### Help System
- [ ] Help button in UI
- [ ] In-game encyclopedia
- [ ] Tooltips on technical terms
- [ ] Links to Wikipedia/NASA

## Phase 3: Depth & Features (Future)

### Enhanced Orbital Mechanics
- [ ] Keplerian orbital calculations
- [ ] Hohmann transfer visualization
- [ ] Delta-v display
- [ ] Launch windows

### Tech Tree
- [ ] Research points system
- [ ] Tech tree UI
- [ ] Unlock mechanics
- [ ] Apply bonuses to gameplay

### Risk & Events
- [ ] Space pirates (later levels)
- [ ] Equipment failures
- [ ] Competitor actions
- [ ] Market events

### Data Expansion
- [ ] Expand to 100+ asteroids
- [ ] Main belt asteroids
- [ ] Comets
- [ ] Outer system objects

## Phase 4: Polish & Content (Future)

### Visual Polish
- [ ] Better 3D models
- [ ] PBR materials
- [ ] Particle effects
- [ ] Animations

### Performance
- [ ] LOD system
- [ ] Instancing for many asteroids
- [ ] Web Workers

### Quality of Life
- [ ] Settings panel
- [ ] Statistics screen
- [ ] Multiple save slots

---

## How to Run

```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Production build
npm run typecheck # Type checking
```

## Current State (Session 3 Complete)

**Playable with full mission loop:**
- Navigate 3D solar system with camera controls
- Select asteroids and view details (diameter, mass, type)
- Search for bodies by name with autocomplete
- Plan missions: contracts → targets → providers → crews
- Watch missions progress through 10 phases
- Risk anomalies based on reliability
- Earn revenue on successful completion
