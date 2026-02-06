/**
 * NASA JPL Small-Body Database API Client
 * Fetches real asteroid data and estimates resources
 * 
 * NOTE: Due to CORS restrictions, asteroid data is bundled as static JSON.
 * The API fetching is only used as a fallback for dynamic lookups.
 */

import { ResourceType } from '../utils/Constants';
import staticAsteroidData from './asteroid-data.json';

export interface AsteroidInfo {
  id: string;
  name: string;
  fullName: string;
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  diameter: number | null; // km
  mass: number | null; // kg (estimated)
  albedo: number | null;
  taxonomicClass: string; // e.g., "C", "S", "M"
  absoluteMagnitude: number;
}

// Resource yield from an asteroid
export interface AsteroidResources {
  [ResourceType.WATER]: number;
  [ResourceType.IRON]: number;
  [ResourceType.NICKEL]: number;
  [ResourceType.PLATINUM]: number;
  [ResourceType.GOLD]: number;
  [ResourceType.RARE_EARTH]: number;
  [ResourceType.LITHIUM]: number;
  [ResourceType.VOLATILES]: number;
}

// Asteroid type information for mining
export interface AsteroidTypeInfo {
  description: string;
  miningValue: string;
  contents: string;
  rarity: string;
  // Resource percentages (fraction of extractable mass)
  resourceYields: Partial<Record<ResourceType, number>>;
}

// Asteroid taxonomic type to resource mapping
// Percentages are fraction of total extractable mass that is each resource
export const ASTEROID_TYPE_INFO: Record<string, AsteroidTypeInfo> = {
  C: {
    description: 'Carbonaceous',
    miningValue: 'Fuel, life support, chemistry feedstock',
    contents: 'Water-bearing clays, carbon compounds, organics, ammonia, sulfur, trace metals',
    rarity: 'Very common',
    resourceYields: {
      [ResourceType.WATER]: 0.40,
      [ResourceType.VOLATILES]: 0.35,
      [ResourceType.IRON]: 0.10,
      [ResourceType.NICKEL]: 0.05,
      [ResourceType.RARE_EARTH]: 0.02,
    },
  },
  S: {
    description: 'Silicaceous',
    miningValue: 'Structural metals & construction material',
    contents: 'Silicates (olivine/pyroxene), iron-nickel grains, Mg, Al, rock-forming minerals',
    rarity: 'Common',
    resourceYields: {
      [ResourceType.IRON]: 0.35,
      [ResourceType.NICKEL]: 0.20,
      [ResourceType.WATER]: 0.05,
      [ResourceType.RARE_EARTH]: 0.05,
      [ResourceType.PLATINUM]: 0.01,
    },
  },
  Q: {
    description: 'Q-type (fresh silicaceous)',
    miningValue: 'High-efficiency metal extraction',
    contents: 'Fresh S-type rock, cleaner metal fractions, less weathered silicates',
    rarity: 'Uncommon',
    resourceYields: {
      [ResourceType.IRON]: 0.40,
      [ResourceType.NICKEL]: 0.25,
      [ResourceType.PLATINUM]: 0.02,
      [ResourceType.GOLD]: 0.01,
      [ResourceType.RARE_EARTH]: 0.08,
    },
  },
  M: {
    description: 'Metallic',
    miningValue: 'High-value metals',
    contents: 'Iron, nickel, cobalt, trace platinum-group metals',
    rarity: 'Rare',
    resourceYields: {
      [ResourceType.IRON]: 0.50,
      [ResourceType.NICKEL]: 0.30,
      [ResourceType.PLATINUM]: 0.05,
      [ResourceType.GOLD]: 0.03,
      [ResourceType.RARE_EARTH]: 0.02,
    },
  },
  D: {
    description: 'D-type (dark/primitive)',
    miningValue: 'Volatiles & exotic organics',
    contents: 'Carbon-rich material, ices, primitive organic compounds',
    rarity: 'Uncommon (outer system)',
    resourceYields: {
      [ResourceType.VOLATILES]: 0.45,
      [ResourceType.WATER]: 0.30,
      [ResourceType.RARE_EARTH]: 0.03,
      [ResourceType.LITHIUM]: 0.02,
    },
  },
  P: {
    description: 'P-type (primitive)',
    miningValue: 'Bulk volatiles & primitive chemistry',
    contents: 'Dark carbonaceous material, ammonia, water ice, early solar compounds',
    rarity: 'Uncommon',
    resourceYields: {
      [ResourceType.WATER]: 0.35,
      [ResourceType.VOLATILES]: 0.40,
      [ResourceType.LITHIUM]: 0.03,
      [ResourceType.RARE_EARTH]: 0.02,
    },
  },
  V: {
    description: 'Vestoid (basaltic)',
    miningValue: 'Advanced ceramics & aerospace materials',
    contents: 'Basaltic rock, pyroxene, igneous crust minerals',
    rarity: 'Rare',
    resourceYields: {
      [ResourceType.IRON]: 0.25,
      [ResourceType.RARE_EARTH]: 0.15,
      [ResourceType.NICKEL]: 0.10,
      [ResourceType.LITHIUM]: 0.05,
    },
  },
  E: {
    description: 'Enstatite',
    miningValue: 'Exotic industrial minerals',
    contents: 'Enstatite-rich rock, unusual reduced minerals',
    rarity: 'Ultra rare',
    resourceYields: {
      [ResourceType.RARE_EARTH]: 0.20,
      [ResourceType.IRON]: 0.30,
      [ResourceType.NICKEL]: 0.15,
      [ResourceType.PLATINUM]: 0.03,
      [ResourceType.LITHIUM]: 0.08,
    },
  },
};

/**
 * Estimate diameter from absolute magnitude (H) using standard formula
 * D = 1329 / sqrt(albedo) * 10^(-H/5) km
 * Uses typical albedo of 0.15 if not provided
 */
export function estimateDiameterFromMagnitude(H: number, albedo: number | null = null): number {
  const p = albedo ?? 0.15; // Default albedo
  return 1329 / Math.sqrt(p) * Math.pow(10, -H / 5);
}

/**
 * Estimate mass from diameter assuming spherical shape and typical density
 * Density varies by type: C-type ~1.3 g/cm³, S-type ~2.7 g/cm³, M-type ~5.3 g/cm³
 */
export function estimateMassFromDiameter(diameterKm: number, taxonomicClass: string = 'S'): number {
  // Density in kg/m³
  const densities: Record<string, number> = {
    'C': 1300,
    'D': 1200,
    'P': 1200,
    'S': 2700,
    'Q': 2700,
    'V': 3500,
    'M': 5300,
    'E': 3000,
  };
  const density = densities[taxonomicClass.toUpperCase().charAt(0)] || 2000;
  
  const radiusM = (diameterKm * 1000) / 2;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  return volumeM3 * density;
}

/**
 * Estimate extractable resources from an asteroid
 * @param taxonomicClass - Asteroid type (C, S, M, etc.) or null for random
 * @param diameterKm - Diameter in km, or null for random (5-50 km)
 * @param massKg - Mass in kg, or null to estimate from diameter
 * @returns Resource quantities in kg
 */
export function estimateAsteroidResources(
  taxonomicClass: string | null,
  diameterKm: number | null,
  massKg: number | null = null
): AsteroidResources {
  // Default/random values if not provided
  const type = taxonomicClass?.toUpperCase().charAt(0) || ['C', 'S', 'M'][Math.floor(Math.random() * 3)];
  const diameter = diameterKm ?? (5 + Math.random() * 45); // 5-50 km
  
  // Calculate mass if not provided (assume spherical, density ~2000 kg/m³)
  let mass = massKg;
  if (!mass) {
    const radiusM = (diameter * 1000) / 2;
    const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
    mass = volumeM3 * 2000; // kg
  }
  
  // Extractable fraction depends on efficiency (~0.1% baseline)
  const extractableMass = mass * 0.001;
  
  // Get type info (default to S-type if unknown)
  const typeInfo = ASTEROID_TYPE_INFO[type] || ASTEROID_TYPE_INFO['S'];
  
  // Calculate resource yields
  const resources: AsteroidResources = {
    [ResourceType.WATER]: 0,
    [ResourceType.IRON]: 0,
    [ResourceType.NICKEL]: 0,
    [ResourceType.PLATINUM]: 0,
    [ResourceType.GOLD]: 0,
    [ResourceType.RARE_EARTH]: 0,
    [ResourceType.LITHIUM]: 0,
    [ResourceType.VOLATILES]: 0,
  };
  
  for (const [resource, fraction] of Object.entries(typeInfo.resourceYields)) {
    if (fraction) {
      // Add some randomness (±20%)
      const variance = 0.8 + Math.random() * 0.4;
      resources[resource as ResourceType] = Math.round(extractableMass * fraction * variance);
    }
  }
  
  return resources;
}

/**
 * Get the primary resources for an asteroid type
 * Returns resources sorted by yield (highest first)
 */
export function getPrimaryResourcesForType(taxonomicClass: string): ResourceType[] {
  const type = taxonomicClass?.toUpperCase().charAt(0) || 'S';
  const typeInfo = ASTEROID_TYPE_INFO[type] || ASTEROID_TYPE_INFO['S'];
  
  return Object.entries(typeInfo.resourceYields)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .map(([resource]) => resource as ResourceType);
}

/**
 * Get asteroid types that are good sources for a specific resource
 * Returns types sorted by yield (best first)
 */
export function getTypesForResource(resource: ResourceType): string[] {
  const typeYields: { type: string; yield: number }[] = [];
  
  for (const [type, info] of Object.entries(ASTEROID_TYPE_INFO)) {
    const yieldFraction = info.resourceYields[resource];
    if (yieldFraction && yieldFraction > 0) {
      typeYields.push({ type, yield: yieldFraction });
    }
  }
  
  return typeYields
    .sort((a, b) => b.yield - a.yield)
    .map(t => t.type);
}

export class AsteroidDataFetcher {
  private static readonly API_BASE = 'https://ssd-api.jpl.nasa.gov/sbdb.api';
  private static readonly CACHE_KEY = 'asteroid_cache';
  private static readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Fetch asteroid data from NASA JPL API
   */
  public static async fetchAsteroid(designation: string): Promise<AsteroidInfo | null> {
    try {
      // Include phys-par to get diameter, mass, and other physical parameters
      const url = `${this.API_BASE}?des=${encodeURIComponent(designation)}&phys-par=1`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Failed to fetch asteroid ${designation}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return this.parseAsteroidData(data);
    } catch (error) {
      console.error(`Error fetching asteroid ${designation}:`, error);
      return null;
    }
  }

  private static parseAsteroidData(data: any): AsteroidInfo | null {
    try {
      const orbit = data.orbit;
      const physParArray = data.phys_par || [];
      
      // Build a map of physical parameters for easy lookup
      const phys: Record<string, any> = {};
      for (const param of physParArray) {
        phys[param.name] = param.value;
      }

      // Determine taxonomic class
      let taxonomicClass = 'S'; // Default to S-type
      if (phys.spec_T || phys.spec_B) {
        const classStr = (phys.spec_T || phys.spec_B || '').toUpperCase();
        if (classStr.startsWith('C')) taxonomicClass = 'C';
        else if (classStr.startsWith('M')) taxonomicClass = 'M';
        else if (classStr.startsWith('S')) taxonomicClass = 'S';
        else if (classStr.startsWith('Q')) taxonomicClass = 'Q';
        else if (classStr.startsWith('V')) taxonomicClass = 'V';
        else if (classStr.startsWith('D')) taxonomicClass = 'D';
        else if (classStr.startsWith('P')) taxonomicClass = 'P';
        else if (classStr.startsWith('E')) taxonomicClass = 'E';
      }

      // Get albedo
      const albedo = phys.albedo ? parseFloat(phys.albedo) : null;

      // Get H (absolute magnitude) from physical params or orbit elements
      const hMag = phys.H 
        ? parseFloat(phys.H) 
        : parseFloat(orbit.elements?.find((e: any) => e.name === 'H')?.value || '15');

      // Get diameter - use measured value or estimate from H magnitude
      let diameter: number | null = null;
      if (phys.diameter) {
        diameter = parseFloat(phys.diameter);
      } else {
        // Estimate from absolute magnitude
        diameter = estimateDiameterFromMagnitude(hMag, albedo);
      }

      // Estimate mass from diameter and type
      const mass = diameter ? estimateMassFromDiameter(diameter, taxonomicClass) : null;

      return {
        id: data.object.shortname || data.object.des,
        name: data.object.shortname || data.object.des,
        fullName: data.object.fullname,
        semiMajorAxis: parseFloat(orbit.elements.find((e: any) => e.name === 'a')?.value || '2.5'),
        eccentricity: parseFloat(orbit.elements.find((e: any) => e.name === 'e')?.value || '0.1'),
        inclination: parseFloat(orbit.elements.find((e: any) => e.name === 'i')?.value || '5'),
        diameter: diameter,
        mass: mass,
        albedo: albedo,
        taxonomicClass: taxonomicClass,
        absoluteMagnitude: hMag,
      };
    } catch (error) {
      console.error('Error parsing asteroid data:', error);
      return null;
    }
  }

  /**
   * Get list of asteroid IDs for initial game load
   * Returns first 36 asteroids for performance - more are loaded as player progresses
   * Full dataset of ~1000 asteroids is available in staticAsteroidData
   */
  public static getDefaultAsteroids(): string[] {
    // Only load first 36 for initial rendering performance
    // Additional asteroids will be loaded as player mines existing ones
    const INITIAL_ASTEROID_COUNT = 36;
    return (staticAsteroidData as AsteroidInfo[])
      .slice(0, INITIAL_ASTEROID_COUNT)
      .map(a => a.id);
  }

  /**
   * Get total count of available asteroids in the dataset
   */
  public static getTotalAsteroidCount(): number {
    return (staticAsteroidData as AsteroidInfo[]).length;
  }

  /**
   * Load multiple asteroids - uses bundled static data to avoid CORS issues
   */
  public static async loadAsteroids(
    designations: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<AsteroidInfo[]> {
    const results: AsteroidInfo[] = [];
    
    // Create a map of static data for quick lookup
    const staticDataMap = new Map<string, AsteroidInfo>();
    for (const asteroid of staticAsteroidData as AsteroidInfo[]) {
      staticDataMap.set(asteroid.id, asteroid);
    }
    
    // Load from static data first (no CORS issues)
    for (let i = 0; i < designations.length; i++) {
      const des = designations[i];
      if (onProgress) onProgress(i + 1, designations.length);
      
      const staticAsteroid = staticDataMap.get(des);
      if (staticAsteroid) {
        results.push(staticAsteroid);
      }
    }
    
    console.log(`Loaded ${results.length} asteroids from bundled data`);
    return results;
  }

  /**
   * Load asteroids with API fallback (for dynamic lookups like search)
   * This may fail due to CORS on production servers
   */
  public static async loadAsteroidsWithApiFallback(
    designations: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<AsteroidInfo[]> {
    const cache = this.loadCache();
    const results: AsteroidInfo[] = [];
    const toFetch: string[] = [];
    
    // Create a map of static data for quick lookup
    const staticDataMap = new Map<string, AsteroidInfo>();
    for (const asteroid of staticAsteroidData as AsteroidInfo[]) {
      staticDataMap.set(asteroid.id, asteroid);
    }

    // Check static data and cache first
    for (const des of designations) {
      const staticAsteroid = staticDataMap.get(des);
      if (staticAsteroid) {
        results.push(staticAsteroid);
      } else if (cache[des]) {
        results.push(cache[des]);
      } else {
        toFetch.push(des);
      }
    }

    // Fetch missing asteroids from API (may fail due to CORS)
    for (let i = 0; i < toFetch.length; i++) {
      const des = toFetch[i];
      if (onProgress) onProgress(i + 1, toFetch.length);

      try {
        const asteroid = await this.fetchAsteroid(des);
        if (asteroid) {
          results.push(asteroid);
          cache[des] = asteroid;
        }
      } catch (error) {
        console.warn(`Could not fetch asteroid ${des} (CORS?):`, error);
      }

      // Rate limiting: wait 100ms between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Save cache
    this.saveCache(cache);

    return results;
  }

  private static loadCache(): Record<string, AsteroidInfo> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return {};

      const data = JSON.parse(cached);
      const age = Date.now() - (data.timestamp || 0);

      if (age > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return {};
      }

      return data.asteroids || {};
    } catch {
      return {};
    }
  }

  private static saveCache(cache: Record<string, AsteroidInfo>): void {
    try {
      localStorage.setItem(
        this.CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          asteroids: cache,
        })
      );
    } catch (error) {
      console.warn('Failed to save asteroid cache:', error);
    }
  }

  /**
   * Generate mock asteroid data for testing/fallback
   */
  public static generateMockAsteroid(id: string, name: string): AsteroidInfo {
    const types: Array<'C' | 'S' | 'M'> = ['C', 'S', 'M'];
    const type = types[Math.floor(Math.random() * types.length)];
    const diameter = Math.random() * 50 + 5; // 5-55 km
    const mass = estimateMassFromDiameter(diameter, type);

    return {
      id,
      name,
      fullName: `${id} ${name}`,
      semiMajorAxis: 2.0 + Math.random() * 2.0, // 2-4 AU (main belt)
      eccentricity: Math.random() * 0.3,
      inclination: Math.random() * 30,
      diameter: diameter,
      mass: mass,
      albedo: type === 'C' ? 0.05 + Math.random() * 0.1 : 0.15 + Math.random() * 0.2,
      taxonomicClass: type,
      absoluteMagnitude: 12 + Math.random() * 8,
    };
  }
}

/**
 * Calculate the current distance from Earth to an asteroid based on orbital positions.
 * Uses the rendered positions (angles) to determine if asteroid is near or far.
 * 
 * @param asteroid - The asteroid info with orbital elements
 * @param gameTimeDays - Game time in days since start (Jan 1, 2032)
 * @param asteroidAngle - Current orbital angle of asteroid in radians (from renderer)
 * @param earthAngle - Current orbital angle of Earth in radians (from renderer)
 * @returns Object with current distance, min possible, and max possible distances in AU
 */
export function calculateDistanceFromEarth(
  asteroid: AsteroidInfo,
  gameTimeDays: number,
  asteroidAngle?: number | null,
  earthAngle?: number
): { current: number; min: number; max: number; isNear: boolean } {
  const a = asteroid.semiMajorAxis;
  const e = asteroid.eccentricity;
  
  // Calculate perihelion and aphelion
  const perihelion = a * (1 - e);
  const aphelion = a * (1 + e);
  
  // Calculate min distance from Earth (simplified)
  let minDistance: number;
  if (perihelion < 1 && aphelion > 1) {
    // Earth-crossing asteroid - can get very close
    // Min is roughly how close the orbits get
    minDistance = Math.min(Math.abs(perihelion - 1), Math.abs(aphelion - 1)) * 0.2;
    minDistance = Math.max(minDistance, 0.01); // At least 0.01 AU
  } else if (perihelion >= 1) {
    // Entirely outside Earth's orbit
    minDistance = perihelion - 1;
  } else {
    // Entirely inside Earth's orbit
    minDistance = 1 - aphelion;
  }
  
  // Max distance from Earth (asteroid at aphelion, Earth on opposite side of Sun)
  const maxDistance = aphelion + 1;
  
  let isNear: boolean;
  
  // If we have actual rendered positions, use the angle difference
  if (asteroidAngle !== undefined && asteroidAngle !== null && earthAngle !== undefined) {
    // Calculate angular separation (0 to π)
    let angleDiff = Math.abs(asteroidAngle - earthAngle);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }
    
    // If angular separation < 90° (π/2), they're on same side = near
    // If angular separation > 90°, they're on opposite sides = far
    isNear = angleDiff < Math.PI / 2;
  } else {
    // Fallback to synodic period calculation
    const asteroidPeriodDays = Math.pow(a, 1.5) * 365.25;
    const earthPeriodDays = 365.25;
    const synodicPeriod = 1 / Math.abs(1/earthPeriodDays - 1/asteroidPeriodDays);
    const phase = (gameTimeDays % synodicPeriod) / synodicPeriod;
    isNear = phase < 0.25 || phase > 0.75;
  }
  
  const current = isNear ? minDistance : maxDistance;
  
  return { current, min: minDistance, max: maxDistance, isNear };
}

/**
 * Result of asteroid match scoring for mission planning
 */
export interface AsteroidMatchResult {
  asteroid: AsteroidInfo;
  matchPercent: number;
  hasResource: boolean;
  rawScore: number;
}

/**
 * Calculate match percentages for asteroids against a contract's resource type.
 * 
 * Logic:
 * 1. Filter asteroids by whether their type contains the resource
 * 2. Score matching asteroids: rawScore = typeScore × sizeScore
 * 3. Normalize scores to 20-90% range
 * 4. Non-matching asteroids get 1% and only shown if < 5 matches
 * 
 * @param asteroids - List of available asteroids
 * @param resourceType - The resource type from the contract
 * @returns Scored and sorted asteroid list
 */
export function calculateAsteroidMatches(
  asteroids: AsteroidInfo[],
  resourceType: ResourceType
): AsteroidMatchResult[] {
  const goodTypes = getTypesForResource(resourceType);
  
  // Separate matching vs non-matching asteroids
  const matching: { asteroid: AsteroidInfo; rawScore: number }[] = [];
  const nonMatching: AsteroidInfo[] = [];
  
  for (const asteroid of asteroids) {
    const typeIndex = goodTypes.indexOf(asteroid.taxonomicClass);
    const hasResource = typeIndex >= 0;
    
    if (hasResource) {
      // Type score: higher rank = higher score (best = 1.0)
      const typeScore = (goodTypes.length - typeIndex) / goodTypes.length;
      // Size score: larger asteroids score higher, capped at 1.0
      const sizeScore = asteroid.diameter ? Math.min(asteroid.diameter / 50, 1) : 0.3;
      // Raw score = multiplicative combination
      const rawScore = 1.0 * typeScore * sizeScore;
      matching.push({ asteroid, rawScore });
    } else {
      nonMatching.push(asteroid);
    }
  }
  
  const results: AsteroidMatchResult[] = [];
  
  // Normalize matching asteroids to 20-90% range
  if (matching.length > 0) {
    const scores = matching.map(m => m.rawScore);
    const minRaw = Math.min(...scores);
    const maxRaw = Math.max(...scores);
    const range = maxRaw - minRaw || 1; // Avoid division by zero
    
    for (const { asteroid, rawScore } of matching) {
      const normalized = (rawScore - minRaw) / range;
      const matchPercent = Math.round(20 + normalized * 70); // 20% to 90%
      results.push({ asteroid, matchPercent, hasResource: true, rawScore });
    }
  }
  
  // Sort by matchPercent descending
  results.sort((a, b) => b.matchPercent - a.matchPercent);
  
  // If fewer than 5 matching, add non-matching at 1%
  if (results.length < 5 && nonMatching.length > 0) {
    const needed = 5 - results.length;
    const toAdd = nonMatching.slice(0, needed).map(asteroid => ({
      asteroid,
      matchPercent: 1,
      hasResource: false,
      rawScore: 0,
    }));
    results.push(...toAdd);
  }
  
  return results;
}
