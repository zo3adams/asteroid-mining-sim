/**
 * Save/Load System
 * - Generates obfuscated hash URLs for saving game state (works in prod)
 * - Parses debug params in dev mode for quick testing
 */

import { GameStateData, GameState } from '../core/GameState';
import { BASE_TECHS } from '../data/TechTree';

// Serializable subset of game state for saves
export interface SaveData {
  v: number; // Version for future compatibility
  b: number; // balance
  m: number; // missions completed
  r: number; // reputation
  t: string[]; // tech unlocks (non-base only)
  gt: number; // game time
  u: boolean; // ula unlocked
}

const SAVE_VERSION = 1;

/**
 * Encode game state to a compact base64 hash
 */
export function encodeGameState(state: GameStateData): string {
  // Only save non-base techs to keep URL shorter
  const nonBaseTechs = state.techTreeUnlocks.filter(t => !BASE_TECHS.includes(t));
  
  const saveData: SaveData = {
    v: SAVE_VERSION,
    b: state.balance,
    m: state.missionsCompleted,
    r: state.reputation,
    t: nonBaseTechs,
    gt: Math.round(state.gameTime),
    u: state.ulaUnlocked,
  };
  
  const json = JSON.stringify(saveData);
  // Base64 encode and make URL-safe
  const base64 = btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return base64;
}

/**
 * Decode a base64 hash back to partial game state
 */
export function decodeGameState(hash: string): Partial<GameStateData> | null {
  try {
    // Restore base64 padding and characters
    let base64 = hash
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const json = atob(base64);
    const saveData: SaveData = JSON.parse(json);
    
    // Version check for future compatibility
    if (saveData.v !== SAVE_VERSION) {
      console.warn(`Save version mismatch: ${saveData.v} vs ${SAVE_VERSION}`);
    }
    
    // Restore base techs + saved techs
    const allTechs = [...BASE_TECHS, ...saveData.t];
    
    return {
      balance: saveData.b,
      missionsCompleted: saveData.m,
      reputation: saveData.r,
      techTreeUnlocks: allTechs,
      gameTime: saveData.gt,
      ulaUnlocked: saveData.u,
    };
  } catch (e) {
    console.error('Failed to decode save:', e);
    return null;
  }
}

/**
 * Generate full save URL with hash
 */
export function generateSaveUrl(): string {
  const state = GameState.getInstance().data;
  const hash = encodeGameState(state);
  
  const url = new URL(window.location.href);
  url.search = ''; // Clear existing params
  url.searchParams.set('save', hash);
  
  return url.toString();
}

/**
 * Check if we're in dev mode (Vite provides this)
 */
export function isDevMode(): boolean {
  // @ts-ignore - Vite injects this at build time
  return import.meta.env?.DEV ?? false;
}

/**
 * Parse URL for save data or debug params
 * Returns partial state to merge with defaults, or null if no params
 */
export function parseUrlParams(): Partial<GameStateData> | null {
  const params = new URLSearchParams(window.location.search);
  
  // Check for obfuscated save hash first (works in any mode)
  const saveHash = params.get('save');
  if (saveHash) {
    console.log('Loading from save URL...');
    return decodeGameState(saveHash);
  }
  
  // Check for debug params (dev mode only)
  if (isDevMode() && params.get('debug') === '1') {
    console.log('DEBUG MODE: Parsing URL parameters...');
    
    const state: Partial<GameStateData> = {};
    
    // Balance
    const balance = params.get('balance');
    if (balance) {
      state.balance = parseInt(balance.replace(/_/g, ''), 10);
    }
    
    // Missions completed
    const missions = params.get('missions');
    if (missions) {
      state.missionsCompleted = parseInt(missions, 10);
    }
    
    // Reputation
    const reputation = params.get('reputation');
    if (reputation) {
      state.reputation = parseInt(reputation, 10);
    }
    
    // Tech unlocks (comma-separated IDs)
    const techs = params.get('techs');
    if (techs) {
      const techIds = techs.split(',').map(t => t.trim());
      state.techTreeUnlocks = [...BASE_TECHS, ...techIds];
    }
    
    // Game time
    const time = params.get('time');
    if (time) {
      state.gameTime = parseInt(time, 10);
    }
    
    // ULA unlocked
    const ula = params.get('ula');
    if (ula === '1' || ula === 'true') {
      state.ulaUnlocked = true;
    }
    
    return Object.keys(state).length > 0 ? state : null;
  }
  
  return null;
}

/**
 * Copy save URL to clipboard
 */
export async function copySaveUrl(): Promise<boolean> {
  try {
    const url = generateSaveUrl();
    await navigator.clipboard.writeText(url);
    return true;
  } catch (e) {
    console.error('Failed to copy save URL:', e);
    return false;
  }
}
