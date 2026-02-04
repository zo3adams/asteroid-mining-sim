/**
 * Storage Depot System
 * Players can purchase orbital depots to store mined resources
 * Unlocks at Level 3+
 */

import { ResourceType } from '../utils/Constants';

// Storage depot definition
export interface StorageDepot {
  id: string;
  name: string;
  location: string;
  description: string;
  purchaseCost: number;
  capacity: number;           // Total tons capacity
  travelTimeFromEarth: number; // Days
  securityRisk: string;       // Description of pirate risk
  unlockLevel: number;
}

// Available storage depots
export const STORAGE_DEPOTS: StorageDepot[] = [
  {
    id: 'leo_depot',
    name: 'LEO Storage Hub',
    location: 'Low Earth Orbit',
    description: 'Compact orbital warehouse in low Earth orbit. Quick access but limited space.',
    purchaseCost: 10_000_000,
    capacity: 5_000,
    travelTimeFromEarth: 0,
    securityRisk: 'None',
    unlockLevel: 3,
  },
  {
    id: 'geo_depot',
    name: 'GEO Warehouse',
    location: 'Geostationary Orbit',
    description: 'Medium-capacity depot in stable geostationary orbit.',
    purchaseCost: 25_000_000,
    capacity: 15_000,
    travelTimeFromEarth: 1,
    securityRisk: 'None',
    unlockLevel: 3,
  },
  {
    id: 'lunar_l2',
    name: 'Lunar L2 Station',
    location: 'Earth-Moon L2 Point',
    description: 'Strategic position beyond the Moon. Good capacity with minimal risk.',
    purchaseCost: 50_000_000,
    capacity: 25_000,
    travelTimeFromEarth: 3,
    securityRisk: 'None',
    unlockLevel: 3,
  },
  {
    id: 'belt_depot',
    name: 'Belt Transfer Station',
    location: 'Asteroid Belt Orbit',
    description: 'Massive capacity close to mining operations. Exposed to pirate activity.',
    purchaseCost: 100_000_000,
    capacity: 50_000,
    travelTimeFromEarth: 120, // Average
    securityRisk: 'Level 4+ pirates',
    unlockLevel: 4,
  },
];

// Stored resources in a depot
export interface StoredResources {
  [ResourceType.WATER]: number;
  [ResourceType.IRON]: number;
  [ResourceType.NICKEL]: number;
  [ResourceType.PLATINUM]: number;
  [ResourceType.GOLD]: number;
  [ResourceType.RARE_EARTH]: number;
  [ResourceType.LITHIUM]: number;
  [ResourceType.VOLATILES]: number;
}

// Create empty storage record
export function createEmptyStorage(): StoredResources {
  return {
    [ResourceType.WATER]: 0,
    [ResourceType.IRON]: 0,
    [ResourceType.NICKEL]: 0,
    [ResourceType.PLATINUM]: 0,
    [ResourceType.GOLD]: 0,
    [ResourceType.RARE_EARTH]: 0,
    [ResourceType.LITHIUM]: 0,
    [ResourceType.VOLATILES]: 0,
  };
}

// Depot instance (allows multiple of same type)
export interface DepotInstance {
  depotTypeId: string;        // Reference to STORAGE_DEPOTS
  count: number;              // Number of this depot type owned
  contents: StoredResources;  // Aggregated storage for all instances of this type
}

// Player's storage state - now supports multiple depots of same type
export interface StorageState {
  depots: Record<string, DepotInstance>;  // Key is depot type ID
}

// Initialize empty storage state
export function initializeStorage(): StorageState {
  return {
    depots: {},
  };
}

// Helper functions

/**
 * Get depot by ID
 */
export function getDepotById(id: string): StorageDepot | undefined {
  return STORAGE_DEPOTS.find(d => d.id === id);
}

/**
 * Get depots available at a given level
 */
export function getDepotsForLevel(level: number): StorageDepot[] {
  return STORAGE_DEPOTS.filter(d => d.unlockLevel <= level);
}

/**
 * Calculate total stored tons in a depot
 */
export function getDepotUsedCapacity(contents: StoredResources): number {
  return Object.values(contents).reduce((sum, amount) => sum + amount, 0);
}

/**
 * Get total capacity for a depot instance (count * base capacity)
 */
export function getInstanceTotalCapacity(depotTypeId: string, count: number): number {
  const depot = getDepotById(depotTypeId);
  return (depot?.capacity || 0) * count;
}

/**
 * Calculate remaining capacity for a depot instance
 */
export function getInstanceRemainingCapacity(depotTypeId: string, instance: DepotInstance): number {
  const totalCapacity = getInstanceTotalCapacity(depotTypeId, instance.count);
  const used = getDepotUsedCapacity(instance.contents);
  return Math.max(0, totalCapacity - used);
}

/**
 * Get total storage capacity across all owned depots (new model)
 */
export function getTotalStorageCapacityNew(storage: StorageState): number {
  return Object.entries(storage.depots).reduce((total, [depotTypeId, instance]) => {
    return total + getInstanceTotalCapacity(depotTypeId, instance.count);
  }, 0);
}

/**
 * Get total stored resources across all depots (new model)
 */
export function getTotalStoredResourcesNew(storage: StorageState): StoredResources {
  const total = createEmptyStorage();
  
  for (const instance of Object.values(storage.depots)) {
    for (const resource of Object.values(ResourceType)) {
      total[resource] += instance.contents[resource] || 0;
    }
  }
  
  return total;
}

/**
 * Get total tons stored across all depots (new model)
 */
export function getTotalStoredTonsNew(storage: StorageState): number {
  const totals = getTotalStoredResourcesNew(storage);
  return getDepotUsedCapacity(totals);
}

/**
 * Check if player owns any depots
 */
export function hasAnyDepots(storage: StorageState): boolean {
  return Object.keys(storage.depots).length > 0;
}

/**
 * Get count of a specific depot type owned
 */
export function getDepotCount(storage: StorageState, depotTypeId: string): number {
  return storage.depots[depotTypeId]?.count || 0;
}

// Legacy compatibility functions
export function getTotalStorageCapacity(ownedDepots: string[]): number {
  return ownedDepots.reduce((total, depotId) => {
    const depot = getDepotById(depotId);
    return total + (depot?.capacity || 0);
  }, 0);
}

export function getTotalStoredTons(depotContents: Record<string, StoredResources>): number {
  let total = 0;
  for (const contents of Object.values(depotContents)) {
    total += getDepotUsedCapacity(contents);
  }
  return total;
}

/**
 * Add resources to a depot (returns overflow if any)
 */
export function addResourcesToDepot(
  depot: StorageDepot,
  contents: StoredResources,
  resource: ResourceType,
  amount: number
): { stored: number; overflow: number; newContents: StoredResources } {
  const used = getDepotUsedCapacity(contents);
  const remaining = Math.max(0, depot.capacity - used);
  const stored = Math.min(amount, remaining);
  const overflow = amount - stored;
  
  const newContents = { ...contents };
  newContents[resource] = (newContents[resource] || 0) + stored;
  
  return { stored, overflow, newContents };
}

/**
 * Remove resources from a depot
 */
export function removeResourcesFromDepot(
  contents: StoredResources,
  resource: ResourceType,
  amount: number
): { removed: number; newContents: StoredResources } {
  const available = contents[resource] || 0;
  const removed = Math.min(amount, available);
  
  const newContents = { ...contents };
  newContents[resource] = available - removed;
  
  return { removed, newContents };
}

/**
 * Format capacity display (e.g., "2,500 / 5,000 tons")
 */
export function formatCapacity(used: number, total: number): string {
  return `${used.toLocaleString()} / ${total.toLocaleString()} tons`;
}

/**
 * Get capacity percentage
 */
export function getCapacityPercent(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}
