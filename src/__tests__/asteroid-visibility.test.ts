/**
 * Asteroid Visibility & Label Tests
 * 
 * Tests the dynamic asteroid rendering and label visibility behavior.
 * 
 * @see game-mechanics.md "Asteroid Rendering & Labels" section
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Types to match the actual implementation
interface AsteroidInfo {
  id: string;
  name: string;
  semiMajorAxis: number;
}

interface Mission {
  id: string;
  asteroidId: string;
  status: string;
}

/**
 * Determines which asteroids should be visible based on camera position and active missions.
 * This mirrors the logic in main.ts updateAsteroidVisibility()
 */
function getVisibleAsteroids(
  allAsteroids: AsteroidInfo[],
  minedAsteroidIds: string[],
  activeMissions: Mission[],
  cameraTargetAU: number,
  maxVisible: number = 36
): { id: string; hasActiveMission: boolean }[] {
  // Get asteroids with active missions - these always stay visible
  const activeMissionAsteroidIds = new Set(
    activeMissions.map(m => m.asteroidId)
  );

  // Filter out mined asteroids and score by distance from camera
  const scored = allAsteroids
    .filter(a => !minedAsteroidIds.includes(a.id))
    .map(asteroid => ({
      asteroid,
      distance: Math.abs(asteroid.semiMajorAxis - cameraTargetAU),
    }))
    .sort((a, b) => a.distance - b.distance);

  // Active mission asteroids always visible first
  const shouldBeVisible = new Set<string>(activeMissionAsteroidIds);

  // Fill remaining slots with closest asteroids
  const slotsForDynamic = maxVisible - activeMissionAsteroidIds.size;
  let added = 0;
  for (const { asteroid } of scored) {
    if (added >= slotsForDynamic) break;
    if (!shouldBeVisible.has(asteroid.id)) {
      shouldBeVisible.add(asteroid.id);
      added++;
    }
  }

  return Array.from(shouldBeVisible).map(id => ({
    id,
    hasActiveMission: activeMissionAsteroidIds.has(id),
  }));
}

/**
 * Determines label visibility for an asteroid.
 * Labels are visible if: hovered OR has active mission
 */
function isLabelVisible(
  asteroidId: string,
  activeMissions: Mission[],
  isHovered: boolean
): boolean {
  const hasActiveMission = activeMissions.some(m => m.asteroidId === asteroidId);
  return isHovered || hasActiveMission;
}

// Helper to create test asteroids
function createAsteroid(id: string, semiMajorAxis: number): AsteroidInfo {
  return { id, name: id, semiMajorAxis };
}

describe('Asteroid Visibility', () => {
  let allAsteroids: AsteroidInfo[];

  beforeEach(() => {
    // Create 100 test asteroids at varying distances
    allAsteroids = [];
    for (let i = 1; i <= 100; i++) {
      // Spread from 0.5 AU to 5.5 AU
      const semiMajorAxis = 0.5 + (i / 20);
      allAsteroids.push(createAsteroid(`asteroid-${i}`, semiMajorAxis));
    }
  });

  // ==========================================================================
  // MAX VISIBLE COUNT
  // ==========================================================================

  describe('Maximum Visible Count', () => {
    it('should limit visible asteroids to maxVisible (default 36)', () => {
      const visible = getVisibleAsteroids(allAsteroids, [], [], 2.5);
      expect(visible.length).toBe(36);
    });

    it('should respect custom maxVisible parameter', () => {
      const visible = getVisibleAsteroids(allAsteroids, [], [], 2.5, 10);
      expect(visible.length).toBe(10);
    });

    it('should return all asteroids if fewer than maxVisible exist', () => {
      const fewAsteroids = allAsteroids.slice(0, 5);
      const visible = getVisibleAsteroids(fewAsteroids, [], [], 2.5, 36);
      expect(visible.length).toBe(5);
    });
  });

  // ==========================================================================
  // DISTANCE-BASED SELECTION
  // ==========================================================================

  describe('Distance-Based Selection', () => {
    it('should select asteroids closest to camera target AU', () => {
      const cameraTargetAU = 2.5; // Camera pointed at 2.5 AU
      const visible = getVisibleAsteroids(allAsteroids, [], [], cameraTargetAU, 5);
      
      // All visible asteroids should be close to 2.5 AU
      const visibleAsteroids = visible.map(v => 
        allAsteroids.find(a => a.id === v.id)!
      );
      
      for (const asteroid of visibleAsteroids) {
        expect(Math.abs(asteroid.semiMajorAxis - cameraTargetAU)).toBeLessThan(1.0);
      }
    });

    it('should change visible asteroids when camera moves', () => {
      const visibleAt1AU = getVisibleAsteroids(allAsteroids, [], [], 1.0, 10);
      const visibleAt5AU = getVisibleAsteroids(allAsteroids, [], [], 5.0, 10);
      
      const ids1AU = new Set(visibleAt1AU.map(v => v.id));
      const ids5AU = new Set(visibleAt5AU.map(v => v.id));
      
      // Should have different asteroids visible at different camera positions
      const intersection = [...ids1AU].filter(id => ids5AU.has(id));
      expect(intersection.length).toBeLessThan(10); // Not all the same
    });

    it('should show inner asteroids when camera at inner solar system', () => {
      const visible = getVisibleAsteroids(allAsteroids, [], [], 1.0, 5);
      const visibleAsteroids = visible.map(v => 
        allAsteroids.find(a => a.id === v.id)!
      );
      
      // Average should be close to 1.0 AU
      const avgAU = visibleAsteroids.reduce((sum, a) => sum + a.semiMajorAxis, 0) / visibleAsteroids.length;
      expect(avgAU).toBeLessThan(2.0);
    });
  });

  // ==========================================================================
  // MINED ASTEROIDS EXCLUSION
  // ==========================================================================

  describe('Mined Asteroid Exclusion', () => {
    it('should exclude mined asteroids from visibility', () => {
      const minedIds = ['asteroid-1', 'asteroid-2', 'asteroid-3'];
      const visible = getVisibleAsteroids(allAsteroids, minedIds, [], 2.5, 36);
      
      for (const v of visible) {
        expect(minedIds).not.toContain(v.id);
      }
    });

    it('should fill all slots even when some asteroids are mined', () => {
      const minedIds = allAsteroids.slice(0, 10).map(a => a.id);
      const visible = getVisibleAsteroids(allAsteroids, minedIds, [], 2.5, 36);
      
      expect(visible.length).toBe(36);
    });
  });

  // ==========================================================================
  // ACTIVE MISSION PRIORITY
  // ==========================================================================

  describe('Active Mission Priority', () => {
    it('should always include asteroids with active missions', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-100', status: 'in-progress' },
      ];
      
      // asteroid-100 is at 5.5 AU, camera at 1.0 AU - normally would not be visible
      const visible = getVisibleAsteroids(allAsteroids, [], missions, 1.0, 5);
      
      expect(visible.some(v => v.id === 'asteroid-100')).toBe(true);
    });

    it('should mark active mission asteroids correctly', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-50', status: 'in-progress' },
      ];
      
      const visible = getVisibleAsteroids(allAsteroids, [], missions, 2.5, 36);
      const missionAsteroid = visible.find(v => v.id === 'asteroid-50');
      
      expect(missionAsteroid).toBeDefined();
      expect(missionAsteroid!.hasActiveMission).toBe(true);
    });

    it('should mark non-mission asteroids correctly', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-50', status: 'in-progress' },
      ];
      
      const visible = getVisibleAsteroids(allAsteroids, [], missions, 2.5, 36);
      const nonMissionAsteroid = visible.find(v => v.id !== 'asteroid-50');
      
      expect(nonMissionAsteroid).toBeDefined();
      expect(nonMissionAsteroid!.hasActiveMission).toBe(false);
    });

    it('should reserve slots for active missions and fill rest by distance', () => {
      // 3 active missions at far asteroids
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-98', status: 'in-progress' },
        { id: 'mission-2', asteroidId: 'asteroid-99', status: 'in-progress' },
        { id: 'mission-3', asteroidId: 'asteroid-100', status: 'in-progress' },
      ];
      
      const visible = getVisibleAsteroids(allAsteroids, [], missions, 1.0, 5);
      
      // Should have exactly 5 visible
      expect(visible.length).toBe(5);
      
      // All 3 mission asteroids should be included
      expect(visible.filter(v => v.hasActiveMission).length).toBe(3);
      
      // The other 2 should be closest to camera (1.0 AU)
      const nonMissionVisible = visible.filter(v => !v.hasActiveMission);
      expect(nonMissionVisible.length).toBe(2);
    });

    it('should handle multiple active missions to same asteroid', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-50', status: 'in-progress' },
        { id: 'mission-2', asteroidId: 'asteroid-50', status: 'in-progress' },
      ];
      
      const visible = getVisibleAsteroids(allAsteroids, [], missions, 2.5, 36);
      
      // asteroid-50 should only appear once
      const asteroid50Count = visible.filter(v => v.id === 'asteroid-50').length;
      expect(asteroid50Count).toBe(1);
    });
  });

  // ==========================================================================
  // MISSION COMPLETION - PRIORITY REMOVAL
  // ==========================================================================

  describe('Mission Completion', () => {
    it('should remove priority when mission completes (no active missions)', () => {
      // During mission
      const activeMissions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-100', status: 'in-progress' },
      ];
      const visibleDuringMission = getVisibleAsteroids(allAsteroids, [], activeMissions, 1.0, 5);
      expect(visibleDuringMission.some(v => v.id === 'asteroid-100')).toBe(true);
      
      // After mission completes (empty active missions)
      const visibleAfterMission = getVisibleAsteroids(allAsteroids, [], [], 1.0, 5);
      
      // asteroid-100 at 5.5 AU should not be visible with camera at 1.0 AU (too far)
      expect(visibleAfterMission.some(v => v.id === 'asteroid-100')).toBe(false);
    });

    it('should keep asteroid visible if still close after mission completes', () => {
      // Mission to a close asteroid
      const activeMissions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-40', status: 'in-progress' },
      ];
      
      // asteroid-40 is around 2.5 AU, camera at 2.5 AU - should still be visible by distance
      const visibleDuringMission = getVisibleAsteroids(allAsteroids, [], activeMissions, 2.5, 10);
      const visibleAfterMission = getVisibleAsteroids(allAsteroids, [], [], 2.5, 10);
      
      expect(visibleDuringMission.some(v => v.id === 'asteroid-40')).toBe(true);
      expect(visibleAfterMission.some(v => v.id === 'asteroid-40')).toBe(true);
    });
  });
});

describe('Label Visibility', () => {
  // ==========================================================================
  // DEFAULT STATE
  // ==========================================================================

  describe('Default State', () => {
    it('should hide label when not hovered and no active mission', () => {
      const visible = isLabelVisible('asteroid-1', [], false);
      expect(visible).toBe(false);
    });
  });

  // ==========================================================================
  // HOVER BEHAVIOR
  // ==========================================================================

  describe('Hover Behavior', () => {
    it('should show label when hovered', () => {
      const visible = isLabelVisible('asteroid-1', [], true);
      expect(visible).toBe(true);
    });

    it('should show label when hovered even with other active missions', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-2', status: 'in-progress' },
      ];
      const visible = isLabelVisible('asteroid-1', missions, true);
      expect(visible).toBe(true);
    });
  });

  // ==========================================================================
  // ACTIVE MISSION VISIBILITY
  // ==========================================================================

  describe('Active Mission Label Visibility', () => {
    it('should show label when asteroid has active mission (not hovered)', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-1', status: 'in-progress' },
      ];
      const visible = isLabelVisible('asteroid-1', missions, false);
      expect(visible).toBe(true);
    });

    it('should show label when asteroid has active mission (also hovered)', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-1', status: 'in-progress' },
      ];
      const visible = isLabelVisible('asteroid-1', missions, true);
      expect(visible).toBe(true);
    });

    it('should show label for each asteroid with an active mission', () => {
      const missions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-1', status: 'in-progress' },
        { id: 'mission-2', asteroidId: 'asteroid-2', status: 'in-progress' },
        { id: 'mission-3', asteroidId: 'asteroid-3', status: 'in-progress' },
      ];
      
      expect(isLabelVisible('asteroid-1', missions, false)).toBe(true);
      expect(isLabelVisible('asteroid-2', missions, false)).toBe(true);
      expect(isLabelVisible('asteroid-3', missions, false)).toBe(true);
    });
  });

  // ==========================================================================
  // MISSION COMPLETION - LABEL HIDDEN
  // ==========================================================================

  describe('Mission Completion Label Behavior', () => {
    it('should hide label after mission completes (not hovered)', () => {
      // During mission
      const activeMissions: Mission[] = [
        { id: 'mission-1', asteroidId: 'asteroid-1', status: 'in-progress' },
      ];
      expect(isLabelVisible('asteroid-1', activeMissions, false)).toBe(true);
      
      // After mission completes (removed from active missions)
      expect(isLabelVisible('asteroid-1', [], false)).toBe(false);
    });

    it('should still show label on hover after mission completes', () => {
      // After mission completes, hovering should still work
      expect(isLabelVisible('asteroid-1', [], true)).toBe(true);
    });

    it('should hide label for completed mission asteroid but show for ongoing', () => {
      // asteroid-1 mission completed, asteroid-2 still active
      const missions: Mission[] = [
        { id: 'mission-2', asteroidId: 'asteroid-2', status: 'in-progress' },
      ];
      
      expect(isLabelVisible('asteroid-1', missions, false)).toBe(false); // completed
      expect(isLabelVisible('asteroid-2', missions, false)).toBe(true);  // still active
    });
  });
});
