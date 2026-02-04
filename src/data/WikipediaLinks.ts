/**
 * Wikipedia URL lookup table for celestial bodies
 * Maps asteroid IDs/names to their correct Wikipedia article URLs
 */

/**
 * Special cases where the Wikipedia URL doesn't match the simple name
 * Key: Asteroid ID or name
 * Value: Wikipedia article title (the part after /wiki/)
 */
export const WIKIPEDIA_LOOKUP: Record<string, string> = {
  // Asteroids with non-standard Wikipedia article names
  '433953': '(433953)_1997_XR2',
  '2008 TC3': '2008_TC3', // Uses underscore not space
  '7341': '(7341)_1991_VK', 
  // Add more as we discover them
  // Format: 'asteroid_id': 'Wikipedia_Article_Title'
};

/**
 * Planet Wikipedia article names
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
 * Get Wikipedia URL for an asteroid
 * @param asteroidId - The asteroid ID (e.g., "433", "433953")
 * @param asteroidName - The asteroid name (e.g., "Eros", "1997 XR2")
 * @returns Full Wikipedia URL
 */
export function getAsteroidWikipediaUrl(asteroidId: string, asteroidName: string): string {
  const baseUrl = 'https://en.wikipedia.org/wiki/';

  // Check lookup table first (by ID)
  if (WIKIPEDIA_LOOKUP[asteroidId]) {
    return baseUrl + WIKIPEDIA_LOOKUP[asteroidId];
  }

  // Check lookup table by name
  if (WIKIPEDIA_LOOKUP[asteroidName]) {
    return baseUrl + WIKIPEDIA_LOOKUP[asteroidName];
  }

  // Default: use the name and encode it properly
  // Replace spaces with underscores (Wikipedia convention)
  const articleName = asteroidName.replace(/ /g, '_');
  return baseUrl + encodeURIComponent(articleName);
}

/**
 * Get Wikipedia URL for a planet
 * @param planetName - Name of the planet
 * @returns Full Wikipedia URL
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

/**
 * Add a custom Wikipedia mapping
 * Useful for discovering and fixing broken links at runtime
 * @param key - Asteroid ID or name
 * @param articleName - Wikipedia article title
 */
export function addWikipediaMapping(key: string, articleName: string): void {
  WIKIPEDIA_LOOKUP[key] = articleName;
}
