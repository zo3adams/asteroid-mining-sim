# Asteroid Miner - Game Mechanics

## Core Values and Balance

### Starting Conditions
- **Starting Capital**: $50,000,000 (50M)
- **Starting Reputation**: 0
- **Starting Tech**: Basic mining equipment only
- **Starting Fleet**: None (must rent or purchase)

### Time System
- **Real-time vs Game-time**: 1 second real = 1 day game time (configurable)
- **Mission Durations**: Calculated from real orbital mechanics, but using speeds that are twice as fast as current vehicle because it is the future.
  - Near-Earth asteroids: 30-180 days in current reality, 15-90 days in gameplay
  - Main belt: 1-3 years in current reality,  6-18 months in gameplay
  - Outer system: 5-10+ years only unlocked in later gameplay,  and will require warp drive in tech tree
- **Time Acceleration**: Player can speed up (2x, 5x, 10x, 100x)

## Contract System

### Contract Types
1. **Resource Acquisition** - "Deliver X tons of Y resource"
2. **Exploratory** - "Survey asteroid Z and report composition"
3. **Establishment** - "Set up mining outpost at location X"
4. **Defense** - "Protect shipment from pirates"
5. **Research** - "Test new equipment at distant location"

### Contract Parameters
- **Payment**: Upfront + completion bonus
- **Deadline**: Game-time deadline
- **Penalties**: Late penalties, failure consequences
- **Reputation Impact**: Success/failure affects future contracts
- **Difficulty Tiers**: Bronze → Silver → Gold → Platinum → Diamond

### Contract Economics
- Payment scales with:
  - Distance (delta-v required)
  - Risk level
  - Quantity required
  - Time constraints
  - Reputation level

## Sub-Contract System

### Launch Providers
- **SpaceY** - Cheap, reliable, medium payload
- **ULA** - Expensive, very reliable, large payload
- **RocketForge** - Cheap, small payload
- **Blue Genesis** - Mid-price, large payload
- Each has: Cost, payload capacity, reliability %, launch frequency

### Mining Crews
- **Robotic** - Cheap, slow, limited capability
- **Small Human Crew** - Moderate cost, good capability
- **Large Expedition** - Expensive, fast, high capability
- Stats: Cost/day, mining rate, reliability, morale

### Robot Vendors
- **Mining Bots** - Autonomous resource extraction
- **Survey Bots** - Composition analysis
- **Defense Bots** - Security against pirates
- **Maintenance Bots** - Repair and upkeep
- Each has: Purchase cost, operating cost, effectiveness rating

### Security Contractors
- **Light** - Small arms, basic protection
- **Medium** - Armed escort, good deterrent
- **Heavy** - Military-grade, high cost
- Effectiveness vs pirate threat levels

## Mission Planning

### Target Selection Factors
1. **Distance** - AU from Earth, delta-v required
2. **Composition** - What resources are available
3. **Size** - Total mass, mineable volume
4. **Risk Level** - Pirate activity, anomaly probability
5. **Competition** - Other companies operating there
6. **Orbital Period** - Launch window timing

##### Mission planning Gameplay description
User should always be able to click "Plan a mission" and a screen should slide out from the side showing various offerings from the contract providers (with
  random prices and material types they are requesting) that the user can choose. After picking a contract the user sees a screen with  possible asteroids that are good targets for that
  resource, and also a button that can instead used to hop back to solar system view and choose manually.   The asteroid resources will be based on their taxonomic types,   and diameter.

After choosing an asteroid, the user will choose the launch service provider, and then the crew (with robotic and human options.) Each will have stats that affect the percentage of posssible pay out and likley hood of an anomoly.   In later levels (not at start) the player will also have to choose security (or optionally not have security) and ambush by pirates becomes a possible outome.

after making all their choices, the player sees a vehicle launch image, and then the flight path of the vehicle is rendered on the solar system, with the HUD showing the mission (time to complete,  resources aquired, and current status) in the HUD.  The basic idea is the player is launching multiple missions simultaneously and watching them progress in the HUD, but can click on the HUD and zoom in on that mission.

### Mission Costs
```
Total Cost = Launch + Crew + Equipment + Security + Operations + Contingency
```

- **Launch**: Based on payload mass and provider
- **Crew**: Daily rate × mission duration
- **Equipment**: Purchase or rental of mining/survey equipment
- **Security**: Based on threat level and duration
- **Operations**: Fuel, supplies, communication
- **Contingency**: 10-30% buffer for unexpected events


### Mission Progress Tree (IMPLEMENTED)
As a mission proceeds it walks the tree described below, starting with contract signed and ending with an outcome.
Each step in this tree has a certain percentage of branching to one of the next steps, and the percentages are affected by player selections of launch provider and crew reliability. Higher reliability reduces anomaly chances.

**Anomaly probability formula**: `baseProbability × (1 - (providerReliability + crewReliability) / 2 + 0.5)`

This means 98% combined reliability reduces 2% anomaly chance to ~1%.

**UI Behavior**:
- Click any mission in the Active Missions list to see phase modal with image and description
- Terminal failure states show red styling
- Terminal success states show green styling
- Progress bar pulses on phase changes
- Dismissing a terminal state removes the mission from the list

| Phase | Image File | Description | Duration | Next Phases |
|-------|------------|-------------|----------|-------------|
| Contract Signed | mission_phase_01_contract_signed.png | You've secured this contract, crew and launch vehicle readiness are pending | 1-3 weeks (Weekly), 2-6 weeks (Bi-weekly), 1-6 months (Monthly) | 100% → Launch |
| Launch | mission_phase_02_launch.png | Wet dress rehearsal is complete. Vehicle is on the pad and ready to launch in 5...4...3...2... | 1-3 days | 98% → Outbound, 2% → Launch Anomaly |
| Launch Anomaly | mission_phase_03_launch_anomaly.png | Launch abort - mission is scrubbed and the crew's lives depend on the launch abort system | Terminal (failure) | - |
| Outbound | mission_phase_04_outbound.png | Crew and mining rig are outbound to target and preparing to drill in zero-G | Based on mission distance | 98% → Drilling, 2% → In Flight Anomaly |
| In Flight Anomaly | mission_phase_05_in_flight_anomaly.png | An anomaly has occurred during flight - crew and all hardware have been lost | Terminal (failure) | - |
| Drilling | mission_phase_06_drilling.png | Crew is assessing and preparing to extract resources | Based on mining duration | 98% → Inbound, 2% → Explosion At Drill Site |
| Explosion At Drill Site | mission_phase_07_explosion_at_drill_site.png | An anomaly has occurred while drilling - we are trying to make contact with the crew | Terminal (failure) | - |
| Inbound | mission_phase_08_inbound.png | Crew is returning with payload | Based on mission distance | 98% → Delivering Payload, 2% → In Flight Anomaly |
| Delivering Payload | mission_phase_09_delivering_payload.png | Crew has returned and is delivering payload to client | 2-7 days | 100% → Mission Success |
| Mission Success | mission_phase_10_mission_success.png | Mission Success - pay day! | Terminal (success) | - |



### Delta-V Budget
- Calculate Hohmann transfer orbits
- Account for:
  - Departure from Earth orbit
  - Arrival at target
  - Return journey
  - Station-keeping
  - Contingency maneuvers

## Resource Management

### Asteroid Taxonomic Types & Resources

Different asteroid types contain different resources. The taxonomic class determines what can be extracted:

| Type | Description | Mining Value | Likely Contents | Rarity |
|------|-------------|--------------|-----------------|--------|
| **C-type** | Carbonaceous | Fuel, life support, chemistry | Water-bearing clays, carbon compounds, organics, ammonia, sulfur | Very common |
| **S-type** | Silicaceous | Structural metals & construction | Silicates, iron-nickel grains, Mg, Al, rock-forming minerals | Common |
| **Q-type** | Fresh silicaceous | High-efficiency metal extraction | Fresh rock, cleaner metal fractions, less weathered silicates | Uncommon |
| **M-type** | Metallic | High-value metals | Iron, nickel, cobalt, platinum-group metals | Rare |
| **D-type** | Dark/primitive | Volatiles & exotic organics | Carbon-rich material, ices, primitive organic compounds | Uncommon (outer) |
| **P-type** | Primitive | Bulk volatiles & chemistry | Dark carbonaceous material, ammonia, water ice | Uncommon |
| **V-type** | Vestoid/basaltic | Ceramics & aerospace materials | Basaltic rock, pyroxene, igneous minerals | Rare |
| **E-type** | Enstatite | Exotic industrial minerals | Enstatite-rich rock, unusual reduced minerals | Ultra rare |

### Resource Yield Estimates

Resource yields depend on:
- **Asteroid type** - Determines which resources are present
- **Diameter/mass** - Larger asteroids have more total material
- **Extraction efficiency** - ~0.1% of total mass is extractable
- **Crew efficiency** - Better crews extract more

### Resource Properties
Each resource has:
- **Base Value**: $/ton baseline price
- **Volatility**: How much price fluctuates (5-50% per week)
- **Independent Movement**: Each resource type fluctuates independently
- **News Events**: Major price changes announced in news ticker

### Dynamic Market System ✅ IMPLEMENTED

#### Price Fluctuation
- All 8 resource types have independent weekly price changes
- Range: Based on volatility (Water ±40%, Volatiles ±35%, Lithium ±25%, Rare Earths ±20%, Platinum/Gold ±15%, Nickel ±12%, Iron ±10%)
- Prices constrained to 50%-200% of base price
- News events trigger and explain price swings >15%
- Contract payouts based on market price but with premium (10-25% above spot)

#### Resource Volatility
| Resource | Icon | Base Price | Volatility |
|----------|------|------------|------------|
| Water Ice | 💧 | $5,000/ton | ±40% |
| Volatiles | ☁️ | $8,000/ton | ±35% |
| Lithium | 🔋 | $45,000/ton | ±25% |
| Rare Earths | ⚡ | $80,000/ton | ±20% |
| Platinum | 💎 | $150,000/ton | ±15% |
| Gold | 🥇 | $200,000/ton | ±15% |
| Nickel | ⚙️ | $2,000/ton | ±12% |
| Iron | 🔩 | $1,000/ton | ±10% |

#### Market UI
- Right panel shows all resources sorted by current price
- Mini sparkline shows 52-week price trend
- Color coding: green = up, red = down, cyan = stable
- Click any resource for detailed price chart modal
- Modal shows: current price, base price, 52-week high/low, price history chart

#### News-Driven Events
Examples that affect prices (announcements in news ticker):
- "📊 Mars colony expansion drives water demand up 30%"
- "📊 New fusion reactor tech crashes lithium prices 25%"
- "📊 Orbital construction boom - platinum at all-time highs"
- "📊 Europa ice discovery floods market - water down 20%"

### Storage Depot System (Level 3+) ✅ IMPLEMENTED

#### Depot Locations
| Location | Purchase Cost | Capacity | Travel Time from Earth | Security Risk |
|----------|---------------|----------|------------------------|---------------|
| Earth LEO | $10M | 5,000 tons | 0 days | None |
| Earth GEO | $25M | 15,000 tons | 1 day | None |
| Lunar L2 | $50M | 25,000 tons | 3 days | None |
| Asteroid Belt Orbit | $100M | 50,000 tons | 120 days | Level 4+ pirates |

#### Storage Features
- No decay or holding costs (simplified)
- Stored resources can be "refined" (+10% payload size over time) (PLANNED)
- Player must sell excess if storage is full (at current market price)
- Storage depots can be attacked by pirates in Level 4 (Scattered Disc) only
- **Multiple depots of same type can be purchased** for additional capacity
- **Sell stored resources** at current market prices via Manage Storage modal

#### Implementation
- Storage panel unlocks at Level 3 (51+ missions)
- Click "Manage Storage" to see all depots
- Purchase depots with one-time cost (can buy multiple of same type)
- Each depot shows:
  - Count owned and total capacity
  - Capacity bar (green/yellow/red by usage percent)
  - List of stored resources with current market value
  - Sell button for each stored resource
- Sell modal allows:
  - Custom quantity selection
  - Quick sell buttons (25%, 50%, All)
  - Shows total value at current market price
- Belt depot requires Level 4 to purchase

### Spec-Free Mining (Level 3+) ✅ IMPLEMENTED
- Player can mine without a contract by selecting "Spec-Free Mining" option
- Requires at least one storage depot to be owned
- **Fills ALL owned depots** (smallest first) before selling overflow
- **Random resource** selected from asteroid's composition based on taxonomic class
- Overflow sold at current market price automatically
- Strategy: mine when prices low, sell when prices high

---

## Tech Tree (PLANNED)

### Structure
- Tree-based unlock system with parent prerequisites
- Some nodes require two parent nodes to unlock
- All unlocks purchased with money
- Visible nodes show costs and benefits (e.g., "10% faster travel")
- Locked nodes beyond next tier show "???"

### Visibility by Level
| Level | Tech Tree Visibility |
|-------|---------------------|
| 1 - Apollo/Amor | Hidden entirely |
| 2 - Inner Belt | Tier 1-2 visible, Tier 1 unlockable |
| 3 - Kuiper Belt | Tier 1-3 visible, Tier 1-2 unlockable |
| 4 - Scattered Disc | Tier 1-4 visible, Tier 1-3 unlockable |
| 5 - Heliopause | Full tree visible and unlockable |

### Tech Categories

#### Propulsion (affects travel time)
```
[Chemical Rockets] (base, free)
       |
[Ion Propulsion] - $5M - 15% faster travel
       |
[Hall Effect Thrusters] - $15M - 25% faster travel
       |
[VASIMR] - $50M - 40% faster travel
       |
[Plasma Drive] - $150M - 60% faster travel
```

#### Mining Equipment (affects yield)
```
[Percussion Drills] (base, free)
       |
[Laser Cutters] - $8M - 10% increased yield
       |
[Shaped Charges] - $20M - 20% increased yield
       |
[Plasma Excavation] - $60M - 35% increased yield
```

#### Stabilization (affects yield and safety)
```
[Manual Anchoring] (base, free)
       |
[Magnetic Anchor Rigs] - $4M - 5% yield, -5% anomaly chance
       |
[Spin Counter Thrusters] - $12M - 10% yield, -10% anomaly chance
       |
[Dust Containment Fields] - $30M - 15% yield, -15% anomaly chance
```

#### Navigation (affects travel time and safety)
```
[Basic Star Trackers] (base, free)
       |
[Advanced GNC] - $6M - 5% faster, -5% anomaly chance
       |
[Relativistic Navigation] - $25M - 10% faster, -10% anomaly chance
       |
[Quantum Positioning] - $80M - 15% faster, -15% anomaly chance
```

#### Automation (affects crew costs and capability)
```
[Manual Operations] (base, free)
       |
[Basic Mining Bots] - $10M - 20% lower crew costs
       |
[Autonomous Swarm] - $40M - 40% lower crew costs
       |
[Full AI Mining] - $120M - Can run missions without human crew
```

### Tech Effect Application
- Travel time modifiers apply equally to outbound AND inbound
- Yield modifiers multiply with crew efficiency
- Anomaly reduction is additive with reliability

### Data Storage Format (TypeScript)
```typescript
interface TechNode {
  id: string;
  name: string;
  category: 'propulsion' | 'mining' | 'stabilization' | 'navigation' | 'automation';
  tier: 1 | 2 | 3 | 4 | 5;
  cost: number;
  prerequisites: string[]; // IDs of required parent nodes
  effects: {
    travelTimeModifier?: number;    // e.g., 0.85 = 15% faster
    yieldModifier?: number;         // e.g., 1.10 = 10% more yield
    anomalyReduction?: number;      // e.g., 0.05 = 5% less anomaly chance
    crewCostModifier?: number;      // e.g., 0.80 = 20% cheaper crews
  };
  description: string;
  unlockLevel: number; // Minimum player level to unlock
}
```

---

## Ownership System (Level 2+) ✅ IMPLEMENTED

### Purchasable Assets
Players can buy instead of rent:

#### Vehicles
| Vehicle | Purchase Cost | Rental Equivalent | Break-even |
|---------|---------------|-------------------|------------|
| Light Freighter | $20M | $2M/mission | 10 missions |
| Heavy Hauler | $80M | $8M/mission | 10 missions |
| Deep Space Vessel | $200M | $25M/mission | 8 missions |

#### Mining Equipment
| Equipment | Purchase Cost | Rental Equivalent | Break-even |
|-----------|---------------|-------------------|------------|
| Basic Drill Rig | $5M | $500K/mission | 10 missions |
| Industrial Extractor | $25M | $2M/mission | 12 missions |
| Plasma Mining Array | $100M | $10M/mission | 10 missions |

#### Robotic Crews
| Crew Type | Purchase Cost | Rental Equivalent | Break-even |
|-----------|---------------|-------------------|------------|
| Mining Bots (Basic) | $8M | $800K/mission | 10 missions |
| Mining Bots (Advanced) | $30M | $3M/mission | 10 missions |
| Autonomous Mining Fleet | $150M | $12M/mission | 12 missions |

### Ownership Benefits
- No maintenance costs (simplified)
- No property taxes
- Significantly lower operating costs than rental
- Can be used on any mission

### Implementation
- Assets panel unlocks at Level 2 (same as Tech Tree)
- Click "View Assets" to see all purchasable items
- Green border indicates owned assets
- Purchase cost deducted from balance immediately
- Owned assets tracked in game state and save URLs

---

## Pirate System (Level 3+) (PLANNED)

### Pirate Attack Mechanics

#### Attack Probability by Phase
| Phase | Attack Probability | Rationale |
|-------|-------------------|-----------|
| Outbound | 5% | Rare, nothing to steal yet |
| Inbound | 25% | Common, payload is valuable |

**Note**: Overall ~30% of missions may encounter pirates (if no security hired)

#### Pirate Strength Scaling
| Level | Pirate Attack Rating | Pirate Defense Rating |
|-------|---------------------|----------------------|
| 3 - Kuiper Belt | 3-6 (1d6+2) | 2-5 (1d6+1) |
| 4 - Scattered Disc | 5-10 (1d6+4) | 4-9 (1d6+3) |
| 5 - Heliopause | 8-14 (1d6+7) | 7-13 (1d6+6) |

#### Combat Resolution (D&D Style)
```
Player Attack Roll: 1d20 + Security Attack Rating
Player Defense Roll: 1d20 + Security Defense Rating
Pirate Attack Roll: 1d20 + Pirate Attack Rating  
Pirate Defense Roll: 1d20 + Pirate Defense Rating

If Player Attack > Pirate Defense AND Player Defense > Pirate Attack:
  → Pirates Defeated (mission continues)
Else If Pirate Attack > Player Defense AND Pirate Defense > Player Attack:
  → Pirates Win (total loss - crew, ship, payload)
Else:
  → Stalemate: 80% crew/ship survive but payload taken, 20% full escape
```

### Security Contractors

#### Security Tiers
| Tier | Name | Cost/Mission | Attack Rating | Defense Rating |
|------|------|--------------|---------------|----------------|
| Light | Frontier Guards | $500K | 2 | 2 |
| Medium | Orbital Defense Corp | $2M | 5 | 5 |
| Heavy | Military Escort | $8M | 9 | 9 |

#### Relationship System
- Relationship builds with each hire (regardless of outcome)
- Relationship levels: 0-10 (starts at 0)
- Each level adds +0.5 to attack AND defense ratings
- Max bonus at level 10: +5 to both ratings

#### Hiring Security
- Optional on all missions (Level 3+)
- Cost-benefit: ~30% pirate chance vs security cost
- Player is tempted to skip security (gambling)

### New Mission Phases (PLANNED)

Add to mission phase tree:

| Phase | Image File | Description | Duration | Next Phases |
|-------|------------|-------------|----------|-------------|
| Pirate Attack (Outbound) | mission_phase_pirate_attack_outbound.png | Pirates have intercepted our outbound vessel! | 1-2 days | Combat resolution → Outbound OR Pirates Won OR Payload Seized |
| Pirate Attack (Inbound) | mission_phase_pirate_attack_inbound.png | Pirates are attempting to board and seize the payload! | 1-2 days | Combat resolution → Inbound OR Pirates Won OR Payload Seized |
| Pirates Won | mission_phase_pirates_won.png | The pirates have overwhelmed our defenses. All hands lost. | Terminal (failure) | - |
| Payload Seized | mission_phase_payload_seized.png | We fought them off but they escaped with the cargo. Crew is safe. | Terminal (partial failure) | - |
| Pirates Defeated | mission_phase_pirates_defeated.png | Security forces repelled the attack! Mission continues. | 1 day | → Continue to next phase |

### Updated Mission Flow (Level 3+)

```
Contract Signed → Launch → [2% Launch Anomaly]
                        ↓
                   Outbound → [5% Pirate Attack Outbound] → Combat
                        ↓                                      ↓
                   [2% In Flight Anomaly]          [Win] → Continue
                        ↓                          [Lose] → Pirates Won
                   Drilling                        [Partial] → Payload Seized (rare)
                        ↓
                   [2% Explosion]
                        ↓
                   Inbound → [25% Pirate Attack Inbound] → Combat
                        ↓                                      ↓
                   [2% In Flight Anomaly]          [Win] → Continue
                        ↓                          [Lose] → Pirates Won
                   Delivering Payload              [Partial] → Payload Seized
                        ↓
                   Mission Success
```

---

## Level Transition System (PLANNED)

### Automatic Level Up
- Triggers automatically when contract count threshold reached
- Level 2 at 11 contracts
- Level 3 at 51 contracts  
- Level 4 at 501 contracts
- Level 5 at tech tree complete + $1T net worth

### Level Up Ceremony
1. Game pauses
2. Title card appears with level name and description
3. Background image specific to level
4. Audio fanfare plays (file TBD)
5. "Continue" button to proceed
6. New tech tree nodes become visible
7. News ticker announces level-specific event

### Level-Specific Unlocks
| Level | New Features Unlocked |
|-------|----------------------|
| 2 | Tech tree visible, can purchase tech, ownership system |
| 3 | Pirates active, security hiring, storage depots, spec-free mining |
| 4 | Stronger pirates, storage can be attacked, VASIMR tech available |
| 5 | Full tech tree, end-game content visible |

---

## Risk and Events

### Risk Factors
- **Distance Risk**: Increases with AU from Earth
- **Duration Risk**: Longer missions = more that can go wrong
- **Pirate Risk**: Level 3+ only, scales with level
- **Equipment Risk**: Based on tech level (better tech = lower risk)
- **Crew Risk**: Based on crew type and reliability

### Random Events
1. **Space Pirates** (Level 3+)
   - Outbound: 5% chance
   - Inbound: 25% chance
   - Combat resolution determines outcome
   - Can be mitigated with security

2. **Equipment Failure**
   - Valve issues, GNC malfunctions, star tracker errors
   - Reduced by tech tree unlocks
   - Can abort mission if critical

3. **Anomalies**
   - Unexpected asteroid composition
   - Structural instability
   - Magnetic interference
   - Reduced by stabilization tech

### Event Mitigation
- Better tech = lower anomaly risk
- Security = pirate protection
- Tech tree progression = overall safer missions

## Progression Curve

### Early Game (First 10 contracts)
- Level name: "Apollo and Amor"
- Description: "Still using chemical propellant and launching from the gravity well? With a [Specific Impulse|https://en.wikipedia.org/wiki/Specific_impulse] of around 400s transit time will mean near-Earth asteroids are your best targets, and you will rely on contractors to supply your vehicle, crew, and tooling."
- Constraint: Small contracts (100-1000 tons)
- Goal: Learn basic mechanics with no pirate interferance or tech tree decision making and travel time limited 
- No tech tree - just choose missions and contractors and crew

### Mid Game (Contracts 11-50)
- Level name: The Inner Below
- Description: "Ion propulsion has dramatically changed the asteroid mining economy!  Vehicles with a Specific Impulse of 5000 and continuous thrust can reach as far as Jupiter in 6 months, out where [silicate|https://en.wikipedia.org/wiki/S-type_asteroid] and [metal-rich|https://en.wikipedia.org/wiki/M-type_asteroid] asteroids are prevalent. These engines don't come cheap however..."   
- Constraint: Medium contracts (1000-10000 tons)
- Goal: make buy or rent decisions about vehicle and crew technology, get familar with tech tree unlock to increase effectiveness.
- Tech tree depth - the tech tree will show various kinda of drives and navigation computers on a the vehicle (which decrease travel time inbound and outbound)  and various drill tech (percussion and energy based, shaped charges) which decrease mining time and increase yeilds,  and and stabalization and anchoring tech (magentic anchor rigs, spin counter thrusters, and dust containment fields) that increase yield as well.

### Late Game (50+ contracts)
- Level name: "All Quiet on the Kuiper Belt Front"
- Description: "Asteroid mining has proven lucrative and many a fortune have been made pushing rock [down the well|https://en.wikipedia.org/wiki/Sphere_of_influence_(astrodynamics)]. But fortune attracts attention, and attention ceattracts depredation."    
- Constaints: Massive contracts (millions of tons) and player can now go mine an asteroid without any contract and store the payload to sell later.
- Goal: deal with threat of piracy, and have to hire security forces to manage.  Start to navigate economy more deeply, purchasing in-orbit storage and stock piling material to sell when prices are high.
- Tech tree - plasma drives and navigtion computers that account for relativistic effects for vehicles, advanced robotic miners that out perform human crew,  and storage depots with material processing and security attributes."

### Later Game ( 500+ contracts or extractions)
- Level name: The  Scattered Disc Expanse
- Descripton: "The great [sphere|https://en.wikipedia.org/wiki/Dyson_sphere] isn't gonna build itself, we need more material to supply construction and a living for the orbital workforce. Contract profits are high, especially for hard to reach targets that come around only [once in a lifetime|https://en.wikipedia.org/wiki/List_of_periodic_comets] but where there is a [VASIMR |https://en.wikipedia.org/wiki/Variable_Specific_Impulse_Magnetoplasma_Rocket] there is a way!"
- Constraint: Massive contracts, sometimes that pay directly in tech tree unlocks, as well as user being able to proactively mine.  Water is especially volitile as a commodity and player can make big money timing it's sale.
- Goal: put all skills developed until now to the test, balance security, production pipeline, and budget to maximize profits.
- Tech tree- VASIMR and other plasma drives, plasma mining equipment and fusion reactor powered automated mining.


### End Game
- Level name: Beyond the Heliopause
- Description: We've minded all we can from [Sol and it's spawn|https://en.wikipedia.org/wiki/Solar_System], humanity is ready to [go beyond| https://en.wikipedia.org/wiki/Milky_Way]. Are you ready for the great beyond?"
- Constraints: none - this stage is reached when tech tree is fully unlocked and player has 1 trillion dollars. It is a message that loads on screen hinting at a galaxy level sequel to the game, and essentially the conclusion of the gameplay. 
- Goal: this is endstate reached when player has unlocked full tech tree and accrued 1 trillion in capital
- Tech tree: an ominous shadowy tree suggests extra-terrestial tech is right around the corner (but not really unlocked to use, hints for sequel.)

## Victory Conditions (Detailed)

### Financial Victory
- Achieve net worth of $1 trillion
- Maintain for 365 game days

### Monopoly Victory
- Control 75% of market in 3+ resource types
- Maintain for 180 game days

### Scientific Victory
- Unlock all tech tree
- Complete 10+ exploratory contracts
- Discover 5+ new asteroids

### Reputation Victory
- Achieve maximum reputation
- Complete 100+ contracts
- Zero pirate losses
- Zero mission failures

## Educational Integration

### Learning Moments
- **Orbital Mechanics**: Show Hohmann transfer calculations
- **Spacecraft Systems**: Detailed tooltips on equipment failures
- **Resource Economics**: Historical price charts, supply/demand graphs
- **Solar System**: Link to Wikipedia/NASA for each body
- **Space Technology**: Explain GNC, delta-v, Isp, etc.

### In-Game Encyclopedia
- Unlocks as player encounters concepts
- Links to external educational resources
- Videos, diagrams, articles
- Quiz mini-games for bonus credits
