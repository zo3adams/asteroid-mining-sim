/**
 * Wikipedia URL lookup for celestial bodies
 * Uses search URLs for asteroids to handle cases where articles don't exist
 */

/**
 * Planet Wikipedia article names (these always have articles)
 */
export const PLANET_WIKIPEDIA: Record<string, string> = {
  'Mercury': 'Mercury_(planet)',
  'Venus': 'Venus',
  'Earth': 'Earth',
  'Mars': 'Mars',
  'Jupiter': 'Jupiter',
  'Saturn': 'Saturn',
  'Uranus': 'Uranus',
  'Neptune': 'Neptune',
};

/**
 * Get Wikipedia search URL for an asteroid
 * Uses search instead of direct article links since many asteroids don't have Wikipedia articles
 * @param _asteroidId - The asteroid ID (unused, kept for API compatibility)
 * @param asteroidName - The asteroid name (e.g., "1 Ceres", "5131 (1990 BG)")
 * @returns Full Wikipedia search URL
 */
export function getAsteroidWikipediaUrl(_asteroidId: string, asteroidName: string): string {
  const searchUrl = 'https://en.wikipedia.org/w/index.php?search=';
  return searchUrl + encodeURIComponent(asteroidName);
}

/**
 * Get Wikipedia URL for a planet
 * @param planetName - Name of the planet
 * @returns Full Wikipedia URL (direct link - planets always have articles)
 */
export function getPlanetWikipediaUrl(planetName: string): string {
  const baseUrl = 'https://en.wikipedia.org/wiki/';
  const articleName = PLANET_WIKIPEDIA[planetName] || planetName;
  return baseUrl + articleName;
}

/**
 * Get Wikipedia URL for the Sun
 * @returns Full Wikipedia URL
 */
export function getSunWikipediaUrl(): string {
  return 'https://en.wikipedia.org/wiki/Sun';
}
