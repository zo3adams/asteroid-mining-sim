/**
 * News System Tests
 * 
 * Tests the news ticker system as defined in news-ticker-content.md:
 * 
 * Categories:
 * - Critical Notifications (triggered by event)
 * - Important Updates (triggered by event)
 * - Market News (triggered by 10-20% price change)
 * - Competitor Actions (every 5 minutes, may block asteroids)
 * - Educational/Space News (no more than 1 per minute)
 * - Humorous Flavor (no more than 1 per 2 minutes)
 * - Easter Eggs (triggered by date/status)
 * 
 * @see news-ticker-content.md
 * @see src/data/NewsSystem.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NewsSystem,
  NEWS_PRIORITY,
  NEWS_COOLDOWNS,
  EDUCATIONAL_NEWS,
  FLAVOR_NEWS,
  COMPETITORS,
  COMPETITOR_ACTIONS,
  MARKET_NEWS_TEMPLATES,
  EASTER_EGGS,
  EasterEggState,
  resetNewsSystem,
  getNewsSystem,
} from '../data/NewsSystem';
import { ResourceType } from '../utils/Constants';

describe('News System', () => {
  let newsSystem: NewsSystem;

  beforeEach(() => {
    resetNewsSystem();
    newsSystem = getNewsSystem();
  });

  // ==========================================================================
  // NEWS PRIORITY
  // ==========================================================================
  describe('News Priority', () => {
    /**
     * Per news-ticker-content.md:
     * - Critical: Show immediately, interrupt current message
     * - Important: Show within 10 seconds, priority queue
     * - Market/Competitor: Show within 1 minute, normal queue
     * - Educational: Every 2-3 minutes when no other messages
     * - Humorous: Every 3-5 minutes, low priority
     */

    it('should have critical as highest priority (0)', () => {
      expect(NEWS_PRIORITY.critical).toBe(0);
    });

    it('should have important as second priority (1)', () => {
      expect(NEWS_PRIORITY.important).toBe(1);
    });

    it('should have market and competitor as medium priority', () => {
      expect(NEWS_PRIORITY.market).toBe(2);
      expect(NEWS_PRIORITY.competitor).toBe(3);
    });

    it('should have educational and flavor as lowest priority', () => {
      expect(NEWS_PRIORITY.educational).toBe(4);
      expect(NEWS_PRIORITY.flavor).toBe(5);
    });

    it('should have priorities in correct order', () => {
      const priorities = Object.entries(NEWS_PRIORITY)
        .sort((a, b) => a[1] - b[1])
        .map(([type]) => type);
      
      expect(priorities).toEqual([
        'critical',
        'important',
        'market',
        'competitor',
        'educational',
        'flavor',
      ]);
    });
  });

  // ==========================================================================
  // NEWS COOLDOWNS
  // ==========================================================================
  describe('News Cooldowns', () => {
    /**
     * Cooldowns are in game days. At 1 week/sec:
     * - 1 game day ≈ 1.4 seconds real time
     * - competitor every ~5 min real = ~3.5 game days
     * - educational ~1/min = ~0.7 game days
     * - flavor ~1/2min = ~1.4 game days
     */

    it('should have no cooldown for critical news', () => {
      expect(NEWS_COOLDOWNS.critical).toBe(0);
    });

    it('should have short cooldown for important news', () => {
      expect(NEWS_COOLDOWNS.important).toBeLessThanOrEqual(1);
    });

    it('should have ~5 minute cooldown for competitor news', () => {
      // At 1 week/sec, 5 minutes = ~3.5 game days
      expect(NEWS_COOLDOWNS.competitor).toBeGreaterThanOrEqual(3);
      expect(NEWS_COOLDOWNS.competitor).toBeLessThanOrEqual(5);
    });

    it('should have ~1 minute cooldown for educational news', () => {
      // At 1 week/sec, 1 minute = ~0.7 game days
      expect(NEWS_COOLDOWNS.educational).toBeGreaterThanOrEqual(0.5);
      expect(NEWS_COOLDOWNS.educational).toBeLessThanOrEqual(1);
    });

    it('should have ~2 minute cooldown for flavor news', () => {
      // At 1 week/sec, 2 minutes = ~1.4 game days
      expect(NEWS_COOLDOWNS.flavor).toBeGreaterThanOrEqual(1);
      expect(NEWS_COOLDOWNS.flavor).toBeLessThanOrEqual(2);
    });
  });

  // ==========================================================================
  // COOLDOWN ENFORCEMENT
  // ==========================================================================
  describe('Cooldown Enforcement', () => {
    it('should allow news when cooldown has passed', () => {
      expect(newsSystem.canShowNews('flavor', 100)).toBe(true);
    });

    it('should block news before cooldown expires', () => {
      newsSystem.recordNewsShown('flavor', 100);
      expect(newsSystem.canShowNews('flavor', 100.5)).toBe(false);
    });

    it('should allow news after cooldown expires', () => {
      newsSystem.recordNewsShown('flavor', 100);
      const cooldown = NEWS_COOLDOWNS.flavor;
      expect(newsSystem.canShowNews('flavor', 100 + cooldown + 0.1)).toBe(true);
    });

    it('should track cooldowns independently per type', () => {
      newsSystem.recordNewsShown('flavor', 100);
      newsSystem.recordNewsShown('educational', 101);
      
      // Flavor cooldown not expired
      expect(newsSystem.canShowNews('flavor', 100.5)).toBe(false);
      // Educational cooldown not expired
      expect(newsSystem.canShowNews('educational', 101.5)).toBe(false);
      // Critical has no cooldown
      expect(newsSystem.canShowNews('critical', 100)).toBe(true);
    });
  });

  // ==========================================================================
  // EDUCATIONAL NEWS CONTENT
  // ==========================================================================
  describe('Educational News Content', () => {
    /**
     * Per news-ticker-content.md:
     * Real Astronomy Facts that appear randomly, no more than 1 per minute
     */

    it('should have educational news content defined', () => {
      expect(EDUCATIONAL_NEWS.length).toBeGreaterThan(0);
    });

    it('should have at least 10 educational facts', () => {
      expect(EDUCATIONAL_NEWS.length).toBeGreaterThanOrEqual(10);
    });

    it('should include facts about asteroid types', () => {
      const hasTypeInfo = EDUCATIONAL_NEWS.some(
        msg => msg.includes('C-type') || msg.includes('S-type') || msg.includes('M-type')
      );
      expect(hasTypeInfo).toBe(true);
    });

    it('should include facts about Psyche asteroid', () => {
      const hasPsyche = EDUCATIONAL_NEWS.some(msg => msg.includes('Psyche'));
      expect(hasPsyche).toBe(true);
    });

    it('should return random educational news', () => {
      const news = newsSystem.getEducationalNews();
      expect(news).not.toBeNull();
      expect(EDUCATIONAL_NEWS).toContain(news);
    });

    it('should return different educational news on multiple calls (statistical)', () => {
      // Call many times and check we get variety (not always the same)
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const news = newsSystem.getEducationalNews();
        if (news) results.add(news);
      }
      // With 12 items and 20 random picks, we should get at least 3 different ones
      expect(results.size).toBeGreaterThanOrEqual(3);
    });
  });

  // ==========================================================================
  // FLAVOR NEWS CONTENT
  // ==========================================================================
  describe('Flavor News Content', () => {
    /**
     * Per news-ticker-content.md:
     * Humorous irrelevant space news, no more than 1 per 2 minutes
     */

    it('should have flavor news content defined', () => {
      expect(FLAVOR_NEWS.length).toBeGreaterThan(0);
    });

    it('should have at least 15 flavor messages', () => {
      expect(FLAVOR_NEWS.length).toBeGreaterThanOrEqual(15);
    });

    it('should include pirate-related humor', () => {
      const hasPirate = FLAVOR_NEWS.some(
        msg => msg.includes('pirate') || msg.includes('Thatch') || msg.includes('Cosmic Jack')
      );
      expect(hasPirate).toBe(true);
    });

    it('should include Mars-related humor', () => {
      const hasMars = FLAVOR_NEWS.some(
        msg => msg.includes('Mars') || msg.includes('Martian')
      );
      expect(hasMars).toBe(true);
    });

    it('should return random flavor news', () => {
      const news = newsSystem.getFlavorNews();
      expect(news).not.toBeNull();
      expect(FLAVOR_NEWS).toContain(news);
    });

    it('should return different flavor news on multiple calls (statistical)', () => {
      // Call many times and check we get variety (not always the same)
      const results = new Set<string>();
      for (let i = 0; i < 30; i++) {
        const news = newsSystem.getFlavorNews();
        if (news) results.add(news);
      }
      // With 19 items and 30 random picks, we should get at least 4 different ones
      expect(results.size).toBeGreaterThanOrEqual(4);
    });
  });

  // ==========================================================================
  // COMPETITOR ACTIONS
  // ==========================================================================
  describe('Competitor Actions', () => {
    /**
     * Per news-ticker-content.md:
     * Trigger randomly every 5 minutes. If action is successful mine/outpost,
     * player can no longer mine that asteroid.
     */

    it('should have competitors defined', () => {
      expect(COMPETITORS.length).toBeGreaterThan(0);
    });

    it('should include Rock Lobster Industries', () => {
      const hasRockLobster = COMPETITORS.some(c => c.name === 'Rock Lobster Industries');
      expect(hasRockLobster).toBe(true);
    });

    it('should include Solar System Quarry and Drill', () => {
      const hasSSQD = COMPETITORS.some(c => c.name === 'Solar System Quarry and Drill');
      expect(hasSSQD).toBe(true);
    });

    it('should include Belt Brothers Salvage', () => {
      const hasBeltBros = COMPETITORS.some(c => c.name === 'Belt Brothers Salvage');
      expect(hasBeltBros).toBe(true);
    });

    it('should have competitor actions defined', () => {
      expect(COMPETITOR_ACTIONS.length).toBeGreaterThan(0);
    });

    it('should have actions that block asteroids', () => {
      const blockingActions = COMPETITOR_ACTIONS.filter(a => a.blocksAsteroid);
      expect(blockingActions.length).toBeGreaterThan(0);
    });

    it('should have actions that do not block asteroids', () => {
      const nonBlockingActions = COMPETITOR_ACTIONS.filter(a => !a.blocksAsteroid);
      expect(nonBlockingActions.length).toBeGreaterThan(0);
    });

    it('should generate competitor news with asteroid name', () => {
      const asteroids = ['Eros', 'Bennu', 'Ryugu'];
      
      // Run multiple times to hit an asteroid-related action
      let foundAsteroid = false;
      for (let i = 0; i < 20; i++) {
        resetNewsSystem();
        const result = getNewsSystem().generateCompetitorNews(asteroids);
        if (result && asteroids.some(a => result.text.includes(a))) {
          foundAsteroid = true;
          break;
        }
      }
      
      expect(foundAsteroid).toBe(true);
    });

    it('should block asteroid when blocking action occurs', () => {
      const asteroids = ['TestAsteroid1', 'TestAsteroid2'];
      
      // Keep generating until we get a blocking action
      let blocked = false;
      for (let i = 0; i < 50 && !blocked; i++) {
        resetNewsSystem();
        const ns = getNewsSystem();
        const result = ns.generateCompetitorNews(asteroids);
        if (result?.blocksAsteroid && result.asteroidId) {
          expect(ns.isAsteroidBlocked(result.asteroidId)).toBe(true);
          blocked = true;
        }
      }
      
      // We should have found at least one blocking action
      expect(blocked).toBe(true);
    });

    it('should not reuse blocked asteroids for new blocking actions', () => {
      const asteroids = ['Asteroid1', 'Asteroid2'];
      const ns = getNewsSystem();
      
      // Block the first asteroid manually
      ns.generateCompetitorNews(['Asteroid1']);
      
      // If Asteroid1 gets blocked, future blocking actions should use Asteroid2
      // This is probabilistic, but we're testing the filtering logic
      const blockedInitial = ns.getBlockedAsteroids().length;
      
      // Generate more actions - blocked asteroids should be filtered
      for (let i = 0; i < 10; i++) {
        ns.generateCompetitorNews(asteroids);
      }
      
      // Total blocked should be <= total asteroids (prove filtering works)
      expect(ns.getBlockedAsteroids().length).toBeLessThanOrEqual(asteroids.length);
      // And should be >= initial (no unblocking happens)
      expect(ns.getBlockedAsteroids().length).toBeGreaterThanOrEqual(blockedInitial);
    });
  });

  // ==========================================================================
  // MARKET NEWS
  // ==========================================================================
  describe('Market News', () => {
    /**
     * Per news-ticker-content.md:
     * Triggered by specific fluctuations in resource price (10-20% change)
     */

    it('should have market news templates for all resources', () => {
      const coveredResources = new Set(MARKET_NEWS_TEMPLATES.map(t => t.resource));
      
      expect(coveredResources.has(ResourceType.WATER)).toBe(true);
      expect(coveredResources.has(ResourceType.LITHIUM)).toBe(true);
      expect(coveredResources.has(ResourceType.PLATINUM)).toBe(true);
      expect(coveredResources.has(ResourceType.IRON)).toBe(true);
      expect(coveredResources.has(ResourceType.NICKEL)).toBe(true);
      expect(coveredResources.has(ResourceType.GOLD)).toBe(true);
      expect(coveredResources.has(ResourceType.RARE_EARTH)).toBe(true);
      expect(coveredResources.has(ResourceType.VOLATILES)).toBe(true);
    });

    it('should have both up and down templates for each resource', () => {
      const resources = [
        ResourceType.WATER,
        ResourceType.LITHIUM,
        ResourceType.PLATINUM,
        ResourceType.IRON,
      ];
      
      for (const resource of resources) {
        const upTemplates = MARKET_NEWS_TEMPLATES.filter(
          t => t.resource === resource && t.direction === 'up'
        );
        const downTemplates = MARKET_NEWS_TEMPLATES.filter(
          t => t.resource === resource && t.direction === 'down'
        );
        
        expect(upTemplates.length).toBeGreaterThan(0);
        expect(downTemplates.length).toBeGreaterThan(0);
      }
    });

    it('should return up news for positive price change', () => {
      const news = newsSystem.getMarketNews(ResourceType.LITHIUM, 15);
      expect(news).not.toBeNull();
      // Should be from the 'up' templates
      const upTemplates = MARKET_NEWS_TEMPLATES.find(
        t => t.resource === ResourceType.LITHIUM && t.direction === 'up'
      );
      expect(upTemplates?.templates).toContain(news);
    });

    it('should return down news for negative price change', () => {
      const news = newsSystem.getMarketNews(ResourceType.PLATINUM, -12);
      expect(news).not.toBeNull();
      // Should be from the 'down' templates
      const downTemplates = MARKET_NEWS_TEMPLATES.find(
        t => t.resource === ResourceType.PLATINUM && t.direction === 'down'
      );
      expect(downTemplates?.templates).toContain(news);
    });
  });

  // ==========================================================================
  // EASTER EGGS
  // ==========================================================================
  describe('Easter Eggs', () => {
    /**
     * Per news-ticker-content.md:
     * Triggered by key in-game events, like a date or player status.
     * Triggered on entry to state only.
     */

    it('should have easter eggs defined', () => {
      expect(EASTER_EGGS.length).toBeGreaterThan(0);
    });

    it('should trigger April Fools easter egg on April 1st', () => {
      const state: EasterEggState = {
        gameMonth: 4,
        gameDay: 1,
        missionsCompleted: 50,
        balance: 50_000_000,
        isFirstCheck: true,
      };
      
      const triggered = newsSystem.checkEasterEggs(state);
      const aprilFools = triggered.find(t => t.text.includes('prank'));
      expect(aprilFools).toBeDefined();
    });

    it('should trigger Christmas easter egg on December 25th', () => {
      const state: EasterEggState = {
        gameMonth: 12,
        gameDay: 25,
        missionsCompleted: 50,
        balance: 50_000_000,
        isFirstCheck: true,
      };
      
      const triggered = newsSystem.checkEasterEggs(state);
      const christmas = triggered.find(t => t.text.includes('Santa'));
      expect(christmas).toBeDefined();
    });

    it('should trigger Moon Landing anniversary on July 20th', () => {
      const state: EasterEggState = {
        gameMonth: 7,
        gameDay: 20,
        missionsCompleted: 50,
        balance: 50_000_000,
        isFirstCheck: true,
      };
      
      const triggered = newsSystem.checkEasterEggs(state);
      const moonLanding = triggered.find(t => t.text.includes('moon landing'));
      expect(moonLanding).toBeDefined();
    });

    it('should trigger Century Club at 100 missions', () => {
      const state: EasterEggState = {
        gameMonth: 6,
        gameDay: 15,
        missionsCompleted: 100,
        balance: 50_000_000,
        isFirstCheck: true,
      };
      
      const triggered = newsSystem.checkEasterEggs(state);
      const centuryClub = triggered.find(t => t.text.includes('Century Club'));
      expect(centuryClub).toBeDefined();
    });

    it('should trigger bankruptcy message when balance <= 0', () => {
      const state: EasterEggState = {
        gameMonth: 6,
        gameDay: 15,
        missionsCompleted: 10,
        balance: 0,
        isFirstCheck: true,
      };
      
      const triggered = newsSystem.checkEasterEggs(state);
      const bankruptcy = triggered.find(t => t.text.includes('bold strategy'));
      expect(bankruptcy).toBeDefined();
    });

    it('should trigger billionaire message at $1B', () => {
      const state: EasterEggState = {
        gameMonth: 6,
        gameDay: 15,
        missionsCompleted: 200,
        balance: 1_000_000_000,
        isFirstCheck: true,
      };
      
      const triggered = newsSystem.checkEasterEggs(state);
      const billionaire = triggered.find(t => t.text.includes('BILLIONAIRE'));
      expect(billionaire).toBeDefined();
    });

    it('should NOT trigger easter egg twice for same condition', () => {
      const state: EasterEggState = {
        gameMonth: 4,
        gameDay: 1,
        missionsCompleted: 50,
        balance: 50_000_000,
        isFirstCheck: true,
      };
      
      // First check triggers
      const first = newsSystem.checkEasterEggs(state);
      expect(first.length).toBeGreaterThan(0);
      
      // Second check should not trigger same egg
      const second = newsSystem.checkEasterEggs(state);
      const aprilFoolsAgain = second.find(t => t.text.includes('prank'));
      expect(aprilFoolsAgain).toBeUndefined();
    });

    it('should only trigger when isFirstCheck is true', () => {
      const state: EasterEggState = {
        gameMonth: 4,
        gameDay: 1,
        missionsCompleted: 50,
        balance: 50_000_000,
        isFirstCheck: false, // Not first check
      };
      
      const triggered = newsSystem.checkEasterEggs(state);
      expect(triggered.length).toBe(0);
    });
  });

  // ==========================================================================
  // SERIALIZATION
  // ==========================================================================
  describe('Serialization', () => {
    it('should serialize and deserialize state correctly', () => {
      // Set up some state
      newsSystem.recordNewsShown('flavor', 100);
      newsSystem.recordNewsShown('educational', 101);
      newsSystem.getEducationalNews(); // Use one
      newsSystem.getFlavorNews(); // Use one
      
      // Trigger an easter egg
      newsSystem.checkEasterEggs({
        gameMonth: 4,
        gameDay: 1,
        missionsCompleted: 50,
        balance: 50_000_000,
        isFirstCheck: true,
      });
      
      // Block an asteroid
      newsSystem.generateCompetitorNews(['TestAsteroid']);
      
      // Serialize
      const serialized = newsSystem.serialize();
      
      // Create new instance and deserialize
      resetNewsSystem();
      const newSystem = getNewsSystem();
      newSystem.deserialize(serialized);
      
      // Verify state was restored
      expect(newSystem.canShowNews('flavor', 100.5)).toBe(false); // Still on cooldown
      
      // Easter egg should still be marked as triggered
      const triggered = newSystem.checkEasterEggs({
        gameMonth: 4,
        gameDay: 1,
        missionsCompleted: 50,
        balance: 50_000_000,
        isFirstCheck: true,
      });
      expect(triggered.find(t => t.text.includes('prank'))).toBeUndefined();
    });
  });
});
