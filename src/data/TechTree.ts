/**
 * Tech Tree System
 * Tree-based unlock system with parent prerequisites
 * All unlocks purchased with money
 */

export type TechCategory = 'propulsion' | 'mining' | 'stabilization' | 'navigation' | 'automation';

export interface TechEffects {
  travelTimeModifier?: number;    // e.g., 0.85 = 15% faster
  yieldModifier?: number;         // e.g., 1.10 = 10% more yield
  anomalyReduction?: number;      // e.g., 0.05 = 5% less anomaly chance
  crewCostModifier?: number;      // e.g., 0.80 = 20% cheaper crews
}

export interface TechNode {
  id: string;
  name: string;
  category: TechCategory;
  tier: 1 | 2 | 3 | 4 | 5;
  cost: number;
  prerequisites: string[]; // IDs of required parent nodes (may require multiple)
  effects: TechEffects;
  description: string;
  unlockLevel: number; // Minimum player level to purchase
}

// Base techs are free and always unlocked
export const BASE_TECHS: string[] = [
  'chemical_rockets',
  'percussion_drills',
  'manual_anchoring',
  'basic_star_trackers',
  'manual_operations',
];

export const TECH_TREE: TechNode[] = [
  // === PROPULSION ===
  {
    id: 'chemical_rockets',
    name: 'Chemical Rockets',
    category: 'propulsion',
    tier: 1,
    cost: 0,
    prerequisites: [],
    effects: {},
    description: 'Standard chemical propulsion. Isp ~400s.',
    unlockLevel: 1,
  },
  {
    id: 'ion_propulsion',
    name: 'Ion Propulsion',
    category: 'propulsion',
    tier: 2,
    cost: 5_000_000,
    prerequisites: ['chemical_rockets'],
    effects: { travelTimeModifier: 0.85 },
    description: 'Xenon ion thrusters provide 15% faster transit times.',
    unlockLevel: 2,
  },
  {
    id: 'hall_effect',
    name: 'Hall Effect Thrusters',
    category: 'propulsion',
    tier: 3,
    cost: 15_000_000,
    prerequisites: ['ion_propulsion'],
    effects: { travelTimeModifier: 0.75 },
    description: 'Advanced Hall thrusters cut travel time by 25%.',
    unlockLevel: 2,
  },
  {
    id: 'vasimr',
    name: 'VASIMR Drive',
    category: 'propulsion',
    tier: 4,
    cost: 50_000_000,
    prerequisites: ['hall_effect'],
    effects: { travelTimeModifier: 0.60 },
    description: 'Variable Specific Impulse Magnetoplasma Rocket. 40% faster travel.',
    unlockLevel: 4,
  },
  {
    id: 'plasma_drive',
    name: 'Plasma Drive',
    category: 'propulsion',
    tier: 5,
    cost: 150_000_000,
    prerequisites: ['vasimr'],
    effects: { travelTimeModifier: 0.40 },
    description: 'Cutting-edge plasma propulsion. 60% faster travel times.',
    unlockLevel: 5,
  },

  // === MINING ===
  {
    id: 'percussion_drills',
    name: 'Percussion Drills',
    category: 'mining',
    tier: 1,
    cost: 0,
    prerequisites: [],
    effects: {},
    description: 'Standard rotary percussion drilling equipment.',
    unlockLevel: 1,
  },
  {
    id: 'laser_cutters',
    name: 'Laser Cutters',
    category: 'mining',
    tier: 2,
    cost: 8_000_000,
    prerequisites: ['percussion_drills'],
    effects: { yieldModifier: 1.10 },
    description: 'Precision laser cutting increases yield by 10%.',
    unlockLevel: 2,
  },
  {
    id: 'shaped_charges',
    name: 'Shaped Charges',
    category: 'mining',
    tier: 3,
    cost: 20_000_000,
    prerequisites: ['laser_cutters'],
    effects: { yieldModifier: 1.20 },
    description: 'Controlled explosives for efficient extraction. 20% yield bonus.',
    unlockLevel: 3,
  },
  {
    id: 'plasma_excavation',
    name: 'Plasma Excavation',
    category: 'mining',
    tier: 4,
    cost: 60_000_000,
    prerequisites: ['shaped_charges'],
    effects: { yieldModifier: 1.35 },
    description: 'Plasma torch mining technology. 35% increased yield.',
    unlockLevel: 4,
  },

  // === STABILIZATION ===
  {
    id: 'manual_anchoring',
    name: 'Manual Anchoring',
    category: 'stabilization',
    tier: 1,
    cost: 0,
    prerequisites: [],
    effects: {},
    description: 'Crew manually anchors to asteroid surface.',
    unlockLevel: 1,
  },
  {
    id: 'magnetic_anchors',
    name: 'Magnetic Anchor Rigs',
    category: 'stabilization',
    tier: 2,
    cost: 4_000_000,
    prerequisites: ['manual_anchoring'],
    effects: { yieldModifier: 1.05, anomalyReduction: 0.05 },
    description: 'Magnetic anchoring system. +5% yield, -5% anomaly chance.',
    unlockLevel: 2,
  },
  {
    id: 'spin_counter',
    name: 'Spin Counter Thrusters',
    category: 'stabilization',
    tier: 3,
    cost: 12_000_000,
    prerequisites: ['magnetic_anchors'],
    effects: { yieldModifier: 1.10, anomalyReduction: 0.10 },
    description: 'Active spin compensation. +10% yield, -10% anomaly chance.',
    unlockLevel: 3,
  },
  {
    id: 'dust_containment',
    name: 'Dust Containment Fields',
    category: 'stabilization',
    tier: 4,
    cost: 30_000_000,
    prerequisites: ['spin_counter'],
    effects: { yieldModifier: 1.15, anomalyReduction: 0.15 },
    description: 'Electromagnetic dust control. +15% yield, -15% anomaly chance.',
    unlockLevel: 4,
  },

  // === NAVIGATION ===
  {
    id: 'basic_star_trackers',
    name: 'Basic Star Trackers',
    category: 'navigation',
    tier: 1,
    cost: 0,
    prerequisites: [],
    effects: {},
    description: 'Standard optical star tracker navigation.',
    unlockLevel: 1,
  },
  {
    id: 'advanced_gnc',
    name: 'Advanced GNC',
    category: 'navigation',
    tier: 2,
    cost: 6_000_000,
    prerequisites: ['basic_star_trackers'],
    effects: { travelTimeModifier: 0.95, anomalyReduction: 0.05 },
    description: 'Improved guidance, navigation & control. 5% faster, 5% safer.',
    unlockLevel: 2,
  },
  {
    id: 'relativistic_nav',
    name: 'Relativistic Navigation',
    category: 'navigation',
    tier: 3,
    cost: 25_000_000,
    prerequisites: ['advanced_gnc'],
    effects: { travelTimeModifier: 0.90, anomalyReduction: 0.10 },
    description: 'Accounts for relativistic effects. 10% faster, 10% safer.',
    unlockLevel: 3,
  },
  {
    id: 'quantum_positioning',
    name: 'Quantum Positioning',
    category: 'navigation',
    tier: 4,
    cost: 80_000_000,
    prerequisites: ['relativistic_nav'],
    effects: { travelTimeModifier: 0.85, anomalyReduction: 0.15 },
    description: 'Quantum-entangled positioning system. 15% faster, 15% safer.',
    unlockLevel: 5,
  },

  // === AUTOMATION ===
  {
    id: 'manual_operations',
    name: 'Manual Operations',
    category: 'automation',
    tier: 1,
    cost: 0,
    prerequisites: [],
    effects: {},
    description: 'All operations require human crew oversight.',
    unlockLevel: 1,
  },
  {
    id: 'basic_mining_bots',
    name: 'Basic Mining Bots',
    category: 'automation',
    tier: 2,
    cost: 10_000_000,
    prerequisites: ['manual_operations'],
    effects: { crewCostModifier: 0.80 },
    description: 'Robotic assistants reduce crew costs by 20%.',
    unlockLevel: 2,
  },
  {
    id: 'autonomous_swarm',
    name: 'Autonomous Swarm',
    category: 'automation',
    tier: 3,
    cost: 40_000_000,
    prerequisites: ['basic_mining_bots'],
    effects: { crewCostModifier: 0.60 },
    description: 'Coordinated robot swarms cut crew costs by 40%.',
    unlockLevel: 3,
  },
  {
    id: 'full_ai_mining',
    name: 'Full AI Mining',
    category: 'automation',
    tier: 4,
    cost: 120_000_000,
    prerequisites: ['autonomous_swarm'],
    effects: { crewCostModifier: 0.30 },
    description: 'Fully autonomous AI mining operations. 70% crew cost reduction.',
    unlockLevel: 4,
  },
];

// Helper functions

export function getTechById(id: string): TechNode | undefined {
  return TECH_TREE.find(t => t.id === id);
}

export function getTechsByCategory(category: TechCategory): TechNode[] {
  return TECH_TREE.filter(t => t.category === category).sort((a, b) => a.tier - b.tier);
}

export function getTechsByTier(tier: number): TechNode[] {
  return TECH_TREE.filter(t => t.tier === tier);
}

export function canUnlockTech(techId: string, unlockedTechs: Set<string>, playerLevel: number, balance: number): {
  canUnlock: boolean;
  reason?: string;
} {
  const tech = getTechById(techId);
  if (!tech) {
    return { canUnlock: false, reason: 'Tech not found' };
  }
  
  if (unlockedTechs.has(techId)) {
    return { canUnlock: false, reason: 'Already unlocked' };
  }
  
  if (playerLevel < tech.unlockLevel) {
    return { canUnlock: false, reason: `Requires Level ${tech.unlockLevel}` };
  }
  
  if (balance < tech.cost) {
    return { canUnlock: false, reason: `Need $${tech.cost.toLocaleString()}` };
  }
  
  // Check all prerequisites are unlocked
  for (const prereq of tech.prerequisites) {
    if (!unlockedTechs.has(prereq)) {
      const prereqTech = getTechById(prereq);
      return { canUnlock: false, reason: `Requires ${prereqTech?.name || prereq}` };
    }
  }
  
  return { canUnlock: true };
}

export function getVisibleTechs(_playerLevel: number, unlockedTechs: Set<string>): TechNode[] {
  // Show techs that are:
  // 1. Already unlocked
  // 2. Have all prerequisites unlocked (next available)
  // 3. Are one tier above current max unlocked tier in their category
  
  const visible: TechNode[] = [];
  
  for (const tech of TECH_TREE) {
    // Always show unlocked techs
    if (unlockedTechs.has(tech.id)) {
      visible.push(tech);
      continue;
    }
    
    // Show if all prerequisites are met (regardless of level - show locked state)
    const allPrereqsMet = tech.prerequisites.every(p => unlockedTechs.has(p));
    if (allPrereqsMet) {
      visible.push(tech);
    }
  }
  
  return visible;
}

export function calculateTechEffects(unlockedTechs: Set<string>): TechEffects {
  const combined: TechEffects = {
    travelTimeModifier: 1.0,
    yieldModifier: 1.0,
    anomalyReduction: 0,
    crewCostModifier: 1.0,
  };
  
  for (const techId of unlockedTechs) {
    const tech = getTechById(techId);
    if (!tech) continue;
    
    // Travel time modifiers multiply (0.85 * 0.95 = faster)
    if (tech.effects.travelTimeModifier) {
      combined.travelTimeModifier! *= tech.effects.travelTimeModifier;
    }
    
    // Yield modifiers multiply (1.10 * 1.05 = more yield)
    if (tech.effects.yieldModifier) {
      combined.yieldModifier! *= tech.effects.yieldModifier;
    }
    
    // Anomaly reduction is additive (caps at reducing to near-zero)
    if (tech.effects.anomalyReduction) {
      combined.anomalyReduction! += tech.effects.anomalyReduction;
    }
    
    // Crew cost modifiers multiply (0.80 * 0.60 = cheaper)
    if (tech.effects.crewCostModifier) {
      combined.crewCostModifier! *= tech.effects.crewCostModifier;
    }
  }
  
  // Cap anomaly reduction at 50% (can't eliminate all risk)
  combined.anomalyReduction = Math.min(combined.anomalyReduction!, 0.50);
  
  return combined;
}

// Category display info
export const CATEGORY_INFO: Record<TechCategory, { name: string; icon: string; color: string }> = {
  propulsion: { name: 'Propulsion', icon: '🚀', color: '#ff6b6b' },
  mining: { name: 'Mining', icon: '⛏️', color: '#ffd93d' },
  stabilization: { name: 'Stabilization', icon: '⚓', color: '#6bcb77' },
  navigation: { name: 'Navigation', icon: '🧭', color: '#4d96ff' },
  automation: { name: 'Automation', icon: '🤖', color: '#9b59b6' },
};
