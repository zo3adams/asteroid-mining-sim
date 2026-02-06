/**
 * Asteroid Match Percentage Tests
 * 
 * Tests the match percentage calculation logic used in mission planning.
 * 
 * @see spec.md "Asteroid Match Percentage Calculation" section
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateAsteroidMatches, 
  getTypesForResource,
  AsteroidInfo 
} from '../data/AsteroidData';
import { ResourceType } from '../utils/Constants';

// Helper to create mock asteroids
function createAsteroid(
  id: string, 
  taxonomicClass: string, 
  diameter: number | null = 10
): AsteroidInfo {
  return {
    id,
    name: id,
    fullName: id,
    semiMajorAxis: 2.5,
    eccentricity: 0.1,
    inclination: 5,
    diameter,
    mass: null,
    albedo: null,
    taxonomicClass,
    absoluteMagnitude: 15,
  };
}

describe('Asteroid Match Percentage', () => {
  // ==========================================================================
  // FILTERING
  // Per spec: "Asteroids are first checked against the contract's resource type"
  // ==========================================================================
  describe('Filtering by Resource Type', () => {
    it('should only include asteroids with matching taxonomic class', () => {
      // Get the actual types that have water
      const goodTypes = getTypesForResource(ResourceType.WATER);
      
      // Create asteroids - some matching, some not
      // X-type doesn't have water (it has iron/nickel/platinum)
      const asteroids = [
        createAsteroid('match1', goodTypes[0] || 'C'),  // Use actual matching type
        createAsteroid('match2', goodTypes[0] || 'C'),
        createAsteroid('nomatch1', 'X'), // X-type doesn't have water
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      const matching = results.filter(r => r.hasResource);
      const nonMatching = results.filter(r => !r.hasResource);
      
      expect(matching.length).toBe(2);
      expect(matching.every(r => goodTypes.includes(r.asteroid.taxonomicClass))).toBe(true);
      
      // Non-matching should be at 1%
      expect(nonMatching.every(r => r.matchPercent === 1)).toBe(true);
    });

    it('should filter based on getTypesForResource list', () => {
      // Platinum is found in M-type asteroids
      const goodTypes = getTypesForResource(ResourceType.PLATINUM);
      expect(goodTypes).toContain('M');
      
      // Create one matching and some non-matching
      // C-type has mostly water/volatiles, minimal platinum
      const asteroids = [
        createAsteroid('m1', 'M'),
        createAsteroid('x1', 'X'), // X has platinum too
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.PLATINUM);
      const matching = results.filter(r => r.hasResource);
      
      // Should have matches
      expect(matching.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // SCORING
  // Per spec: "Raw Score = 1.0 × typeScore × sizeScore (multiplicative)"
  // ==========================================================================
  describe('Multiplicative Scoring', () => {
    it('should score larger asteroids higher than smaller ones of same type', () => {
      const asteroids = [
        createAsteroid('small', 'C', 10),  // Small
        createAsteroid('large', 'C', 50),  // Large (maxes out size score)
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      const small = results.find(r => r.asteroid.id === 'small')!;
      const large = results.find(r => r.asteroid.id === 'large')!;
      
      expect(large.rawScore).toBeGreaterThan(small.rawScore);
      expect(large.matchPercent).toBeGreaterThan(small.matchPercent);
    });

    it('should use multiplicative scoring (not additive)', () => {
      // With multiplicative: rawScore = typeScore * sizeScore
      // A low type score should significantly reduce overall score
      const goodTypes = getTypesForResource(ResourceType.WATER);
      
      // Create asteroids of different types in the good types list
      const asteroids = goodTypes.map((type) => 
        createAsteroid(`asteroid-${type}`, type, 25) // Same size
      );
      
      if (asteroids.length >= 2) {
        const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
        
        // Best type should have higher score than worse types
        const bestType = results.find(r => r.asteroid.taxonomicClass === goodTypes[0]);
        const worstType = results.find(r => r.asteroid.taxonomicClass === goodTypes[goodTypes.length - 1]);
        
        if (bestType && worstType && goodTypes.length > 1) {
          expect(bestType.rawScore).toBeGreaterThan(worstType.rawScore);
        }
      }
    });

    it('should cap size score at 1.0 for asteroids >= 50km', () => {
      const asteroids = [
        createAsteroid('a50', 'C', 50),
        createAsteroid('a100', 'C', 100),
        createAsteroid('a200', 'C', 200),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      // All should have same raw score since size is capped
      const scores = results.map(r => r.rawScore);
      expect(scores[0]).toBe(scores[1]);
      expect(scores[1]).toBe(scores[2]);
    });

    it('should use 0.3 size score for asteroids with unknown diameter', () => {
      const asteroids = [
        createAsteroid('known', 'C', 15),    // 15/50 = 0.3 size score
        createAsteroid('unknown', 'C', null), // null = 0.3 default
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      const known = results.find(r => r.asteroid.id === 'known')!;
      const unknown = results.find(r => r.asteroid.id === 'unknown')!;
      
      // Both should have same raw score
      expect(known.rawScore).toBe(unknown.rawScore);
    });
  });

  // ==========================================================================
  // NORMALIZATION
  // Per spec: "Normalized to a 20-90% display range"
  // ==========================================================================
  describe('Normalization to 20-90%', () => {
    it('should normalize lowest match to 20%', () => {
      const asteroids = [
        createAsteroid('best', 'C', 50),   // Best match
        createAsteroid('worst', 'C', 5),   // Worst match (small)
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      const worst = results.find(r => r.asteroid.id === 'worst')!;
      
      expect(worst.matchPercent).toBe(20);
    });

    it('should normalize highest match to 90%', () => {
      const asteroids = [
        createAsteroid('best', 'C', 50),   // Best match
        createAsteroid('worst', 'C', 5),   // Worst match
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      const best = results.find(r => r.asteroid.id === 'best')!;
      
      expect(best.matchPercent).toBe(90);
    });

    it('should never show below 20% for matching asteroids', () => {
      const asteroids = [
        createAsteroid('a1', 'C', 1),   // Very small
        createAsteroid('a2', 'C', 2),
        createAsteroid('a3', 'C', 100), // Very large
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      const matching = results.filter(r => r.hasResource);
      
      for (const result of matching) {
        expect(result.matchPercent).toBeGreaterThanOrEqual(20);
      }
    });

    it('should never show above 90% for matching asteroids', () => {
      const asteroids = [
        createAsteroid('a1', 'C', 50),
        createAsteroid('a2', 'C', 100),
        createAsteroid('a3', 'C', 200),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      const matching = results.filter(r => r.hasResource);
      
      for (const result of matching) {
        expect(result.matchPercent).toBeLessThanOrEqual(90);
      }
    });

    it('should handle single matching asteroid (both min and max)', () => {
      const asteroids = [
        createAsteroid('only', 'C', 25),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      // With only one asteroid, it's both min and max
      // Should still be in valid range (20-90)
      expect(results[0].matchPercent).toBeGreaterThanOrEqual(20);
      expect(results[0].matchPercent).toBeLessThanOrEqual(90);
    });

    it('should interpolate middle scores linearly', () => {
      const asteroids = [
        createAsteroid('small', 'C', 10),  // 10/50 = 0.2 size
        createAsteroid('medium', 'C', 30), // 30/50 = 0.6 size
        createAsteroid('large', 'C', 50),  // 50/50 = 1.0 size
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      const small = results.find(r => r.asteroid.id === 'small')!;
      const medium = results.find(r => r.asteroid.id === 'medium')!;
      const large = results.find(r => r.asteroid.id === 'large')!;
      
      // Small should be 20%, Large should be 90%
      expect(small.matchPercent).toBe(20);
      expect(large.matchPercent).toBe(90);
      
      // Medium should be between them
      expect(medium.matchPercent).toBeGreaterThan(20);
      expect(medium.matchPercent).toBeLessThan(90);
    });
  });

  // ==========================================================================
  // FALLBACK
  // Per spec: "If fewer than 5 asteroids match, non-matching shown at 1%"
  // ==========================================================================
  describe('Fallback for Non-Matching Asteroids', () => {
    it('should add non-matching asteroids at 1% when fewer than 5 matches', () => {
      // Use X-type which doesn't have water
      const goodTypes = getTypesForResource(ResourceType.WATER);
      const matchingType = goodTypes[0] || 'C';
      
      const asteroids = [
        createAsteroid('match1', matchingType, 25),
        createAsteroid('match2', matchingType, 30),
        createAsteroid('nomatch1', 'X', 40), // X-type has no water
        createAsteroid('nomatch2', 'X', 35),
        createAsteroid('nomatch3', 'X', 45),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      // Should have 2 matches + 3 non-matches to reach 5
      expect(results.length).toBe(5);
      
      const nonMatching = results.filter(r => !r.hasResource);
      expect(nonMatching.length).toBe(3);
      expect(nonMatching.every(r => r.matchPercent === 1)).toBe(true);
    });

    it('should not add non-matching asteroids when 5+ matches exist', () => {
      const goodTypes = getTypesForResource(ResourceType.WATER);
      const matchingType = goodTypes[0] || 'C';
      
      const asteroids = [
        createAsteroid('match1', matchingType, 10),
        createAsteroid('match2', matchingType, 20),
        createAsteroid('match3', matchingType, 30),
        createAsteroid('match4', matchingType, 40),
        createAsteroid('match5', matchingType, 50),
        createAsteroid('nomatch1', 'X', 60),
        createAsteroid('nomatch2', 'X', 70),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      // Should only have the 5 matching asteroids
      const nonMatching = results.filter(r => !r.hasResource);
      expect(nonMatching.length).toBe(0);
    });

    it('should show 1% asteroids last in the list', () => {
      const goodTypes = getTypesForResource(ResourceType.WATER);
      const matchingType = goodTypes[0] || 'C';
      
      const asteroids = [
        createAsteroid('match1', matchingType, 25),
        createAsteroid('nomatch1', 'X', 40),
        createAsteroid('nomatch2', 'X', 35),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      // 1% asteroids should be at the end (sorted by matchPercent desc)
      const lastTwo = results.slice(-2);
      expect(lastTwo.every(r => r.matchPercent === 1)).toBe(true);
    });
  });

  // ==========================================================================
  // SORTING
  // ==========================================================================
  describe('Result Sorting', () => {
    it('should sort results by matchPercent descending', () => {
      const asteroids = [
        createAsteroid('small', 'C', 5),
        createAsteroid('medium', 'C', 25),
        createAsteroid('large', 'C', 50),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      // Should be sorted: large, medium, small
      expect(results[0].asteroid.id).toBe('large');
      expect(results[results.length - 1].asteroid.id).toBe('small');
      
      // Verify descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i].matchPercent).toBeLessThanOrEqual(results[i - 1].matchPercent);
      }
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle empty asteroid list', () => {
      const results = calculateAsteroidMatches([], ResourceType.WATER);
      expect(results).toEqual([]);
    });

    it('should handle all non-matching asteroids', () => {
      // Use a resource that M-type doesn't have
      const asteroids = [
        createAsteroid('m1', 'M', 25),
        createAsteroid('m2', 'M', 30),
        createAsteroid('m3', 'M', 35),
      ];
      
      // If M-type doesn't have water, all should be 1%
      const goodTypes = getTypesForResource(ResourceType.WATER);
      if (!goodTypes.includes('M')) {
        const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
        expect(results.every(r => r.matchPercent === 1)).toBe(true);
      }
    });

    it('should handle all asteroids having same score', () => {
      const asteroids = [
        createAsteroid('a1', 'C', 25),
        createAsteroid('a2', 'C', 25),
        createAsteroid('a3', 'C', 25),
      ];
      
      const results = calculateAsteroidMatches(asteroids, ResourceType.WATER);
      
      // All same score - normalization should still work
      // With range = 0, all should get same percent (could be any valid value)
      const percents = new Set(results.map(r => r.matchPercent));
      expect(percents.size).toBe(1);
      
      // Should still be in valid range
      expect(results[0].matchPercent).toBeGreaterThanOrEqual(20);
      expect(results[0].matchPercent).toBeLessThanOrEqual(90);
    });
  });
});
