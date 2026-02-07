/**
 * Mission Planning Types and Data
 */

import { ResourceType, RESOURCE_BASE_PRICES } from '../utils/Constants';
import { MarketState, getContractPrice } from '../data/MarketSystem';

// Contract offered by vendors
export interface Contract {
  id: string;
  vendorName: string;
  resourceType: ResourceType;
  quantityTons: number; // tons requested
  pricePerTon: number; // $/ton offered
  totalValue: number;
  deadline: number; // game days
  description: string;
}

// Generate random contracts for the player to choose from
// If market is provided, uses market prices + premium; otherwise uses base prices with variance
export function generateContracts(count: number = 4, market?: MarketState): Contract[] {
  const vendors = [
    'Lunar Industries',
    'Mars Colonial Authority',
    'Orbital Dynamics Corp',
    'Deep Space Mining Co',
    'Stellar Resources Ltd',
    'Asteroid Ventures Inc',
  ];
  
  const contracts: Contract[] = [];
  const usedResources = new Set<ResourceType>();
  
  for (let i = 0; i < count; i++) {
    // Pick a resource type we haven't used yet (for variety)
    let resourceType: ResourceType;
    const allResources = Object.values(ResourceType);
    do {
      resourceType = allResources[Math.floor(Math.random() * allResources.length)];
    } while (usedResources.has(resourceType) && usedResources.size < allResources.length);
    usedResources.add(resourceType);
    
    // Generate quantity based on resource type
    const baseQuantity = resourceType === ResourceType.PLATINUM || resourceType === ResourceType.GOLD
      ? 50 + Math.floor(Math.random() * 150) // 50-200 tons for precious
      : 500 + Math.floor(Math.random() * 2000); // 500-2500 tons for common
    
    // Price: use market price with contract premium, or base price with variance
    let pricePerTon: number;
    if (market) {
      pricePerTon = getContractPrice(market, resourceType);
    } else {
      const basePrice = RESOURCE_BASE_PRICES[resourceType];
      const priceVariance = 0.7 + Math.random() * 0.6;
      pricePerTon = Math.round(basePrice * priceVariance);
    }
    
    // Deadline based on distance/difficulty
    const deadline = 60 + Math.floor(Math.random() * 180); // 60-240 days
    
    contracts.push({
      id: `contract-${Date.now()}-${i}`,
      vendorName: vendors[Math.floor(Math.random() * vendors.length)],
      resourceType,
      quantityTons: baseQuantity,
      pricePerTon,
      totalValue: baseQuantity * pricePerTon,
      deadline,
      description: getResourceDescription(resourceType),
    });
  }
  
  return contracts;
}

function getResourceDescription(resource: ResourceType): string {
  const descriptions: Record<ResourceType, string> = {
    [ResourceType.WATER]: 'Essential for life support and hydrogen fuel production',
    [ResourceType.IRON]: 'Primary construction material for orbital infrastructure',
    [ResourceType.NICKEL]: 'Key alloy component for spacecraft hulls',
    [ResourceType.PLATINUM]: 'Catalyst for fuel cells and chemical processes',
    [ResourceType.GOLD]: 'Electronics and radiation shielding applications',
    [ResourceType.RARE_EARTH]: 'Critical for advanced electronics and magnets',
    [ResourceType.LITHIUM]: 'Battery production for energy storage systems',
    [ResourceType.VOLATILES]: 'Chemical feedstock and propellant production',
  };
  return descriptions[resource];
}

// Launch Provider definitions

// Launch Provider definitions
export interface LaunchProvider {
  id: string;
  name: string;
  description: string;
  costPerKg: number; // $/kg to orbit
  payloadCapacity: number; // kg
  reliability: number; // 0-1 probability of success
  launchFrequency: string; // descriptive
}

export const LAUNCH_PROVIDERS: LaunchProvider[] = [
  {
    id: 'spacey',
    name: 'SpaceY',
    description: 'Reliable workhorse with reusable rockets',
    costPerKg: 2500,
    payloadCapacity: 22000,
    reliability: 0.97,
    launchFrequency: 'Weekly',
  },
  {
    id: 'ula',
    name: 'ULA',
    description: 'Premium service with perfect safety record',
    costPerKg: 5500,
    payloadCapacity: 28000,
    reliability: 0.995,
    launchFrequency: 'Monthly',
  },
  {
    id: 'rocketforge',
    name: 'RocketForge',
    description: 'Budget option for small payloads',
    costPerKg: 1800,
    payloadCapacity: 8000,
    reliability: 0.92,
    launchFrequency: 'Bi-weekly',
  },
  {
    id: 'bluegenesis',
    name: 'Blue Genesis',
    description: 'Balanced performance and cost',
    costPerKg: 3200,
    payloadCapacity: 18000,
    reliability: 0.95,
    launchFrequency: 'Weekly',
  },
];

// Crew Type definitions
export interface CrewType {
  id: string;
  name: string;
  description: string;
  dailyCost: number; // $/day
  miningEfficiency: number; // multiplier (1.0 = baseline)
  reliability: number; // 0-1 probability of no issues
  requiredPayload: number; // kg needed for crew/equipment
}

export const CREW_TYPES: CrewType[] = [
  {
    id: 'robotic',
    name: 'Robotic Crew',
    description: 'Autonomous mining bots. Slow but cheap.',
    dailyCost: 5000,
    miningEfficiency: 0.6,
    reliability: 0.85,
    requiredPayload: 2000,
  },
  {
    id: 'small_human',
    name: 'Small Human Crew',
    description: '3-person team with good flexibility.',
    dailyCost: 25000,
    miningEfficiency: 1.0,
    reliability: 0.92,
    requiredPayload: 5000,
  },
  {
    id: 'large_expedition',
    name: 'Large Expedition',
    description: '8-person team for maximum output.',
    dailyCost: 75000,
    miningEfficiency: 1.8,
    reliability: 0.88,
    requiredPayload: 12000,
  },
];

// Mission Status (legacy - keeping for compatibility)
export enum MissionStatus {
  PLANNING = 'planning',
  OUTBOUND = 'outbound',
  MINING = 'mining',
  RETURNING = 'returning',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Mission Phases (new detailed phase system)
export enum MissionPhase {
  CONTRACT_SIGNED = 'contract_signed',
  LAUNCH = 'launch',
  LAUNCH_ANOMALY = 'launch_anomaly',
  OUTBOUND = 'outbound',
  PIRATE_ATTACK_OUTBOUND = 'pirate_attack_outbound',
  IN_FLIGHT_ANOMALY = 'in_flight_anomaly',
  DRILLING = 'drilling',
  EXPLOSION_AT_DRILL_SITE = 'explosion_at_drill_site',
  INBOUND = 'inbound',
  PIRATE_ATTACK_INBOUND = 'pirate_attack_inbound',
  DELIVERING_PAYLOAD = 'delivering_payload',
  MISSION_SUCCESS = 'mission_success',
  // New terminal states for pirate outcomes
  PIRATES_DEFEATED = 'pirates_defeated',
  PIRATES_WON = 'pirates_won',
  PAYLOAD_SEIZED = 'payload_seized',
}

// Phase metadata
export interface PhaseInfo {
  name: string;
  image: string;
  description: string;
  isTerminal: boolean;
  isSuccess: boolean; // Only relevant for terminal states
  // Next phases with base probabilities (before reliability modifiers)
  nextPhases: { phase: MissionPhase; baseProbability: number }[];
}

export const PHASE_INFO: Record<MissionPhase, PhaseInfo> = {
  [MissionPhase.CONTRACT_SIGNED]: {
    name: 'Contract Signed',
    image: '/images/mission_phase_01_contract_signed.png',
    description: "You've secured this contract. Crew and launch vehicle readiness are pending.",
    isTerminal: false,
    isSuccess: false,
    nextPhases: [{ phase: MissionPhase.LAUNCH, baseProbability: 1.0 }],
  },
  [MissionPhase.LAUNCH]: {
    name: 'Launch',
    image: '/images/mission_phase_02_launch.png',
    description: 'Wet dress rehearsal is complete. Vehicle is on the pad and ready to launch in 5...4...3...2...',
    isTerminal: false,
    isSuccess: false,
    nextPhases: [
      { phase: MissionPhase.OUTBOUND, baseProbability: 0.98 },
      { phase: MissionPhase.LAUNCH_ANOMALY, baseProbability: 0.02 },
    ],
  },
  [MissionPhase.LAUNCH_ANOMALY]: {
    name: 'Launch Anomaly',
    image: '/images/mission_phase_03_launch_anomoly.png',
    description: "Launch abort - mission is scrubbed and the crew's lives depend on the launch abort system.",
    isTerminal: true,
    isSuccess: false,
    nextPhases: [],
  },
  [MissionPhase.OUTBOUND]: {
    name: 'Outbound',
    image: '/images/mission_phase_04_outbound.png',
    description: 'Crew and mining rig are outbound to target and preparing to drill in zero-G.',
    isTerminal: false,
    isSuccess: false,
    nextPhases: [
      { phase: MissionPhase.DRILLING, baseProbability: 0.98 },
      { phase: MissionPhase.IN_FLIGHT_ANOMALY, baseProbability: 0.02 },
    ],
  },
  [MissionPhase.IN_FLIGHT_ANOMALY]: {
    name: 'In Flight Anomaly',
    image: '/images/vehicle_anomoly.png',
    description: 'An anomaly has occurred during flight - crew and all hardware have been lost.',
    isTerminal: true,
    isSuccess: false,
    nextPhases: [],
  },
  [MissionPhase.DRILLING]: {
    name: 'Drilling',
    image: '/images/mission_phase_06_drilling.png',
    description: 'Crew is assessing and preparing to extract resources.',
    isTerminal: false,
    isSuccess: false,
    nextPhases: [
      { phase: MissionPhase.INBOUND, baseProbability: 0.98 },
      { phase: MissionPhase.EXPLOSION_AT_DRILL_SITE, baseProbability: 0.02 },
    ],
  },
  [MissionPhase.EXPLOSION_AT_DRILL_SITE]: {
    name: 'Explosion At Drill Site',
    image: '/images/mission_phase_07_explosion_at_drill_site.png',
    description: 'An anomaly has occurred while drilling - we are trying to make contact with the crew.',
    isTerminal: true,
    isSuccess: false,
    nextPhases: [],
  },
  [MissionPhase.INBOUND]: {
    name: 'Inbound',
    image: '/images/mission_phase_08_in_bound.png',
    description: 'Crew is returning with payload.',
    isTerminal: false,
    isSuccess: false,
    nextPhases: [
      { phase: MissionPhase.DELIVERING_PAYLOAD, baseProbability: 0.98 },
      { phase: MissionPhase.IN_FLIGHT_ANOMALY, baseProbability: 0.02 },
    ],
  },
  [MissionPhase.DELIVERING_PAYLOAD]: {
    name: 'Delivering Payload',
    image: '/images/mission_phase_09_delivering_payload.png',
    description: 'Crew has returned and is delivering payload to client.',
    isTerminal: false,
    isSuccess: false,
    nextPhases: [{ phase: MissionPhase.MISSION_SUCCESS, baseProbability: 1.0 }],
  },
  [MissionPhase.MISSION_SUCCESS]: {
    name: 'Mission Success',
    image: '/images/mission_phase_10_mission_success.png',
    description: 'Mission Success - pay day!',
    isTerminal: true,
    isSuccess: true,
    nextPhases: [],
  },
  // Pirate encounter phases
  [MissionPhase.PIRATE_ATTACK_OUTBOUND]: {
    name: 'Pirate Attack!',
    image: '/images/mission_phase_pirate_attack.png',
    description: 'Pirates have intercepted our outbound vessel! Prepare for combat!',
    isTerminal: false,
    isSuccess: false,
    nextPhases: [], // Resolved by combat system, not probability
  },
  [MissionPhase.PIRATE_ATTACK_INBOUND]: {
    name: 'Pirate Ambush!',
    image: '/images/mission_phase_pirate_attack.png',
    description: 'Pirates are attempting to board and seize the payload!',
    isTerminal: false,
    isSuccess: false,
    nextPhases: [], // Resolved by combat system, not probability
  },
  [MissionPhase.PIRATES_DEFEATED]: {
    name: 'Pirates Defeated',
    image: '/images/mission_phase_pirates_defeated.png',
    description: 'Security forces repelled the pirate attack! Mission continues.',
    isTerminal: false, // Not terminal - mission continues
    isSuccess: false,
    nextPhases: [], // Set dynamically based on where attack occurred
  },
  [MissionPhase.PIRATES_WON]: {
    name: 'Pirates Won',
    image: '/images/mission_phase_pirates_won.png',
    description: 'The pirates have overwhelmed our defenses. All hands lost.',
    isTerminal: true,
    isSuccess: false,
    nextPhases: [],
  },
  [MissionPhase.PAYLOAD_SEIZED]: {
    name: 'Payload Seized',
    image: '/images/mission_phase_payload_seized.png',
    description: 'We fought them off but they escaped with the cargo. Crew is safe.',
    isTerminal: true,
    isSuccess: false, // Partial failure - no payout but crew survives
    nextPhases: [],
  },
};

// Calculate phase duration based on mission parameters
export function calculatePhaseDuration(
  phase: MissionPhase,
  outboundDays: number,
  miningDays: number,
  returnDays: number,
  launchFrequency: string
): number {
  switch (phase) {
    case MissionPhase.CONTRACT_SIGNED:
      // 1 week to 6 months based on launch frequency
      if (launchFrequency === 'Weekly') return 7 + Math.random() * 14; // 1-3 weeks
      if (launchFrequency === 'Bi-weekly') return 14 + Math.random() * 30; // 2-6 weeks
      if (launchFrequency === 'Monthly') return 30 + Math.random() * 150; // 1-6 months
      return 14 + Math.random() * 30;
    case MissionPhase.LAUNCH:
      return 1 + Math.random() * 2; // 1-3 days
    case MissionPhase.OUTBOUND:
      return outboundDays;
    case MissionPhase.DRILLING:
      return miningDays;
    case MissionPhase.INBOUND:
      return returnDays;
    case MissionPhase.DELIVERING_PAYLOAD:
      return 2 + Math.random() * 5; // 2-7 days
    // Pirate phases
    case MissionPhase.PIRATE_ATTACK_OUTBOUND:
    case MissionPhase.PIRATE_ATTACK_INBOUND:
      return 1 + Math.random(); // 1-2 days combat
    case MissionPhase.PIRATES_DEFEATED:
      return 1; // 1 day to regroup
    default:
      return 0; // Terminal states have no duration
  }
}

// Roll for next phase with reliability modifiers
export function rollNextPhase(
  currentPhase: MissionPhase,
  providerReliability: number,
  crewReliability: number
): MissionPhase {
  const phaseInfo = PHASE_INFO[currentPhase];
  if (phaseInfo.isTerminal || phaseInfo.nextPhases.length === 0) {
    return currentPhase;
  }

  // Calculate combined reliability modifier
  // Higher reliability = lower anomaly chance
  const reliabilityModifier = (providerReliability + crewReliability) / 2;

  const roll = Math.random();
  let cumulative = 0;

  for (const next of phaseInfo.nextPhases) {
    let probability = next.baseProbability;

    // Modify anomaly probabilities based on reliability
    const isAnomaly = PHASE_INFO[next.phase].isTerminal && !PHASE_INFO[next.phase].isSuccess;
    if (isAnomaly) {
      // Reduce anomaly chance based on reliability (e.g., 0.98 reliability = 0.02 * (1 - 0.98) = ~0.0004 anomaly chance reduction)
      probability = probability * (1 - reliabilityModifier + 0.5); // Scale so perfect reliability halves anomaly chance
      probability = Math.max(0.001, probability); // Minimum 0.1% chance
    } else {
      // Increase success chance accordingly
      const anomalyReduction = phaseInfo.nextPhases
        .filter(p => PHASE_INFO[p.phase].isTerminal && !PHASE_INFO[p.phase].isSuccess)
        .reduce((sum, p) => sum + p.baseProbability * (reliabilityModifier - 0.5), 0);
      probability = Math.min(1, probability + anomalyReduction);
    }

    cumulative += probability;
    if (roll < cumulative) {
      return next.phase;
    }
  }

  // Fallback to first option
  return phaseInfo.nextPhases[0].phase;
}

// Active Mission
export interface Mission {
  id: string;
  asteroidId: string;
  asteroidName: string;
  providerId: string;
  providerName: string;
  crewId: string;
  crewName: string;
  
  // Crew metadata (generated at mission creation)
  captainName: string;
  
  // Contract info (if any)
  contractId?: string;
  contractVendorName?: string; // Vendor who issued the contract
  contractValue?: number; // Base payout from contract
  contractDeadline?: number; // Contract deadline in days from mission start
  resourceType?: string; // Primary resource being mined
  isSpecFreeMining?: boolean; // True if mining without a contract (store to depot)
  targetDepotId?: string; // Depot to store resources (for spec-free mining)
  
  // Mission distance (for speed calculations)
  distanceAU: number; // Distance to asteroid in AU
  
  // Timing
  launchTime: number; // game time (days since start)
  outboundDuration: number; // days
  miningDuration: number; // days
  returnDuration: number; // days
  totalDuration: number; // days
  
  // Costs
  launchCost: number;
  crewCost: number;
  totalCost: number;
  
  // Progress (legacy)
  status: MissionStatus;
  progress: number; // 0-1 overall progress
  
  // Phase tracking (new)
  currentPhase: MissionPhase;
  phaseStartTime: number; // game time when current phase started
  phaseDuration: number; // duration of current phase in days
  phaseJustChanged: boolean; // flag to trigger UI flash
  
  // Reliability (for phase transitions)
  providerReliability: number;
  crewReliability: number;
  
  // Security (Level 3+)
  securityId?: string;       // ID of hired security contractor
  securityCost?: number;     // Cost of security
  
  // Results (filled on completion)
  resourcesGained?: number; // tons
  revenue?: number;
  
  // Expected payload (calculated at mission start)
  expectedPayload?: number; // tons
  
  // Delivery destination (randomly chosen at mission start)
  deliveryDestination: 'LEO' | 'GEO' | 'Lunar';
  
  // Combat results (if pirate encounter)
  combatResult?: {
    outcome: string;
    narrative: string;
  };
}

// Captain names for mission crews
const CAPTAIN_FIRST_NAMES = [
  'James', 'Sarah', 'Marcus', 'Elena', 'Chen', 'Yuki', 'Dmitri', 'Amara',
  'Raj', 'Astrid', 'Miguel', 'Fatima', 'Oleg', 'Priya', 'Hassan', 'Ingrid',
  'Kwame', 'Lena', 'Viktor', 'Zara', 'Anders', 'Kenji', 'Nadia', 'Pavel'
];

const CAPTAIN_LAST_NAMES = [
  'Chen', 'Rodriguez', 'Nakamura', 'Okonkwo', 'Petrov', 'Singh', 'Mueller',
  'Okafor', 'Kim', 'Santos', 'Volkov', 'Johansson', 'Tanaka', 'Patel',
  'Andersen', 'Kowalski', 'Yamamoto', 'Jensen', 'Ivanov', 'Reyes', 'Larsson'
];

/**
 * Generate a random captain name
 */
export function generateCaptainName(): string {
  const firstName = CAPTAIN_FIRST_NAMES[Math.floor(Math.random() * CAPTAIN_FIRST_NAMES.length)];
  const lastName = CAPTAIN_LAST_NAMES[Math.floor(Math.random() * CAPTAIN_LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Calculate vehicle speed from distance and duration
 * Returns speed in km/s and as percentage of light speed
 */
export function calculateVehicleSpeed(
  distanceAU: number,
  durationDays: number
): { kmPerSecond: number; percentLightSpeed: number } {
  const AU_IN_KM = 149597870.7; // 1 AU in kilometers
  const LIGHT_SPEED_KM_S = 299792.458; // Speed of light in km/s
  const SECONDS_PER_DAY = 86400;
  
  const distanceKm = distanceAU * AU_IN_KM;
  const durationSeconds = durationDays * SECONDS_PER_DAY;
  
  const kmPerSecond = distanceKm / durationSeconds;
  const percentLightSpeed = (kmPerSecond / LIGHT_SPEED_KM_S) * 100;
  
  return { kmPerSecond, percentLightSpeed };
}

// Mission calculation helpers
export function calculateMissionDuration(
  distanceAU: number, 
  travelTimeModifier: number = 1.0
): {
  outbound: number;
  mining: number;
  return: number;
  total: number;
} {
  // Simplified calculation: ~100 days per AU one-way (future tech = 2x faster than current)
  // Mining time scales with distance (more fuel = less mining time available)
  // Apply tech modifier to travel times (not mining)
  const baseOutbound = Math.round((distanceAU * 50 + 15) * travelTimeModifier); // 15 days minimum
  const miningDays = Math.round(30 + distanceAU * 10); // 30-80 days (unaffected by propulsion)
  const returnDays = Math.round((distanceAU * 50 + 15) * travelTimeModifier); // Same formula as outbound
  
  return {
    outbound: Math.max(baseOutbound, 5), // Minimum 5 days outbound
    mining: miningDays,
    return: Math.max(returnDays, 5), // Minimum 5 days return
    total: Math.max(baseOutbound, 5) + miningDays + Math.max(returnDays, 5),
  };
}

export function calculateMissionCost(
  provider: LaunchProvider,
  crew: CrewType,
  durationDays: number,
  crewCostModifier: number = 1.0
): {
  launchCost: number;
  crewCost: number;
  totalCost: number;
} {
  const launchCost = provider.costPerKg * crew.requiredPayload;
  const crewCost = Math.round(crew.dailyCost * durationDays * crewCostModifier);
  
  return {
    launchCost,
    crewCost,
    totalCost: launchCost + crewCost,
  };
}

// Estimate potential resource yield based on asteroid properties
export function estimateResourceYield(
  diameterKm: number | null,
  taxonomicClass: string,
  crewEfficiency: number,
  massKg: number | null = null
): number {
  if (!diameterKm && !massKg) return 0;
  
  // Use provided mass or estimate from diameter
  let mass: number;
  if (massKg) {
    mass = massKg;
  } else if (diameterKm) {
    // Estimate mass from diameter (assume ~2000 kg/m³ default density)
    const radiusKm = diameterKm / 2;
    const volumeKm3 = (4 / 3) * Math.PI * Math.pow(radiusKm, 3);
    const volumeM3 = volumeKm3 * 1e9;
    mass = volumeM3 * 2000;
  } else {
    return 0;
  }
  
  const massTons = mass / 1000;
  
  // Extractable percentage based on type
  let extractionRate = 0.001; // 0.1% baseline
  if (taxonomicClass === 'M') extractionRate = 0.003; // Metal-rich
  if (taxonomicClass === 'C') extractionRate = 0.002; // Carbonaceous
  if (taxonomicClass === 'S') extractionRate = 0.0015; // Silicate
  if (taxonomicClass === 'Q') extractionRate = 0.002; // Fresh silicate
  if (taxonomicClass === 'V') extractionRate = 0.0018; // Vestoid
  
  const baseYield = massTons * extractionRate;
  
  // Apply crew efficiency and cap at reasonable amount
  return Math.min(Math.round(baseYield * crewEfficiency), 50000);
}

// Generate unique mission ID
export function generateMissionId(): string {
  return 'mission-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}
