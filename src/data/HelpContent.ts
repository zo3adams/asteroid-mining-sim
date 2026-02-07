/**
 * Help content - tips and references for the help system
 */

export interface Tip {
  id: number;
  text: string;
}

export interface Reference {
  id: number;
  title: string;
  url: string;
  description?: string;
}

export interface ProgressionLevel {
  id: number;
  name: string;
  displayName: string; // Plain text version without links
  contractRange: string;
  description: string;
  goal: string;
  unlocks: string[]; // Features unlocked at this level
}

export const GAMEPLAY_TIPS: Tip[] = [
  {
    id: 1,
    text: "Events reported in the news scroller can help you choose a strategy or profitable resource to pursue.",
  },
  {
    id: 2,
    text: "Asteroids farther from Earth take longer to deliver, but aren't generally more risky. Most accidents happen during delta-V maneuvers, not transit.",
  },
  {
    id: 3,
    text: "Cheaper contractors for launch vehicle and mining crew can mean higher profits, but also more risk. You get what you pay for.",
  },
  {
    id: 4,
    text: 'You can search unrendered asteroids by <a href="https://en.wikipedia.org/wiki/Minor-planet_designation" target="_blank" style="color: #0ff;">MPC designation</a> (e.g., "1" for Ceres), and rendered asteroids by name and designation.',
  },
  {
    id: 5,
    text: 'Game can run at realtime or as fast as 1 week per second, most players use real time to plan out missions, and sped up while waiting for them to complete.',
  },
  {
    id: 6,
    text: "Contract deadlines matter, payout will be reduced if delivery is late so be sure to choose a target you can fly out to and back from in time!",
  },
];

export const REFERENCES: Reference[] = [
  {
    id: 1,
    title: "JPL Small-Body Database",
    url: "https://catalog.data.gov/dataset/jpl-small-body-database-search-engine",
    description: "NASA's database of asteroids and comets used in this game",
  },
  {
    id: 2,
    title: "Orbital Mechanics",
    url: "http://www.braeunig.us/space/orbmech.htm",
    description: "Comprehensive guide to orbital mechanics and space travel",
  },
  {
    id: 3,
    title: "World's Most Valuable Substances",
    url: "https://www.visualcapitalist.com/the-worlds-most-valuable-substances-by-weight",
    description: "Context for resource values in space mining",
  },
];

export const PROGRESSION_LEVELS: ProgressionLevel[] = [
  {
    id: 1,
    name: '<a href="https://en.wikipedia.org/wiki/Apollo_asteroid" target="_blank" style="color: var(--hud-cyan);">Apollo</a> and <a href="https://en.wikipedia.org/wiki/Amor_asteroid" target="_blank" style="color: var(--hud-cyan);">Amor</a>',
    displayName: 'Apollo and Amor',
    contractRange: "First 10 contracts",
    description: 'Still using chemical propellant and launching from the gravity well? With a <a href="https://en.wikipedia.org/wiki/Specific_impulse" target="_blank" style="color: #0ff;">Specific Impulse</a> of around 400s, transit time will mean near-Earth asteroids are your best targets, and you will rely on contractors to supply your vehicle, crew, and tooling.',
    goal: "Learn basic mechanics with no pirate interference or tech tree decision making.",
    unlocks: [],
  },
  {
    id: 2,
    name: 'The Inner Belt',
    displayName: 'The Inner Belt',
    contractRange: "Contracts 11-50",
    description: 'Ion propulsion has dramatically changed the asteroid mining economy! Vehicles with a Specific Impulse of 5000 and continuous thrust can reach as far as Jupiter in 6 months, out where <a href="https://en.wikipedia.org/wiki/S-type_asteroid" target="_blank" style="color: #0ff;">silicate</a> and <a href="https://en.wikipedia.org/wiki/M-type_asteroid" target="_blank" style="color: #0ff;">metal-rich</a> asteroids are prevalent.',
    goal: "Make buy or rent decisions about vehicle and crew technology, unlock tech tree upgrades.",
    unlocks: [
      'Tech Tree - Purchase upgrades to improve propulsion, mining, and automation',
      'Asset Ownership - Buy vehicles and equipment instead of renting',
    ],
  },
  {
    id: 3,
    name: 'All Quiet on the Kuiper Belt Front',
    displayName: 'All Quiet on the Kuiper Belt Front',
    contractRange: "Contracts 51-500",
    description: 'Asteroid mining has proven lucrative and many a fortune have been made pushing rock <a href="https://en.wikipedia.org/wiki/Sphere_of_influence_(astrodynamics)" target="_blank" style="color: #0ff;">down the well</a>. But fortune attracts attention, and attention attracts depredation.',
    goal: "Deal with the threat of piracy, hire security forces, navigate the economy with orbital storage.",
    unlocks: [
      'Pirates - Space pirates may attack your missions (hire security!)',
      'Security Contractors - Hire armed escorts to protect your cargo',
      'Storage Depots - Purchase orbital storage to stockpile resources',
      'Spec-Free Mining - Mine asteroids without a contract and sell later',
    ],
  },
  {
    id: 4,
    name: 'The Scattered Disc Expanse',
    displayName: 'The Scattered Disc Expanse',
    contractRange: "Contracts 501+",
    description: 'The great <a href="https://en.wikipedia.org/wiki/Dyson_sphere" target="_blank" style="color: #0ff;">sphere</a> isn\'t gonna build itself! Contract profits are high, especially for hard to reach targets that come around only <a href="https://en.wikipedia.org/wiki/List_of_periodic_comets" target="_blank" style="color: #0ff;">once in a lifetime</a>, but where there is a <a href="https://en.wikipedia.org/wiki/Variable_Specific_Impulse_Magnetoplasma_Rocket" target="_blank" style="color: #0ff;">VASIMR</a> there is a way!',
    goal: "Balance security, production pipeline, and budget to maximize profits.",
    unlocks: [
      'VASIMR Propulsion - Advanced drives for deep space missions',
      'Stronger Pirates - More dangerous foes require better security',
      'Storage Attacks - Pirates may raid your orbital depots',
    ],
  },
  {
    id: 5,
    name: 'Beyond the Heliopause',
    displayName: 'Beyond the Heliopause',
    contractRange: "End Game",
    description: 'We\'ve mined all we can from <a href="https://en.wikipedia.org/wiki/Solar_System" target="_blank" style="color: #0ff;">Sol and its spawn</a>, humanity is ready to <a href="https://en.wikipedia.org/wiki/Milky_Way" target="_blank" style="color: #0ff;">go beyond</a>. Are you ready for the great beyond?',
    goal: "Unlock full tech tree and accrue 1 trillion in capital to complete the game.",
    unlocks: [
      'Full Tech Tree - All technologies available for purchase',
      'Victory Conditions - Achieve financial, monopoly, or scientific victory',
    ],
  },
];

export const GAMEPLAY_WALKTHROUGH = `
**Welcome to Asteroid Mining Sim!**

You are the CEO of a fledgling asteroid mining company. Your goal is to build a profitable operation by securing contracts, launching missions, and extracting valuable resources from asteroids.

**Getting Started:**
1. Click "Plan a Mission" to begin
2. Choose a contract from a vendor, or skip to select your own target
3. Select a target asteroid based on the resources you need
4. Choose a launch provider (balancing cost vs. reliability)
5. Select a crew type (robotic, small human, or large expedition)
6. Review costs and launch your mission

**Mission Phases:**
Your mission will progress through several phases. Click on any active mission to see its current status. Watch out for anomalies - they're rare but can end a mission early.

**Tips for Success:**
- Match asteroid types to contract resources (C-type for water, M-type for metals)
- Higher reliability providers and crews reduce anomaly risk
- Larger asteroids yield more resources but missions cost more
- Use the search box to find specific asteroids by name
`;

// Helper to get a random tip
export function getRandomTip(): Tip {
  const index = Math.floor(Math.random() * GAMEPLAY_TIPS.length);
  return GAMEPLAY_TIPS[index];
}

// Get current level based on missions completed
export function getCurrentLevel(missionsCompleted: number): ProgressionLevel {
  if (missionsCompleted >= 500) return PROGRESSION_LEVELS[3]; // Scattered Disc
  if (missionsCompleted >= 50) return PROGRESSION_LEVELS[2]; // Kuiper Belt
  if (missionsCompleted >= 10) return PROGRESSION_LEVELS[1]; // Inner Belt
  return PROGRESSION_LEVELS[0]; // Apollo and Amor
}
