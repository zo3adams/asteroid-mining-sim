/**
 * Central game state manager
 * Single source of truth for all game state
 */

import { PlayerBackground, STARTING_CAPITAL, STARTING_REPUTATION } from '../utils/Constants';
import { Mission } from './MissionTypes';
import { 
  BASE_TECHS, 
  calculateTechEffects, 
  canUnlockTech, 
  getTechById, 
  TechEffects 
} from '../data/TechTree';
import { getCurrentLevel } from '../data/HelpContent';
import { MarketState, initializeMarket } from '../data/MarketSystem';
import { StorageState, initializeStorage } from '../data/StorageDepots';

// Flight log entry for completed missions
export interface FlightLogEntry {
  asteroidName: string;
  resourceType: string;
  tons: number;
  profit: number;
  completedTime: number; // game time when completed
}

export interface GameStateData {
  // Player info
  playerName: string;
  background: PlayerBackground;
  balance: number;
  reputation: number;

  // Progress
  missionsCompleted: number;
  techTreeUnlocks: string[];
  minedAsteroids: string[]; // Asteroid IDs that have been drilled
  flightLog: FlightLogEntry[]; // Last completed missions
  ownedAssets: string[]; // IDs of purchased vehicles, equipment, crews

  // Active state
  selectedAsteroidId: string | null;
  activeMissions: Mission[];

  // Time
  gameTime: number; // Game days elapsed
  timeScale: number; // Time acceleration multiplier (1 = 1 sec per day, 0.001 = real-time)

  // Unlocks
  ulaUnlocked: boolean;

  // Market
  market: MarketState;

  // Storage (Level 3+)
  storage: StorageState;
  
  // Security relationships (Level 3+)
  securityRelationships: Record<string, number>; // security ID -> relationship level (0-10)
}

export class GameState {
  private static instance: GameState;
  public data: GameStateData;
  private listeners: Map<string, Set<(data: GameStateData) => void>>;
  private _cachedTechEffects: TechEffects | null = null;

  private constructor() {
    this.data = this.getDefaultState();
    this.listeners = new Map();
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  private getDefaultState(): GameStateData {
    return {
      playerName: 'Commander',
      background: PlayerBackground.ENGINEER,
      balance: STARTING_CAPITAL,
      reputation: STARTING_REPUTATION,
      missionsCompleted: 0,
      techTreeUnlocks: [...BASE_TECHS], // Start with base techs unlocked
      minedAsteroids: [],
      flightLog: [],
      ownedAssets: [],
      selectedAsteroidId: null,
      activeMissions: [],
      gameTime: 0,
      timeScale: 0.333, // Start at 8 hours per second
      ulaUnlocked: false,
      market: initializeMarket(0),
      storage: initializeStorage(),
      securityRelationships: {},
    };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(key: string, callback: (data: GameStateData) => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  /**
   * Unsubscribe from state changes
   */
  public unsubscribe(key: string, callback: (data: GameStateData) => void): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((callbacks) => {
      callbacks.forEach((callback) => callback(this.data));
    });
  }

  /**
   * Update state and notify listeners
   */
  public update(updates: Partial<GameStateData>): void {
    this.data = { ...this.data, ...updates };
    // Invalidate tech effects cache if techs changed
    if (updates.techTreeUnlocks) {
      this._cachedTechEffects = null;
    }
    this.notify();
  }

  /**
   * Add money to balance
   */
  public addMoney(amount: number): void {
    this.update({ balance: this.data.balance + amount });
  }

  /**
   * Subtract money from balance
   */
  public subtractMoney(amount: number): boolean {
    if (this.data.balance >= amount) {
      this.update({ balance: this.data.balance - amount });
      return true;
    }
    return false;
  }

  /**
   * Select an asteroid
   */
  public selectAsteroid(asteroidId: string | null): void {
    this.update({ selectedAsteroidId: asteroidId });
  }

  /**
   * Complete a mission
   */
  public completeMission(): void {
    this.update({ missionsCompleted: this.data.missionsCompleted + 1 });
  }

  /**
   * Check and unlock ULA if threshold reached
   */
  public checkULAUnlock(): boolean {
    if (!this.data.ulaUnlocked && this.data.balance >= 100_000_000) {
      this.update({ ulaUnlocked: true });
      return true; // Return true if just unlocked
    }
    return false;
  }

  /**
   * Set time scale directly
   */
  public setTimeScale(scale: number): void {
    this.update({ timeScale: scale });
  }

  /**
   * Set time scale by index (0-5)
   */
  public setTimeScaleByIndex(index: number): void {
    const scales = [0.001, 0.042, 0.167, 0.333, 1.0, 7.0];
    if (index >= 0 && index < scales.length) {
      this.update({ timeScale: scales[index] });
    }
  }

  /**
   * Add a new mission
   */
  public addMission(mission: Mission): void {
    const missions = [...this.data.activeMissions, mission];
    this.update({ activeMissions: missions });
  }

  /**
   * Update mission progress/status
   */
  public updateMission(missionId: string, updates: Partial<Mission>): void {
    const missions = this.data.activeMissions.map(m => 
      m.id === missionId ? { ...m, ...updates } : m
    );
    this.update({ activeMissions: missions });
  }

  /**
   * Remove a mission (completed or failed)
   */
  public removeMission(missionId: string): void {
    const missions = this.data.activeMissions.filter(m => m.id !== missionId);
    this.update({ activeMissions: missions });
  }

  /**
   * Get mission by ID
   */
  public getMission(missionId: string): Mission | undefined {
    return this.data.activeMissions.find(m => m.id === missionId);
  }

  // === TECH TREE METHODS ===

  /**
   * Get current player level based on missions completed
   */
  public getPlayerLevel(): number {
    return getCurrentLevel(this.data.missionsCompleted).id;
  }

  /**
   * Get set of unlocked tech IDs
   */
  public getUnlockedTechs(): Set<string> {
    return new Set(this.data.techTreeUnlocks);
  }

  /**
   * Check if a specific tech is unlocked
   */
  public isTechUnlocked(techId: string): boolean {
    return this.data.techTreeUnlocks.includes(techId);
  }

  /**
   * Attempt to unlock a tech (returns success/failure with reason)
   */
  public unlockTech(techId: string): { success: boolean; reason?: string } {
    const result = canUnlockTech(
      techId, 
      this.getUnlockedTechs(), 
      this.getPlayerLevel(), 
      this.data.balance
    );

    if (!result.canUnlock) {
      return { success: false, reason: result.reason };
    }

    const tech = getTechById(techId);
    if (!tech) {
      return { success: false, reason: 'Tech not found' };
    }

    // Deduct cost and add to unlocks
    this.subtractMoney(tech.cost);
    this.update({ 
      techTreeUnlocks: [...this.data.techTreeUnlocks, techId] 
    });

    return { success: true };
  }

  /**
   * Get combined effects of all unlocked techs (cached)
   */
  public getTechEffects(): TechEffects {
    if (!this._cachedTechEffects) {
      this._cachedTechEffects = calculateTechEffects(this.getUnlockedTechs());
    }
    return this._cachedTechEffects;
  }

  // === OWNERSHIP METHODS ===

  /**
   * Get list of owned asset IDs
   */
  public getOwnedAssets(): string[] {
    return this.data.ownedAssets;
  }

  /**
   * Check if player owns an asset
   */
  public ownsAsset(assetId: string): boolean {
    return this.data.ownedAssets.includes(assetId);
  }

  /**
   * Purchase an asset (deducts cost from balance)
   */
  public purchaseAsset(assetId: string, cost: number): { success: boolean; error?: string } {
    if (this.ownsAsset(assetId)) {
      return { success: false, error: 'Already owned' };
    }
    if (this.data.balance < cost) {
      return { success: false, error: 'Insufficient funds' };
    }

    this.update({
      balance: this.data.balance - cost,
      ownedAssets: [...this.data.ownedAssets, assetId],
    });

    return { success: true };
  }

  // === STORAGE METHODS ===

  /**
   * Check if player owns any of a depot type
   */
  public ownsDepot(depotId: string): boolean {
    return (this.data.storage.depots[depotId]?.count || 0) > 0;
  }

  /**
   * Get count of a depot type owned
   */
  public getDepotCount(depotId: string): number {
    return this.data.storage.depots[depotId]?.count || 0;
  }

  /**
   * Purchase a storage depot (can buy multiple)
   */
  public purchaseDepot(depotId: string, cost: number): { success: boolean; error?: string } {
    if (this.data.balance < cost) {
      return { success: false, error: 'Insufficient funds' };
    }

    const existingInstance = this.data.storage.depots[depotId];
    const newCount = (existingInstance?.count || 0) + 1;
    const existingContents = existingInstance?.contents || {
      water: 0, iron: 0, nickel: 0, platinum: 0,
      gold: 0, rare_earth: 0, lithium: 0, volatiles: 0,
    };

    const newStorage: StorageState = {
      depots: {
        ...this.data.storage.depots,
        [depotId]: {
          depotTypeId: depotId,
          count: newCount,
          contents: existingContents,
        },
      },
    };

    this.update({
      balance: this.data.balance - cost,
      storage: newStorage,
    });

    return { success: true };
  }

  /**
   * Sell resources from a depot
   */
  public sellFromDepot(
    depotId: string, 
    resource: string, 
    amount: number, 
    pricePerTon: number
  ): { success: boolean; revenue: number; error?: string } {
    const instance = this.data.storage.depots[depotId];
    if (!instance) {
      return { success: false, revenue: 0, error: 'Depot not owned' };
    }

    const available = instance.contents[resource as keyof typeof instance.contents] || 0;
    const sellAmount = Math.min(amount, available);
    
    if (sellAmount <= 0) {
      return { success: false, revenue: 0, error: 'Nothing to sell' };
    }

    const revenue = Math.round(sellAmount * pricePerTon);
    
    const newContents = { ...instance.contents };
    newContents[resource as keyof typeof newContents] = available - sellAmount;

    const newStorage: StorageState = {
      depots: {
        ...this.data.storage.depots,
        [depotId]: {
          ...instance,
          contents: newContents,
        },
      },
    };

    this.update({
      balance: this.data.balance + revenue,
      storage: newStorage,
    });

    return { success: true, revenue };
  }

  /**
   * Get storage state
   */
  public getStorage(): StorageState {
    return this.data.storage;
  }

  /**
   * Load state from serialized data
   */
  public loadState(data: Partial<GameStateData>): void {
    this.data = { ...this.getDefaultState(), ...data };
    this._cachedTechEffects = null;
    this.notify();
  }

  /**
   * Reset to default state
   */
  public reset(): void {
    this.data = this.getDefaultState();
    this._cachedTechEffects = null;
    this.notify();
  }
}
