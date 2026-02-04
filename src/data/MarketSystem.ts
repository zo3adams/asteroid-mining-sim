/**
 * Market System - Dynamic pricing for asteroid resources
 * Prices fluctuate weekly with news events explaining major changes
 */

import { ResourceType, RESOURCE_BASE_PRICES } from '../utils/Constants';

// Resource display info
export const RESOURCE_INFO: Record<ResourceType, { name: string; icon: string; volatility: number }> = {
  [ResourceType.WATER]: { name: 'Water Ice', icon: '💧', volatility: 0.40 },
  [ResourceType.LITHIUM]: { name: 'Lithium', icon: '🔋', volatility: 0.25 },
  [ResourceType.RARE_EARTH]: { name: 'Rare Earths', icon: '⚡', volatility: 0.20 },
  [ResourceType.PLATINUM]: { name: 'Platinum', icon: '💎', volatility: 0.15 },
  [ResourceType.GOLD]: { name: 'Gold', icon: '🥇', volatility: 0.15 },
  [ResourceType.IRON]: { name: 'Iron', icon: '🔩', volatility: 0.10 },
  [ResourceType.NICKEL]: { name: 'Nickel', icon: '⚙️', volatility: 0.12 },
  [ResourceType.VOLATILES]: { name: 'Volatiles', icon: '☁️', volatility: 0.35 },
};

// Price history entry
export interface PricePoint {
  time: number;      // Game time in days
  price: number;     // Price per ton
  change: number;    // Percent change from previous
}

// Market state for a single resource
export interface ResourceMarket {
  currentPrice: number;
  priceHistory: PricePoint[];
  lastUpdateTime: number;
}

// Full market state
export interface MarketState {
  resources: Record<ResourceType, ResourceMarket>;
  lastNewsTime: number;
}

// News event templates for price changes
const PRICE_UP_NEWS: Record<ResourceType, string[]> = {
  [ResourceType.WATER]: [
    'Mars colony expansion drives water demand up {pct}%',
    'Lunar base life support systems require more water - prices up {pct}%',
    'Hydrogen fuel production surge pushes water prices {pct}% higher',
  ],
  [ResourceType.LITHIUM]: [
    'New battery tech breakthrough - lithium prices surge {pct}%',
    'Orbital station energy storage needs spike lithium {pct}%',
    'Electric spacecraft demand drives lithium up {pct}%',
  ],
  [ResourceType.RARE_EARTH]: [
    'Advanced electronics shortage - rare earths up {pct}%',
    'Quantum computer production boosts rare earth prices {pct}%',
    'Magnet demand for ion drives pushes rare earths {pct}% higher',
  ],
  [ResourceType.PLATINUM]: [
    'Fuel cell demand drives platinum up {pct}%',
    'Catalyst shortage pushes platinum prices {pct}% higher',
    'Chemical processing expansion - platinum up {pct}%',
  ],
  [ResourceType.GOLD]: [
    'Radiation shielding demand pushes gold up {pct}%',
    'Electronics manufacturing surge - gold prices up {pct}%',
    'Orbital habitat construction drives gold {pct}% higher',
  ],
  [ResourceType.IRON]: [
    'Orbital construction boom - iron prices up {pct}%',
    'Space station expansion drives iron demand {pct}% higher',
    'Shipyard activity pushes iron prices up {pct}%',
  ],
  [ResourceType.NICKEL]: [
    'Spacecraft hull production surge - nickel up {pct}%',
    'Alloy demand for new vessels drives nickel {pct}% higher',
    'Defense contractor orders push nickel prices up {pct}%',
  ],
  [ResourceType.VOLATILES]: [
    'Propellant shortage drives volatiles up {pct}%',
    'Chemical feedstock demand pushes volatiles {pct}% higher',
    'Deep space mission prep surges volatile prices {pct}%',
  ],
};

const PRICE_DOWN_NEWS: Record<ResourceType, string[]> = {
  [ResourceType.WATER]: [
    'Europa ice discovery floods market - water down {pct}%',
    'Comet capture delivers water surplus - prices drop {pct}%',
    'Recycling breakthrough reduces water demand {pct}%',
  ],
  [ResourceType.LITHIUM]: [
    'New fusion tech crashes lithium prices {pct}%',
    'Solid-state battery breakthrough - lithium drops {pct}%',
    'Lithium asteroid discovery floods market {pct}%',
  ],
  [ResourceType.RARE_EARTH]: [
    'Synthetic rare earth production cuts prices {pct}%',
    'Recycling tech reduces rare earth demand {pct}%',
    'New deposits discovered - rare earths fall {pct}%',
  ],
  [ResourceType.PLATINUM]: [
    'Alternative catalyst discovered - platinum drops {pct}%',
    'Platinum-rich asteroid find crashes prices {pct}%',
    'Fuel cell efficiency gains reduce platinum need {pct}%',
  ],
  [ResourceType.GOLD]: [
    'Gold-laden asteroid discovery - prices plummet {pct}%',
    'New shielding materials reduce gold demand {pct}%',
    'Electronics miniaturization cuts gold use {pct}%',
  ],
  [ResourceType.IRON]: [
    'Lunar mining operations flood iron market {pct}%',
    'Construction slowdown drops iron prices {pct}%',
    'Composite materials reduce iron demand {pct}%',
  ],
  [ResourceType.NICKEL]: [
    'Nickel asteroid discovery crashes prices {pct}%',
    'New alloys reduce nickel requirements {pct}%',
    'Recycling surge drops nickel demand {pct}%',
  ],
  [ResourceType.VOLATILES]: [
    'Titan atmospheric harvest floods volatile market {pct}%',
    'New synthesis process drops volatile prices {pct}%',
    'Propellant efficiency gains reduce demand {pct}%',
  ],
};

/**
 * Initialize market state with base prices
 */
export function initializeMarket(gameTime: number = 0): MarketState {
  const resources = {} as Record<ResourceType, ResourceMarket>;
  
  for (const resource of Object.values(ResourceType)) {
    const basePrice = RESOURCE_BASE_PRICES[resource];
    // Start with some initial variance (±10%)
    const initialVariance = 0.9 + Math.random() * 0.2;
    const startPrice = Math.round(basePrice * initialVariance);
    
    resources[resource] = {
      currentPrice: startPrice,
      priceHistory: [{
        time: gameTime,
        price: startPrice,
        change: 0,
      }],
      lastUpdateTime: gameTime,
    };
  }
  
  return {
    resources,
    lastNewsTime: gameTime,
  };
}

/**
 * Update market prices based on elapsed time
 * Returns array of news events to announce
 */
export function updateMarketPrices(
  market: MarketState, 
  currentTime: number
): { market: MarketState; newsEvents: string[] } {
  const WEEK_IN_DAYS = 7;
  const newsEvents: string[] = [];
  
  // Check each resource for updates
  for (const resource of Object.values(ResourceType)) {
    const resourceMarket = market.resources[resource];
    const daysSinceUpdate = currentTime - resourceMarket.lastUpdateTime;
    
    // Update weekly
    if (daysSinceUpdate >= WEEK_IN_DAYS) {
      const weeksElapsed = Math.floor(daysSinceUpdate / WEEK_IN_DAYS);
      
      for (let w = 0; w < weeksElapsed; w++) {
        const info = RESOURCE_INFO[resource];
        const basePrice = RESOURCE_BASE_PRICES[resource];
        
        // Calculate price change based on volatility
        // Range: -volatility to +volatility (e.g., -40% to +40% for water)
        const maxChange = info.volatility;
        const change = (Math.random() * 2 - 1) * maxChange;
        
        // Apply change but keep price within 50%-200% of base
        const oldPrice = resourceMarket.currentPrice;
        let newPrice = Math.round(oldPrice * (1 + change));
        newPrice = Math.max(basePrice * 0.5, Math.min(basePrice * 2, newPrice));
        
        const actualChange = (newPrice - oldPrice) / oldPrice;
        const updateTime = resourceMarket.lastUpdateTime + (w + 1) * WEEK_IN_DAYS;
        
        // Record in history (keep last 52 weeks / 1 year)
        resourceMarket.priceHistory.push({
          time: updateTime,
          price: newPrice,
          change: actualChange,
        });
        if (resourceMarket.priceHistory.length > 52) {
          resourceMarket.priceHistory.shift();
        }
        
        resourceMarket.currentPrice = newPrice;
        resourceMarket.lastUpdateTime = updateTime;
        
        // Generate news for significant changes (>15%)
        if (Math.abs(actualChange) > 0.15) {
          const pct = Math.abs(Math.round(actualChange * 100));
          const templates = actualChange > 0 ? PRICE_UP_NEWS[resource] : PRICE_DOWN_NEWS[resource];
          const template = templates[Math.floor(Math.random() * templates.length)];
          const news = template.replace('{pct}', pct.toString());
          newsEvents.push(`📊 ${news}`);
        }
      }
    }
  }
  
  return { market, newsEvents };
}

/**
 * Get current spot price for a resource
 */
export function getSpotPrice(market: MarketState, resource: ResourceType): number {
  return market.resources[resource].currentPrice;
}

/**
 * Get contract price (spot + premium for guaranteed buyer)
 * Contracts pay 10-25% above spot price
 */
export function getContractPrice(market: MarketState, resource: ResourceType): number {
  const spotPrice = getSpotPrice(market, resource);
  const premium = 1.1 + Math.random() * 0.15; // 10-25% premium
  return Math.round(spotPrice * premium);
}

/**
 * Get price trend indicator
 */
export function getPriceTrend(market: MarketState, resource: ResourceType): 'up' | 'down' | 'stable' {
  const history = market.resources[resource].priceHistory;
  if (history.length < 2) return 'stable';
  
  // Compare current to 4-week average
  const recent = history.slice(-4);
  const avgPrice = recent.reduce((sum, p) => sum + p.price, 0) / recent.length;
  const currentPrice = market.resources[resource].currentPrice;
  
  const pctDiff = (currentPrice - avgPrice) / avgPrice;
  if (pctDiff > 0.1) return 'up';
  if (pctDiff < -0.1) return 'down';
  return 'stable';
}

/**
 * Get formatted price string
 */
export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}K`;
  }
  return `$${price}`;
}

/**
 * Get all resources sorted by current price (descending)
 */
export function getResourcesByPrice(market: MarketState): ResourceType[] {
  return Object.values(ResourceType).sort(
    (a, b) => market.resources[b].currentPrice - market.resources[a].currentPrice
  );
}

/**
 * Calculate total value of a resource haul
 */
export function calculateHaulValue(
  market: MarketState, 
  resources: Partial<Record<ResourceType, number>>
): number {
  let total = 0;
  for (const [resource, amount] of Object.entries(resources)) {
    if (amount && amount > 0) {
      total += getSpotPrice(market, resource as ResourceType) * amount;
    }
  }
  return total;
}
