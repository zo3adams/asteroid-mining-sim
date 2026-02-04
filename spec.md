# Asteroid Miner - Game Specification

## Core Concept
A resource management simulation game where the player is CEO of an asteroid and comet mining operation. Players send robotic and human crews to mine resources from real celestial bodies, manage contracts, and grow their business through a tech tree while navigating the challenges of deep space operations.

## Victory Conditions
- Grow business value to specific thresholds
- Complete prestigious contracts
- Unlock entire tech tree
- Achieve monopoly status in specific resource markets

## Core Game Loop
1. **Contract Selection** - Choose main contracts (e.g., "acquire 3 trillion tons of lithium")
2. **Sub-contract Management** - Select launch providers, mining crews, robot vendors, security
3. **Mission Planning** - Choose target asteroids/comets considering time, distance, risk
4. **Execution** - Watch missions unfold in real-time 3D solar system
5. **Resource Management** - Manage inventory in orbital warehouses
6. **Economics** - Trade resources as prices fluctuate (Dope Wars style)
7. **Tech Tree** - Unlock new capabilities and expand operations

## Core Resources
- **Rare Earth Metals** - High value, moderate rarity
- **Pure Water** - Essential for life support and fuel
- **Precious Metals** - Gold, platinum, palladium
- **Lithium** - Battery production
- **Iron/Nickel** - Construction materials
- **Volatiles** - Ammonia, methane for fuel/chemistry

## Key Challenges
- **Space Pirates** - Require security contracts
- **Anomalies** - Unexpected events during mining
- **Accidental Shrinkage** - Resource loss/waste
- **Time Management** - Travel time, mission duration, contract deadlines
- **Risk vs Reward** - Higher risk for distant targets
- **Inventory Management** - Orbital warehouse capacity
- **Market Volatility** - Resource prices fluctuate
- **Equipment Failures** - Valve issues, GNC problems, star tracker malfunctions

## Educational Elements
Players learn about:
- **Space Vehicles** - Payload costs/limits, propulsion systems, GNC, star trackers
- **Orbital Mechanics** - Real physics, transfer orbits, delta-v calculations
- **Solar System** - Distances, asteroid belt composition, outer planet resources
- **Economics** - Supply/demand, market timing, inventory management
- **Relativistic Effects** - End-game content for distant missions
- **Spacecraft Systems** - Life support, communication delays, radiation shielding

## Real-World Data Integration
- Use real asteroids and comets from NASA databases
- Link to Wikipedia entries for educational content
- Real orbital mechanics determine mission timelines
- Accurate distance and composition data
- Live data sources where possible

## Progression Systems
- **Business Growth** - Revenue, contracts completed, reputation
- **Tech Tree** - Unlock new mining tech, faster ships, better equipment
- **Contracts** - Start small, unlock larger/more complex contracts
- **Fleet Expansion** - More simultaneous missions
- **Territory** - Establish permanent outposts

## UI/UX Philosophy
- Primary view: 3D navigable solar system
- HUD elements around edges for menus and controls
- Watch ships/pirates/competitors navigate in real-time
- "Save Game URL" always visible at top
- **News Ticker at bottom** - City Skylines-style scrolling ticker with:
  - Important game notifications (ULA unlocked, mission completed, pirate attacks, contract opportunities)
  - Funny/irrelevant space news (e.g., "Mars colonists vote pineapple banned from space pizza")
  - Market alerts and competitor actions
  - Educational facts and asteroid discoveries
- Clean, informative displays
- Educational tooltips and links

### Left Panel (Company & Controls)
- **Company Status**: Balance, Reputation, Missions completed
- **Active Missions**: List of in-progress missions with progress bars
  - Click mission to zoom to ship
  - "Plan Mission" button at bottom (always visible)
- **Controls**: Mouse/keyboard binding reference
- **Search**: Body search box with autocomplete suggestions (max 5), keyboard navigation (↑/↓/Enter/Escape), zooms and selects target on selection

### Right Panel (Target Information)
- **Target Information**: Details for selected object including:
  - Name, type, distance from Earth
  - Diameter (auto-scaled: km for large bodies, m for small asteroids)
  - Mass (estimated for asteroids)
  - Orbital parameters (eccentricity, inclination)
  - Wikipedia link
- **Quick Stats**: Asteroid count
- **Hover Info**: Preview details on mouse hover (includes diameter and mass)

### Mission Planning Modal
Multi-step modal overlay for planning mining missions:
1. **Contract Selection**: Choose from randomly generated vendor contracts requesting specific resources, or skip to select own target
2. **Target Selection**: Shows suggested asteroids ranked by suitability for the selected resource type; can also select manually from map
3. **Target Confirmation**: (If pre-selected) Shows asteroid details and estimated resources
4. **Launch Provider**: Choose from 4 providers (SpaceY, ULA, RocketForge, Blue Genesis) with cost, payload, reliability stats
5. **Crew Selection**: Choose from 3 crew types (Robotic, Small Human, Large Expedition) with cost/day, efficiency, reliability
6. **Mission Summary**: Review total costs, estimated yield, and launch

### Contract System
- Vendors offer contracts for specific resource types (Water, Iron, Platinum, etc.)
- Contracts specify quantity needed, price per ton, and deadline
- Target suggestions are filtered and ranked by asteroid type suitability for the requested resource

### Asteroid Resource Mapping
Resources are determined by asteroid taxonomic type:
- **C-type**: Water, Volatiles (common)
- **S-type**: Iron, Nickel (common)
- **M-type**: Iron, Nickel, Platinum, Gold (rare)
- **D/P-type**: Volatiles, Water (outer system)
- **V/E-type**: Rare Earth, Exotic minerals (rare)

### Mission Tracking
- Active missions shown in left panel with progress bars
- Ships rendered in 3D scene as green cones following trajectory to asteroid
- Click mission to show phase modal with current status image and description
- Progress bar shows overall mission progress, pulses on phase changes
- Terminal failure states shown in red, terminal success in green
- Dismissing terminal state modal removes mission from list

### Mission Phases
Missions progress through phases with probability-based outcomes:
1. **Contract Signed** → Waiting for launch readiness (1-6 months based on provider frequency)
2. **Launch** → 98% success to Outbound, 2% Launch Anomaly (terminal failure)
3. **Outbound** → 98% success to Drilling, 2% In-Flight Anomaly (terminal failure)
4. **Drilling** → 98% success to Inbound, 2% Explosion at Drill Site (terminal failure)
5. **Inbound** → 98% success to Delivering Payload, 2% In-Flight Anomaly (terminal failure)
6. **Delivering Payload** → 100% success to Mission Success
7. **Mission Success** → Payout deposited (terminal success)

Anomaly probabilities modified by provider and crew reliability (higher reliability = lower anomaly chance).

### Mission Phases (Level 3+ with Pirates) (PLANNED)
Additional phases for pirate encounters:
1. **Pirate Attack (Outbound)** - 5% chance during Outbound phase
2. **Pirate Attack (Inbound)** - 25% chance during Inbound phase
3. **Pirates Won** - Total loss (terminal failure)
4. **Payload Seized** - Crew survives, cargo lost (terminal partial failure)
5. **Pirates Defeated** - Mission continues normally

Combat resolution uses D&D-style attack/defense rolls (see game-mechanics.md).

### Mission Payout
- Contract missions pay contract value modified by crew efficiency (88%-128% of contract value)
- Non-contract missions (Level 3+) pay market spot price for extracted resources
- Excess resources beyond storage capacity sold at market price
- Payout deposited to player balance on Mission Success

---

## Progression System (PLANNED)

### Level Progression
| Level | Contract Count | Features Unlocked |
|-------|----------------|-------------------|
| 1 - Apollo/Amor | 0-10 | Basic gameplay, no tech tree |
| 2 - Inner Belt | 11-50 | Tech tree, ownership system |
| 3 - Kuiper Belt | 51-500 | Pirates, security, storage, spec-free mining |
| 4 - Scattered Disc | 501+ | Stronger pirates, storage attacks, VASIMR |
| 5 - Heliopause | Tech complete + $1T | End-game, full unlock |

### Level Up Ceremony
- Game pauses on threshold
- Title card with level name and description
- Background image and audio fanfare (TBD)
- "Continue" button to proceed
- News ticker announces level event

### Tech Tree (Level 2+)
- Tree-based unlock system with parent prerequisites
- All unlocks purchased with money
- Categories: Propulsion, Mining, Stabilization, Navigation, Automation
- Effects: travel time, yield, anomaly reduction, crew costs
- See game-mechanics.md for full tree structure

### Ownership System (Level 2+)
Players can purchase instead of rent:
- **Vehicles**: Light Freighter ($20M), Heavy Hauler ($80M), Deep Space Vessel ($200M)
- **Mining Equipment**: Basic Drill ($5M), Industrial Extractor ($25M), Plasma Array ($100M)
- **Robotic Crews**: Basic Bots ($8M), Advanced Bots ($30M), Autonomous Fleet ($150M)

Benefits: Significantly lower operating costs, no maintenance fees.

### Storage System (Level 3+)
- Depots at LEO, GEO, Belt Orbit, Lunar L2
- Capacity limits, different costs per location
- Stored resources refined (+10% over time)
- Depots attackable by pirates in Level 4+

### Pirate System (Level 3+)
- Attack probability: 5% outbound, 25% inbound
- Combat: D&D-style attack/defense rolls
- Security tiers: Light, Medium, Heavy
- Security relationship builds with hires (+0.5 rating per level)
- Pirate strength scales with game level

### Market System
- 8 resource types with independent price fluctuations
- Weekly price changes: -50% to +50%
- News events announce major swings
- Contract payouts include premium over spot price
- Strategy: Mine low, sell high (Dope Wars style)

---

## Save System
- URL-based save via obfuscated hash
- Encodes: bank balance, missions completed, tech tree progress, active contracts, fleet status
- Player can copy URL anytime to save progress
- No account/server required for MVP
