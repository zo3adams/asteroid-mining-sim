/**
 * Script to fetch asteroid data from NASA JPL API and save as static JSON
 * Run with: npx ts-node scripts/fetch-asteroid-data.ts
 * 
 * This solves CORS issues by bundling asteroid data at build time
 * instead of fetching at runtime from the browser.
 */

const ASTEROIDS = [
  // Famous NEAs
  '433', // Eros - first NEA visited by spacecraft
  '1036', // Ganymed - largest NEA
  '1566', // Icarus - very eccentric orbit
  '1620', // Geographos - elongated shape
  '1862', // Apollo - prototype Apollo asteroid
  '1866', // Sisyphus - large Apollo
  '2060', // Chiron - centaur, comet-like
  '2062', // Aten - prototype Aten asteroid
  '3200', // Phaethon - source of Geminids
  '4015', // Wilson-Harrington - extinct comet
  '4179', // Toutatis - tumbling motion
  '4769', // Castalia - contact binary
  '6489', // Golevka - radar mapped
  '25143', // Itokawa - Hayabusa target
  '99942', // Apophis - famous close approach
  '101955', // Bennu - OSIRIS-REx target
  '162173', // Ryugu - Hayabusa2 target
  '433953', // 2008 TC3 - impacted Earth
  // Additional interesting NEAs
  '1221', // Amor - prototype Amor asteroid
  '1580', // Betulia - C-type NEA
  '1627', // Ivar - Amor asteroid
  '1685', // Toro - resonant orbit
  '1864', // Daedalus - large Apollo
  '1981', // Midas - gold-named asteroid
  '2063', // Bacchus - small NEA
  '2100', // Ra-Shalom - Aten asteroid
  '2201', // Oljato - unusual orbit
  '2340', // Hathor - Aten asteroid
  '3103', // Eger - E-type NEA (rare)
  '3361', // Orpheus - Apollo asteroid
  '3554', // Amun - M-type NEA (metal-rich)
  '4183', // Cuno - large Apollo
  '4660', // Nereus - mission target candidate
  '5011', // Ptah - small NEA
  '7341', // 1991 VK - binary asteroid
];

const API_BASE = 'https://ssd-api.jpl.nasa.gov/sbdb.api';

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

async function fetchAsteroid(designation: string): Promise<AsteroidInfo | null> {
  try {
    const url = `${API_BASE}?des=${encodeURIComponent(designation)}&phys-par=1`;
    console.log(`Fetching ${designation}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${designation}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Parse orbital elements - they're in an array with 'name' property
    const orbitElements = data.orbit?.elements;
    const phys = data.phys_par;
    
    if (!orbitElements) {
      console.warn(`No orbit data for ${designation}`);
      return null;
    }
    
    // Extract orbital parameters from elements array
    const getElement = (name: string): number | null => {
      const el = orbitElements.find((e: any) => e.name === name);
      return el?.value ? parseFloat(el.value) : null;
    };
    
    const semiMajorAxis = getElement('a');
    const eccentricity = getElement('e');
    const inclination = getElement('i');
    
    if (semiMajorAxis === null) {
      console.warn(`Missing semi-major axis for ${designation}`);
      return null;
    }
    
    // Extract physical parameters
    let diameter: number | null = null;
    let mass: number | null = null;
    let albedo: number | null = null;
    let taxonomicClass = 'S'; // Default
    
    if (phys) {
      for (const param of phys) {
        if (param.name === 'diameter' && param.value) {
          diameter = parseFloat(param.value);
        } else if (param.name === 'GM' && param.value) {
          // GM in km³/s², convert to mass in kg
          const GM = parseFloat(param.value);
          const G = 6.674e-20; // km³/(kg·s²)
          mass = GM / G;
        } else if (param.name === 'albedo' && param.value) {
          albedo = parseFloat(param.value);
        } else if (param.name === 'spec_B' && param.value) {
          taxonomicClass = param.value.charAt(0).toUpperCase();
        } else if (param.name === 'spec_T' && param.value && taxonomicClass === 'S') {
          taxonomicClass = param.value.charAt(0).toUpperCase();
        }
      }
    }
    
    // Get absolute magnitude
    const H = phys?.find((p: any) => p.name === 'H')?.value;
    const absoluteMagnitude = H ? parseFloat(H) : 20;
    
    // Estimate diameter from absolute magnitude if not available
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
    console.error(`Error fetching ${designation}:`, error);
    return null;
  }
}

async function main() {
  console.log('Fetching asteroid data from NASA JPL API...\n');
  
  const results: AsteroidInfo[] = [];
  
  for (let i = 0; i < ASTEROIDS.length; i++) {
    const asteroid = await fetchAsteroid(ASTEROIDS[i]);
    if (asteroid) {
      results.push(asteroid);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\nSuccessfully fetched ${results.length}/${ASTEROIDS.length} asteroids`);
  
  // Output as JSON
  const output = JSON.stringify(results, null, 2);
  
  // Write to file
  const fs = await import('fs');
  const path = await import('path');
  
  const outputPath = path.join(process.cwd(), 'src', 'data', 'asteroid-data.json');
  fs.writeFileSync(outputPath, output);
  
  console.log(`\nData saved to: ${outputPath}`);
}

main().catch(console.error);
