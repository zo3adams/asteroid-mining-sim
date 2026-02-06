/**
 * News Ticker System
 * 
 * Manages game news items including:
 * - Critical notifications (pirate attacks, failures)
 * - Important updates (mission success, tech unlocks)
 * - Market news (price changes)
 * - Competitor actions (with game state effects)
 * - Educational/flavor content
 * - Easter eggs
 * 
 * @see news-ticker-content.md for full content specification
 */

/// <reference types="vite/client" />

import { ResourceType } from '../utils/Constants';

// News item types with priority (lower = higher priority)
export type NewsType = 'critical' | 'important' | 'market' | 'competitor' | 'educational' | 'flavor';

export interface NewsItem {
  id: string;
  text: string;
  type: NewsType;
  timestamp: number; // game time in days
  priority: number;
  // Optional: action triggered by this news
  action?: {
    type: 'block_asteroid' | 'price_change' | 'reputation_change';
    data: Record<string, unknown>;
  };
}

// Priority mapping (lower = higher priority, shown sooner)
export const NEWS_PRIORITY: Record<NewsType, number> = {
  critical: 0,
  important: 1,
  market: 2,
  competitor: 3,
  educational: 4,
  flavor: 5,
};

// Cooldowns in game days between news of each type
export const NEWS_COOLDOWNS: Record<NewsType, number> = {
  critical: 0,      // No cooldown - show immediately
  important: 0.5,   // ~12 game hours
  market: 1,        // ~1 game day
  competitor: 3.5,  // ~5 minutes real time at 1 week/sec (spec says 5 min)
  educational: 0.7, // ~1 per minute real time
  flavor: 1.4,      // ~1 per 2 minutes real time
};

// ============================================================================
// CONTENT: Educational/Space News (Gray)
// Appears randomly in feed, no more than one per minute.
// ============================================================================
export const EDUCATIONAL_NEWS: string[] = [
  "FUN FACT: Asteroid 16 Psyche may contain $10 quintillion in metal",
  "DID YOU KNOW: Main belt contains 1-2 million asteroids larger than 1km",
  "SCIENCE: C-type asteroids are the oldest objects in the solar system",
  "ASTRONOMY: Jupiter's gravity creates Kirkwood gaps in the asteroid belt",
  "HISTORY: First asteroid Ceres discovered in 1801 by Giuseppe Piazzi",
  "PHYSICS: Hohmann transfers are the most fuel-efficient orbital maneuvers",
  "SPACE: Communication with asteroid belt missions has 20+ minute delay",
  "FUN FACT: S-type asteroids are rich in silicates and metals",
  "SCIENCE: M-type asteroids are mostly iron and nickel - valuable for construction",
  "HISTORY: The term 'asteroid' means 'star-like' in Greek",
  "PHYSICS: Asteroids have very low gravity - jumping could launch you into orbit",
  "ASTRONOMY: The asteroid belt contains only 4% of the Moon's mass combined",
];

// ============================================================================
// CONTENT: Humorous Flavor Text (Gray)
// Appears randomly in feed, no more than one per every 2 minutes.
// ============================================================================
export const FLAVOR_NEWS: string[] = [
  "Mars colonists vote pineapple officially banned from space pizza",
  "Lunar tourist complains about 'false advertising' in low gravity wedding photos",
  "ISS crew reports coffee tastes 'weird' - investigation finds nothing unusual",
  "Asteroid named after celebrity already being mined by fans",
  "Space insurance rates drop to 'merely absurd' following quiet quarter",
  "Belt miner sets record for longest poker game - 14 months in transit",
  "Jovian moon colonists petition for time zone recognition",
  "Cosmic Jack's pirate crew spotted wearing surprisingly tasteful matching uniforms",
  "Edward Thatch denies retirement rumors, says 'still plenty of belts to plunder'",
  "Venture capitalists excited about 'Uber but for asteroid mining'",
  "Tech billionaire's personal asteroid mine 'not a tax dodge' says lawyer",
  "Space dating app launches 'orbital compatibility' matching algorithm",
  "Martian weather report: Dusty with a chance of dust",
  "Zero-G sports league announces 3D chess now requires actual 3D board",
  "Conspiracy theorist insists Pluto 'still a planet, wake up sheeple'",
  "Robot vendor recalls mining bots after 'overly enthusiastic drilling incidents'",
  "SpaceY announces reusable rockets will now be 'even more reusable'",
  "Astronomer discovers asteroid shaped exactly like a potato - names it 'Potato'",
  "Belt miner's cat becomes first feline to visit 100 asteroids",
];

// ============================================================================
// CONTENT: Competitor Names and Actions
// Trigger randomly every 5 minutes. If action is successful mine/outpost,
// player can no longer mine that asteroid.
// ============================================================================
export const COMPETITORS = [
  { name: 'Rock Lobster Industries', ceo: 'Kiki Lobster' },
  { name: 'Solar System Quarry and Drill', ceo: 'Reginald P. Stone' },
  { name: 'Belt Brothers Salvage', ceo: null },
  { name: 'Cosmic Extraction Corp', ceo: 'Luna Starfield' },
  { name: 'Deep Space Mining Co', ceo: null },
] as const;

export type CompetitorActionType = 
  | 'launch_swarm'      // Competitor launches mission - blocks asteroid
  | 'establish_outpost' // Competitor sets up permanent base - blocks asteroid
  | 'spotted_near'      // Competitor seen near location - warning only
  | 'ceo_statement'     // CEO makes public statement - flavor only
  | 'failed_delivery';  // Competitor failed - may affect market

export interface CompetitorAction {
  type: CompetitorActionType;
  blocksAsteroid: boolean;
  templates: string[];
}

export const COMPETITOR_ACTIONS: CompetitorAction[] = [
  {
    type: 'launch_swarm',
    blocksAsteroid: true,
    templates: [
      "{competitor} launches swarm to {asteroid} - no permits filed",
      "{competitor} begins mining operations at {asteroid}",
      "{competitor} claims exclusive rights to {asteroid}",
    ],
  },
  {
    type: 'establish_outpost',
    blocksAsteroid: true,
    templates: [
      "{competitor} sets up permanent outpost at {asteroid}",
      "{competitor} establishes mining base on {asteroid}",
    ],
  },
  {
    type: 'spotted_near',
    blocksAsteroid: false,
    templates: [
      "{competitor} spotted near {asteroid}",
      "{competitor} survey ships detected in {asteroid} vicinity",
    ],
  },
  {
    type: 'ceo_statement',
    blocksAsteroid: false,
    templates: [
      "{ceo} claims 'revolutionary nano-miner breakthrough' on social media",
      "{ceo} testifies before Congress on mining safety regulations",
      "{ceo} announces quarterly earnings beat expectations",
    ],
  },
  {
    type: 'failed_delivery',
    blocksAsteroid: false,
    templates: [
      "{competitor} failed to deliver on ESA contract - spot prices rising",
      "{competitor} mission to {asteroid} ends in failure",
    ],
  },
];

// ============================================================================
// CONTENT: Market News Templates
// Triggered by specific fluctuations in resource price (10-20% change)
// ============================================================================
export interface MarketNewsTemplate {
  resource: ResourceType;
  direction: 'up' | 'down';
  templates: string[];
}

export const MARKET_NEWS_TEMPLATES: MarketNewsTemplate[] = [
  // Water
  { resource: ResourceType.WATER, direction: 'up', templates: [
    "Water futures spike - space station consortium buying aggressively",
    "Water prices surge following life support system expansions",
  ]},
  { resource: ResourceType.WATER, direction: 'down', templates: [
    "Water prices fall as ice mining operations ramp up",
    "Comet harvest floods water market - prices tumble",
  ]},
  // Lithium
  { resource: ResourceType.LITHIUM, direction: 'up', templates: [
    "Lithium prices surge following Earth-side battery shortage",
    "Lithium demand spikes as orbital factories expand",
  ]},
  { resource: ResourceType.LITHIUM, direction: 'down', templates: [
    "Lithium oversupply crashes market prices",
    "New battery tech reduces lithium demand - prices fall",
  ]},
  // Platinum
  { resource: ResourceType.PLATINUM, direction: 'up', templates: [
    "Platinum prices surge on catalyst demand",
    "Platinum shortage drives prices to yearly highs",
  ]},
  { resource: ResourceType.PLATINUM, direction: 'down', templates: [
    "Platinum market crashes as competitor floods supply",
    "Platinum glut from main belt operations depresses prices",
  ]},
  // Iron
  { resource: ResourceType.IRON, direction: 'up', templates: [
    "Iron prices rise on orbital construction boom",
    "Station building drives iron demand higher",
  ]},
  { resource: ResourceType.IRON, direction: 'down', templates: [
    "Iron surplus from M-type asteroids weighs on prices",
    "Iron prices fall as supply exceeds demand",
  ]},
  // Nickel
  { resource: ResourceType.NICKEL, direction: 'up', templates: [
    "Nickel prices climb on battery alloy demand",
    "Nickel shortage reported - prices trending up",
  ]},
  { resource: ResourceType.NICKEL, direction: 'down', templates: [
    "Nickel market softens as stockpiles grow",
    "Nickel prices ease following large delivery",
  ]},
  // Gold
  { resource: ResourceType.GOLD, direction: 'up', templates: [
    "Gold prices rally as safe-haven demand increases",
    "Gold hits new highs on electronics demand",
  ]},
  { resource: ResourceType.GOLD, direction: 'down', templates: [
    "Gold prices retreat after asteroid discovery announcement",
    "Gold surplus depresses precious metals market",
  ]},
  // Rare Earth
  { resource: ResourceType.RARE_EARTH, direction: 'up', templates: [
    "Rare earth metals surge on tech sector demand",
    "Rare earth shortage threatens electronics production",
  ]},
  { resource: ResourceType.RARE_EARTH, direction: 'down', templates: [
    "Rare earth metals stabilize after volatile trading week",
    "Rare earth prices ease as new sources come online",
  ]},
  // Volatiles
  { resource: ResourceType.VOLATILES, direction: 'up', templates: [
    "Volatiles prices rise on fuel refinery demand",
    "Ammonia and methane prices spike - refueling stations buying",
  ]},
  { resource: ResourceType.VOLATILES, direction: 'down', templates: [
    "Volatiles market softens as C-type mining increases",
    "Fuel prices fall on abundant supply",
  ]},
];

// ============================================================================
// CONTENT: Easter Eggs & Special Messages
// Triggered by key in-game events, like a date or player status.
// ============================================================================
export interface EasterEgg {
  id: string;
  condition: (state: EasterEggState) => boolean;
  message: string;
  type: NewsType;
}

export interface EasterEggState {
  gameMonth: number;  // 1-12
  gameDay: number;    // 1-31
  missionsCompleted: number;
  balance: number;
  isFirstCheck: boolean; // True if this is entry to state
}

export const EASTER_EGGS: EasterEgg[] = [
  {
    id: 'april_fools',
    condition: (s) => s.gameMonth === 4 && s.gameDay === 1 && s.isFirstCheck,
    message: "Scientists confirm space is real, not elaborate prank",
    type: 'flavor',
  },
  {
    id: 'christmas',
    condition: (s) => s.gameMonth === 12 && s.gameDay === 25 && s.isFirstCheck,
    message: "NORAD tracks Santa's sleigh passing through asteroid belt",
    type: 'flavor',
  },
  {
    id: 'moon_landing',
    condition: (s) => s.gameMonth === 7 && s.gameDay === 20 && s.isFirstCheck,
    message: "Celebrating moon landing anniversary - 10% off lunar contracts today!",
    type: 'important',
  },
  {
    id: 'century_club',
    condition: (s) => s.missionsCompleted === 100 && s.isFirstCheck,
    message: "🎉 Century Club! You've completed 100 missions!",
    type: 'important',
  },
  {
    id: 'bankruptcy',
    condition: (s) => s.balance <= 0 && s.isFirstCheck,
    message: "Financial experts baffled by your 'bold strategy'",
    type: 'flavor',
  },
  {
    id: 'billionaire',
    condition: (s) => s.balance >= 1_000_000_000 && s.isFirstCheck,
    message: "🚀 BILLIONAIRE STATUS! Your company is now worth over $1 billion!",
    type: 'important',
  },
  {
    id: 'trillionaire',
    condition: (s) => s.balance >= 1_000_000_000_000 && s.isFirstCheck,
    message: "👑 TRILLIONAIRE! You've achieved the ultimate goal!",
    type: 'critical',
  },
];

// ============================================================================
// NEWS SYSTEM CLASS
// ============================================================================
export class NewsSystem {
  private lastNewsTime: Record<NewsType, number> = {
    critical: -Infinity,
    important: -Infinity,
    market: -Infinity,
    competitor: -Infinity,
    educational: -Infinity,
    flavor: -Infinity,
  };
  
  private triggeredEasterEggs: Set<string> = new Set();
  private blockedAsteroids: Set<string> = new Set();

  /**
   * Check if enough time has passed to show a news item of this type
   */
  canShowNews(type: NewsType, currentGameTime: number): boolean {
    const cooldown = NEWS_COOLDOWNS[type];
    const lastTime = this.lastNewsTime[type];
    return (currentGameTime - lastTime) >= cooldown;
  }

  /**
   * Record that news of this type was shown
   */
  recordNewsShown(type: NewsType, currentGameTime: number): void {
    this.lastNewsTime[type] = currentGameTime;
  }

  /**
   * Get a random educational news item
   */
  getEducationalNews(): string | null {
    if (EDUCATIONAL_NEWS.length === 0) return null;
    return EDUCATIONAL_NEWS[Math.floor(Math.random() * EDUCATIONAL_NEWS.length)];
  }

  /**
   * Get a random flavor news item
   */
  getFlavorNews(): string | null {
    if (FLAVOR_NEWS.length === 0) return null;
    return FLAVOR_NEWS[Math.floor(Math.random() * FLAVOR_NEWS.length)];
  }

  /**
   * Generate a competitor action news item
   * Returns the news text and whether it blocks an asteroid
   */
  generateCompetitorNews(availableAsteroids: string[]): { 
    text: string; 
    blocksAsteroid: boolean; 
    asteroidId?: string;
  } | null {
    // Pick random action type
    const action = COMPETITOR_ACTIONS[Math.floor(Math.random() * COMPETITOR_ACTIONS.length)];
    
    // Pick random competitor
    const competitor = COMPETITORS[Math.floor(Math.random() * COMPETITORS.length)];
    
    // Pick random template
    const template = action.templates[Math.floor(Math.random() * action.templates.length)];
    
    // Pick random asteroid if needed
    let asteroidId: string | undefined;
    let asteroidName = 'unknown location';
    
    if (template.includes('{asteroid}')) {
      // Filter to asteroids not already blocked
      const unblocked = availableAsteroids.filter(id => !this.blockedAsteroids.has(id));
      if (unblocked.length > 0) {
        asteroidId = unblocked[Math.floor(Math.random() * unblocked.length)];
        asteroidName = asteroidId; // Will be replaced with actual name by caller
      }
    }
    
    // Build the text
    let text = template
      .replace('{competitor}', competitor.name)
      .replace('{asteroid}', asteroidName)
      .replace('{ceo}', competitor.ceo || competitor.name);
    
    // If this action blocks the asteroid and we have one, mark it
    if (action.blocksAsteroid && asteroidId) {
      this.blockedAsteroids.add(asteroidId);
    }
    
    return {
      text,
      blocksAsteroid: action.blocksAsteroid && !!asteroidId,
      asteroidId,
    };
  }

  /**
   * Get market news for a price change
   */
  getMarketNews(resource: ResourceType, percentChange: number): string | null {
    const direction = percentChange > 0 ? 'up' : 'down';
    
    const templates = MARKET_NEWS_TEMPLATES.find(
      t => t.resource === resource && t.direction === direction
    );
    
    if (!templates || templates.templates.length === 0) return null;
    
    return templates.templates[Math.floor(Math.random() * templates.templates.length)];
  }

  /**
   * Check for easter eggs and return any that should trigger
   */
  checkEasterEggs(state: EasterEggState): NewsItem[] {
    const triggered: NewsItem[] = [];
    
    for (const egg of EASTER_EGGS) {
      if (this.triggeredEasterEggs.has(egg.id)) continue;
      
      if (egg.condition(state)) {
        this.triggeredEasterEggs.add(egg.id);
        triggered.push({
          id: `easter_${egg.id}_${Date.now()}`,
          text: egg.message,
          type: egg.type,
          timestamp: 0, // Will be filled by caller
          priority: NEWS_PRIORITY[egg.type],
        });
      }
    }
    
    return triggered;
  }

  /**
   * Check if an asteroid is blocked by competitor activity
   */
  isAsteroidBlocked(asteroidId: string): boolean {
    return this.blockedAsteroids.has(asteroidId);
  }

  /**
   * Get all blocked asteroids
   */
  getBlockedAsteroids(): string[] {
    return Array.from(this.blockedAsteroids);
  }

  /**
   * Reset easter egg state for a specific egg (e.g., after date changes)
   */
  resetEasterEgg(eggId: string): void {
    this.triggeredEasterEggs.delete(eggId);
  }

  /**
   * Serialize state for save/load
   */
  serialize(): Record<string, unknown> {
    return {
      lastNewsTime: this.lastNewsTime,
      triggeredEasterEggs: Array.from(this.triggeredEasterEggs),
      blockedAsteroids: Array.from(this.blockedAsteroids),
    };
  }

  /**
   * Deserialize state from save
   */
  deserialize(data: Record<string, unknown>): void {
    if (data.lastNewsTime) {
      this.lastNewsTime = data.lastNewsTime as Record<NewsType, number>;
    }
    if (data.triggeredEasterEggs) {
      this.triggeredEasterEggs = new Set(data.triggeredEasterEggs as string[]);
    }
    if (data.blockedAsteroids) {
      this.blockedAsteroids = new Set(data.blockedAsteroids as string[]);
    }
  }
}

// Singleton instance for use across the game
let newsSystemInstance: NewsSystem | null = null;

export function getNewsSystem(): NewsSystem {
  if (!newsSystemInstance) {
    newsSystemInstance = new NewsSystem();
  }
  return newsSystemInstance;
}

export function resetNewsSystem(): void {
  newsSystemInstance = new NewsSystem();
}

// Vite HMR: preserve NewsSystem state across hot module reloads
if (import.meta.hot) {
  import.meta.hot.accept();
  
  // Save state before module is replaced
  import.meta.hot.dispose((data: Record<string, unknown>) => {
    if (newsSystemInstance) {
      data.newsSystemState = newsSystemInstance.serialize();
    }
  });
  
  // Restore state after module is replaced (check for prior state)
  const priorState = import.meta.hot.data?.newsSystemState;
  if (priorState) {
    newsSystemInstance = new NewsSystem();
    newsSystemInstance.deserialize(priorState as ReturnType<NewsSystem['serialize']>);
  }
}
