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
- **Dynamic distance calculation** based on orbital position and game time
- Accurate composition data based on asteroid taxonomic class
- Live data sources where possible

### Distance Calculation
Asteroid distance from Earth varies based on orbital mechanics:
- **Perihelion** = semi-major axis × (1 - eccentricity)
- **Aphelion** = semi-major axis × (1 + eccentricity)
- **Min distance from Earth** ≈ |perihelion - 1 AU| for non-crossing orbits
- **Max distance from Earth** ≈ aphelion + 1 AU (opposite sides of Sun)

The game calculates a **synodic period** (time between closest approaches) and uses game time to determine if the asteroid is currently at "near" or "far" approach. This affects:
- Travel time (and thus mission duration)
- Whether contracts can be completed on time
- Strategic timing of when to accept distant contracts

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

### Responsive Layouts

#### Landscape Mode (Desktop/Laptop/Tablet)
Standard layout with side panels:
- **Top bar**: Game title, date, speed controls, save URL button
- **Left panel** (320px): Company status, active missions, tech tree, assets, storage, help, controls
- **Center**: 3D solar system canvas (full height)
- **Right panel** (320px): Search, target info, quick stats, hover info, market prices, flight log
- **Bottom**: News ticker (70px)

#### Portrait Mode (Mobile Phones < 768px)
Vertical scrolling layout optimized for touch:
1. **Top bar** (fixed): Game title, date, speed controls (compact)
2. **Solar system canvas**: Full width, square aspect ratio (max 50% viewport height)
3. **News ticker**: Full width below canvas
4. **Vertical Components** (full width, in this order):
   - Help
   - Search box
   - Company Status
   - Active Missions + Plan Mission button
   - Tech Tree (Level 2+)
   - Owned Assets (Level 2+)
   - Storage (Level 3+)
   - Market Prices
   - Flight Log

**Mobile-specific adjustments:**
- Modals expand to 95% width or full screen
- Buttons are full width for easy touch
- Contract/target/vendor cards stack vertically
- Hover info, Quick Stats, Target Info, Controls sections hidden (not useful with touch)
- Canvas pixel ratio capped at 2x for performance
- Loading screen content positioned higher for easier button access
- Width constrained to viewport (`max-width: 100vw`, `overflow-x: hidden` on html/body/#app)

**Panel Section IDs** (for CSS targeting and testing):
- Left panel: `#company-section`, `#missions-section`, `#tech-tree-section`, `#assets-section`, `#storage-section`, `#help-section`, `#controls-section`
- Right panel: `#search-section`, `#target-section`, `#quickstats-section`, `#hover-section`, `#market-section`, `#flight-log-section`

**Mobile CSS Implementation:**
- Panels use `display: contents` to flatten hierarchy, making sections direct flex children of `#app`
- Sections use CSS `order` property for sequencing (Help=10 through FlightLog=18)
- Hidden sections use `display: none !important`

### Left Panel (Company & Controls)
- **Company Status**: Balance, Reputation, Missions completed
- **Active Missions**: List of in-progress missions with progress bars
  - Click mission to zoom to ship
  - "Plan Mission" button at bottom (always visible)
- **Controls**: Mouse/keyboard binding reference

### Right Panel (Target Information)
- **Search**: Body search box with autocomplete suggestions (max 5), keyboard navigation (↑/↓/Enter/Escape), zooms and selects target on selection
- **Target Information**: Details for selected object including:
  - Name, type, distance from Earth
  - Diameter (auto-scaled: km for large bodies, m for small asteroids)
  - Mass (estimated for asteroids)
  - Orbital parameters (eccentricity, inclination)
  - Wikipedia link, JPL Small-Body Database link
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

### Asteroid Match Percentage Calculation
When selecting a target asteroid for a contract, match percentages indicate suitability:

1. **Filtering**: Asteroids are first checked against the contract's resource type using `getTypesForResource()`. Asteroids whose taxonomic class is NOT in the resource's type list are filtered out.

2. **Scoring (for matching asteroids)**:
   - **Type Score**: Based on rank in the resource's type list (best match = 1.0)
   - **Size Score**: `min(diameter / 50km, 1.0)` - larger asteroids score higher
   - **Raw Score**: `1.0 × typeScore × sizeScore` (multiplicative, not additive)

3. **Normalization**: Raw scores are normalized to a 20-90% display range:
   - Lowest scoring match = 20%
   - Highest scoring match = 90%
   - Scores are linearly interpolated between

4. **Fallback**: If fewer than 5 asteroids match the resource type, non-matching asteroids are shown with 1% match, sorted by distance (closest first).

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

### Mission Phase Modal Details
Each phase modal displays comprehensive mission information:

**Common Info (all phases):**
- Phase image and title
- Captain name (generated at mission start, stored with mission)
- Asteroid: Type, Diameter, Mass, Orbital Distance (each clickable → Wikipedia)
- Contract: Vendor name, Resource type, Contract value (or "Spec-Free Mining" + resource)
- Provider: Name, Reliability rating
- Crew: Type, Reliability rating
- Current leg distance (outbound distance or return distance)
- Vehicle speed (calculated from distance/time, shown as km/s and % of light speed)

**Phase-Specific Info:**
- **Contract Signed**: Days until launch window
- **Launch**: Launch countdown/date
- **Outbound**: Expected payload estimate, Distance to target
- **Drilling**: Expected payload, Extraction progress %, Actual/in-progress payload
- **Inbound**: Actual payload extracted, Distance home
- **Delivering Payload**: Payload being delivered
- **Mission Success**: Final payload, Revenue, Costs, Profit breakdown
- **Pirate Attack**: Combat odds, Security info (if hired)
- **Pirates Won/Payload Seized**: Loss summary
- **Pirates Defeated**: Combat result narrative

### Mission Phases
Missions progress through phases with probability-based outcomes:
1. **Contract Signed** → Waiting for launch readiness (1-8 weeks based on provider frequency), title card shows the payload type and qty, due date as month year (based on deadline days,) agreed price, and current market price.
2. **Launch** → 98% success to Outbound, 2% Launch Anomaly (terminal failure), title card shows vehicle provider, weight of payload to orbit, launch date and wet dress rehearsal status (always passed.)
3. **Outbound** → 98% success to Drilling, 2% In-Flight Anomaly (terminal failure), title card shows vehicle speed, distance to travel in au and km, and captain's name
4. **Drilling** → 98% success to Inbound, 2% Explosion at Drill Site (terminal failure), title card shows crew type, current payload extracted (generated based on duration time drilling passed)
5. **Inbound** → 98% success to Delivering Payload, 2% In-Flight Anomaly (terminal failure), title card shows vehicle speed, distance to travel in au and km, captain's name, and payload type and weight in kg and as percentage of target payload weight.
6. **Delivering Payload** → 100% success to Mission Success, title card shows payload type and weight in kg and as percentage of target weight, and whether it's delivering to LEO, GEO, or Lunar storage (randomly choose.)
7. **Mission Success** → Payout deposited (terminal success), title card shows payload type and weight in kg and as percentage of target weight, contract value, % for payload deviation, % for on time or not, and total pay out, then total mission costs broken down into vehicle rental, crew rental, security rental (in L3 and beyond only) total mission costs and net profit.

All title cards will have data on the target asteroid: min and max distance from Earth in AU, size and diameter, and type, and each of these will be a link to the wikipedia article for that asteroid.

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

### Late Delivery Penalty
Contract missions have a deadline. If the mission completes after the deadline:
- **Penalty formula:** `penaltyPercent = daysLate / contractDeadline`
- **Payout modifier:** `lateModifier = 1.0 - penaltyPercent`
- Penalty is capped at 100% (no negative payouts)

Examples:
- 1 day late on 100 day deadline → 1% penalty → 99% payout
- 50 days late on 100 day deadline → 50% penalty → 50% payout
- 100+ days late on 100 day deadline → 100% penalty → 0% payout

The Contract Signed modal shows estimated mission time vs deadline so players can assess feasibility before committing.

### Financial Consistency Requirements
The following values MUST be consistent across all displays:
1. **Mission Success Modal** - Shows NET PROFIT = Final Payout - Total Costs
2. **Flight Log Entry** - Shows PROFIT (same calculation as modal)
3. **Balance Adjustment** - Costs deducted at contract signing; Revenue (payout) added at completion

Calculation flow:
- At contract signing: `balance -= totalCost` (vehicle + crew rental)
- At mission success: `balance += revenue` (contract value × efficiency modifier × late modifier)
- Displayed profit: `profit = revenue - totalCost`

For contract missions, revenue = `contractValue × efficiencyModifier × lateModifier` where:
- `efficiencyModifier = 0.8 + (crewMiningEfficiency × 0.4)` → Range: 88% to 128%
- `lateModifier = 1.0 - (daysLate / contractDeadline)` → Range: 0% to 100%

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

---

## Testing

### Unit Tests (Vitest)
Test files located in `src/__tests__/`:

| Test File | Coverage |
|-----------|----------|
| `progression.test.ts` | Level progression system, thresholds, feature unlocks |
| `news-system.test.ts` | News ticker messages, formatting, event triggers |
| `asteroid-visibility.test.ts` | Asteroid filtering by level, distance calculations |
| `asteroid-match.test.ts` | Asteroid search/matching for contracts |
| `mobile-layout.test.ts` | Mobile portrait layout ordering and visibility |

### Mobile Layout Tests
Verifies the responsive layout configuration:
- **Panel Section IDs**: All 13 required IDs exist in HTML
- **CSS Order Values**: Help(10) → Search(11) → Company(12) → Missions(13) → TechTree(14) → Assets(15) → Storage(16) → Market(17) → FlightLog(18)
- **Hidden Sections**: Controls, Hover, Target, QuickStats have `display: none`
- **Layout Structure**: Panels use `display: contents` for hierarchy flattening

Run tests: `npm test`
