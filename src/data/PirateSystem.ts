/**
 * Pirate System - Combat encounters for Level 3+
 * D&D-style dice roll combat resolution
 */

// Pirate strength by player level
export interface PirateStats {
  attackRating: { min: number; max: number };  // e.g., 1d6+2 = min 3, max 8
  defenseRating: { min: number; max: number };
}

export const PIRATE_STATS_BY_LEVEL: Record<number, PirateStats> = {
  3: { attackRating: { min: 3, max: 8 }, defenseRating: { min: 2, max: 7 } },   // 1d6+2, 1d6+1
  4: { attackRating: { min: 5, max: 10 }, defenseRating: { min: 4, max: 9 } },  // 1d6+4, 1d6+3
  5: { attackRating: { min: 8, max: 14 }, defenseRating: { min: 7, max: 13 } }, // 1d6+7, 1d6+6
};

// Security contractor tiers
export interface SecurityContractor {
  id: string;
  name: string;
  tier: 'light' | 'medium' | 'heavy';
  costPerMission: number;
  attackRating: number;
  defenseRating: number;
  description: string;
}

export const SECURITY_CONTRACTORS: SecurityContractor[] = [
  {
    id: 'frontier_guards',
    name: 'Frontier Guards',
    tier: 'light',
    costPerMission: 500000,
    attackRating: 2,
    defenseRating: 2,
    description: 'Basic armed escort. Better than nothing.',
  },
  {
    id: 'orbital_defense',
    name: 'Orbital Defense Corp',
    tier: 'medium',
    costPerMission: 2000000,
    attackRating: 5,
    defenseRating: 5,
    description: 'Professional security with combat experience.',
  },
  {
    id: 'military_escort',
    name: 'Military Escort',
    tier: 'heavy',
    costPerMission: 8000000,
    attackRating: 9,
    defenseRating: 9,
    description: 'Former military operators with heavy weaponry.',
  },
];

// Combat outcome types
export type CombatOutcome = 
  | 'pirates_defeated'    // Player wins - mission continues
  | 'pirates_won'         // Pirates win - total loss
  | 'payload_seized';     // Stalemate - crew survives, cargo lost

// Combat result with details for news/logging
export interface CombatResult {
  outcome: CombatOutcome;
  playerAttackRoll: number;
  playerDefenseRoll: number;
  pirateAttackRoll: number;
  pirateDefenseRoll: number;
  playerTotalAttack: number;
  playerTotalDefense: number;
  pirateTotalAttack: number;
  pirateTotalDefense: number;
  narrative: string;
}

/**
 * Roll a d20
 */
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Roll for pirate stats within their range
 */
function rollPirateRating(rating: { min: number; max: number }): number {
  return rating.min + Math.floor(Math.random() * (rating.max - rating.min + 1));
}

/**
 * Get security contractor by ID
 */
export function getSecurityById(id: string): SecurityContractor | undefined {
  return SECURITY_CONTRACTORS.find(s => s.id === id);
}

/**
 * Calculate relationship bonus for security contractor
 * Each relationship level adds +0.5 to attack AND defense
 * Max level 10 = +5 bonus
 */
export function getRelationshipBonus(relationshipLevel: number): number {
  return Math.min(relationshipLevel, 10) * 0.5;
}

/**
 * Resolve combat between player security and pirates
 * 
 * @param playerLevel - Current player level (3-5)
 * @param securityId - ID of hired security (or null if none)
 * @param relationshipLevel - Relationship level with security contractor (0-10)
 * @returns Combat result with outcome and narrative
 */
export function resolveCombat(
  playerLevel: number,
  securityId: string | null,
  relationshipLevel: number = 0
): CombatResult {
  // Get pirate stats for this level
  const pirateStats = PIRATE_STATS_BY_LEVEL[playerLevel] || PIRATE_STATS_BY_LEVEL[3];
  
  // Get player security stats
  const security = securityId ? getSecurityById(securityId) : null;
  const relationshipBonus = security ? getRelationshipBonus(relationshipLevel) : 0;
  
  // Base player stats (if no security, player has minimal defense)
  const basePlayerAttack = security?.attackRating || 0;
  const basePlayerDefense = security?.defenseRating || 1; // Minimum 1 for evasion
  
  // Roll dice
  const playerAttackRoll = rollD20();
  const playerDefenseRoll = rollD20();
  const pirateAttackRoll = rollD20();
  const pirateDefenseRoll = rollD20();
  
  // Calculate totals
  const playerTotalAttack = playerAttackRoll + basePlayerAttack + relationshipBonus;
  const playerTotalDefense = playerDefenseRoll + basePlayerDefense + relationshipBonus;
  const pirateTotalAttack = pirateAttackRoll + rollPirateRating(pirateStats.attackRating);
  const pirateTotalDefense = pirateDefenseRoll + rollPirateRating(pirateStats.defenseRating);
  
  // Determine outcome
  const playerWinsAttack = playerTotalAttack > pirateTotalDefense;
  const playerWinsDefense = playerTotalDefense > pirateTotalAttack;
  const pirateWinsAttack = pirateTotalAttack > playerTotalDefense;
  const pirateWinsDefense = pirateTotalDefense > playerTotalAttack;
  
  let outcome: CombatOutcome;
  let narrative: string;
  
  if (playerWinsAttack && playerWinsDefense) {
    // Clear player victory
    outcome = 'pirates_defeated';
    narrative = security 
      ? `${security.name} repelled the pirate attack! Our forces overwhelmed their defenses.`
      : 'Against all odds, evasive maneuvers allowed us to escape the pirates!';
  } else if (pirateWinsAttack && pirateWinsDefense) {
    // Clear pirate victory
    outcome = 'pirates_won';
    narrative = security
      ? `Despite ${security.name}'s best efforts, the pirates overwhelmed our defenses. All hands lost.`
      : 'Without security escort, we were defenseless. The pirates showed no mercy.';
  } else {
    // Stalemate - 80% payload seized, 20% full escape
    const escapeRoll = Math.random();
    if (escapeRoll < 0.2) {
      outcome = 'pirates_defeated';
      narrative = 'A desperate gambit paid off! We managed to escape with cargo intact.';
    } else {
      outcome = 'payload_seized';
      narrative = 'The battle was fierce but inconclusive. The pirates escaped with our cargo, but the crew survived.';
    }
  }
  
  return {
    outcome,
    playerAttackRoll,
    playerDefenseRoll,
    pirateAttackRoll,
    pirateDefenseRoll,
    playerTotalAttack,
    playerTotalDefense,
    pirateTotalAttack,
    pirateTotalDefense,
    narrative,
  };
}

/**
 * Check if a pirate attack occurs
 * 
 * @param phase - 'outbound' or 'inbound'
 * @param playerLevel - Current player level
 * @returns true if pirates attack
 */
export function checkPirateAttack(phase: 'outbound' | 'inbound', playerLevel: number): boolean {
  // No pirates below level 3
  if (playerLevel < 3) return false;
  
  const attackProbability = phase === 'outbound' ? 0.05 : 0.25;
  return Math.random() < attackProbability;
}

/**
 * Get pirate attack probability for display
 */
export function getPirateAttackProbability(phase: 'outbound' | 'inbound'): number {
  return phase === 'outbound' ? 0.05 : 0.25;
}

/**
 * Format combat result for news ticker
 */
export function formatCombatNews(result: CombatResult, missionName: string): string {
  switch (result.outcome) {
    case 'pirates_defeated':
      return `🛡️ ${missionName}: ${result.narrative}`;
    case 'pirates_won':
      return `☠️ ${missionName}: ${result.narrative}`;
    case 'payload_seized':
      return `📦 ${missionName}: ${result.narrative}`;
  }
}
