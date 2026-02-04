/**
 * Ownable Assets System
 * Players can purchase vehicles, equipment, and robotic crews instead of renting
 * Unlocks at Level 2+
 */

// Asset categories
export type AssetCategory = 'vehicle' | 'equipment' | 'crew';

// Base interface for all ownable assets
export interface OwnableAsset {
  id: string;
  name: string;
  category: AssetCategory;
  description: string;
  purchaseCost: number;       // One-time purchase price
  rentalCost: number;         // Cost per mission if renting
  breakEvenMissions: number;  // Missions to break even vs renting
  unlockLevel: number;        // Minimum player level to purchase
  
  // Gameplay stats
  payloadCapacity?: number;   // For vehicles: kg capacity
  reliability?: number;       // 0-1 success rate modifier
  efficiency?: number;        // Mining efficiency multiplier
  requiredPayload?: number;   // Payload space needed (for crews)
}

// Vehicle assets (replace launch providers for owned missions)
export const OWNABLE_VEHICLES: OwnableAsset[] = [
  {
    id: 'light_freighter',
    name: 'Light Freighter',
    category: 'vehicle',
    description: 'Compact vessel for small asteroid runs. Low capacity but efficient.',
    purchaseCost: 20_000_000,
    rentalCost: 2_000_000,
    breakEvenMissions: 10,
    unlockLevel: 2,
    payloadCapacity: 10_000,
    reliability: 0.94,
  },
  {
    id: 'heavy_hauler',
    name: 'Heavy Hauler',
    category: 'vehicle',
    description: 'Industrial workhorse. Great capacity for large payloads.',
    purchaseCost: 80_000_000,
    rentalCost: 8_000_000,
    breakEvenMissions: 10,
    unlockLevel: 2,
    payloadCapacity: 25_000,
    reliability: 0.92,
  },
  {
    id: 'deep_space_vessel',
    name: 'Deep Space Vessel',
    category: 'vehicle',
    description: 'Long-range explorer. Required for distant asteroid belt missions.',
    purchaseCost: 200_000_000,
    rentalCost: 25_000_000,
    breakEvenMissions: 8,
    unlockLevel: 3,
    payloadCapacity: 35_000,
    reliability: 0.96,
  },
];

// Equipment assets (reduce mission costs)
export const OWNABLE_EQUIPMENT: OwnableAsset[] = [
  {
    id: 'basic_drill_rig',
    name: 'Basic Drill Rig',
    category: 'equipment',
    description: 'Standard percussion drilling system. Gets the job done.',
    purchaseCost: 5_000_000,
    rentalCost: 500_000,
    breakEvenMissions: 10,
    unlockLevel: 2,
    efficiency: 1.0,
  },
  {
    id: 'industrial_extractor',
    name: 'Industrial Extractor',
    category: 'equipment',
    description: 'Heavy-duty mining equipment with improved yield.',
    purchaseCost: 25_000_000,
    rentalCost: 2_000_000,
    breakEvenMissions: 12,
    unlockLevel: 2,
    efficiency: 1.15,
  },
  {
    id: 'plasma_mining_array',
    name: 'Plasma Mining Array',
    category: 'equipment',
    description: 'Cutting-edge extraction tech. Maximum resource yield.',
    purchaseCost: 100_000_000,
    rentalCost: 10_000_000,
    breakEvenMissions: 10,
    unlockLevel: 3,
    efficiency: 1.35,
  },
];

// Crew assets (robotic crews that can be purchased)
export const OWNABLE_CREWS: OwnableAsset[] = [
  {
    id: 'mining_bots_basic',
    name: 'Mining Bots (Basic)',
    category: 'crew',
    description: 'Entry-level autonomous mining drones. Reliable and cheap to operate.',
    purchaseCost: 8_000_000,
    rentalCost: 800_000,
    breakEvenMissions: 10,
    unlockLevel: 2,
    efficiency: 0.6,
    reliability: 0.85,
    requiredPayload: 2000,
  },
  {
    id: 'mining_bots_advanced',
    name: 'Mining Bots (Advanced)',
    category: 'crew',
    description: 'AI-enhanced mining systems with improved decision making.',
    purchaseCost: 30_000_000,
    rentalCost: 3_000_000,
    breakEvenMissions: 10,
    unlockLevel: 2,
    efficiency: 0.9,
    reliability: 0.90,
    requiredPayload: 3000,
  },
  {
    id: 'autonomous_mining_fleet',
    name: 'Autonomous Mining Fleet',
    category: 'crew',
    description: 'Fully autonomous swarm mining operation. Near-human efficiency.',
    purchaseCost: 150_000_000,
    rentalCost: 12_000_000,
    breakEvenMissions: 12,
    unlockLevel: 3,
    efficiency: 1.2,
    reliability: 0.92,
    requiredPayload: 5000,
  },
];

// All ownable assets combined
export const ALL_OWNABLE_ASSETS: OwnableAsset[] = [
  ...OWNABLE_VEHICLES,
  ...OWNABLE_EQUIPMENT,
  ...OWNABLE_CREWS,
];

// Helper functions

/**
 * Get asset by ID
 */
export function getAssetById(id: string): OwnableAsset | undefined {
  return ALL_OWNABLE_ASSETS.find(a => a.id === id);
}

/**
 * Get assets by category
 */
export function getAssetsByCategory(category: AssetCategory): OwnableAsset[] {
  return ALL_OWNABLE_ASSETS.filter(a => a.category === category);
}

/**
 * Get assets available at a given level
 */
export function getAssetsForLevel(level: number): OwnableAsset[] {
  return ALL_OWNABLE_ASSETS.filter(a => a.unlockLevel <= level);
}

/**
 * Calculate total savings from owning an asset over N missions
 */
export function calculateOwnershipSavings(asset: OwnableAsset, missions: number): number {
  const rentalTotal = asset.rentalCost * missions;
  const ownershipTotal = asset.purchaseCost;
  return rentalTotal - ownershipTotal;
}

/**
 * Check if player can afford an asset
 */
export function canAffordAsset(asset: OwnableAsset, balance: number): boolean {
  return balance >= asset.purchaseCost;
}

/**
 * Get mission cost reduction when using owned assets
 * Returns 0 if player doesn't own the asset (they pay rental)
 */
export function getOwnedAssetCostReduction(
  ownedAssets: string[],
  assetId: string
): number {
  const asset = getAssetById(assetId);
  if (!asset) return 0;
  
  if (ownedAssets.includes(assetId)) {
    return asset.rentalCost; // Full rental cost is saved
  }
  return 0;
}

// Category display info
export const CATEGORY_INFO: Record<AssetCategory, { name: string; icon: string; description: string }> = {
  vehicle: {
    name: 'Vehicles',
    icon: '🚀',
    description: 'Spacecraft for transporting crews and cargo to asteroids',
  },
  equipment: {
    name: 'Mining Equipment',
    icon: '⛏️',
    description: 'Tools and machinery for extracting resources',
  },
  crew: {
    name: 'Robotic Crews',
    icon: '🤖',
    description: 'Autonomous mining systems that replace human crews',
  },
};
