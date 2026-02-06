/**
 * Script to fetch asteroid data from NASA JPL API and save as static JSON
 * Run with: npx tsx scripts/fetch-asteroid-data.ts
 * 
 * This solves CORS issues by bundling asteroid data at build time
 * instead of fetching at runtime from the browser.
 * 
 * Fetches ~1000 asteroids including:
 * - All Near-Earth Asteroids (NEAs) with known physical properties
 * - Some main belt asteroids for variety
 */

const QUERY_API = 'https://ssd-api.jpl.nasa.gov/sbdb_query.api';
const DETAIL_API = 'https://ssd-api.jpl.nasa.gov/sbdb.api';

interface AsteroidInfo {
  id: string;
  name: string;
  fullName: string;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  diameter: number | null;
  mass: number | null;
  albedo: number | null;
  taxonomicClass: string;
  absoluteMagnitude: number;
}

// Famous asteroids to always include (even if query doesn't return them)
const MUST_INCLUDE = [
  '433',    // Eros - first NEA visited by spacecraft
  '1036',   // Ganymed - largest NEA
  '1566',   // Icarus - very eccentric orbit
  '25143',  // Itokawa - Hayabusa target
  '99942',  // Apophis - famous close approach
  '101955', // Bennu - OSIRIS-REx target
  '162173', // Ryugu - Hayabusa2 target
  '3200',   // Phaethon - source of Geminids
  '4179',   // Toutatis - tumbling motion
  '16',     // Psyche - metal-rich, mission target
];

/**
 * Query NASA for a list of asteroids
 */
async function queryAsteroids(limit: number): Promise<string[]> {
  // Fields: spkid (ID), full_name, class, diameter, albedo, spec_B/T (type), H (magnitude), e, a, i (orbital)
  const fields = 'spkid,full_name,class,diameter,albedo,spec_B,spec_T,H,e,a,i';
  
  // First get NEAs (Near-Earth Asteroids) - orbit classes: ATE, APO, AMO, IEO
  const neaClasses = ['ATE', 'APO', 'AMO', 'IEO'];
  const allIds: string[] = [];
  
  for (const orbitClass of neaClasses) {
    const url = `${QUERY_API}?fields=${fields}&sb-class=${orbitClass}&limit=400`;
    console.log(`Querying ${orbitClass} asteroids...`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data.data) {
        for (const row of data.data) {
          // spkid is in format 20000433 for asteroid 433
          const spkid = String(row[0]);
          const id = spkid.startsWith('2') ? spkid.slice(1).replace(/^0+/, '') : spkid;
          allIds.push(id);
        }
        console.log(`  Found ${data.data.length} ${orbitClass} asteroids`);
      }
    } catch (error) {
      console.warn(`Failed to query ${orbitClass}:`, error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Also get some main belt asteroids with known diameter > 1km
  console.log('Querying main belt asteroids...');
  const mbaUrl = `${QUERY_API}?fields=${fields}&sb-class=MBA&sb-cdata={"AND":["diameter|GT|1"]}&limit=300`;
  try {
    const response = await fetch(mbaUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        for (const row of data.data) {
          const spkid = String(row[0]);
          const id = spkid.startsWith('2') ? spkid.slice(1).replace(/^0+/, '') : spkid;
          allIds.push(id);
        }
        console.log(`  Found ${data.data.length} MBA asteroids`);
      }
    }
  } catch (error) {
    console.warn('Failed to query MBA:', error);
  }
  
  // Add must-include asteroids
  for (const id of MUST_INCLUDE) {
    if (!allIds.includes(id)) {
      allIds.push(id);
    }
  }
  
  // Deduplicate and limit
  const uniqueIds = [...new Set(allIds)];
  console.log(`\nTotal unique asteroids found: ${uniqueIds.length}`);
  
  return uniqueIds.slice(0, limit);
}

/**
 * Fetch detailed data for a single asteroid
 */
async function fetchAsteroidDetail(designation: string): Promise<AsteroidInfo | null> {
  try {
    const url = `${DETAIL_API}?des=${encodeURIComponent(designation)}&phys-par=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Parse orbital elements
    const orbitElements = data.orbit?.elements;
    if (!orbitElements) {
      return null;
    }
    
    const getElement = (name: string): number | null => {
      const el = orbitElements.find((e: any) => e.name === name);
      return el?.value ? parseFloat(el.value) : null;
    };
    
    const semiMajorAxis = getElement('a');
    const eccentricity = getElement('e');
    const inclination = getElement('i');
    
    if (semiMajorAxis === null) {
      return null;
    }
    
    // Extract physical parameters
    const phys = data.phys_par || [];
    let diameter: number | null = null;
    let mass: number | null = null;
    let albedo: number | null = null;
    let taxonomicClass = 'S';
    
    for (const param of phys) {
      if (param.name === 'diameter' && param.value) {
        diameter = parseFloat(param.value);
      } else if (param.name === 'GM' && param.value) {
        const GM = parseFloat(param.value);
        const G = 6.674e-20;
        mass = GM / G;
      } else if (param.name === 'albedo' && param.value) {
        albedo = parseFloat(param.value);
      } else if (param.name === 'spec_B' && param.value) {
        taxonomicClass = param.value.charAt(0).toUpperCase();
      } else if (param.name === 'spec_T' && param.value && taxonomicClass === 'S') {
        taxonomicClass = param.value.charAt(0).toUpperCase();
      }
    }
    
    const H = phys.find((p: any) => p.name === 'H')?.value;
    const absoluteMagnitude = H ? parseFloat(H) : 20;
    
    // Estimate diameter from magnitude if not available
    if (!diameter && absoluteMagnitude) {
      const pv = albedo || 0.15;
      diameter = 1329 / Math.sqrt(pv) * Math.pow(10, -absoluteMagnitude / 5);
    }
    
    return {
      id: designation,
      name: data.object?.shortname || data.object?.fullname || designation,
      fullName: data.object?.fullname || designation,
      semiMajorAxis,
      eccentricity: eccentricity ?? 0.1,
      inclination: inclination ?? 5,
      diameter,
      mass,
      albedo,
      taxonomicClass,
      absoluteMagnitude,
    };
  } catch (error) {
    return null;
  }
}

async function main() {
  const TARGET_COUNT = 1000;
  
  console.log('='.repeat(60));
  console.log('Fetching asteroid data from NASA JPL API');
  console.log(`Target: ${TARGET_COUNT} asteroids`);
  console.log('='.repeat(60));
  console.log('');
  
  // Step 1: Query for asteroid IDs
  const asteroidIds = await queryAsteroids(TARGET_COUNT);
  console.log(`\nWill fetch details for ${asteroidIds.length} asteroids\n`);
  
  // Step 2: Fetch details for each
  const results: AsteroidInfo[] = [];
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < asteroidIds.length; i++) {
    const id = asteroidIds[i];
    
    if ((i + 1) % 50 === 0 || i === 0) {
      console.log(`Fetching ${i + 1}/${asteroidIds.length}... (${success} success, ${failed} failed)`);
    }
    
    const asteroid = await fetchAsteroidDetail(id);
    if (asteroid) {
      results.push(asteroid);
      success++;
    } else {
      failed++;
    }
    
    // Rate limiting - be nice to NASA's servers
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log(`Successfully fetched ${results.length} asteroids`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60));
  
  // Sort by semi-major axis for consistent ordering
  results.sort((a, b) => a.semiMajorAxis - b.semiMajorAxis);
  
  // Output as JSON
  const output = JSON.stringify(results, null, 2);
  
  // Write to file
  const fs = await import('fs');
  const path = await import('path');
  
  const outputPath = path.join(process.cwd(), 'src', 'data', 'asteroid-data.json');
  fs.writeFileSync(outputPath, output);
  
  console.log(`\nData saved to: ${outputPath}`);
  console.log(`File size: ${(output.length / 1024).toFixed(1)} KB`);
  
  // Print some stats
  const types = new Map<string, number>();
  for (const a of results) {
    types.set(a.taxonomicClass, (types.get(a.taxonomicClass) || 0) + 1);
  }
  console.log('\nAsteroid types:');
  for (const [type, count] of [...types.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch(console.error);
