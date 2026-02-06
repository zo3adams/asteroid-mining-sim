/**
 * Main entry point for Asteroid Miner
 */

import { SolarSystem } from './rendering/SolarSystem';
import { GameState, FlightLogEntry } from './core/GameState';
import { AsteroidDataFetcher, AsteroidInfo, getTypesForResource, estimateAsteroidResources, getPrimaryResourcesForType, calculateDistanceFromEarth, calculateAsteroidMatches } from './data/AsteroidData';
import { formatCurrency, formatDistance, formatMass, formatDiameter } from './utils/Formatters';
import { getAsteroidWikipediaUrl, getPlanetWikipediaUrl, getSunWikipediaUrl } from './data/WikipediaLinks';
import { TIME_SCALE_NAMES, PLANET_DIAMETERS, MOON_DIAMETERS } from './utils/Constants';
import {
  LAUNCH_PROVIDERS,
  CREW_TYPES,
  LaunchProvider,
  CrewType,
  Mission,
  MissionStatus,
  MissionPhase,
  PHASE_INFO,
  Contract,
  calculateMissionDuration,
  calculateMissionCost,
  calculatePhaseDuration,
  rollNextPhase,
  estimateResourceYield,
  generateMissionId,
  generateContracts,
  generateCaptainName,
} from './core/MissionTypes';
import { GAMEPLAY_TIPS, REFERENCES, GAMEPLAY_WALKTHROUGH, PROGRESSION_LEVELS, getRandomTip, getCurrentLevel } from './data/HelpContent';
import { 
  TECH_TREE, 
  TechCategory,
  CATEGORY_INFO, 
  getTechsByCategory, 
  getVisibleTechs,
  canUnlockTech,
} from './data/TechTree';
import { parseUrlParams, copySaveUrl, isDevMode } from './utils/SaveSystem';
import { 
  ResourceType, 
  RESOURCE_BASE_PRICES 
} from './utils/Constants';
import {
  RESOURCE_INFO,
  updateMarketPrices,
  getSpotPrice,
  getPriceTrend,
  formatPrice,
  getResourcesByPrice,
} from './data/MarketSystem';
import {
  OwnableAsset,
  AssetCategory,
  CATEGORY_INFO as ASSET_CATEGORY_INFO,
  ALL_OWNABLE_ASSETS,
  getAssetsByCategory,
  getAssetById,
} from './data/OwnableAssets';
import {
  StorageDepot,
  STORAGE_DEPOTS,
  getDepotById,
  getDepotUsedCapacity,
  formatCapacity,
  getInstanceTotalCapacity,
  getTotalStorageCapacityNew,
  getTotalStoredTonsNew,
  hasAnyDepots,
  createEmptyStorage,
} from './data/StorageDepots';
import {
  checkPirateAttack,
  resolveCombat,
  formatCombatNews,
  CombatResult,
} from './data/PirateSystem';
import {
  NewsSystem,
  getNewsSystem,
  EasterEggState,
} from './data/NewsSystem';

// Alias for RESOURCE_INFO from MarketSystem
const MARKET_RESOURCE_INFO = RESOURCE_INFO;

// Searchable body entry
interface SearchableBody {
  name: string;
  type: 'sun' | 'planet' | 'moon' | 'asteroid' | 'satellite';
  id?: string;
}

class Game {
  private solarSystem: SolarSystem | null = null;
  private gameState: GameState;
  private lastTime = 0;
  private isRunning = false;
  private asteroidData: Map<string, AsteroidInfo> = new Map();
  private debugMode = false;
  private lastKnownLevel = 1; // Track level for transition detection
  
  // News system
  private newsSystem: NewsSystem;
  private lastNewsCheck = 0; // Game time of last news check
  private lastEasterEggState: { month: number; day: number; missions: number; balanceTier: string } | null = null;
  
  // News ticker state
  private tickerPosition = 0;
  private tickerPaused = false;
  private lastTickerUpdate = 0;
  private readonly TICKER_SPEED = 80; // pixels per second
  
  // Search functionality
  private searchableBodies: SearchableBody[] = [];
  private searchSelectedIndex = -1;

  // Mission planning state
  private selectedProvider: LaunchProvider | null = null;
  private selectedCrew: CrewType | null = null;
  private currentMissionAsteroid: AsteroidInfo | null = null;
  private availableContracts: Contract[] = [];
  private selectedContract: Contract | null = null;
  private cameFromPreselected = false; // Track if we came from a pre-selected asteroid
  private isSpecFreeMining = false; // Track if this is a spec-free mining mission (no contract)

  constructor() {
    this.gameState = GameState.getInstance();
    this.lastKnownLevel = getCurrentLevel(this.gameState.data.missionsCompleted).id;
    this.newsSystem = getNewsSystem();
    this.init();
  }

  private async init(): Promise<void> {
    console.log('Initializing Asteroid Miner...');

    // Load state from URL params if present
    const urlState = parseUrlParams();
    if (urlState) {
      this.gameState.loadState(urlState);
      if (isDevMode() && new URLSearchParams(window.location.search).get('debug') === '1') {
        this.debugMode = true;
        console.log('DEBUG MODE ACTIVE - State loaded from URL params');
      }
    }

    // Get canvas
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }

    // Prevent right-click context menu on canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Initialize solar system renderer
    this.solarSystem = new SolarSystem(canvas);

    // Set up UI event listeners
    this.setupUI();

    // Load asteroids
    await this.loadAsteroids();

    // Restore mined asteroid state (hide labels for already-mined asteroids)
    this.gameState.data.minedAsteroids.forEach(asteroidId => {
      if (this.solarSystem) {
        this.solarSystem.setAsteroidMined(asteroidId, true);
      }
    });

    // Initialize searchable bodies list
    this.initSearchableBodies();

    // Show ready button, hide progress
    const statusText = document.getElementById('loading-status');
    const progressBar = document.querySelector('.loading-progress') as HTMLElement;
    const launchBtn = document.getElementById('launch-btn');
    
    if (statusText) statusText.style.display = 'none';
    if (progressBar) progressBar.style.display = 'none';
    if (launchBtn) launchBtn.style.display = 'block';

    // Wait for user to click "Ready to Launch"
    const loading = document.getElementById('loading');
    await new Promise<void>(resolve => {
      if (launchBtn) {
        launchBtn.addEventListener('click', () => {
          if (loading) loading.classList.add('hidden');
          resolve();
        });
      }
    });

    // Start game loop
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));

    // Initialize random starting news (after Welcome message)
    this.initializeStartingNews();

    // Show debug indicator if in debug mode
    if (this.debugMode) {
      this.showDebugIndicator();
    }

    // Setup save URL button
    this.setupSaveButton();
    
    // Setup ticker scroll and pause on hover
    this.setupTickerScroll();

    console.log('Game initialized!');
  }

  /**
   * Add random starting news items so each game feels fresh
   */
  private initializeStartingNews(): void {
    // Add 2-3 random flavor/educational items
    const flavorNews = this.newsSystem.getFlavorNews();
    if (flavorNews) {
      this.addNewsItem(flavorNews, 'flavor');
    }
    
    const eduNews = this.newsSystem.getEducationalNews();
    if (eduNews) {
      this.addNewsItem(eduNews, 'flavor'); // Educational uses flavor style (gray)
    }
    
    // Maybe add another flavor item
    if (Math.random() > 0.5) {
      const moreFlavorNews = this.newsSystem.getFlavorNews();
      if (moreFlavorNews) {
        this.addNewsItem(moreFlavorNews, 'flavor');
      }
    }
  }

  /**
   * Setup JavaScript-based ticker scrolling for true infinite scroll
   */
  private setupTickerScroll(): void {
    const ticker = document.getElementById('ticker-content');
    const tickerContainer = document.getElementById('news-ticker');
    if (!ticker || !tickerContainer) return;
    
    // Start position off-screen to the right
    const containerWidth = tickerContainer.offsetWidth;
    this.tickerPosition = containerWidth;
    ticker.style.transform = `translateX(${this.tickerPosition}px)`;
    
    // Pause on hover
    tickerContainer.addEventListener('mouseenter', () => {
      this.tickerPaused = true;
    });
    tickerContainer.addEventListener('mouseleave', () => {
      this.tickerPaused = false;
    });
    
    this.lastTickerUpdate = performance.now();
  }

  /**
   * Update ticker scroll position - called from game loop
   */
  private updateTickerScroll(timestamp: number): void {
    if (this.tickerPaused) {
      this.lastTickerUpdate = timestamp;
      return;
    }
    
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;
    
    const deltaTime = (timestamp - this.lastTickerUpdate) / 1000;
    this.lastTickerUpdate = timestamp;
    
    // Move ticker left
    this.tickerPosition -= this.TICKER_SPEED * deltaTime;
    
    // Get ticker width (all items)
    const tickerWidth = ticker.scrollWidth;
    
    // If ticker has scrolled completely off screen to the left, reset
    if (this.tickerPosition < -tickerWidth) {
      // Remove old items that have scrolled past, keep recent ones
      const items = ticker.querySelectorAll('.ticker-item');
      const itemsToKeep = Math.min(items.length, 10); // Keep last 10 items
      while (items.length > itemsToKeep && ticker.firstChild) {
        ticker.removeChild(ticker.firstChild);
      }
      
      // Reset position to start from right edge
      const tickerContainer = document.getElementById('news-ticker');
      if (tickerContainer) {
        this.tickerPosition = tickerContainer.offsetWidth;
      }
    }
    
    ticker.style.transform = `translateX(${this.tickerPosition}px)`;
  }

  private showDebugIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'debug-indicator';
    indicator.innerHTML = '🔧 DEBUG MODE';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 100, 0, 0.9);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 9999;
    `;
    document.body.appendChild(indicator);
  }

  private setupSaveButton(): void {
    const saveBtn = document.getElementById('save-url-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const success = await copySaveUrl();
        if (success) {
          this.addNewsItem('Save URL copied to clipboard!', 'important');
          saveBtn.textContent = '✓ Copied!';
          setTimeout(() => {
            saveBtn.textContent = 'Copy Save URL';
          }, 2000);
        } else {
          this.addNewsItem('Failed to copy save URL', 'critical');
        }
      });
    }
  }

  private async loadAsteroids(): Promise<void> {
    console.log('Loading asteroid data from NASA JPL...');

    const asteroidList = AsteroidDataFetcher.getDefaultAsteroids();
    const progressBar = document.getElementById('loading-progress-bar');
    const statusText = document.getElementById('loading-status');

    try {
      const asteroids = await AsteroidDataFetcher.loadAsteroids(asteroidList, (current, total) => {
        const percent = Math.round((current / total) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (statusText) statusText.textContent = `Loading asteroids... ${current}/${total}`;
      });

      console.log(`Loaded ${asteroids.length} asteroids`);

      // Add asteroids to scene
      asteroids.forEach((asteroid) => {
        this.asteroidData.set(asteroid.id, asteroid);

        // Estimate size for rendering (smaller than real size for visibility)
        const size = asteroid.diameter ? Math.max(0.5, asteroid.diameter / 20) : 1;

        // Determine type
        const type = (asteroid.taxonomicClass as 'C' | 'S' | 'M') || 'S';

        this.solarSystem?.addAsteroid(asteroid.id, asteroid.name, asteroid.semiMajorAxis, size, type);
      });

      // Update UI
      this.updateAsteroidCount();
    } catch (error) {
      console.error('Failed to load asteroids:', error);

      // Fallback: add some mock asteroids
      console.log('Using mock asteroid data');
      for (let i = 0; i < 20; i++) {
        const id = `mock-${i}`;
        const name = `Asteroid ${i}`;
        const asteroid = AsteroidDataFetcher.generateMockAsteroid(id, name);
        this.asteroidData.set(id, asteroid);

        const size = asteroid.diameter ? Math.max(0.5, asteroid.diameter / 20) : 1;
        const type = asteroid.taxonomicClass as 'C' | 'S' | 'M';

        this.solarSystem?.addAsteroid(id, name, asteroid.semiMajorAxis, size, type);
      }

      this.updateAsteroidCount();
    }
  }

  private setupUI(): void {
    // Subscribe to game state changes
    this.gameState.subscribe('ui', (data) => {
      // Update balance
      const balanceEl = document.getElementById('balance');
      if (balanceEl) balanceEl.textContent = formatCurrency(data.balance);

      // Update reputation
      const reputationEl = document.getElementById('reputation');
      if (reputationEl) reputationEl.textContent = data.reputation.toString();

      // Update missions completed
      const missionsEl = document.getElementById('missions-completed');
      if (missionsEl) missionsEl.textContent = data.missionsCompleted.toString();

      // Update current level
      const levelEl = document.getElementById('current-level');
      if (levelEl) {
        const currentLevel = getCurrentLevel(data.missionsCompleted);
        levelEl.innerHTML = `${currentLevel.id}/5: ${currentLevel.name}`;
      }

      // Check ULA unlock
      if (this.gameState.checkULAUnlock()) {
        this.addNewsItem(
          `BREAKING: ULA will now accept contracts from ${data.playerName}`,
          'important'
        );
      }
    });

    // Object selection
    window.addEventListener('objectSelected', ((event: CustomEvent) => {
      this.onObjectSelected(event.detail);
    }) as EventListener);

    // Object hover
    window.addEventListener('objectHovered', ((event: CustomEvent) => {
      this.onObjectHovered(event.detail);
    }) as EventListener);

    // Copy save button
    const copyBtn = document.getElementById('copy-save-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const input = document.getElementById('save-url-input') as HTMLInputElement;
        if (input) {
          input.select();
          document.execCommand('copy');
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy Save';
          }, 2000);
        }
      });
    }

    // Plan mission button
    const planBtn = document.getElementById('plan-mission-btn');
    if (planBtn) {
      planBtn.addEventListener('click', () => {
        this.onPlanMission();
      });
    }

    // Time slider
    const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        const index = parseInt((e.target as HTMLInputElement).value);
        this.gameState.setTimeScaleByIndex(index);
        this.updateTimeDisplay(index);
      });
      this.updateTimeDisplay(3); // Initialize display to 8 Hours/Sec
    }

    // Breadcrumb link
    const breadcrumbLink = document.getElementById('breadcrumb-link');
    if (breadcrumbLink) {
      breadcrumbLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.solarSystem) {
          this.solarSystem.focusOnObject(null);
        }
      });
    }

    // Camera focus events
    window.addEventListener('cameraFocusChanged', ((event: CustomEvent) => {
      this.onCameraFocusChanged(event.detail);
    }) as EventListener);

    // Search box setup
    this.setupSearch();

    // Mission modal setup
    this.setupMissionModal();

    // Phase modal setup
    this.setupPhaseModal();

    // Mission list click handler (event delegation)
    this.setupMissionListClickHandler();

    // Help system setup
    this.setupHelp();

    // Tech tree setup
    this.setupTechTree();

    // Assets system setup
    this.setupAssets();

    // Storage system setup
    this.setupStorage();

    // Level transition setup
    this.setupLevelTransitions();

    // Market display setup
    this.setupMarket();
  }

  private onObjectSelected(userData: any): void {
    if (!userData) {
      // Deselected
      const targetInfo = document.getElementById('target-info');
      if (targetInfo) {
        targetInfo.innerHTML = '<p style="color: #888;">Select an asteroid to view details</p>';
      }

      this.gameState.selectAsteroid(null);
      return;
    }

    if (userData.type === 'asteroid') {
      const asteroid = this.asteroidData.get(userData.id);
      if (asteroid) {
        this.displayAsteroidInfo(asteroid);
        this.gameState.selectAsteroid(asteroid.id);
      }
    } else if (userData.type === 'planet') {
      this.displayPlanetInfo(userData);
    } else if (userData.type === 'sun') {
      this.displaySunInfo(userData);
    } else if (userData.type === 'moon' || userData.type === 'satellite') {
      this.displayMoonInfo(userData);
    }
  }

  private displayAsteroidInfo(asteroid: AsteroidInfo): void {
    const targetInfo = document.getElementById('target-info');
    if (!targetInfo) return;

    const diameterStr = asteroid.diameter ? formatDiameter(asteroid.diameter) : 'Unknown';
    const massStr = asteroid.mass ? formatMass(asteroid.mass) : 'Unknown';

    const wikiUrl = getAsteroidWikipediaUrl(asteroid.id, asteroid.name);

    targetInfo.innerHTML = `
      <p><strong style="color: #0ff; font-size: 14px;">${asteroid.name}</strong></p>
      <p style="margin-top: 10px;"><span class="label">Type:</span> ${asteroid.taxonomicClass}-class</p>
      <p><span class="label">Distance:</span> ${formatDistance(asteroid.semiMajorAxis)}</p>
      <p><span class="label">Diameter:</span> ${diameterStr}</p>
      <p><span class="label">Est. Mass:</span> ${massStr}</p>
      <p><span class="label">Eccentricity:</span> ${asteroid.eccentricity.toFixed(3)}</p>
      <p><span class="label">Inclination:</span> ${asteroid.inclination.toFixed(1)}°</p>
      <p style="margin-top: 10px;"><a href="${wikiUrl}" target="_blank" style="color: #0ff;">Wikipedia ↗</a></p>
    `;
  }

  private displayPlanetInfo(userData: any): void {
    const targetInfo = document.getElementById('target-info');
    if (!targetInfo) return;

    const wikiUrl = getPlanetWikipediaUrl(userData.name);
    const diameter = PLANET_DIAMETERS[userData.name];
    const diameterStr = diameter ? formatDiameter(diameter) : 'Unknown';

    targetInfo.innerHTML = `
      <p><strong style="color: #0ff; font-size: 14px;">${userData.name}</strong></p>
      <p style="margin-top: 10px;"><span class="label">Type:</span> Planet</p>
      <p><span class="label">Distance:</span> ${formatDistance(userData.orbit)}</p>
      <p><span class="label">Diameter:</span> ${diameterStr}</p>
      <p style="margin-top: 10px; color: #888;">Planets cannot be mined (yet)</p>
      <p style="margin-top: 10px;"><a href="${wikiUrl}" target="_blank" style="color: #0ff;">Wikipedia ↗</a></p>
    `;
  }

  private displaySunInfo(_userData: any): void {
    const targetInfo = document.getElementById('target-info');
    if (!targetInfo) return;

    const wikiUrl = getSunWikipediaUrl();
    const diameterStr = formatDiameter(PLANET_DIAMETERS.Sun);

    targetInfo.innerHTML = `
      <p><strong style="color: #ff0; font-size: 14px;">Sun</strong></p>
      <p style="margin-top: 10px;"><span class="label">Type:</span> G-type Main Sequence Star</p>
      <p><span class="label">Distance:</span> 0.00 AU</p>
      <p><span class="label">Diameter:</span> ${diameterStr}</p>
      <p><span class="label">Mass:</span> 1.989 × 10³⁰ kg</p>
      <p style="margin-top: 10px; color: #888;">The center of our solar system</p>
      <p style="margin-top: 10px;"><a href="${wikiUrl}" target="_blank" style="color: #0ff;">Wikipedia ↗</a></p>
    `;
  }

  private displayMoonInfo(userData: any): void {
    const targetInfo = document.getElementById('target-info');
    if (!targetInfo) return;

    const wikiUrl = getAsteroidWikipediaUrl('', userData.name); // Moons use simple name lookup

    const typeStr = userData.type === 'satellite' ? 'Space Station' : 'Moon';
    const parentStr = userData.parent || 'Unknown';
    const diameter = MOON_DIAMETERS[userData.name];
    const diameterStr = diameter ? formatDiameter(diameter) : null;

    targetInfo.innerHTML = `
      <p><strong style="color: #0ff; font-size: 14px;">${userData.name}</strong></p>
      <p style="margin-top: 10px;"><span class="label">Type:</span> ${typeStr}</p>
      <p><span class="label">Orbits:</span> ${parentStr}</p>
      ${diameterStr ? `<p><span class="label">Diameter:</span> ${diameterStr}</p>` : ''}
      ${userData.orbitalPeriod ? `<p><span class="label">Period:</span> ${userData.orbitalPeriod.toFixed(2)} days</p>` : ''}
      <p style="margin-top: 10px; color: #888;">${userData.type === 'satellite' ? 'Human-made orbital station' : 'Natural satellite'}</p>
      <p style="margin-top: 10px;"><a href="${wikiUrl}" target="_blank" style="color: #0ff;">Wikipedia ↗</a></p>
    `;
  }

  private onObjectHovered(userData: any): void {
    const hoverInfo = document.getElementById('hover-info');
    if (!hoverInfo) return;

    if (!userData) {
      hoverInfo.innerHTML = '<p style="color: #888;">Hover over objects to see details</p>';
      return;
    }

    if (userData.type === 'sun') {
      const wikiUrl = getSunWikipediaUrl();
      const diameterStr = formatDiameter(PLANET_DIAMETERS.Sun);
      hoverInfo.innerHTML = `
        <p><strong style="color: #ff0;">Sun</strong></p>
        <p><span class="label">Type:</span> G-type Star</p>
        <p><span class="label">Diameter:</span> ${diameterStr}</p>
        <p><span class="label">Distance:</span> 0.00 AU</p>
        <p><span class="label">Visited:</span> <span style="color: #f00;">No</span></p>
        <p style="margin-top: 5px;"><a href="${wikiUrl}" target="_blank" style="color: #0ff; font-size: 11px;">Wiki ↗</a></p>
      `;
    } else if (userData.type === 'planet') {
      // Calculate distance from Earth (simplified - assuming Earth is at 1 AU)
      const distanceFromEarth = Math.abs(userData.orbit - 1.0);
      const wikiUrl = getPlanetWikipediaUrl(userData.name);
      const diameter = PLANET_DIAMETERS[userData.name];
      const diameterStr = diameter ? formatDiameter(diameter) : 'Unknown';
      hoverInfo.innerHTML = `
        <p><strong style="color: #0ff;">${userData.name}</strong></p>
        <p><span class="label">Type:</span> Planet</p>
        <p><span class="label">Diameter:</span> ${diameterStr}</p>
        <p><span class="label">From Earth:</span> ${formatDistance(distanceFromEarth)}</p>
        <p><span class="label">Visited:</span> <span style="color: #f00;">No</span></p>
        <p style="margin-top: 5px;"><a href="${wikiUrl}" target="_blank" style="color: #0ff; font-size: 11px;">Wiki ↗</a></p>
      `;
    } else if (userData.type === 'asteroid') {
      const asteroid = this.asteroidData.get(userData.id);
      if (!asteroid) return;

      // Get rendered positions for accurate distance
      const asteroidAngle = this.solarSystem?.getAsteroidAngle(userData.id);
      const earthAngle = this.solarSystem?.getEarthAngle();
      const distanceInfo = calculateDistanceFromEarth(asteroid, this.gameState.data.gameTime, asteroidAngle, earthAngle);
      const distanceStr = `${formatDistance(distanceInfo.current)} (${distanceInfo.isNear ? 'near' : 'far'})`;
      const diameterStr = asteroid.diameter ? formatDiameter(asteroid.diameter) : 'Unknown';
      const massStr = asteroid.mass ? formatMass(asteroid.mass) : 'Unknown';
      const wikiUrl = getAsteroidWikipediaUrl(asteroid.id, asteroid.name);
      
      // Check if asteroid has been mined
      const isMined = this.gameState.data.minedAsteroids.includes(userData.id);
      const visitedHtml = isMined 
        ? '<span style="color: #4ade80;">✓ Mined</span>'
        : '<span style="color: #888;">Not yet</span>';

      hoverInfo.innerHTML = `
        <p><strong style="color: #0ff;">${asteroid.name}</strong></p>
        <p><span class="label">Type:</span> ${asteroid.taxonomicClass}-class</p>
        <p><span class="label">Diameter:</span> ${diameterStr}</p>
        <p><span class="label">Mass:</span> ${massStr}</p>
        <p><span class="label">From Earth:</span> ${distanceStr}</p>
        <p><span class="label">Status:</span> ${visitedHtml}</p>
        <p style="margin-top: 5px;"><a href="${wikiUrl}" target="_blank" style="color: #0ff; font-size: 11px;">Wiki ↗</a></p>
      `;
    }
  }

  /**
   * Get distance info for an asteroid using rendered positions
   */
  private getAsteroidDistanceInfo(asteroid: AsteroidInfo): { current: number; min: number; max: number; isNear: boolean } {
    const asteroidAngle = this.solarSystem?.getAsteroidAngle(asteroid.id);
    const earthAngle = this.solarSystem?.getEarthAngle();
    return calculateDistanceFromEarth(asteroid, this.gameState.data.gameTime, asteroidAngle, earthAngle);
  }

  private onPlanMission(): void {
    const selectedId = this.gameState.data.selectedAsteroidId;
    
    // Reset state
    this.selectedProvider = null;
    this.selectedCrew = null;
    this.selectedContract = null;
    this.availableContracts = generateContracts(4, this.gameState.data.market);
    
    if (selectedId) {
      // Check if this asteroid has already been mined - if so, don't use it
      const isMined = this.gameState.data.minedAsteroids.includes(selectedId);
      if (!isMined) {
        // If an asteroid is already selected and not mined, use it
        const asteroid = this.asteroidData.get(selectedId);
        if (asteroid) {
          this.currentMissionAsteroid = asteroid;
          this.cameFromPreselected = true;
          this.openMissionModal(true);
          return;
        }
      }
    }
    
    // No asteroid selected (or it was mined) - start from contract selection
    this.currentMissionAsteroid = null;
    this.cameFromPreselected = false;
    this.openMissionModal(false);
  }

  private openMissionModal(hasPreselectedTarget: boolean): void {
    const modal = document.getElementById('mission-modal');
    if (!modal) return;

    // Populate contract options
    this.populateContractOptions();
    
    // Populate provider/crew options (will be used later)
    this.populateProviderOptions();
    this.populateCrewOptions();

    if (hasPreselectedTarget && this.currentMissionAsteroid) {
      // Start at target confirmation
      this.populateTargetSummary();
      this.showModalStep('step-target');
    } else {
      // Start at contract selection
      this.showModalStep('step-contract');
    }

    // Show modal
    modal.classList.add('visible');
  }

  private closeMissionModal(): void {
    const modal = document.getElementById('mission-modal');
    if (modal) modal.classList.remove('visible');
    this.currentMissionAsteroid = null;
    this.selectedProvider = null;
    this.selectedCrew = null;
    this.selectedContract = null;
    this.cameFromPreselected = false;
    this.isSpecFreeMining = false;
    // Clear selected asteroid so next "Plan a Mission" starts fresh
    this.gameState.update({ selectedAsteroidId: null });
  }

  private showModalStep(stepId: string): void {
    document.querySelectorAll('.modal-step').forEach(el => el.classList.remove('active'));
    const step = document.getElementById(stepId);
    if (step) step.classList.add('active');
  }

  private populateContractOptions(): void {
    const container = document.getElementById('contract-options');
    if (!container) return;

    const level = getCurrentLevel(this.gameState.data.missionsCompleted);
    const hasStorage = hasAnyDepots(this.gameState.data.storage);
    const canSpecFreeMine = level.id >= 3 && hasStorage;

    // Build contract cards
    let html = this.availableContracts.map(contract => {
      const resourceName = contract.resourceType.replace('_', ' ').toUpperCase();
      return `
        <div class="contract-card" data-contract-id="${contract.id}">
          <div class="vendor-name">${contract.vendorName}</div>
          <div class="resource-name">${resourceName}</div>
          <div class="contract-details">
            <div class="contract-detail">
              <span class="label">Quantity:</span>
              <span class="value">${contract.quantityTons.toLocaleString()} tons</span>
            </div>
            <div class="contract-detail">
              <span class="label">Price/ton:</span>
              <span class="value">${formatCurrency(contract.pricePerTon)}</span>
            </div>
            <div class="contract-detail">
              <span class="label">Deadline:</span>
              <span class="value">${contract.deadline} days</span>
            </div>
          </div>
          <div class="total-value">
            <span class="label">Total Value:</span>
            <span class="value">${formatCurrency(contract.totalValue)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Add spec-free mining option if available
    if (canSpecFreeMine) {
      const totalCapacity = getTotalStorageCapacityNew(this.gameState.data.storage);
      const usedCapacity = getTotalStoredTonsNew(this.gameState.data.storage);
      const remainingCapacity = totalCapacity - usedCapacity;
      const depotCount = Object.values(this.gameState.data.storage.depots).reduce((sum, d) => sum + d.count, 0);
      
      html += `
        <div class="contract-card spec-free-card" data-spec-free="true" style="border-color: #4ade80; background: rgba(74, 222, 128, 0.1);">
          <div class="vendor-name" style="color: #4ade80;">⛏️ Spec-Free Mining</div>
          <div class="resource-name">MINE FOR YOURSELF</div>
          <div class="contract-details">
            <div class="contract-detail">
              <span class="label">Depots:</span>
              <span class="value">${depotCount} (${totalCapacity.toLocaleString()} tons total)</span>
            </div>
            <div class="contract-detail">
              <span class="label">Available:</span>
              <span class="value">${remainingCapacity.toLocaleString()} tons</span>
            </div>
            <div class="contract-detail">
              <span class="label">Overflow:</span>
              <span class="value">Sold at market price</span>
            </div>
          </div>
          <div class="total-value">
            <span class="label">Strategy:</span>
            <span class="value" style="font-size: 11px;">Store resources, sell when prices are high</span>
          </div>
        </div>
      `;
    } else if (level.id >= 3) {
      // Show locked spec-free option
      html += `
        <div class="contract-card" style="opacity: 0.5; cursor: not-allowed;">
          <div class="vendor-name" style="color: #888;">⛏️ Spec-Free Mining</div>
          <div class="resource-name" style="color: #888;">REQUIRES STORAGE</div>
          <div style="color: #666; font-size: 11px; padding: 10px 0;">
            Purchase a storage depot to unlock spec-free mining.
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.contract-card').forEach(card => {
      card.addEventListener('click', () => {
        // Skip locked cards
        if ((card as HTMLElement).style.cursor === 'not-allowed') return;
        
        container.querySelectorAll('.contract-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const isSpecFree = (card as HTMLElement).dataset.specFree === 'true';
        
        if (isSpecFree) {
          this.selectedContract = null;
          this.isSpecFreeMining = true;
          this.populateTargetSuggestions();
          this.showModalStep('step-target-select');
        } else {
          const contractId = (card as HTMLElement).dataset.contractId;
          this.selectedContract = this.availableContracts.find(c => c.id === contractId) || null;
          this.isSpecFreeMining = false;
          
          // Move to target selection with this contract
          if (this.selectedContract) {
            this.populateTargetSuggestions();
            this.showModalStep('step-target-select');
          }
        }
      });
    });
  }

  private populateTargetSuggestions(): void {
    const container = document.getElementById('target-options');
    const hint = document.getElementById('target-select-hint');
    if (!container) return;

    // Get best asteroid types for the selected resource
    const goodTypes = this.selectedContract 
      ? getTypesForResource(this.selectedContract.resourceType)
      : [];
    
    const resourceName = this.selectedContract?.resourceType.replace('_', ' ') || 'resources';
    
    // Wikipedia links for asteroid types
    const asteroidTypeWikiLinks: Record<string, string> = {
      'C': 'https://en.wikipedia.org/wiki/C-type_asteroid',
      'S': 'https://en.wikipedia.org/wiki/S-type_asteroid',
      'M': 'https://en.wikipedia.org/wiki/M-type_asteroid',
      'Q': 'https://en.wikipedia.org/wiki/Q-type_asteroid',
      'V': 'https://en.wikipedia.org/wiki/V-type_asteroid',
      'E': 'https://en.wikipedia.org/wiki/E-type_asteroid',
      'D': 'https://en.wikipedia.org/wiki/D-type_asteroid',
      'P': 'https://en.wikipedia.org/wiki/P-type_asteroid',
      'X': 'https://en.wikipedia.org/wiki/X-type_asteroid',
    };
    
    if (hint) {
      if (this.selectedContract) {
        const typeLinks = goodTypes.slice(0, 3).map(type => {
          const url = asteroidTypeWikiLinks[type];
          return url 
            ? `<a href="${url}" target="_blank" class="type-link">${type}</a>` 
            : type;
        }).join(', ');
        hint.innerHTML = `Showing asteroids likely to contain ${resourceName}. Best types: ${typeLinks}-class.`;
      } else {
        hint.textContent = 'Select an asteroid to mine.';
      }
    }

    // Score and sort asteroids by suitability, excluding unavailable asteroids
    const availableAsteroids = Array.from(this.asteroidData.values())
      .filter(asteroid => this.isAsteroidAvailable(asteroid.id)); // Filter out mined and competitor-blocked
    
    // Use centralized match calculation if we have a contract
    let scoredAsteroids: { asteroid: AsteroidInfo; matchPercent: number }[];
    
    if (this.selectedContract) {
      const matchResults = calculateAsteroidMatches(availableAsteroids, this.selectedContract.resourceType);
      scoredAsteroids = matchResults.map(r => ({ asteroid: r.asteroid, matchPercent: r.matchPercent }));
    } else {
      // No contract - just show all asteroids with neutral match
      scoredAsteroids = availableAsteroids.map(asteroid => ({ asteroid, matchPercent: 50 }));
    }

    // Show top 8 suggestions
    const topSuggestions = scoredAsteroids.slice(0, 8);

    container.innerHTML = topSuggestions.map(({ asteroid, matchPercent }) => {
      const distanceInfo = this.getAsteroidDistanceInfo(asteroid);
      const diameterStr = asteroid.diameter ? formatDiameter(asteroid.diameter) : '?';
      
      return `
        <div class="target-card" data-asteroid-id="${asteroid.id}">
          <div class="target-info">
            <div class="target-name">${asteroid.name}</div>
            <div class="target-details">${asteroid.taxonomicClass}-class • ${diameterStr} • ${formatDistance(distanceInfo.current)} (${distanceInfo.isNear ? 'near' : 'far'})</div>
          </div>
          <div class="target-match">
            <div class="match-label">Match</div>
            <div class="match-value">${matchPercent}%</div>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.target-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.target-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const asteroidId = (card as HTMLElement).dataset.asteroidId;
        this.currentMissionAsteroid = this.asteroidData.get(asteroidId!) || null;
        
        const nextBtn = document.getElementById('btn-to-provider-from-target') as HTMLButtonElement;
        if (nextBtn) nextBtn.disabled = false;
      });
    });

    // Reset next button
    const nextBtn = document.getElementById('btn-to-provider-from-target') as HTMLButtonElement;
    if (nextBtn) nextBtn.disabled = true;
  }

  private populateTargetSummary(): void {
    const container = document.getElementById('target-summary');
    if (!container || !this.currentMissionAsteroid) return;

    const asteroid = this.currentMissionAsteroid;
    const distanceInfo = this.getAsteroidDistanceInfo(asteroid);
    const distanceFromEarth = distanceInfo.current;
    const techEffects = this.gameState.getTechEffects();
    const duration = calculateMissionDuration(distanceFromEarth, techEffects.travelTimeModifier);
    const diameterStr = asteroid.diameter ? formatDiameter(asteroid.diameter) : 'Unknown';
    
    // Show estimated resources
    const resources = estimateAsteroidResources(asteroid.taxonomicClass, asteroid.diameter, null);
    const topResources = Object.entries(resources)
      .filter(([_, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    container.innerHTML = `
      <h4 style="color: var(--hud-cyan); margin: 0 0 12px 0;">${asteroid.name}</h4>
      <div class="summary-row">
        <span class="label">Type:</span>
        <span class="value">${asteroid.taxonomicClass}-class Asteroid</span>
      </div>
      <div class="summary-row">
        <span class="label">Distance:</span>
        <span class="value">${formatDistance(distanceFromEarth)} from Earth (${distanceInfo.isNear ? 'near approach' : 'far approach'})</span>
      </div>
      <div class="summary-row">
        <span class="label">Range:</span>
        <span class="value">${formatDistance(distanceInfo.min)} - ${formatDistance(distanceInfo.max)}</span>
      </div>
      <div class="summary-row">
        <span class="label">Diameter:</span>
        <span class="value">${diameterStr}</span>
      </div>
      <div class="summary-row">
        <span class="label">Est. Trip Duration:</span>
        <span class="value">${duration.total.toFixed(1)} days</span>
      </div>
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(84, 230, 255, 0.2);">
        <div style="color: var(--text-muted); font-size: 11px; margin-bottom: 6px;">LIKELY RESOURCES:</div>
        ${topResources.map(([resource, amount]) => `
          <div class="summary-row">
            <span class="label">${resource.replace('_', ' ')}:</span>
            <span class="value">${(amount / 1000).toFixed(0)}t est.</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  private populateProviderOptions(): void {
    const container = document.getElementById('provider-options');
    if (!container) return;

    container.innerHTML = LAUNCH_PROVIDERS.map(provider => `
      <div class="option-card" data-provider-id="${provider.id}">
        <h4>${provider.name}</h4>
        <div class="description">${provider.description}</div>
        <div class="option-stats">
          <div class="option-stat">
            <span class="stat-label">Cost/kg:</span>
            <span class="stat-value">${formatCurrency(provider.costPerKg)}</span>
          </div>
          <div class="option-stat">
            <span class="stat-label">Payload:</span>
            <span class="stat-value">${(provider.payloadCapacity / 1000).toFixed(0)}t</span>
          </div>
          <div class="option-stat">
            <span class="stat-label">Reliability:</span>
            <span class="stat-value">${(provider.reliability * 100).toFixed(1)}%</span>
          </div>
          <div class="option-stat">
            <span class="stat-label">Frequency:</span>
            <span class="stat-value">${provider.launchFrequency}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const providerId = (card as HTMLElement).dataset.providerId;
        this.selectedProvider = LAUNCH_PROVIDERS.find(p => p.id === providerId) || null;
        
        const nextBtn = document.getElementById('btn-to-crew') as HTMLButtonElement;
        if (nextBtn) nextBtn.disabled = false;
      });
    });
  }

  private populateCrewOptions(): void {
    const container = document.getElementById('crew-options');
    if (!container) return;

    container.innerHTML = CREW_TYPES.map(crew => `
      <div class="option-card" data-crew-id="${crew.id}">
        <h4>${crew.name}</h4>
        <div class="description">${crew.description}</div>
        <div class="option-stats">
          <div class="option-stat">
            <span class="stat-label">Daily Cost:</span>
            <span class="stat-value">${formatCurrency(crew.dailyCost)}</span>
          </div>
          <div class="option-stat">
            <span class="stat-label">Efficiency:</span>
            <span class="stat-value">${(crew.miningEfficiency * 100).toFixed(0)}%</span>
          </div>
          <div class="option-stat">
            <span class="stat-label">Reliability:</span>
            <span class="stat-value">${(crew.reliability * 100).toFixed(0)}%</span>
          </div>
          <div class="option-stat">
            <span class="stat-label">Payload Req:</span>
            <span class="stat-value">${(crew.requiredPayload / 1000).toFixed(1)}t</span>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const crewId = (card as HTMLElement).dataset.crewId;
        this.selectedCrew = CREW_TYPES.find(c => c.id === crewId) || null;
        
        const nextBtn = document.getElementById('btn-to-summary') as HTMLButtonElement;
        if (nextBtn) nextBtn.disabled = false;
      });
    });
  }

  private populateMissionSummary(): void {
    const container = document.getElementById('mission-summary');
    if (!container || !this.currentMissionAsteroid || !this.selectedProvider || !this.selectedCrew) return;

    const asteroid = this.currentMissionAsteroid;
    const provider = this.selectedProvider;
    const crew = this.selectedCrew;
    
    const distanceInfo = this.getAsteroidDistanceInfo(asteroid);
    const distanceFromEarth = distanceInfo.current;
    const techEffects = this.gameState.getTechEffects();
    const duration = calculateMissionDuration(distanceFromEarth, techEffects.travelTimeModifier);
    const costs = calculateMissionCost(provider, crew, duration.total, techEffects.crewCostModifier);
    const baseYield = estimateResourceYield(asteroid.diameter, asteroid.taxonomicClass, crew.miningEfficiency, asteroid.mass);
    const estimatedYield = Math.round(baseYield * (techEffects.yieldModifier || 1.0));
    
    const canAfford = this.gameState.data.balance >= costs.totalCost;
    const fundsClass = canAfford ? '' : 'insufficient-funds';

    container.innerHTML = `
      <div class="summary-section">
        <h4>Target</h4>
        <div class="summary-row">
          <span class="label">Asteroid:</span>
          <span class="value">${asteroid.name}</span>
        </div>
        <div class="summary-row">
          <span class="label">Distance:</span>
          <span class="value">${formatDistance(distanceFromEarth)} (${distanceInfo.isNear ? 'near' : 'far'})</span>
        </div>
      </div>

      <div class="summary-section">
        <h4>Mission Details</h4>
        <div class="summary-row">
          <span class="label">Launch Provider:</span>
          <span class="value">${provider.name}</span>
        </div>
        <div class="summary-row">
          <span class="label">Crew:</span>
          <span class="value">${crew.name}</span>
        </div>
        <div class="summary-row">
          <span class="label">Total Duration:</span>
          <span class="value">${duration.total.toFixed(1)} days</span>
        </div>
        <div class="summary-row">
          <span class="label">Est. Yield:</span>
          <span class="value">${estimatedYield.toLocaleString()} tons</span>
        </div>
      </div>

      <div class="summary-section">
        <h4>Costs</h4>
        <div class="summary-row">
          <span class="label">Launch Cost:</span>
          <span class="value">${formatCurrency(costs.launchCost)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Crew Cost (${duration.total} days):</span>
          <span class="value">${formatCurrency(costs.crewCost)}</span>
        </div>
        <div class="summary-row total">
          <span class="label">Total Cost:</span>
          <span class="value ${fundsClass}">${formatCurrency(costs.totalCost)}</span>
        </div>
        <div class="summary-row">
          <span class="label">Your Balance:</span>
          <span class="value ${fundsClass}">${formatCurrency(this.gameState.data.balance)}</span>
        </div>
      </div>
    `;

    // Update launch button state
    const launchBtn = document.getElementById('btn-launch') as HTMLButtonElement;
    if (launchBtn) {
      launchBtn.disabled = !canAfford;
      launchBtn.textContent = canAfford ? 'Launch Mission' : 'Insufficient Funds';
    }
  }

  private launchMission(): void {
    if (!this.currentMissionAsteroid || !this.selectedProvider || !this.selectedCrew) return;

    const asteroid = this.currentMissionAsteroid;
    const provider = this.selectedProvider;
    const crew = this.selectedCrew;
    
    const distanceInfo = this.getAsteroidDistanceInfo(asteroid);
    const distanceFromEarth = distanceInfo.current;
    const techEffects = this.gameState.getTechEffects();
    const duration = calculateMissionDuration(distanceFromEarth, techEffects.travelTimeModifier);
    const costs = calculateMissionCost(provider, crew, duration.total, techEffects.crewCostModifier);

    // Check funds
    if (!this.gameState.subtractMoney(costs.totalCost)) {
      this.addNewsItem('Insufficient funds for mission!', 'critical');
      return;
    }

    // Calculate initial phase duration
    const initialPhase = MissionPhase.CONTRACT_SIGNED;
    const initialPhaseDuration = calculatePhaseDuration(
      initialPhase,
      duration.outbound,
      duration.mining,
      duration.return,
      provider.launchFrequency
    );

    // Calculate total mission duration including all phases
    const contractDuration = initialPhaseDuration;
    const launchDuration = calculatePhaseDuration(MissionPhase.LAUNCH, duration.outbound, duration.mining, duration.return, provider.launchFrequency);
    const deliveryDuration = calculatePhaseDuration(MissionPhase.DELIVERING_PAYLOAD, duration.outbound, duration.mining, duration.return, provider.launchFrequency);
    const totalWithPhases = contractDuration + launchDuration + duration.outbound + duration.mining + duration.return + deliveryDuration;

    // Determine target depot for spec-free mining (use first owned depot)
    const ownedDepotIds = Object.keys(this.gameState.data.storage.depots).filter(
      id => this.gameState.data.storage.depots[id].count > 0
    );
    const targetDepotId = this.isSpecFreeMining && ownedDepotIds.length > 0
      ? ownedDepotIds[0]
      : undefined;

    // Generate captain name and delivery destination
    const captainName = generateCaptainName();
    const deliveryDestinations: ('LEO' | 'GEO' | 'Lunar')[] = ['LEO', 'GEO', 'Lunar'];
    const deliveryDestination = deliveryDestinations[Math.floor(Math.random() * deliveryDestinations.length)];
    
    // Calculate expected payload
    const expectedPayload = estimateResourceYield(asteroid.diameter, asteroid.taxonomicClass, crew.miningEfficiency, asteroid.mass);

    // Create mission
    const mission: Mission = {
      id: generateMissionId(),
      asteroidId: asteroid.id,
      asteroidName: asteroid.name,
      providerId: provider.id,
      providerName: provider.name,
      crewId: crew.id,
      crewName: crew.name,
      captainName,
      // Contract info
      contractId: this.selectedContract?.id,
      contractVendorName: this.selectedContract?.vendorName,
      contractValue: this.selectedContract?.totalValue,
      contractDeadline: this.selectedContract?.deadline,
      resourceType: this.selectedContract?.resourceType || this.currentMissionAsteroid?.taxonomicClass || 'Unknown',
      isSpecFreeMining: this.isSpecFreeMining,
      targetDepotId: targetDepotId,
      // Distance
      distanceAU: distanceFromEarth,
      // Timing
      launchTime: this.gameState.data.gameTime,
      outboundDuration: duration.outbound,
      miningDuration: duration.mining,
      returnDuration: duration.return,
      totalDuration: totalWithPhases,
      launchCost: costs.launchCost,
      crewCost: costs.crewCost,
      totalCost: costs.totalCost,
      status: MissionStatus.OUTBOUND,
      progress: 0,
      // Phase tracking
      currentPhase: initialPhase,
      phaseStartTime: this.gameState.data.gameTime,
      phaseDuration: initialPhaseDuration,
      phaseJustChanged: false,
      providerReliability: provider.reliability,
      crewReliability: crew.reliability,
      // Payload and delivery
      expectedPayload,
      deliveryDestination,
    };

    // Add to game state
    this.gameState.addMission(mission);

    // Update UI
    this.updateActiveMissionsList();

    // Close modal and show news
    this.closeMissionModal();
    const newsType = this.isSpecFreeMining ? 'Spec-free mining mission' : 'Contract signed';
    this.addNewsItem(`${newsType} for mission to ${asteroid.name}!`, 'important');
  }

  private setupMissionModal(): void {
    // Close button
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeMissionModal());
    document.getElementById('btn-cancel')?.addEventListener('click', () => this.closeMissionModal());

    // Navigation buttons
    document.getElementById('btn-to-provider')?.addEventListener('click', () => {
      this.showModalStep('step-provider');
    });
    document.getElementById('btn-back-target')?.addEventListener('click', () => {
      // Go back to the appropriate target step
      if (this.cameFromPreselected) {
        this.showModalStep('step-target');
      } else {
        this.showModalStep('step-target-select');
      }
    });
    document.getElementById('btn-to-crew')?.addEventListener('click', () => {
      this.showModalStep('step-crew');
    });
    document.getElementById('btn-back-provider')?.addEventListener('click', () => {
      this.showModalStep('step-provider');
    });
    document.getElementById('btn-to-summary')?.addEventListener('click', () => {
      this.populateMissionSummary();
      this.showModalStep('step-summary');
    });
    document.getElementById('btn-back-crew')?.addEventListener('click', () => {
      this.showModalStep('step-crew');
    });
    document.getElementById('btn-launch')?.addEventListener('click', () => {
      this.launchMission();
    });

    // New contract flow buttons
    document.getElementById('btn-skip-contract')?.addEventListener('click', () => {
      this.selectedContract = null;
      this.populateTargetSuggestions();
      this.showModalStep('step-target-select');
    });
    document.getElementById('btn-back-contract')?.addEventListener('click', () => {
      this.showModalStep('step-contract');
    });
    document.getElementById('btn-manual-select')?.addEventListener('click', () => {
      // Close modal, let user select from map
      this.closeMissionModal();
      this.addNewsItem('Select an asteroid from the map, then click Plan Mission', 'market');
    });
    document.getElementById('btn-to-provider-from-target')?.addEventListener('click', () => {
      if (this.currentMissionAsteroid) {
        this.showModalStep('step-provider');
      }
    });
    document.getElementById('btn-back-to-contract')?.addEventListener('click', () => {
      if (this.cameFromPreselected) {
        this.closeMissionModal();
      } else {
        this.showModalStep('step-contract');
      }
    });

    // Close on overlay click
    document.getElementById('mission-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeMissionModal();
      }
    });
  }

  private updateActiveMissionsList(): void {
    const container = document.getElementById('active-missions-list');
    if (!container) return;

    const missions = this.gameState.data.activeMissions;
    
    if (missions.length === 0) {
      container.innerHTML = '<p style="color: #888;">No active missions</p>';
      return;
    }

    container.innerHTML = missions.map(mission => {
      const progressPercent = Math.round(mission.progress * 100);
      const phaseInfo = PHASE_INFO[mission.currentPhase];
      
      // Determine terminal state class
      let terminalClass = '';
      if (phaseInfo.isTerminal) {
        terminalClass = phaseInfo.isSuccess ? 'terminal-success' : 'terminal-failure';
      }
      
      // Pulse class for phase changes
      const pulseClass = mission.phaseJustChanged ? 'pulse' : '';
      
      return `
        <div class="mission-item ${terminalClass}" data-mission-id="${mission.id}">
          <div class="mission-name">${mission.asteroidName}</div>
          <div class="mission-status">${this.getMissionStatusText(mission)}</div>
          <div class="mission-progress ${pulseClass}">
            <div class="mission-progress-bar" style="width: ${progressPercent}%"></div>
          </div>
        </div>
      `;
    }).join('');

    // Clear phaseJustChanged flags after rendering
    missions.forEach(mission => {
      if (mission.phaseJustChanged) {
        this.gameState.updateMission(mission.id, { phaseJustChanged: false });
      }
    });
  }

  private setupMissionListClickHandler(): void {
    const container = document.getElementById('active-missions-list');
    if (!container) return;

    // Use event delegation - attach once to container
    container.addEventListener('click', (e) => {
      const missionItem = (e.target as HTMLElement).closest('.mission-item');
      if (missionItem) {
        const missionId = (missionItem as HTMLElement).dataset.missionId;
        if (missionId) {
          this.showPhaseModal(missionId);
        }
      }
    });
  }

  private getMissionStatusText(mission: Mission): string {
    const phaseInfo = PHASE_INFO[mission.currentPhase];
    
    if (phaseInfo.isTerminal) {
      return phaseInfo.name;
    }
    
    const phaseElapsed = this.gameState.data.gameTime - mission.phaseStartTime;
    const phaseRemaining = Math.max(0, Math.round(mission.phaseDuration - phaseElapsed));
    
    return `${phaseInfo.name} - ${phaseRemaining} days`;
  }

  private showPhaseModal(missionId: string): void {
    const mission = this.gameState.getMission(missionId);
    if (!mission) return;

    const phaseInfo = PHASE_INFO[mission.currentPhase];
    const modal = document.getElementById('phase-modal');
    const content = document.getElementById('phase-modal-content');
    const image = document.getElementById('phase-modal-image') as HTMLImageElement;
    const title = document.getElementById('phase-modal-title');
    const asteroidInfo = document.getElementById('phase-modal-asteroid-info');
    const description = document.getElementById('phase-modal-description');
    const details = document.getElementById('phase-modal-details');

    if (!modal || !content || !image || !title || !asteroidInfo || !description || !details) return;

    // Get asteroid data for display
    const asteroid = this.asteroidData.get(mission.asteroidId);
    const AU_IN_KM = 149597870.7;
    const SPEED_OF_LIGHT = 299792.458; // km/s

    // Set basic content
    image.src = phaseInfo.image;
    image.alt = phaseInfo.name;
    title.textContent = phaseInfo.name;
    description.textContent = phaseInfo.description;

    // Build asteroid info section with Wikipedia link
    const asteroidWikiName = mission.asteroidName.replace(/\s+/g, '_');
    const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(asteroidWikiName)}`;
    const distanceKm = mission.distanceAU ? (mission.distanceAU * AU_IN_KM).toFixed(0) : 'N/A';
    const diameterDisplay = asteroid?.diameter ? `${asteroid.diameter.toFixed(1)} km` : 'Unknown';
    const typeDisplay = asteroid?.taxonomicClass || 'Unknown';
    
    asteroidInfo.innerHTML = `
      <strong>Target:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener">${mission.asteroidName}</a><br>
      <strong>Type:</strong> ${typeDisplay}-type &nbsp;|&nbsp; 
      <strong>Diameter:</strong> ${diameterDisplay} &nbsp;|&nbsp;
      <strong>Distance:</strong> ${mission.distanceAU?.toFixed(3) || 'N/A'} AU (${Number(distanceKm).toLocaleString()} km)
    `;

    // Build phase-specific details
    let detailsHtml = '';
    
    switch (mission.currentPhase) {
      case MissionPhase.CONTRACT_SIGNED: {
        // Show payload type, qty, due date, agreed price, market price
        // Game starts January 1, 2032 - calculate due date from launchTime + deadline
        const gameStartDate = new Date(2032, 0, 1); // January 1, 2032
        const deadlineDays = mission.contractDeadline || mission.totalDuration;
        const dueDateGameDays = mission.launchTime + deadlineDays;
        const dueDate = new Date(gameStartDate.getTime() + dueDateGameDays * 24 * 60 * 60 * 1000);
        const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const currentPrice = getSpotPrice(this.gameState.data.market, mission.resourceType as ResourceType);
        const expectedPayload = mission.expectedPayload || 0;
        
        // Show warning if mission duration exceeds deadline
        const missionDays = mission.totalDuration;
        const isAchievable = missionDays <= deadlineDays;
        const daysToSpare = deadlineDays - missionDays;
        
        // Calculate contract price per ton and premium
        const contractPricePerTon = mission.contractValue && expectedPayload > 0 
          ? mission.contractValue / expectedPayload 
          : null;
        const premiumPercent = contractPricePerTon && currentPrice > 0
          ? ((contractPricePerTon - currentPrice) / currentPrice) * 100
          : null;
        
        detailsHtml = `
          <div class="detail-section">
            <div><span class="detail-label">Payload Type:</span> <span class="detail-value highlight">${mission.resourceType}</span></div>
            <div><span class="detail-label">Expected Yield:</span> <span class="detail-value">${expectedPayload.toFixed(1)} tons</span></div>
            <div><span class="detail-label">Due Date:</span> <span class="detail-value">${dueDateStr}</span> <span style="color: var(--text-muted);">(${deadlineDays} days)</span></div>
            <div><span class="detail-label">Est. Mission Time:</span> <span class="detail-value ${isAchievable ? '' : 'loss'}">${missionDays.toFixed(1)} days</span> ${isAchievable ? `<span class="detail-value profit">(${daysToSpare.toFixed(1)} days to spare)</span>` : '<span class="detail-value loss">(WILL BE LATE)</span>'}</div>
            ${mission.contractValue ? `<div><span class="detail-label">Contract Value:</span> <span class="detail-value profit">$${mission.contractValue.toLocaleString()}</span></div>` : ''}
            ${mission.contractVendorName ? `<div><span class="detail-label">Vendor:</span> <span class="detail-value">${mission.contractVendorName}</span></div>` : ''}
            ${contractPricePerTon ? `<div><span class="detail-label">Agreed Price:</span> <span class="detail-value">$${contractPricePerTon.toLocaleString(undefined, {maximumFractionDigits: 0})}/ton</span> ${premiumPercent !== null ? `<span class="detail-value ${premiumPercent >= 0 ? 'profit' : 'loss'}">(${premiumPercent >= 0 ? '+' : ''}${premiumPercent.toFixed(1)}% vs market)</span>` : ''}</div>` : ''}
            <div><span class="detail-label">Current Market Price:</span> <span class="detail-value">$${currentPrice.toLocaleString()}/ton</span></div>
          </div>
        `;
        break;
      }
      
      case MissionPhase.LAUNCH: {
        // Show provider, payload weight, launch date, wet dress rehearsal
        const launchDate = new Date(mission.phaseStartTime);
        const launchDateStr = launchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const payloadWeight = mission.expectedPayload ? (mission.expectedPayload * 1000).toFixed(0) : 'N/A'; // Convert tons to kg
        
        detailsHtml = `
          <div class="detail-section">
            <div><span class="detail-label">Launch Provider:</span> <span class="detail-value highlight">${mission.providerName}</span></div>
            <div><span class="detail-label">Payload to Orbit:</span> <span class="detail-value">${Number(payloadWeight).toLocaleString()} kg</span></div>
            <div><span class="detail-label">Launch Date:</span> <span class="detail-value">${launchDateStr}</span></div>
            <div><span class="detail-label">Wet Dress Rehearsal:</span> <span class="detail-value profit">✓ PASSED</span></div>
            <div><span class="detail-label">Provider Reliability:</span> <span class="detail-value">${((mission.providerReliability || 0.98) * 100).toFixed(0)}%</span></div>
          </div>
        `;
        break;
      }
      
      case MissionPhase.OUTBOUND: {
        // Show vehicle speed, distance in AU and km, captain's name
        const distanceKmNum = mission.distanceAU ? mission.distanceAU * AU_IN_KM : 0;
        const travelTimeSeconds = (mission.outboundDuration || 30) * 24 * 60 * 60;
        const speedKmS = distanceKmNum / travelTimeSeconds;
        const speedPercentC = (speedKmS / SPEED_OF_LIGHT) * 100;
        
        detailsHtml = `
          <div class="detail-section">
            <div><span class="detail-label">Captain:</span> <span class="detail-value highlight">${mission.captainName || 'Unknown'}</span></div>
            <div><span class="detail-label">Distance:</span> <span class="detail-value">${mission.distanceAU?.toFixed(3) || 'N/A'} AU (${distanceKmNum.toLocaleString(undefined, {maximumFractionDigits: 0})} km)</span></div>
            <div><span class="detail-label">Vehicle Speed:</span> <span class="detail-value">${speedKmS.toFixed(1)} km/s (${speedPercentC.toFixed(4)}% c)</span></div>
            <div><span class="detail-label">Travel Time:</span> <span class="detail-value">${mission.outboundDuration || 30} days</span></div>
            <div><span class="detail-label">Crew:</span> <span class="detail-value">${mission.crewName}</span></div>
          </div>
        `;
        break;
      }
      
      case MissionPhase.DRILLING: {
        // Show crew type, current payload extracted (based on time elapsed)
        const phaseElapsed = (this.gameState.data.gameTime - mission.phaseStartTime) / (24 * 60 * 60 * 1000);
        const phaseDuration = mission.miningDuration || 30;
        const progress = Math.min(phaseElapsed / phaseDuration, 1);
        const currentExtracted = (mission.expectedPayload || 0) * progress;
        
        detailsHtml = `
          <div class="detail-section">
            <div><span class="detail-label">Crew Type:</span> <span class="detail-value highlight">${mission.crewName}</span></div>
            <div><span class="detail-label">Mining Progress:</span> <span class="detail-value">${(progress * 100).toFixed(1)}%</span></div>
            <div><span class="detail-label">Payload Extracted:</span> <span class="detail-value">${currentExtracted.toFixed(2)} tons of ${mission.resourceType}</span></div>
            <div><span class="detail-label">Target Payload:</span> <span class="detail-value">${(mission.expectedPayload || 0).toFixed(1)} tons</span></div>
            <div><span class="detail-label">Crew Reliability:</span> <span class="detail-value">${((mission.crewReliability || 0.98) * 100).toFixed(0)}%</span></div>
          </div>
        `;
        break;
      }
      
      case MissionPhase.INBOUND: {
        // Show vehicle speed, distance, captain, payload type/weight/%
        const distanceKmNum = mission.distanceAU ? mission.distanceAU * AU_IN_KM : 0;
        const travelTimeSeconds = (mission.returnDuration || 30) * 24 * 60 * 60;
        const speedKmS = distanceKmNum / travelTimeSeconds;
        const speedPercentC = (speedKmS / SPEED_OF_LIGHT) * 100;
        const actualPayload = mission.resourcesGained || mission.expectedPayload || 0;
        const payloadPercent = mission.expectedPayload ? (actualPayload / mission.expectedPayload) * 100 : 100;
        
        detailsHtml = `
          <div class="detail-section">
            <div><span class="detail-label">Captain:</span> <span class="detail-value highlight">${mission.captainName || 'Unknown'}</span></div>
            <div><span class="detail-label">Return Distance:</span> <span class="detail-value">${mission.distanceAU?.toFixed(3) || 'N/A'} AU (${distanceKmNum.toLocaleString(undefined, {maximumFractionDigits: 0})} km)</span></div>
            <div><span class="detail-label">Vehicle Speed:</span> <span class="detail-value">${speedKmS.toFixed(1)} km/s (${speedPercentC.toFixed(4)}% c)</span></div>
            <div><span class="detail-label">Travel Time:</span> <span class="detail-value">${mission.returnDuration || 30} days</span></div>
          </div>
          <div class="detail-section">
            <div><span class="detail-label">Payload Type:</span> <span class="detail-value highlight">${mission.resourceType}</span></div>
            <div><span class="detail-label">Payload Weight:</span> <span class="detail-value">${actualPayload.toFixed(1)} tons (${(actualPayload * 1000).toLocaleString()} kg)</span></div>
            <div><span class="detail-label">% of Target:</span> <span class="detail-value ${payloadPercent >= 100 ? 'profit' : ''}">${payloadPercent.toFixed(1)}%</span></div>
          </div>
        `;
        break;
      }
      
      case MissionPhase.DELIVERING_PAYLOAD: {
        // Show payload info, delivery destination
        const actualPayload = mission.resourcesGained || mission.expectedPayload || 0;
        const payloadPercent = mission.expectedPayload ? (actualPayload / mission.expectedPayload) * 100 : 100;
        const destinationNames = { 'LEO': 'Low Earth Orbit', 'GEO': 'Geosynchronous Orbit', 'Lunar': 'Lunar Storage' };
        const destination = mission.deliveryDestination || 'LEO';
        
        detailsHtml = `
          <div class="detail-section">
            <div><span class="detail-label">Payload Type:</span> <span class="detail-value highlight">${mission.resourceType}</span></div>
            <div><span class="detail-label">Payload Weight:</span> <span class="detail-value">${actualPayload.toFixed(1)} tons (${(actualPayload * 1000).toLocaleString()} kg)</span></div>
            <div><span class="detail-label">% of Target:</span> <span class="detail-value ${payloadPercent >= 100 ? 'profit' : ''}">${payloadPercent.toFixed(1)}%</span></div>
          </div>
          <div class="detail-section">
            <div><span class="detail-label">Delivery To:</span> <span class="detail-value highlight">${destinationNames[destination]}</span></div>
            <div><span class="detail-label">Status:</span> <span class="detail-value profit">PAYLOAD TRANSFER IN PROGRESS</span></div>
          </div>
        `;
        break;
      }
      
      case MissionPhase.MISSION_SUCCESS: {
        // Full breakdown: payload, contract value, deviations, costs, profit
        // NOTE: Must match onMissionComplete calculation for consistency
        const actualPayload = mission.resourcesGained || mission.expectedPayload || 0;
        const payloadPercent = mission.expectedPayload ? (actualPayload / mission.expectedPayload) * 100 : 100;
        
        // Calculate revenue - must match onMissionComplete logic
        const crew = CREW_TYPES.find(c => c.id === mission.crewId);
        const efficiency = crew?.miningEfficiency || 1;
        const resourcePrice = getSpotPrice(this.gameState.data.market, mission.resourceType as ResourceType);
        
        let finalRevenue: number;
        let lateModifier = 1.0;
        let daysLate = 0;
        
        if (mission.contractValue) {
          // Contract-based: use crew efficiency modifier (same as onMissionComplete)
          const efficiencyModifier = 0.8 + (efficiency * 0.4); // Range: 0.88 to 1.28
          let baseRevenue = Math.round(mission.contractValue * efficiencyModifier);
          
          // Apply late delivery penalty if applicable
          if (mission.contractDeadline) {
            const missionDuration = this.gameState.data.gameTime - mission.launchTime;
            daysLate = Math.max(0, missionDuration - mission.contractDeadline);
            if (daysLate > 0) {
              const penaltyPercent = Math.min(1.0, daysLate / mission.contractDeadline);
              lateModifier = 1.0 - penaltyPercent;
            }
          }
          
          finalRevenue = Math.round(baseRevenue * lateModifier);
        } else {
          // Market-based
          finalRevenue = actualPayload * resourcePrice;
        }
        
        // Calculate profit (costs were deducted at contract signing, revenue added at completion)
        const totalCosts = mission.totalCost || 0;
        const netProfit = finalRevenue - totalCosts;
        
        const destinationNames = { 'LEO': 'Low Earth Orbit', 'GEO': 'Geosynchronous Orbit', 'Lunar': 'Lunar Storage' };
        const destination = mission.deliveryDestination || 'LEO';
        
        // Show efficiency bonus/penalty
        const efficiencyPercent = mission.contractValue ? ((0.8 + (efficiency * 0.4)) * 100 - 100) : 0;
        const latePenaltyPercent = (1 - lateModifier) * 100;
        
        detailsHtml = `
          <div class="detail-section success-section">
            <div><span class="detail-label">Payload Delivered:</span> <span class="detail-value highlight">${actualPayload.toFixed(1)} tons of ${mission.resourceType}</span></div>
            <div><span class="detail-label">% of Target:</span> <span class="detail-value ${payloadPercent >= 100 ? 'profit' : ''}">${payloadPercent.toFixed(1)}%</span></div>
            <div><span class="detail-label">Delivered To:</span> <span class="detail-value">${destinationNames[destination]}</span></div>
          </div>
          <div class="detail-section">
            <div><span class="detail-label">${mission.contractValue ? 'Contract Value:' : 'Market Value:'}</span> <span class="detail-value">$${(mission.contractValue || (actualPayload * resourcePrice)).toLocaleString()}</span></div>
            ${mission.contractValue ? `<div><span class="detail-label">Crew Efficiency (${mission.crewName}):</span> <span class="detail-value ${efficiencyPercent >= 0 ? 'profit' : 'loss'}">${efficiencyPercent >= 0 ? '+' : ''}${efficiencyPercent.toFixed(1)}%</span></div>` : ''}
            ${daysLate > 0 ? `<div><span class="detail-label">Late Penalty (${daysLate.toFixed(1)} days late):</span> <span class="detail-value loss">-${latePenaltyPercent.toFixed(1)}%</span></div>` : ''}
            <div><span class="detail-label">Final Payout:</span> <span class="detail-value profit">$${finalRevenue.toLocaleString()}</span></div>
          </div>
          <div class="detail-section">
            <div><span class="detail-label">Vehicle Rental (${mission.providerName}):</span> <span class="detail-value">$${(mission.launchCost || 0).toLocaleString()}</span></div>
            <div><span class="detail-label">Crew Rental (${mission.crewName}):</span> <span class="detail-value">$${(mission.crewCost || 0).toLocaleString()}</span></div>
            <div><span class="detail-label">Total Costs:</span> <span class="detail-value">$${totalCosts.toLocaleString()}</span></div>
          </div>
          <div class="detail-section ${netProfit >= 0 ? 'success-section' : 'failure-section'}">
            <div><span class="detail-label">NET PROFIT:</span> <span class="detail-value ${netProfit >= 0 ? 'profit' : 'loss'}">$${netProfit.toLocaleString()}</span></div>
          </div>
        `;
        break;
      }
      
      // Terminal failure states
      case MissionPhase.LAUNCH_ANOMALY:
      case MissionPhase.IN_FLIGHT_ANOMALY:
      case MissionPhase.EXPLOSION_AT_DRILL_SITE: {
        detailsHtml = `
          <div class="detail-section failure-section">
            <div><span class="detail-label">Mission Status:</span> <span class="detail-value loss">MISSION LOST</span></div>
            <div><span class="detail-label">Total Investment Lost:</span> <span class="detail-value loss">$${(mission.totalCost || 0).toLocaleString()}</span></div>
            <div><span class="detail-label">Vehicle:</span> <span class="detail-value">${mission.providerName}</span></div>
            <div><span class="detail-label">Crew:</span> <span class="detail-value">${mission.crewName}</span></div>
          </div>
        `;
        break;
      }
      
      // Pirate encounters
      case MissionPhase.PIRATE_ATTACK_OUTBOUND:
      case MissionPhase.PIRATE_ATTACK_INBOUND: {
        detailsHtml = `
          <div class="detail-section failure-section">
            <div><span class="detail-label">Alert:</span> <span class="detail-value loss">HOSTILE CONTACT DETECTED</span></div>
            <div><span class="detail-label">Captain:</span> <span class="detail-value">${mission.captainName || 'Unknown'}</span></div>
            <div><span class="detail-label">Crew:</span> <span class="detail-value">${mission.crewName}</span></div>
            <div><span class="detail-label">Payload at Risk:</span> <span class="detail-value">${(mission.expectedPayload || 0).toFixed(1)} tons of ${mission.resourceType}</span></div>
          </div>
        `;
        break;
      }
      
      case MissionPhase.PIRATES_DEFEATED: {
        detailsHtml = `
          <div class="detail-section success-section">
            <div><span class="detail-label">Combat Result:</span> <span class="detail-value profit">PIRATES DEFEATED</span></div>
            <div><span class="detail-label">Captain:</span> <span class="detail-value">${mission.captainName || 'Unknown'}</span></div>
            <div><span class="detail-label">Payload Secured:</span> <span class="detail-value">${(mission.expectedPayload || 0).toFixed(1)} tons of ${mission.resourceType}</span></div>
            ${mission.combatResult ? `<div style="margin-top: 8px; font-style: italic; color: var(--text-muted);">${mission.combatResult.narrative}</div>` : ''}
          </div>
        `;
        break;
      }
      
      case MissionPhase.PIRATES_WON:
      case MissionPhase.PAYLOAD_SEIZED: {
        const payloadLost = mission.currentPhase === MissionPhase.PIRATES_WON ? 'ALL' : '80%';
        detailsHtml = `
          <div class="detail-section failure-section">
            <div><span class="detail-label">Combat Result:</span> <span class="detail-value loss">${mission.currentPhase === MissionPhase.PIRATES_WON ? 'TOTAL LOSS' : 'PAYLOAD SEIZED'}</span></div>
            <div><span class="detail-label">Payload Lost:</span> <span class="detail-value loss">${payloadLost}</span></div>
            <div><span class="detail-label">Captain:</span> <span class="detail-value">${mission.captainName || 'Unknown'}</span></div>
            ${mission.combatResult ? `<div style="margin-top: 8px; font-style: italic; color: var(--text-muted);">${mission.combatResult.narrative}</div>` : ''}
          </div>
        `;
        break;
      }
      
      default:
        detailsHtml = '';
    }
    
    details.innerHTML = detailsHtml;

    // Set styling based on terminal state
    content.classList.remove('failure', 'success');
    if (phaseInfo.isTerminal) {
      if (phaseInfo.isSuccess) {
        content.classList.add('success');
      } else {
        content.classList.add('failure');
      }
    }

    // Store mission ID for dismiss handler
    modal.dataset.missionId = missionId;

    // Show modal
    modal.classList.add('visible');
  }

  private closePhaseModal(): void {
    const modal = document.getElementById('phase-modal');
    if (!modal) return;

    const missionId = modal.dataset.missionId;
    modal.classList.remove('visible');

    // If terminal state, remove mission
    if (missionId) {
      const mission = this.gameState.getMission(missionId);
      if (mission) {
        const phaseInfo = PHASE_INFO[mission.currentPhase];
        if (phaseInfo.isTerminal) {
          // Handle completion/failure
          if (phaseInfo.isSuccess) {
            this.onMissionComplete(mission);
          } else {
            this.onMissionFailed(mission);
          }
          this.gameState.removeMission(missionId);
          this.updateActiveMissionsList();
        }
      }
    }
  }

  private setupPhaseModal(): void {
    document.getElementById('phase-modal-close')?.addEventListener('click', () => this.closePhaseModal());
    document.getElementById('phase-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closePhaseModal();
      }
    });
  }

  private setupHelp(): void {
    // Show initial random tip
    this.showRandomTip();

    // Rotate tips every 30 seconds
    setInterval(() => this.showRandomTip(), 30000);

    // Update layout first
    this.updateHelpHeaderGlow();
    this.updateLeftPanelLayout();

    // Use event delegation on left panel to catch clicks on help elements
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel) {
      leftPanel.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.id === 'help-header' || target.id === 'help-more-link' ||
            target.closest('#help-header') || target.closest('#help-more-link')) {
          e.preventDefault();
          this.showHelpModal();
        }
      });
    }

    // Close help modal
    document.getElementById('help-modal-close')?.addEventListener('click', () => this.closeHelpModal());
    document.getElementById('help-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeHelpModal();
      }
    });
    
    // Subscribe to state changes to update UI when level changes
    this.gameState.subscribe('help-panel-layout', () => {
      this.updateHelpHeaderGlow();
      this.updateLeftPanelLayout();
    });
  }
  
  private updateHelpHeaderGlow(): void {
    const header = document.getElementById('help-header');
    if (!header) return;
    
    // Show glow for new players (no missions completed, starting balance intact)
    const isNewPlayer = this.gameState.data.missionsCompleted === 0 && 
                        this.gameState.data.balance >= 50000000;
    
    if (isNewPlayer) {
      header.classList.add('new-player-glow');
    } else {
      header.classList.remove('new-player-glow');
    }
  }
  
  private updateLeftPanelLayout(): void {
    const level = getCurrentLevel(this.gameState.data.missionsCompleted).id;
    
    const techSection = document.getElementById('tech-tree-section');
    const assetsSection = document.getElementById('assets-section');
    const storageSection = document.getElementById('storage-section');
    
    if (level === 1) {
      // Level 1: Just hide tech/assets/storage - help stays in original position
      if (techSection) techSection.style.display = 'none';
      if (assetsSection) assetsSection.style.display = 'none';
      if (storageSection) storageSection.style.display = 'none';
    } else {
      // Level 2+: Show appropriate sections
      if (techSection) techSection.style.display = 'block';
      if (assetsSection) assetsSection.style.display = 'block';
      if (level >= 3 && storageSection) {
        storageSection.style.display = 'block';
      } else if (storageSection) {
        storageSection.style.display = 'none';
      }
    }
  }

  private showRandomTip(): void {
    const tipEl = document.getElementById('help-tip-text');
    if (tipEl) {
      const tip = getRandomTip();
      tipEl.innerHTML = tip.text;
    }
  }

  private showHelpModal(): void {
    const modal = document.getElementById('help-modal');
    const walkthrough = document.getElementById('help-walkthrough');
    const progressionList = document.getElementById('help-progression-list');
    const tipsList = document.getElementById('help-tips-list');
    const refsList = document.getElementById('help-references-list');

    if (!modal) return;

    // Populate walkthrough (convert markdown-style to HTML)
    if (walkthrough) {
      walkthrough.innerHTML = GAMEPLAY_WALKTHROUGH
        .split('\n\n')
        .map(para => {
          // Convert **text** to <strong>text</strong>
          para = para.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          return `<p>${para}</p>`;
        })
        .join('');
    }

    // Populate progression levels
    if (progressionList) {
      const currentLevel = getCurrentLevel(this.gameState.data.missionsCompleted);
      progressionList.innerHTML = PROGRESSION_LEVELS
        .map(level => `
          <div class="progression-level ${level.id === currentLevel.id ? 'current' : ''}">
            <div class="progression-level-header">
              <span class="progression-level-name">${level.name}</span>
              <span class="progression-level-range">${level.contractRange}</span>
            </div>
            <div class="progression-level-desc">${level.description}</div>
            <div class="progression-level-goal">Goal: ${level.goal}</div>
          </div>
        `)
        .join('');
    }

    // Populate tips
    if (tipsList) {
      tipsList.innerHTML = GAMEPLAY_TIPS
        .map(tip => `<li>${tip.text}</li>`)
        .join('');
    }

    // Populate references
    if (refsList) {
      refsList.innerHTML = REFERENCES
        .map(ref => `
          <li>
            <a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="help-reference-link">${ref.title}</a>
            ${ref.description ? `<div class="help-reference-desc">${ref.description}</div>` : ''}
          </li>
        `)
        .join('');
    }

    modal.classList.add('visible');
  }

  private closeHelpModal(): void {
    const modal = document.getElementById('help-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  // === TECH TREE ===

  private setupTechTree(): void {
    // Update tech tree section visibility based on level
    this.updateTechTreeSection();

    // Subscribe to state changes to update tech tree
    this.gameState.subscribe('tech-tree', () => this.updateTechTreeSection());

    // Open tech tree modal button
    document.getElementById('open-tech-tree-btn')?.addEventListener('click', () => this.showTechTreeModal());

    // Close tech tree modal
    document.getElementById('tech-modal-close')?.addEventListener('click', () => this.closeTechTreeModal());
    document.getElementById('tech-tree-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeTechTreeModal();
      }
    });
  }

  private updateTechTreeSection(): void {
    const lockedEl = document.getElementById('tech-tree-locked');
    const contentEl = document.getElementById('tech-tree-content');
    const statusEl = document.getElementById('tech-tree-status');
    const effectsEl = document.getElementById('tech-effects-summary');

    const playerLevel = this.gameState.getPlayerLevel();
    const isUnlocked = playerLevel >= 2;

    if (lockedEl) lockedEl.style.display = isUnlocked ? 'none' : 'block';
    if (contentEl) contentEl.style.display = isUnlocked ? 'block' : 'none';
    if (statusEl) statusEl.textContent = isUnlocked ? '' : '(Level 2+)';

    // Update effects summary in left panel
    if (effectsEl && isUnlocked) {
      const effects = this.gameState.getTechEffects();
      const lines: string[] = [];
      
      if (effects.travelTimeModifier && effects.travelTimeModifier < 1.0) {
        const pct = Math.round((1 - effects.travelTimeModifier) * 100);
        lines.push(`<div class="tech-effect-row"><span>Travel Time:</span><span class="tech-effect-value">-${pct}%</span></div>`);
      }
      if (effects.yieldModifier && effects.yieldModifier > 1.0) {
        const pct = Math.round((effects.yieldModifier - 1) * 100);
        lines.push(`<div class="tech-effect-row"><span>Mining Yield:</span><span class="tech-effect-value">+${pct}%</span></div>`);
      }
      if (effects.anomalyReduction && effects.anomalyReduction > 0) {
        const pct = Math.round(effects.anomalyReduction * 100);
        lines.push(`<div class="tech-effect-row"><span>Anomaly Risk:</span><span class="tech-effect-value">-${pct}%</span></div>`);
      }
      if (effects.crewCostModifier && effects.crewCostModifier < 1.0) {
        const pct = Math.round((1 - effects.crewCostModifier) * 100);
        lines.push(`<div class="tech-effect-row"><span>Crew Costs:</span><span class="tech-effect-value">-${pct}%</span></div>`);
      }
      
      if (lines.length === 0) {
        effectsEl.innerHTML = '<span style="color: #666;">No upgrades yet</span>';
      } else {
        effectsEl.innerHTML = lines.join('');
      }
    }
  }

  private showTechTreeModal(): void {
    const modal = document.getElementById('tech-tree-modal');
    const categoriesEl = document.getElementById('tech-categories');
    const balanceEl = document.getElementById('tech-modal-balance');
    const effectsEl = document.getElementById('tech-modal-effects');

    if (!modal || !categoriesEl) return;

    // Update balance display
    if (balanceEl) {
      balanceEl.textContent = formatCurrency(this.gameState.data.balance);
    }

    const playerLevel = this.gameState.getPlayerLevel();
    const unlockedTechs = this.gameState.getUnlockedTechs();
    const visibleTechs = getVisibleTechs(playerLevel, unlockedTechs);
    const visibleIds = new Set(visibleTechs.map(t => t.id));

    // Build category columns
    const categories: TechCategory[] = ['propulsion', 'mining', 'stabilization', 'navigation', 'automation'];
    
    categoriesEl.innerHTML = categories.map(category => {
      const info = CATEGORY_INFO[category];
      const techs = getTechsByCategory(category);
      
      const techHtml = techs.map(tech => {
        const isUnlocked = unlockedTechs.has(tech.id);
        const isVisible = visibleIds.has(tech.id);
        
        if (!isVisible && !isUnlocked) {
          return ''; // Don't show techs that aren't visible yet
        }

        const checkResult = canUnlockTech(tech.id, unlockedTechs, playerLevel, this.gameState.data.balance);
        const canAfford = this.gameState.data.balance >= tech.cost;
        
        let statusClass = 'locked';
        if (isUnlocked) {
          statusClass = 'unlocked';
        } else if (checkResult.canUnlock) {
          statusClass = 'available';
        }

        // Build effect description
        const effectParts: string[] = [];
        if (tech.effects.travelTimeModifier) {
          const pct = Math.round((1 - tech.effects.travelTimeModifier) * 100);
          if (pct > 0) effectParts.push(`${pct}% faster travel`);
        }
        if (tech.effects.yieldModifier) {
          const pct = Math.round((tech.effects.yieldModifier - 1) * 100);
          if (pct > 0) effectParts.push(`${pct}% more yield`);
        }
        if (tech.effects.anomalyReduction) {
          const pct = Math.round(tech.effects.anomalyReduction * 100);
          effectParts.push(`${pct}% safer`);
        }
        if (tech.effects.crewCostModifier) {
          const pct = Math.round((1 - tech.effects.crewCostModifier) * 100);
          if (pct > 0) effectParts.push(`${pct}% crew cost`);
        }

        const effectText = effectParts.length > 0 ? effectParts.join(', ') : 'Base tech';
        const costClass = isUnlocked ? '' : (canAfford ? 'can-afford' : 'cannot-afford');
        const costText = isUnlocked ? '✓ Unlocked' : 
          (tech.cost === 0 ? 'Free' : formatCurrency(tech.cost));
        const reasonText = !isUnlocked && !checkResult.canUnlock && checkResult.reason ? 
          `<div style="font-size: 9px; color: #f88; margin-top: 2px;">${checkResult.reason}</div>` : '';

        return `
          <div class="tech-node ${statusClass}" data-tech-id="${tech.id}" title="${tech.description}">
            <div class="tech-node-name">${tech.name}</div>
            <div class="tech-node-effect">${effectText}</div>
            <div class="tech-node-cost ${costClass}">${costText}</div>
            ${reasonText}
          </div>
        `;
      }).join('');

      return `
        <div class="tech-category">
          <div class="tech-category-header">
            <span class="tech-category-icon">${info.icon}</span>
            <span class="tech-category-name">${info.name}</span>
          </div>
          ${techHtml}
        </div>
      `;
    }).join('');

    // Add click handlers for purchasing
    categoriesEl.querySelectorAll('.tech-node.available').forEach(node => {
      node.addEventListener('click', () => {
        const techId = node.getAttribute('data-tech-id');
        if (techId) {
          this.purchaseTech(techId);
        }
      });
    });

    // Update current effects display
    if (effectsEl) {
      const effects = this.gameState.getTechEffects();
      const lines: string[] = [];
      
      const travelPct = effects.travelTimeModifier ? Math.round((1 - effects.travelTimeModifier) * 100) : 0;
      const yieldPct = effects.yieldModifier ? Math.round((effects.yieldModifier - 1) * 100) : 0;
      const anomalyPct = effects.anomalyReduction ? Math.round(effects.anomalyReduction * 100) : 0;
      const crewPct = effects.crewCostModifier ? Math.round((1 - effects.crewCostModifier) * 100) : 0;

      lines.push(`<div class="tech-effect-row"><span>Travel Time Reduction:</span><span class="tech-effect-value ${travelPct === 0 ? 'neutral' : ''}">${travelPct > 0 ? '-' + travelPct + '%' : 'None'}</span></div>`);
      lines.push(`<div class="tech-effect-row"><span>Mining Yield Bonus:</span><span class="tech-effect-value ${yieldPct === 0 ? 'neutral' : ''}">${yieldPct > 0 ? '+' + yieldPct + '%' : 'None'}</span></div>`);
      lines.push(`<div class="tech-effect-row"><span>Anomaly Risk Reduction:</span><span class="tech-effect-value ${anomalyPct === 0 ? 'neutral' : ''}">${anomalyPct > 0 ? '-' + anomalyPct + '%' : 'None'}</span></div>`);
      lines.push(`<div class="tech-effect-row"><span>Crew Cost Reduction:</span><span class="tech-effect-value ${crewPct === 0 ? 'neutral' : ''}">${crewPct > 0 ? '-' + crewPct + '%' : 'None'}</span></div>`);
      
      effectsEl.innerHTML = lines.join('');
    }

    modal.classList.add('visible');
  }

  private closeTechTreeModal(): void {
    const modal = document.getElementById('tech-tree-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  private purchaseTech(techId: string): void {
    const result = this.gameState.unlockTech(techId);
    
    if (result.success) {
      const tech = TECH_TREE.find(t => t.id === techId);
      this.addNewsItem(`Tech unlocked: ${tech?.name || techId}!`, 'important');
      // Refresh the modal to show updated state
      this.showTechTreeModal();
    } else {
      this.addNewsItem(`Cannot unlock tech: ${result.reason}`, 'critical');
    }
  }

  // === ASSETS SYSTEM ===

  private setupAssets(): void {
    // Open assets modal button
    document.getElementById('open-assets-btn')?.addEventListener('click', () => {
      this.showAssetsModal();
    });

    // Close assets modal
    document.getElementById('assets-modal-close')?.addEventListener('click', () => {
      const modal = document.getElementById('assets-modal');
      if (modal) modal.classList.remove('visible');
    });
    document.getElementById('assets-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        (e.target as HTMLElement).classList.remove('visible');
      }
    });

    // Subscribe to state changes to update assets panel
    this.gameState.subscribe('assets-panel', () => {
      this.updateAssetsPanel();
    });

    // Initial update
    this.updateAssetsPanel();
  }

  private updateAssetsPanel(): void {
    const level = getCurrentLevel(this.gameState.data.missionsCompleted);
    const lockedDiv = document.getElementById('assets-locked');
    const contentDiv = document.getElementById('assets-content');
    const statusSpan = document.getElementById('assets-status');

    if (level.id >= 2) {
      // Unlocked
      if (lockedDiv) lockedDiv.style.display = 'none';
      if (contentDiv) contentDiv.style.display = 'block';
      if (statusSpan) statusSpan.textContent = '';

      // Update summary
      const summaryDiv = document.getElementById('owned-assets-summary');
      if (summaryDiv) {
        const ownedCount = this.gameState.data.ownedAssets.length;
        const totalAssets = ALL_OWNABLE_ASSETS.length;
        summaryDiv.innerHTML = `
          <div class="owned-assets-summary">
            <span class="owned-count">${ownedCount}</span> / ${totalAssets} assets owned
          </div>
        `;
      }
    } else {
      // Locked
      if (lockedDiv) lockedDiv.style.display = 'block';
      if (contentDiv) contentDiv.style.display = 'none';
      if (statusSpan) statusSpan.textContent = '(Level 2+)';
    }
  }

  private showAssetsModal(): void {
    const modal = document.getElementById('assets-modal');
    const container = document.getElementById('assets-categories');
    const balanceSpan = document.getElementById('assets-modal-balance');

    if (!modal || !container) return;

    // Update balance
    if (balanceSpan) {
      balanceSpan.textContent = formatCurrency(this.gameState.data.balance);
    }

    const level = getCurrentLevel(this.gameState.data.missionsCompleted);
    const categories: AssetCategory[] = ['vehicle', 'equipment', 'crew'];

    container.innerHTML = categories.map(category => {
      const categoryInfo = ASSET_CATEGORY_INFO[category];
      const assets = getAssetsByCategory(category);

      return `
        <div class="asset-category">
          <div class="asset-category-header">
            <span class="asset-category-icon">${categoryInfo.icon}</span>
            <span class="asset-category-name">${categoryInfo.name}</span>
          </div>
          <div class="asset-grid">
            ${assets.map(asset => this.renderAssetCard(asset, level.id)).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers for purchase
    container.querySelectorAll('.asset-card:not(.owned):not(.locked)').forEach(card => {
      card.addEventListener('click', () => {
        const assetId = card.getAttribute('data-asset-id');
        if (assetId) this.purchaseAsset(assetId);
      });
    });

    modal.classList.add('visible');
  }

  private renderAssetCard(asset: OwnableAsset, playerLevel: number): string {
    const owned = this.gameState.ownsAsset(asset.id);
    const canAfford = this.gameState.data.balance >= asset.purchaseCost;
    const levelLocked = asset.unlockLevel > playerLevel;

    let cardClass = 'asset-card';
    if (owned) cardClass += ' owned';
    else if (levelLocked) cardClass += ' locked';

    let priceClass = 'asset-price';
    let priceText = '';
    if (owned) {
      priceText = '✓ Owned';
    } else if (levelLocked) {
      priceClass += '';
      priceText = `Level ${asset.unlockLevel}+`;
    } else {
      priceClass += canAfford ? ' can-afford' : ' cannot-afford';
      priceText = formatCurrency(asset.purchaseCost);
    }

    return `
      <div class="${cardClass}" data-asset-id="${asset.id}">
        <div class="asset-name">${asset.name}</div>
        <div class="asset-desc">${asset.description}</div>
        <div class="asset-stats">
          <span class="${priceClass}">${priceText}</span>
          <span class="asset-breakeven">${asset.breakEvenMissions} missions to break even</span>
        </div>
      </div>
    `;
  }

  private purchaseAsset(assetId: string): void {
    const asset = getAssetById(assetId);
    if (!asset) return;

    const result = this.gameState.purchaseAsset(assetId, asset.purchaseCost);
    if (result.success) {
      this.addNewsItem(`Purchased ${asset.name} for ${formatCurrency(asset.purchaseCost)}`, 'important');
      // Refresh modal
      this.showAssetsModal();
      this.updateAssetsPanel();
    } else {
      this.addNewsItem(`Cannot purchase: ${result.error}`, 'critical');
    }
  }

  // === STORAGE SYSTEM ===

  private setupStorage(): void {
    // Open storage modal button
    document.getElementById('open-storage-btn')?.addEventListener('click', () => {
      this.showStorageModal();
    });

    // Close storage modal
    document.getElementById('storage-modal-close')?.addEventListener('click', () => {
      const modal = document.getElementById('storage-modal');
      if (modal) modal.classList.remove('visible');
    });
    document.getElementById('storage-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        (e.target as HTMLElement).classList.remove('visible');
      }
    });

    // Subscribe to state changes to update storage panel
    this.gameState.subscribe('storage-panel', () => {
      this.updateStoragePanel();
    });

    // Initial update
    this.updateStoragePanel();
  }

  private updateStoragePanel(): void {
    const level = getCurrentLevel(this.gameState.data.missionsCompleted);
    const lockedDiv = document.getElementById('storage-locked');
    const contentDiv = document.getElementById('storage-content');
    const statusSpan = document.getElementById('storage-status');

    if (level.id >= 3) {
      // Unlocked
      if (lockedDiv) lockedDiv.style.display = 'none';
      if (contentDiv) contentDiv.style.display = 'block';
      if (statusSpan) statusSpan.textContent = '';

      // Update summary
      const summaryDiv = document.getElementById('storage-summary');
      if (summaryDiv) {
        const storage = this.gameState.data.storage;
        const ownedCount = Object.values(storage.depots).reduce((sum, d) => sum + d.count, 0);
        const totalCapacity = getTotalStorageCapacityNew(storage);
        const usedCapacity = getTotalStoredTonsNew(storage);
        
        if (ownedCount === 0) {
          summaryDiv.innerHTML = `<div class="storage-summary">No depots owned yet</div>`;
        } else {
          summaryDiv.innerHTML = `
            <div class="storage-summary">
              <span class="storage-count">${ownedCount}</span> depot${ownedCount !== 1 ? 's' : ''} • 
              ${formatCapacity(usedCapacity, totalCapacity)}
            </div>
          `;
        }
      }
    } else {
      // Locked
      if (lockedDiv) lockedDiv.style.display = 'block';
      if (contentDiv) contentDiv.style.display = 'none';
      if (statusSpan) statusSpan.textContent = '(Level 3+)';
    }
  }

  private showStorageModal(): void {
    const modal = document.getElementById('storage-modal');
    const container = document.getElementById('storage-depots-list');
    const balanceSpan = document.getElementById('storage-modal-balance');

    if (!modal || !container) return;

    // Update balance
    if (balanceSpan) {
      balanceSpan.textContent = formatCurrency(this.gameState.data.balance);
    }

    const level = getCurrentLevel(this.gameState.data.missionsCompleted);
    const storage = this.gameState.data.storage;

    container.innerHTML = STORAGE_DEPOTS.map(depot => {
      return this.renderDepotCard(depot, level.id, storage);
    }).join('');

    // Add click handlers for purchase
    container.querySelectorAll('.depot-buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const depotId = btn.getAttribute('data-depot-id');
        if (depotId) this.purchaseDepot(depotId);
      });
    });

    // Add click handlers for sell buttons
    container.querySelectorAll('.depot-sell-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const depotId = btn.getAttribute('data-depot-id');
        const resource = btn.getAttribute('data-resource');
        if (depotId && resource) this.showSellModal(depotId, resource);
      });
    });

    modal.classList.add('visible');
  }

  private renderDepotCard(depot: StorageDepot, playerLevel: number, storage: any): string {
    const ownedCount = this.gameState.getDepotCount(depot.id);
    const canAfford = this.gameState.data.balance >= depot.purchaseCost;
    const levelLocked = depot.unlockLevel > playerLevel;

    let cardClass = 'depot-card';
    if (ownedCount > 0) cardClass += ' owned';
    else if (levelLocked) cardClass += ' locked';

    // Get instance info if owned
    const instance = storage.depots[depot.id];
    const totalCapacity = instance ? getInstanceTotalCapacity(depot.id, instance.count) : 0;
    const usedCapacity = instance ? getDepotUsedCapacity(instance.contents) : 0;
    const percent = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

    // Build status/buy section
    let statusSection = '';
    if (ownedCount > 0) {
      statusSection = `
        <div class="depot-owned-status">
          <span class="depot-owned-count">✓ ${ownedCount} owned</span>
          ${!levelLocked && canAfford ? `
            <button class="depot-buy-btn" data-depot-id="${depot.id}">
              Buy Another (${formatCurrency(depot.purchaseCost)})
            </button>
          ` : ''}
        </div>
      `;
    } else if (levelLocked) {
      statusSection = `<div class="depot-locked-status">🔒 Level ${depot.unlockLevel}+</div>`;
    } else {
      statusSection = `
        <button class="depot-buy-btn ${canAfford ? 'can-afford' : 'cannot-afford'}" data-depot-id="${depot.id}">
          ${canAfford ? 'Buy' : 'Need'} ${formatCurrency(depot.purchaseCost)}
        </button>
      `;
    }

    // Build capacity bar and contents if owned
    let capacitySection = '';
    if (ownedCount > 0 && instance) {
      const fillClass = percent >= 90 ? 'full' : percent >= 70 ? 'warning' : '';
      
      // Build stored resources list
      const contents = instance.contents;
      const storedItems: string[] = [];
      for (const [resource, amount] of Object.entries(contents)) {
        if ((amount as number) > 0) {
          const displayName = MARKET_RESOURCE_INFO[resource as keyof typeof MARKET_RESOURCE_INFO]?.name || resource;
          const spotPrice = getSpotPrice(this.gameState.data.market, resource as ResourceType);
          storedItems.push(`
            <div class="depot-stored-item">
              <span class="stored-resource">${displayName}</span>
              <span class="stored-amount">${(amount as number).toLocaleString()} tons</span>
              <span class="stored-value">(~${formatCurrency((amount as number) * spotPrice)})</span>
              <button class="depot-sell-btn" data-depot-id="${depot.id}" data-resource="${resource}">Sell</button>
            </div>
          `);
        }
      }

      capacitySection = `
        <div class="depot-capacity-section">
          <div class="depot-capacity-header">
            ${formatCapacity(usedCapacity, totalCapacity)} (${ownedCount} × ${depot.capacity.toLocaleString()} tons)
          </div>
          <div class="depot-capacity-bar">
            <div class="depot-capacity-fill ${fillClass}" style="width: ${percent}%"></div>
          </div>
          ${storedItems.length > 0 ? `
            <div class="depot-stored-list">${storedItems.join('')}</div>
          ` : `
            <div class="depot-empty">Empty - use spec-free mining to fill</div>
          `}
        </div>
      `;
    }

    return `
      <div class="${cardClass}" data-depot-id="${depot.id}">
        <div class="depot-header">
          <div>
            <div class="depot-name">${depot.name}</div>
            <div class="depot-location">📍 ${depot.location}</div>
          </div>
          ${statusSection}
        </div>
        <div class="depot-desc">${depot.description}</div>
        <div class="depot-stats">
          <div class="depot-stat">
            <div class="depot-stat-label">Capacity Each</div>
            <div class="depot-stat-value">${depot.capacity.toLocaleString()} tons</div>
          </div>
          <div class="depot-stat">
            <div class="depot-stat-label">Travel Time</div>
            <div class="depot-stat-value">${depot.travelTimeFromEarth} days</div>
          </div>
          <div class="depot-stat">
            <div class="depot-stat-label">Security Risk</div>
            <div class="depot-stat-value">${depot.securityRisk}</div>
          </div>
        </div>
        ${capacitySection}
      </div>
    `;
  }

  private showSellModal(depotId: string, resource: string): void {
    const depot = getDepotById(depotId);
    const instance = this.gameState.data.storage.depots[depotId];
    if (!depot || !instance) return;

    const available = instance.contents[resource as keyof typeof instance.contents] || 0;
    if (available <= 0) return;

    const spotPrice = getSpotPrice(this.gameState.data.market, resource as ResourceType);
    const resourceInfo = MARKET_RESOURCE_INFO[resource as keyof typeof MARKET_RESOURCE_INFO];
    const displayName = resourceInfo?.name || resource;

    // Create or update sell modal
    let modal = document.getElementById('sell-resource-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sell-resource-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content sell-modal">
        <div class="modal-header">
          <h2>Sell ${displayName}</h2>
          <button class="modal-close" id="sell-modal-close">✕</button>
        </div>
        <div class="sell-modal-body">
          <div class="sell-info">
            <div class="sell-depot">From: ${depot.name}</div>
            <div class="sell-available">Available: ${available.toLocaleString()} tons</div>
            <div class="sell-price">Market Price: ${formatCurrency(spotPrice)}/ton</div>
          </div>
          <div class="sell-amount-section">
            <label>Amount to sell:</label>
            <input type="number" id="sell-amount" min="1" max="${available}" value="${available}" />
            <div class="sell-quick-buttons">
              <button class="sell-quick" data-pct="25">25%</button>
              <button class="sell-quick" data-pct="50">50%</button>
              <button class="sell-quick" data-pct="100">All</button>
            </div>
          </div>
          <div class="sell-total">
            Total: <span id="sell-total-value">${formatCurrency(available * spotPrice)}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" id="sell-cancel">Cancel</button>
          <button class="modal-btn primary" id="sell-confirm">Confirm Sale</button>
        </div>
      </div>
    `;

    // Add event handlers
    const amountInput = modal.querySelector('#sell-amount') as HTMLInputElement;
    const totalSpan = modal.querySelector('#sell-total-value');
    
    const updateTotal = () => {
      const amount = Math.min(available, Math.max(0, parseInt(amountInput.value) || 0));
      if (totalSpan) totalSpan.textContent = formatCurrency(amount * spotPrice);
    };

    amountInput?.addEventListener('input', updateTotal);

    modal.querySelectorAll('.sell-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        const pct = parseInt(btn.getAttribute('data-pct') || '100');
        amountInput.value = String(Math.floor(available * pct / 100));
        updateTotal();
      });
    });

    modal.querySelector('#sell-modal-close')?.addEventListener('click', () => {
      modal?.classList.remove('visible');
    });
    modal.querySelector('#sell-cancel')?.addEventListener('click', () => {
      modal?.classList.remove('visible');
    });

    modal.querySelector('#sell-confirm')?.addEventListener('click', () => {
      const amount = Math.min(available, Math.max(0, parseInt(amountInput.value) || 0));
      if (amount > 0) {
        const result = this.gameState.sellFromDepot(depotId, resource, amount, spotPrice);
        if (result.success) {
          this.addNewsItem(`Sold ${amount.toLocaleString()} tons of ${displayName} for ${formatCurrency(result.revenue)}`, 'important');
          modal?.classList.remove('visible');
          this.showStorageModal(); // Refresh storage modal
        }
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });

    modal.classList.add('visible');
  }

  private purchaseDepot(depotId: string): void {
    const depot = getDepotById(depotId);
    if (!depot) return;

    const result = this.gameState.purchaseDepot(depotId, depot.purchaseCost);
    if (result.success) {
      this.addNewsItem(`Purchased ${depot.name} for ${formatCurrency(depot.purchaseCost)}`, 'important');
      // Refresh modal
      this.showStorageModal();
      this.updateStoragePanel();
    } else {
      this.addNewsItem(`Cannot purchase: ${result.error}`, 'critical');
    }
  }

  // === LEVEL TRANSITIONS ===

  private setupLevelTransitions(): void {
    // Subscribe to state changes to detect level ups
    this.gameState.subscribe('level-transitions', (data) => {
      const newLevel = getCurrentLevel(data.missionsCompleted).id;
      if (newLevel > this.lastKnownLevel) {
        this.showLevelUpCeremony(newLevel);
        this.lastKnownLevel = newLevel;
      }
    });

    // Close level-up modal button
    document.getElementById('level-up-continue')?.addEventListener('click', () => {
      this.closeLevelUpModal();
    });
  }

  private showLevelUpCeremony(levelId: number): void {
    const level = PROGRESSION_LEVELS.find(l => l.id === levelId);
    if (!level) return;

    const modal = document.getElementById('level-up-modal');
    const badge = document.getElementById('level-up-badge');
    const title = document.getElementById('level-up-title');
    const description = document.getElementById('level-up-description');
    const unlocks = document.getElementById('level-up-unlocks');

    if (!modal) return;

    // Set level-specific background image
    const levelImages: Record<number, string> = {
      2: '/images/mining_jupiter_moon.png',
      3: '/images/mining_pirate_approach.png',
      4: '/images/mining_fleet_commander.png',
      5: '/images/mining_milky_way.png'
    };
    const bgImage = levelImages[levelId] || '/images/mining_red_asteroid.png';
    modal.style.backgroundImage = `url('${bgImage}')`;
    modal.style.backgroundSize = 'cover';
    modal.style.backgroundPosition = 'center';
    modal.style.backgroundRepeat = 'no-repeat';

    // Populate content
    if (badge) badge.textContent = `LEVEL ${level.id}`;
    if (title) title.textContent = level.displayName;
    if (description) {
      // Keep HTML links in description
      description.innerHTML = level.description;
    }

    // Populate unlocks
    if (unlocks && level.unlocks.length > 0) {
      unlocks.innerHTML = `
        <h3>New Features Unlocked:</h3>
        <ul>
          ${level.unlocks.map(u => `<li>${u}</li>`).join('')}
        </ul>
      `;
      unlocks.style.display = 'block';
    } else if (unlocks) {
      unlocks.style.display = 'none';
    }

    // Show modal
    modal.classList.add('visible');

    // Add news announcement
    this.addNewsItem(`🎉 LEVEL UP! Welcome to ${level.displayName}!`, 'important');

    // Play audio fanfare (placeholder - audio file TBD)
    this.playLevelUpSound(levelId);
  }

  private closeLevelUpModal(): void {
    const modal = document.getElementById('level-up-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  private playLevelUpSound(_levelId: number): void {
    // Placeholder for audio playback
    // TODO: Add audio files and implement playback
    // const audio = new Audio(`/assets/audio/level_up_${levelId}.mp3`);
    // audio.play().catch(() => {}); // Ignore autoplay restrictions
    console.log('Level up sound would play here');
  }

  // ==================== MARKET SYSTEM ====================

  private lastMarketUpdate: number = 0;

  private setupMarket(): void {
    // Initial render of market prices
    this.renderMarketPrices();

    // Initial render of flight log
    this.renderFlightLog();

    // Setup market detail modal close button
    const closeBtn = document.getElementById('market-detail-close');
    const modal = document.getElementById('market-detail-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('visible');
        }
      });
    }

    // Subscribe to game state changes to update market
    this.gameState.subscribe('market-updates', () => {
      const currentTime = this.gameState.data.gameTime;
      // Update market prices every game week (but check every ~minute real time to avoid spam)
      if (currentTime - this.lastMarketUpdate >= 7) {
        // Update lastMarketUpdate BEFORE calling updateMarket to prevent recursion
        this.lastMarketUpdate = currentTime;
        this.updateMarket();
      }
    });
  }

  private updateMarket(): void {
    const currentTime = this.gameState.data.gameTime;
    const { market, newsEvents } = updateMarketPrices(
      this.gameState.data.market,
      currentTime
    );

    // Update game state with new market
    this.gameState.update({ market });

    // Announce significant price changes
    newsEvents.forEach(news => {
      this.addNewsItem(news, 'market');
    });

    // Re-render market display
    this.renderMarketPrices();
  }

  private renderMarketPrices(): void {
    const container = document.getElementById('market-prices');
    if (!container) return;

    const market = this.gameState.data.market;
    const sortedResources = getResourcesByPrice(market);

    container.innerHTML = sortedResources.map(resource => {
      const info = RESOURCE_INFO[resource];
      const price = getSpotPrice(market, resource);
      const trend = getPriceTrend(market, resource);
      const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•';
      const history = market.resources[resource].priceHistory;
      
      // Generate mini sparkline SVG
      const sparkline = this.generateSparkline(history);

      return `
        <div class="market-row" data-resource="${resource}">
          <div class="market-resource">
            <span class="market-icon">${info.icon}</span>
            <span class="market-name">${info.name}</span>
          </div>
          <div style="display: flex; align-items: center;">
            ${sparkline}
            <span class="market-price ${trend}">
              ${formatPrice(price)}
              <span class="market-trend">${trendIcon}</span>
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.market-row').forEach(row => {
      row.addEventListener('click', () => {
        const resource = row.getAttribute('data-resource') as ResourceType;
        this.showMarketDetail(resource);
      });
    });
  }

  private generateSparkline(history: { price: number }[]): string {
    if (history.length < 2) return '';

    const width = 40;
    const height = 16;
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((price, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((price - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const lastPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const color = lastPrice >= firstPrice ? '#4ade80' : '#f87171';

    return `
      <svg class="market-sparkline" viewBox="0 0 ${width} ${height}">
        <polyline 
          fill="none" 
          stroke="${color}" 
          stroke-width="1.5"
          points="${points}"
        />
      </svg>
    `;
  }

  private showMarketDetail(resource: ResourceType): void {
    const modal = document.getElementById('market-detail-modal');
    const info = RESOURCE_INFO[resource];
    const market = this.gameState.data.market;
    const resourceMarket = market.resources[resource];
    const basePrice = RESOURCE_BASE_PRICES[resource];

    if (!modal) return;

    // Update modal content
    const iconEl = document.getElementById('market-detail-icon');
    const nameEl = document.getElementById('market-detail-name');
    const currentEl = document.getElementById('market-current-price');
    const baseEl = document.getElementById('market-base-price');
    const highEl = document.getElementById('market-high');
    const lowEl = document.getElementById('market-low');

    if (iconEl) iconEl.textContent = info.icon;
    if (nameEl) nameEl.textContent = info.name;
    if (currentEl) currentEl.textContent = formatPrice(resourceMarket.currentPrice);
    if (baseEl) baseEl.textContent = formatPrice(basePrice);

    const prices = resourceMarket.priceHistory.map(h => h.price);
    if (highEl) highEl.textContent = formatPrice(Math.max(...prices));
    if (lowEl) lowEl.textContent = formatPrice(Math.min(...prices));

    // Draw chart
    this.drawMarketChart(resource);

    modal.classList.add('visible');
  }

  private drawMarketChart(resource: ResourceType): void {
    const canvas = document.getElementById('market-chart-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const market = this.gameState.data.market;
    const history = market.resources[resource].priceHistory;
    const basePrice = RESOURCE_BASE_PRICES[resource];

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    const width = canvas.width;
    const height = canvas.height;
    const padding = 10;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (history.length < 2) {
      ctx.fillStyle = '#888';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Not enough data', width / 2, height / 2);
      return;
    }

    const prices = history.map(h => h.price);
    const min = Math.min(...prices, basePrice * 0.5);
    const max = Math.max(...prices, basePrice * 1.5);
    const range = max - min || 1;

    // Draw base price line
    const baseY = height - padding - ((basePrice - min) / range) * (height - padding * 2);
    ctx.strokeStyle = 'rgba(84, 230, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, baseY);
    ctx.lineTo(width - padding, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw price line
    const lastPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    ctx.strokeStyle = lastPrice >= firstPrice ? '#4ade80' : '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();

    prices.forEach((price, i) => {
      const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
      const y = height - padding - ((price - min) / range) * (height - padding * 2);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw current price dot
    const lastX = width - padding;
    const lastY = height - padding - ((lastPrice - min) / range) * (height - padding * 2);
    ctx.fillStyle = lastPrice >= firstPrice ? '#4ade80' : '#f87171';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderFlightLog(): void {
    const container = document.getElementById('flight-log');
    if (!container) return;

    const log = this.gameState.data.flightLog;
    
    if (log.length === 0) {
      container.innerHTML = '<p style="color: #888; font-size: 11px;">No completed missions yet</p>';
      return;
    }

    // Show most recent first
    container.innerHTML = [...log].reverse().map(entry => {
      const profitClass = entry.profit >= 0 ? '' : 'loss';
      const profitPrefix = entry.profit >= 0 ? '+' : '';
      return `
        <div class="flight-log-entry">
          <div class="flight-log-asteroid">${entry.asteroidName}</div>
          <div class="flight-log-details">
            <span>${entry.tons.toLocaleString()} tons ${entry.resourceType}</span>
            <span class="flight-log-profit ${profitClass}">${profitPrefix}${formatCurrency(entry.profit)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==================== END MARKET SYSTEM ====================

  private updateMissions(): void {
    const currentTime = this.gameState.data.gameTime;
    const missions = this.gameState.data.activeMissions;
    let needsUpdate = false;

    missions.forEach(mission => {
      const phaseInfo = PHASE_INFO[mission.currentPhase];
      
      // Skip terminal states
      if (phaseInfo.isTerminal) return;

      // Calculate overall progress
      const elapsed = currentTime - mission.launchTime;
      const progress = Math.min(1, elapsed / mission.totalDuration);

      // Check if current phase is complete
      const phaseElapsed = currentTime - mission.phaseStartTime;
      
      if (phaseElapsed >= mission.phaseDuration) {
        const provider = LAUNCH_PROVIDERS.find(p => p.id === mission.providerId);
        const playerLevel = getCurrentLevel(this.gameState.data.missionsCompleted).id;
        
        let nextPhase: MissionPhase;
        let combatResult: CombatResult | undefined;
        
        // Handle pirate attack phases - resolve combat
        if (mission.currentPhase === MissionPhase.PIRATE_ATTACK_OUTBOUND || 
            mission.currentPhase === MissionPhase.PIRATE_ATTACK_INBOUND) {
          // Resolve combat
          combatResult = resolveCombat(
            playerLevel,
            mission.securityId || null,
            this.gameState.data.securityRelationships?.[mission.securityId || ''] || 0
          );
          
          // News about combat
          this.addNewsItem(formatCombatNews(combatResult, mission.asteroidName), 
            combatResult.outcome === 'pirates_defeated' ? 'important' : 'critical');
          
          // Determine next phase based on combat outcome
          if (combatResult.outcome === 'pirates_defeated') {
            // Continue mission - go to next normal phase
            if (mission.currentPhase === MissionPhase.PIRATE_ATTACK_OUTBOUND) {
              nextPhase = MissionPhase.DRILLING;
            } else {
              nextPhase = MissionPhase.DELIVERING_PAYLOAD;
            }
          } else if (combatResult.outcome === 'pirates_won') {
            nextPhase = MissionPhase.PIRATES_WON;
          } else {
            nextPhase = MissionPhase.PAYLOAD_SEIZED;
          }
        } else {
          // Normal phase transition - roll for next phase
          nextPhase = rollNextPhase(
            mission.currentPhase,
            mission.providerReliability,
            mission.crewReliability
          );
          
          // Check for pirate attacks at Level 3+ when entering certain phases
          if (playerLevel >= 3) {
            // Check when completing OUTBOUND (before DRILLING)
            if (mission.currentPhase === MissionPhase.OUTBOUND && nextPhase === MissionPhase.DRILLING) {
              if (checkPirateAttack('outbound', playerLevel)) {
                nextPhase = MissionPhase.PIRATE_ATTACK_OUTBOUND;
                this.addNewsItem(`⚠️ Pirates detected near ${mission.asteroidName}!`, 'critical');
              }
            }
            // Check when completing DRILLING (before INBOUND) - actually check at end of inbound
            // Check when completing INBOUND (before DELIVERING)
            if (mission.currentPhase === MissionPhase.INBOUND && nextPhase === MissionPhase.DELIVERING_PAYLOAD) {
              if (checkPirateAttack('inbound', playerLevel)) {
                nextPhase = MissionPhase.PIRATE_ATTACK_INBOUND;
                this.addNewsItem(`⚠️ Pirates intercepting ${mission.asteroidName} cargo ship!`, 'critical');
              }
            }
          }
        }
        
        const nextPhaseInfo = PHASE_INFO[nextPhase];
        
        // Calculate next phase duration
        const nextPhaseDuration = nextPhaseInfo.isTerminal ? 0 : calculatePhaseDuration(
          nextPhase,
          mission.outboundDuration,
          mission.miningDuration,
          mission.returnDuration,
          provider?.launchFrequency || 'Weekly'
        );

        // Build update object
        const missionUpdate: Partial<Mission> = {
          currentPhase: nextPhase,
          phaseStartTime: currentTime,
          phaseDuration: nextPhaseDuration,
          phaseJustChanged: true,
          progress,
        };
        
        // Add combat result if applicable
        if (combatResult) {
          missionUpdate.combatResult = {
            outcome: combatResult.outcome,
            narrative: combatResult.narrative,
          };
        }

        // Update mission
        this.gameState.updateMission(mission.id, missionUpdate);

        needsUpdate = true;

        // News item for phase change
        if (nextPhaseInfo.isTerminal) {
          if (nextPhaseInfo.isSuccess) {
            this.addNewsItem(`Mission to ${mission.asteroidName}: SUCCESS!`, 'important');
          } else if (nextPhase !== MissionPhase.PIRATES_WON && nextPhase !== MissionPhase.PAYLOAD_SEIZED) {
            // Don't duplicate news for pirate outcomes (already shown above)
            this.addNewsItem(`Mission to ${mission.asteroidName}: ${nextPhaseInfo.name}`, 'critical');
          }
        } else if (nextPhase === MissionPhase.DRILLING) {
          // Mark asteroid as mined when drilling begins
          if (!this.gameState.data.minedAsteroids.includes(mission.asteroidId)) {
            this.gameState.update({
              minedAsteroids: [...this.gameState.data.minedAsteroids, mission.asteroidId]
            });
            // Hide label for this asteroid
            if (this.solarSystem) {
              this.solarSystem.setAsteroidMined(mission.asteroidId, true);
            }
          }
        } else if (nextPhase === MissionPhase.LAUNCH) {
          this.addNewsItem(`Mission to ${mission.asteroidName} launching!`, 'market');
          // Create ship when actually launching
          if (this.solarSystem) {
            const asteroid = this.asteroidData.get(mission.asteroidId);
            if (asteroid) {
              this.solarSystem.createMissionShip(mission.id, asteroid.semiMajorAxis);
            }
          }
        }
      } else {
        // Just update progress internally (don't trigger list rebuild)
        const roundedProgress = Math.round(progress * 100) / 100;
        if (roundedProgress !== Math.round(mission.progress * 100) / 100) {
          this.gameState.updateMission(mission.id, { progress, phaseJustChanged: false });
          // Only rebuild list if progress changed by 1% or more (visual update)
          needsUpdate = true;
        }
      }

      // Update ship position (only for active flight phases)
      if (this.solarSystem && [MissionPhase.OUTBOUND, MissionPhase.DRILLING, MissionPhase.INBOUND].includes(mission.currentPhase)) {
        // Calculate flight progress (just the flight portion)
        const flightStart = mission.launchTime + 
          calculatePhaseDuration(MissionPhase.CONTRACT_SIGNED, mission.outboundDuration, mission.miningDuration, mission.returnDuration, 'Weekly') +
          calculatePhaseDuration(MissionPhase.LAUNCH, mission.outboundDuration, mission.miningDuration, mission.returnDuration, 'Weekly');
        const flightDuration = mission.outboundDuration + mission.miningDuration + mission.returnDuration;
        const flightElapsed = Math.max(0, currentTime - flightStart);
        const flightProgress = Math.min(1, flightElapsed / flightDuration);
        
        this.solarSystem.updateMissionShipProgress(mission.id, flightProgress);
      }
    });

    if (needsUpdate) {
      this.updateActiveMissionsList();
    }
  }

  private onMissionFailed(mission: Mission): void {
    // Remove ship from scene
    if (this.solarSystem) {
      this.solarSystem.removeMissionShip(mission.id);
    }
    
    // Handle PAYLOAD_SEIZED - partial failure, crew survives but cargo lost
    if (mission.currentPhase === MissionPhase.PAYLOAD_SEIZED) {
      // No revenue, but increment mission count (experience gained)
      this.gameState.update({
        missionsCompleted: this.gameState.data.missionsCompleted + 1,
      });
      
      // Add to flight log with zero profit
      const logEntry: FlightLogEntry = {
        asteroidName: mission.asteroidName,
        resourceType: mission.resourceType || 'Unknown',
        tons: 0,
        profit: -mission.totalCost,
        completedTime: this.gameState.data.gameTime,
      };
      const newLog = [...this.gameState.data.flightLog, logEntry].slice(-3);
      this.gameState.update({ flightLog: newLog });
      this.renderFlightLog();
    }
    
    // Increment security relationship if security was hired (regardless of outcome)
    if (mission.securityId) {
      const currentRel = this.gameState.data.securityRelationships[mission.securityId] || 0;
      if (currentRel < 10) {
        this.gameState.update({
          securityRelationships: {
            ...this.gameState.data.securityRelationships,
            [mission.securityId]: Math.min(10, currentRel + 1),
          },
        });
      }
    }
  }

  private onMissionComplete(mission: Mission): void {
    const asteroid = this.asteroidData.get(mission.asteroidId);
    if (!asteroid) return;

    const crew = CREW_TYPES.find(c => c.id === mission.crewId);
    const efficiency = crew?.miningEfficiency || 1;
    const resourcesGained = estimateResourceYield(asteroid.diameter, asteroid.taxonomicClass, efficiency, asteroid.mass);
    
    let revenue: number;
    let profit: number;
    let newsMessage: string;

    if (mission.isSpecFreeMining && mission.targetDepotId) {
      // Spec-free mining: fill all owned depots, overflow sold at market
      const storage = this.gameState.data.storage;
      
      // Pick random resource from asteroid's composition
      const availableResources = getPrimaryResourcesForType(asteroid.taxonomicClass);
      const resourceType = availableResources[Math.floor(Math.random() * availableResources.length)];
      
      // Fill ALL owned depots in order until full, then sell overflow
      let remainingToStore = resourcesGained;
      let totalStored = 0;
      const newDepots = { ...storage.depots };
      
      // Get all owned depot IDs sorted by capacity (fill smaller depots first)
      const ownedDepotIds = Object.keys(storage.depots)
        .filter(id => storage.depots[id].count > 0)
        .sort((a, b) => {
          const depotA = getDepotById(a);
          const depotB = getDepotById(b);
          return (depotA?.capacity || 0) - (depotB?.capacity || 0);
        });
      
      for (const depotId of ownedDepotIds) {
        if (remainingToStore <= 0) break;
        
        const depot = getDepotById(depotId);
        const instance = storage.depots[depotId];
        if (!depot || !instance) continue;
        
        const depotContents = instance.contents || createEmptyStorage();
        const totalCapacity = depot.capacity * instance.count;
        const usedCapacity = Object.values(depotContents).reduce((s, v) => s + v, 0);
        const remainingCapacity = totalCapacity - usedCapacity;
        
        if (remainingCapacity > 0) {
          const storeInThisDepot = Math.min(remainingToStore, remainingCapacity);
          const currentAmount = depotContents[resourceType] || 0;
          
          newDepots[depotId] = {
            ...instance,
            contents: {
              ...depotContents,
              [resourceType]: currentAmount + storeInThisDepot,
            },
          };
          
          totalStored += storeInThisDepot;
          remainingToStore -= storeInThisDepot;
        }
      }
      
      const overflow = remainingToStore;
      
      const newStorage = { depots: newDepots };
      
      // Sell overflow at market price
      const market = this.gameState.data.market;
      const spotPrice = getSpotPrice(market, resourceType);
      revenue = overflow > 0 ? Math.round(overflow * spotPrice) : 0;
      profit = revenue - mission.totalCost;
      
      this.gameState.update({ storage: newStorage });
      
      if (overflow > 0) {
        newsMessage = `Mission to ${mission.asteroidName} complete! Stored ${totalStored.toLocaleString()} tons, sold ${overflow.toLocaleString()} tons overflow for ${formatCurrency(revenue)}`;
      } else {
        newsMessage = `Mission to ${mission.asteroidName} complete! Stored ${totalStored.toLocaleString()} tons of ${resourceType}`;
        // No revenue for pure storage missions
        profit = -mission.totalCost;
      }
      
      // Update storage panel
      this.updateStoragePanel();
    } else if (mission.contractValue) {
      // Contract-based payout with crew efficiency modifier
      const efficiencyModifier = 0.8 + (efficiency * 0.4); // Range: 0.88 to 1.28
      let baseRevenue = Math.round(mission.contractValue * efficiencyModifier);
      
      // Apply late delivery penalty if applicable
      let lateModifier = 1.0;
      if (mission.contractDeadline) {
        const missionDuration = this.gameState.data.gameTime - mission.launchTime;
        const daysLate = Math.max(0, missionDuration - mission.contractDeadline);
        if (daysLate > 0) {
          // Penalty = daysLate / deadline, capped at 100%
          const penaltyPercent = Math.min(1.0, daysLate / mission.contractDeadline);
          lateModifier = 1.0 - penaltyPercent;
        }
      }
      
      revenue = Math.round(baseRevenue * lateModifier);
      profit = revenue - mission.totalCost;
      
      if (lateModifier < 1.0) {
        const penaltyPercent = ((1 - lateModifier) * 100).toFixed(1);
        newsMessage = `Mission to ${mission.asteroidName} complete! Earned ${formatCurrency(revenue)} (${penaltyPercent}% late penalty)`;
      } else {
        newsMessage = `Mission to ${mission.asteroidName} complete! Earned ${formatCurrency(revenue)}`;
      }
    } else {
      // No contract, no storage - sell at market (fallback)
      const pricePerTon = 50000;
      revenue = resourcesGained * pricePerTon;
      profit = revenue - mission.totalCost;
      newsMessage = `Mission to ${mission.asteroidName} complete! Earned ${formatCurrency(revenue)}`;
    }

    // Add to flight log (keep last 3)
    const logEntry: FlightLogEntry = {
      asteroidName: mission.asteroidName,
      resourceType: mission.resourceType || 'Mixed',
      tons: resourcesGained,
      profit: profit,
      completedTime: this.gameState.data.gameTime,
    };
    const newLog = [...this.gameState.data.flightLog, logEntry].slice(-3);

    // Add money and update mission
    if (revenue > 0) {
      this.gameState.addMoney(revenue);
    }
    this.gameState.updateMission(mission.id, { resourcesGained, revenue });
    this.gameState.completeMission();
    this.gameState.update({ flightLog: newLog });

    // Update flight log display
    this.renderFlightLog();

    // Remove ship from scene
    if (this.solarSystem) {
      this.solarSystem.removeMissionShip(mission.id);
    }
    
    // Increment security relationship if security was hired
    if (mission.securityId) {
      const currentRel = this.gameState.data.securityRelationships[mission.securityId] || 0;
      if (currentRel < 10) {
        this.gameState.update({
          securityRelationships: {
            ...this.gameState.data.securityRelationships,
            [mission.securityId]: Math.min(10, currentRel + 1),
          },
        });
      }
    }

    // Show news
    this.addNewsItem(newsMessage, 'important');
  }

  private updateAsteroidCount(): void {
    const countEl = document.getElementById('asteroid-count');
    if (countEl && this.solarSystem) {
      countEl.textContent = `${this.solarSystem.getAsteroidCount()} asteroids loaded`;
    }
  }

  private updateTimeDisplay(index: number): void {
    const display = document.getElementById('time-display');
    if (!display) return;
    display.textContent = TIME_SCALE_NAMES[index];
  }

  private updateGameDate(): void {
    const dateEl = document.getElementById('game-date');
    if (!dateEl) return;

    // Game starts January 1, 2032
    const startDate = new Date(2032, 0, 1); // January 1, 2032
    const gameDays = this.gameState.data.gameTime;
    
    // Add game days to start date
    const currentDate = new Date(startDate.getTime() + gameDays * 24 * 60 * 60 * 1000);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    
    dateEl.textContent = `${month} ${year}`;
  }

  private onCameraFocusChanged(focusData: any): void {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;

    if (focusData) {
      // Show breadcrumb
      breadcrumb.style.display = 'block';
    } else {
      // Hide breadcrumb
      breadcrumb.style.display = 'none';
    }
  }

  private addNewsItem(text: string, type: 'critical' | 'important' | 'market' | 'flavor'): void {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;

    const item = document.createElement('span');
    item.className = `ticker-item ticker-${type}`;
    item.textContent = text;

    ticker.appendChild(item);
  }

  /**
   * Periodic news generation based on game time
   * Checks cooldowns and generates appropriate news items
   */
  private updateNews(): void {
    const currentTime = this.gameState.data.gameTime;
    
    // Only check news every ~0.1 game days to avoid performance issues
    if (currentTime - this.lastNewsCheck < 0.1) return;
    this.lastNewsCheck = currentTime;
    
    // Check for easter eggs
    this.checkEasterEggs();
    
    // Generate competitor news (every ~5 min real time = ~3.5 game days at max speed)
    if (this.newsSystem.canShowNews('competitor', currentTime)) {
      const availableAsteroids = Array.from(this.asteroidData.keys())
        .filter(id => !this.gameState.data.minedAsteroids.includes(id))
        .filter(id => !this.newsSystem.isAsteroidBlocked(id));
      
      if (availableAsteroids.length > 0) {
        const result = this.newsSystem.generateCompetitorNews(availableAsteroids);
        if (result) {
          // Replace asteroid ID with actual name
          let text = result.text;
          if (result.asteroidId) {
            const asteroid = this.asteroidData.get(result.asteroidId);
            if (asteroid) {
              text = text.replace(result.asteroidId, asteroid.name);
            }
          }
          
          this.addNewsItem(text, 'market'); // Competitor uses 'market' style (blue)
          this.newsSystem.recordNewsShown('competitor', currentTime);
          
          // If asteroid was blocked, we might want to update UI
          if (result.blocksAsteroid && result.asteroidId) {
            // Asteroid is now unavailable for player
            // This is tracked in newsSystem.isAsteroidBlocked()
          }
        }
      }
    }
    
    // Generate educational news
    if (this.newsSystem.canShowNews('educational', currentTime)) {
      const news = this.newsSystem.getEducationalNews();
      if (news) {
        this.addNewsItem(news, 'flavor'); // Educational uses 'flavor' style (gray)
        this.newsSystem.recordNewsShown('educational', currentTime);
      }
    }
    
    // Generate flavor news (less frequent than educational)
    if (this.newsSystem.canShowNews('flavor', currentTime)) {
      const news = this.newsSystem.getFlavorNews();
      if (news) {
        this.addNewsItem(news, 'flavor');
        this.newsSystem.recordNewsShown('flavor', currentTime);
      }
    }
  }

  /**
   * Check for easter egg conditions
   */
  private checkEasterEggs(): void {
    // Calculate current game date
    const startDate = new Date(2032, 0, 1); // January 1, 2032
    const currentDate = new Date(startDate.getTime() + this.gameState.data.gameTime * 24 * 60 * 60 * 1000);
    const month = currentDate.getMonth() + 1; // 1-12
    const day = currentDate.getDate();
    const missions = this.gameState.data.missionsCompleted;
    const balance = this.gameState.data.balance;
    
    // Determine balance tier for change detection
    const balanceTier = balance >= 1_000_000_000_000 ? 'trillion' 
      : balance >= 1_000_000_000 ? 'billion' 
      : balance <= 0 ? 'bankrupt' 
      : 'normal';
    
    // Check if state has changed (for isFirstCheck)
    const currentState = { month, day, missions, balanceTier };
    const isFirstCheck = !this.lastEasterEggState 
      || this.lastEasterEggState.month !== month 
      || this.lastEasterEggState.day !== day
      || this.lastEasterEggState.missions !== missions
      || this.lastEasterEggState.balanceTier !== balanceTier;
    
    this.lastEasterEggState = currentState;
    
    const easterEggState: EasterEggState = {
      gameMonth: month,
      gameDay: day,
      missionsCompleted: missions,
      balance,
      isFirstCheck,
    };
    
    const triggered = this.newsSystem.checkEasterEggs(easterEggState);
    triggered.forEach(item => {
      this.addNewsItem(item.text, item.type as 'critical' | 'important' | 'market' | 'flavor');
    });
  }

  /**
   * Check if an asteroid is available (not mined and not blocked by competitors)
   */
  private isAsteroidAvailable(asteroidId: string): boolean {
    return !this.gameState.data.minedAsteroids.includes(asteroidId) 
      && !this.newsSystem.isAsteroidBlocked(asteroidId);
  }

  private initSearchableBodies(): void {
    // Add Sun
    this.searchableBodies.push({ name: 'Sun', type: 'sun' });

    // Add planets
    const planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    planets.forEach(name => {
      this.searchableBodies.push({ name, type: 'planet' });
    });

    // Add moons
    const moons = ['Moon', 'Io', 'Europa', 'Ganymede', 'Callisto'];
    moons.forEach(name => {
      this.searchableBodies.push({ name, type: 'moon' });
    });

    // Add ISS
    this.searchableBodies.push({ name: 'ISS', type: 'satellite' });

    // Add all asteroids
    this.asteroidData.forEach((asteroid, id) => {
      this.searchableBodies.push({ name: asteroid.name, type: 'asteroid', id });
    });
  }

  private setupSearch(): void {
    const searchInput = document.getElementById('body-search') as HTMLInputElement;
    const suggestionsEl = document.getElementById('search-suggestions');
    if (!searchInput || !suggestionsEl) return;

    // Handle input changes
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      if (query.length === 0) {
        this.hideSearchSuggestions();
        return;
      }
      this.showSearchSuggestions(query);
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', async (e) => {
      const suggestions = suggestionsEl.querySelectorAll('.search-suggestion');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.searchSelectedIndex = Math.min(this.searchSelectedIndex + 1, suggestions.length - 1);
        this.updateSearchSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.searchSelectedIndex = Math.max(this.searchSelectedIndex - 1, -1);
        this.updateSearchSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions.length > 0) {
          // Select from existing suggestions
          const index = this.searchSelectedIndex >= 0 ? this.searchSelectedIndex : 0;
          const selected = suggestions[index] as HTMLElement;
          if (selected) {
            this.selectSearchResult(selected.dataset.name!, selected.dataset.type as any, selected.dataset.id);
          }
        } else {
          // No matches - try to fetch from NASA API
          const query = searchInput.value.trim();
          if (query.length > 0) {
            await this.searchAndAddAsteroid(query);
          }
        }
      } else if (e.key === 'Escape') {
        this.hideSearchSuggestions();
        searchInput.blur();
      }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target as Node) && !suggestionsEl.contains(e.target as Node)) {
        this.hideSearchSuggestions();
      }
    });

    // Show suggestions when focusing on non-empty input
    searchInput.addEventListener('focus', () => {
      const query = searchInput.value.trim().toLowerCase();
      if (query.length > 0) {
        this.showSearchSuggestions(query);
      }
    });
  }

  private showSearchSuggestions(query: string): void {
    const suggestionsEl = document.getElementById('search-suggestions');
    if (!suggestionsEl) return;

    // Filter and limit to 5 results
    const matches = this.searchableBodies
      .filter(body => body.name.toLowerCase().includes(query))
      .slice(0, 5);

    if (matches.length === 0) {
      this.hideSearchSuggestions();
      return;
    }

    // Build suggestions HTML
    suggestionsEl.innerHTML = matches.map(body => {
      const typeLabel = body.type.charAt(0).toUpperCase() + body.type.slice(1);
      return `<div class="search-suggestion" data-name="${body.name}" data-type="${body.type}" ${body.id ? `data-id="${body.id}"` : ''}>
        ${body.name}<span class="body-type">${typeLabel}</span>
      </div>`;
    }).join('');

    // Add click handlers
    suggestionsEl.querySelectorAll('.search-suggestion').forEach(el => {
      el.addEventListener('click', () => {
        const element = el as HTMLElement;
        this.selectSearchResult(element.dataset.name!, element.dataset.type as any, element.dataset.id);
      });
    });

    suggestionsEl.classList.add('visible');
    this.searchSelectedIndex = -1;
  }

  private hideSearchSuggestions(): void {
    const suggestionsEl = document.getElementById('search-suggestions');
    if (suggestionsEl) {
      suggestionsEl.classList.remove('visible');
      suggestionsEl.innerHTML = '';
    }
    this.searchSelectedIndex = -1;
  }

  private updateSearchSelection(): void {
    const suggestionsEl = document.getElementById('search-suggestions');
    if (!suggestionsEl) return;

    const suggestions = suggestionsEl.querySelectorAll('.search-suggestion');
    suggestions.forEach((el, index) => {
      if (index === this.searchSelectedIndex) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  private selectSearchResult(name: string, type: 'sun' | 'planet' | 'moon' | 'asteroid' | 'satellite', id?: string): void {
    // Clear search
    const searchInput = document.getElementById('body-search') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
    this.hideSearchSuggestions();

    // Focus and select the object
    if (this.solarSystem) {
      this.solarSystem.selectAndFocusByName(name, type, id);
    }
  }

  private async searchAndAddAsteroid(query: string): Promise<void> {
    const searchInput = document.getElementById('body-search') as HTMLInputElement;
    const suggestionsEl = document.getElementById('search-suggestions');
    
    // Show loading indicator
    if (suggestionsEl) {
      suggestionsEl.innerHTML = '<div class="search-suggestion" style="color: #888;">Searching NASA database...</div>';
      suggestionsEl.classList.add('visible');
    }

    try {
      // Try to fetch from NASA API
      const asteroid = await AsteroidDataFetcher.fetchAsteroid(query);
      
      if (asteroid) {
        // Add to our data store
        this.asteroidData.set(asteroid.id, asteroid);
        
        // Add to searchable bodies
        this.searchableBodies.push({
          name: asteroid.name,
          type: 'asteroid',
          id: asteroid.id,
        });
        
        // Add to solar system scene
        if (this.solarSystem) {
          const size = asteroid.diameter ? Math.max(0.5, asteroid.diameter / 20) : 1;
          const type = (asteroid.taxonomicClass as 'C' | 'S' | 'M') || 'S';
          this.solarSystem.addAsteroid(asteroid.id, asteroid.name, asteroid.semiMajorAxis, size, type);
        }
        
        // Update asteroid count display
        this.updateAsteroidCount();
        
        // Clear search and select the new asteroid
        if (searchInput) searchInput.value = '';
        this.hideSearchSuggestions();
        
        // Focus on it
        if (this.solarSystem) {
          this.solarSystem.selectAndFocusByName(asteroid.name, 'asteroid', asteroid.id);
        }
        
        this.addNewsItem(`Found and added asteroid: ${asteroid.name}`, 'market');
      } else {
        // Show not found message
        if (suggestionsEl) {
          suggestionsEl.innerHTML = '<div class="search-suggestion" style="color: #f66;">No asteroid found with that name/number</div>';
        }
        // Auto-hide after 2 seconds
        setTimeout(() => this.hideSearchSuggestions(), 2000);
      }
    } catch (error) {
      console.error('Error searching for asteroid:', error);
      if (suggestionsEl) {
        suggestionsEl.innerHTML = '<div class="search-suggestion" style="color: #f66;">Error searching NASA database</div>';
      }
      setTimeout(() => this.hideSearchSuggestions(), 2000);
    }
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update ticker scroll (runs regardless of game state)
    this.updateTickerScroll(currentTime);

    // Update solar system with time scale
    if (this.solarSystem) {
      const timeScale = this.gameState.data.timeScale;
      this.solarSystem.update(deltaTime, timeScale, currentTime);
      this.solarSystem.render();

      // Update game time (convert ms delta to days based on time scale)
      const daysPassed = (deltaTime / 1000) * timeScale;
      this.gameState.update({ gameTime: this.gameState.data.gameTime + daysPassed });

      // Update game date display
      this.updateGameDate();

      // Update active missions
      this.updateMissions();
      
      // Generate periodic news items
      this.updateNews();
    }

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  public stop(): void {
    this.isRunning = false;
    if (this.solarSystem) {
      this.solarSystem.dispose();
    }
  }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Game());
} else {
  new Game();
}

// Expose for debugging
(window as any).game = Game;
