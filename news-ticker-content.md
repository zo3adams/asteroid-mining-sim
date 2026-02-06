# News Ticker Content

This document contains example news ticker messages for the game. The ticker should mix important game notifications with humorous flavor text and educational content (City Skylines-style).

## Message Categories

### Critical Notifications (Red/Orange)
Triggered by event
**Game Events - High Priority**
- "ALERT: Mission [Mission ID] to [Asteroid Name] under pirate attack!"
- "FAILURE: Mission [Mission ID] aborted due to equipment malfunction"
- "WARNING: Belt Brothers Salvage approaching your mining site at [Asteroid Name]"
- "CRITICAL: Warehouse capacity at 95% - sell resources or expand storage"
- "CONTRACT FAILED: [Contract Name] deadline missed - reputation penalty applied"

### Important Updates (Yellow)
Triggered by event
**Game Events - Medium Priority**
- "SUCCESS: Mission [Mission ID] completed - [Resource Amount] delivered"
- "BREAKING: ULA will now accept contracts from [Player Company Name]"
- "UNLOCKED: New technology available - [Tech Name]"
- "CONTRACT AVAILABLE: NASA seeks [Resource] delivery to ISS"
- "MILESTONE: Company valuation reaches $[Amount]"
- "NEW RECORD: Fastest mission to main belt - [X] days"
- "ACHIEVEMENT: 10 successful missions completed"
- "DISCOUNT UNLOCKED: Blue Genesis repeat customer pricing now active"

### Market News (Blue)
  Triggered by specific fluctuations in resource price, when a 10-20% change occurs one of these will trigger for the appropriate resource.
**Economic Updates**
- "Lithium prices surge 40% following Earth-side battery shortage"
- "Platinum market crashes as competitor floods supply"
- "Water futures spike - space station consortium buying aggressively"
- "Rock Lobster Industries announces experimental mining technique - investors skeptical"
- "Solar System Quarry and Drill completes massive main belt operation"
- "Rare earth metals stabilize after volatile trading week"
- "Belt Brothers Salvage failed to deliver on ESA contract - spot prices rising"

### Competitor Actions (Blue)
Trigger randomly every 5 minutes.  If action is a succesfu mine or outpost estalished, player is no longer abel to mine that asteroid.
- "Rock Lobster Industries launches swarm to [Asteroid Name] - no permits filed"
- "Solar System Quarry sets up permanent outpost at [Location]"
- "Belt Brothers spotted near failed mission site at [Asteroid Name]"
- "Kiki Lobster claims 'revolutionary nano-miner breakthrough' on social media"
- "Reginald P. Stone testifies before Congress on mining safety regulations"

### Educational/Space News (Gray)
Appears randomly in feed, no more than one per minute.
**Real Astronomy Facts**
- "FUN FACT: Asteroid 16 Psyche may contain $10 quintillion in metal"
- "DID YOU KNOW: Main belt contains 1-2 million asteroids larger than 1km"
- "SCIENCE: C-type asteroids are the oldest objects in the solar system"
- "ASTRONOMY: Jupiter's gravity creates Kirkwood gaps in the asteroid belt"
- "HISTORY: First asteroid Ceres discovered in 1801 by Giuseppe Piazzi"
- "PHYSICS: Hohmann transfers are the most fuel-efficient orbital maneuvers"
- "SPACE: Communication with asteroid belt missions has 20+ minute delay"

### Humorous Flavor Text (Gray)
Appears randomly in feed, no more than one per every 2 minute.
**Irrelevant Space News**
- "Mars colonists vote pineapple officially banned from space pizza"
- "Lunar tourist complains about 'false advertising' in low gravity wedding photos"
- "ISS crew reports coffee tastes 'weird' - investigation finds nothing unusual"
- "Asteroid named after celebrity already being mined by fans"
- "Space insurance rates drop to 'merely absurd' following quiet quarter"
- "Belt miner sets record for longest poker game - 14 months in transit"
- "Jovian moon colonists petition for time zone recognition"
- "Cosmic Jack's pirate crew spotted wearing surprisingly tasteful matching uniforms"
- "Edward Thatch denies retirement rumors, says 'still plenty of belts to plunder'"
- "Venture capitalists excited about 'Uber but for asteroid mining'"
- "Tech billionaire's personal asteroid mine 'not a tax dodge' says lawyer"
- "Space dating app launches 'orbital compatibility' matching algorithm"
- "Martian weather report: Dusty with a chance of dust"
- "Zero-G sports league announces 3D chess now requires actual 3D board"
- "Conspiracy theorist insists Pluto 'still a planet, wake up sheeple'"
- "Robot vendor recalls mining bots after 'overly enthusiastic drilling incidents'"
- "SpaceY announces reusable rockets will now be 'even more reusable'"
- "Astronomer discovers asteroid shaped exactly like a potato - names it 'Potato'"
- "Belt miner's cat becomes first feline to visit 100 asteroids"


### Procedural Templates
**Generate based on game state:**
- "[Competitor Name] mining at [Asteroid Name]"
- "[Resource] price change: [Up/Down] [X]% to $[Price]/ton"
- "[Player Name] company valuation: $[Amount]"
- "[Random Celebrity] invests in asteroid mining startup"
- "Scientists discover [Random Element] deposits on [Asteroid Name]"
- "[Random Country] announces asteroid mining program"
- "New asteroid discovered: [Generated Name]"

## Message Frequency Guidelines

- **Critical**: Show immediately, interrupt current message
- **Important**: Show within 10 seconds, priority queue
- **Market/Competitor**: Show within 1 minute, normal queue
- **Educational**: Every 2-3 minutes when no other messages
- **Humorous**: Every 3-5 minutes, low priority
- **Tutorial**: Only first 30 minutes of gameplay

## Message Timing

- Messages scroll at readable speed (~100 characters per 10 seconds)
- Minimum 5 seconds between messages
- Pause scrolling on hover
- Click message to show full details in popup
- Message history accessible via ticker icon (last 50 messages)

## Dynamic Message Generation

Some messages should be generated procedurally based on game state:
- Contract completions/failures
- Price changes (>10%)
- Competitor actions
- Tech unlocks
- Milestone achievements
- Random events

## Easter Eggs & Special Messages
Triggered by key in game events, like a date reached or player a status. Triggered on entry to state only.

- **April 1st**: "Scientists confirm space is real, not elaborate prank"
- **December 25th**: "NORAD tracks Santa's sleigh passing through asteroid belt"
- **July 20th**: "Celebrating moon landing anniversary - 10% off lunar contracts"
- **Player 100th mission**: "Century Club! [Player Name] completes 100th mission"
- **Player bankruptcy**: "Financial experts baffled by [Player Name]'s 'bold strategy'"

---

*This list should expand as we add more game features and discover funny situations during playtesting.*
