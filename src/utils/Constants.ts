/**
 * Game Constants
 */

// Astronomical Units
export const AU = 149597870.7; // km per AU
export const AU_TO_RENDERING_UNITS = 100; // Scale factor for rendering (1 AU = 100 units in scene)

// Time
export const SECONDS_PER_DAY = 86400;
export const DAYS_PER_YEAR = 365.25;

// Starting values
export const STARTING_CAPITAL = 50_000_000; // $50M
export const STARTING_REPUTATION = 0;

// Player backgrounds
export enum PlayerBackground {
  ENGINEER = 'engineer',
  ASTRONOMER = 'astronomer',
  ECONOMIST = 'economist',
  BUSINESS_DEVELOPER = 'business_developer',
}

// Background bonuses
export const BACKGROUND_BONUSES = {
  [PlayerBackground.ENGINEER]: {
    techTreeSpeedBonus: 0.25, // 25% faster tech unlocks
    anomalyReduction: 0.20, // 20% less anomalies/failures
  },
  [PlayerBackground.ASTRONOMER]: {
    travelTimeBonus: 0.10, // 10% faster travel
    bonusMaterialChance: 0.15, // 15% more chance of bonus materials
  },
  [PlayerBackground.ECONOMIST]: {
    priceVarianceBonus: 0.30, // 30% higher price variance (more opportunities)
    tradingBonus: 0.15, // 15% better trade margins
  },
  [PlayerBackground.BUSINESS_DEVELOPER]: {
    equipmentRentalDiscount: 0.20, // 20% discount on rentals
    storageDiscount: 0.20, // 20% discount on storage
  },
};

// Celestial body colors (realistic approximations)
export const BODY_COLORS = {
  SUN: 0xfdb813,
  MERCURY: 0x9d9d9d,
  VENUS: 0xe8cda2,
  EARTH: 0x2f6a9e,
  MARS: 0xc1440e,
  JUPITER: 0xd8ca9d,
  SATURN: 0xe3d8b8,
  URANUS: 0x4fd0e0,
  NEPTUNE: 0x4166f5,
  MOON: 0xaaaaaa,
  ISS: 0xcccccc,
  ASTEROID_C: 0xcccccc, // C-type: light grey (was too dark)
  ASTEROID_S: 0xcccccc, // S-type: light grey (was too dark)
  ASTEROID_M: 0xcccccc, // M-type: light grey (was too dark)
};

// Simplified orbital data (semi-major axis in AU, for initial positioning)
export const PLANET_ORBITS = {
  MERCURY: 0.387,
  VENUS: 0.723,
  EARTH: 1.0,
  MARS: 1.524,
  JUPITER: 5.204,
  SATURN: 9.537,
  URANUS: 19.191,
  NEPTUNE: 30.069,
};

// Planet diameters in km
export const PLANET_DIAMETERS: Record<string, number> = {
  Mercury: 4879,
  Venus: 12104,
  Earth: 12742,
  Mars: 6779,
  Jupiter: 139820,
  Saturn: 116460,
  Uranus: 50724,
  Neptune: 49244,
  Sun: 1392700,
};

// Moon diameters in km
export const MOON_DIAMETERS: Record<string, number> = {
  Moon: 3474,
  Io: 3643,
  Europa: 3122,
  Ganymede: 5268,
  Callisto: 4821,
};

// Moon data (orbital distance in km from parent planet)
export interface MoonData {
  name: string;
  parent: string; // Planet name
  orbitKm: number; // Distance from parent in km
  size: number; // Render size
  color: number;
  orbitalPeriodDays?: number; // For realistic orbital speeds
}

export const MOONS: MoonData[] = [
  // Earth's Moon
  {
    name: 'Moon',
    parent: 'Earth',
    orbitKm: 384400,
    size: 0.8,
    color: BODY_COLORS.MOON,
    orbitalPeriodDays: 27.3,
  },
  // Jupiter's Galilean moons
  {
    name: 'Io',
    parent: 'Jupiter',
    orbitKm: 421700,
    size: 0.7,
    color: 0xffcc66, // Yellowish (sulfur)
    orbitalPeriodDays: 1.77,
  },
  {
    name: 'Europa',
    parent: 'Jupiter',
    orbitKm: 671100,
    size: 0.6,
    color: 0xccddee, // Icy white-blue
    orbitalPeriodDays: 3.55,
  },
  {
    name: 'Ganymede',
    parent: 'Jupiter',
    orbitKm: 1070400,
    size: 0.9,
    color: 0xbbaa99, // Grey-brown
    orbitalPeriodDays: 7.15,
  },
  {
    name: 'Callisto',
    parent: 'Jupiter',
    orbitKm: 1882700,
    size: 0.8,
    color: 0x998877, // Dark grey-brown
    orbitalPeriodDays: 16.69,
  },
];

// ISS data (special case - human-made satellite)
export const ISS_DATA = {
  name: 'ISS',
  parent: 'Earth',
  orbitKm: 6371 + 408, // Earth radius + altitude
  size: 0.15, // Very small
  color: BODY_COLORS.ISS,
  orbitalPeriodDays: 0.063, // ~90 minutes = ~0.063 days
};

// Camera settings
export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 10000;
export const CAMERA_DEFAULT_DISTANCE = 300;

// Resource types
export enum ResourceType {
  WATER = 'water',
  LITHIUM = 'lithium',
  RARE_EARTH = 'rare_earth',
  PLATINUM = 'platinum',
  GOLD = 'gold',
  IRON = 'iron',
  NICKEL = 'nickel',
  VOLATILES = 'volatiles',
}

// Base resource prices ($/ton)
export const RESOURCE_BASE_PRICES = {
  [ResourceType.WATER]: 5000,
  [ResourceType.LITHIUM]: 45000,
  [ResourceType.RARE_EARTH]: 80000,
  [ResourceType.PLATINUM]: 150000,
  [ResourceType.GOLD]: 200000,
  [ResourceType.IRON]: 1000,
  [ResourceType.NICKEL]: 2000,
  [ResourceType.VOLATILES]: 8000,
};

// Unlock thresholds
export const ULA_UNLOCK_THRESHOLD = 100_000_000; // $100M

// UI Colors
export const UI_COLORS = {
  PRIMARY: '#0f0',
  SECONDARY: '#0ff',
  WARNING: '#ff0',
  DANGER: '#f00',
  MUTED: '#888',
};

// Time scale levels
export const TIME_SCALES = {
  REAL_TIME: 0.001,
  ONE_HOUR_PER_SEC: 0.042,     // 1 hour/sec (1/24 day)
  FOUR_HOURS_PER_SEC: 0.167,    // 4 hours/sec (1/6 day)
  EIGHT_HOURS_PER_SEC: 0.333,   // 8 hours/sec (1/3 day)
  ONE_DAY_PER_SEC: 1.0,         // 1 day/sec
  ONE_WEEK_PER_SEC: 7.0,        // 1 week/sec (7 days)
};

export const TIME_SCALE_NAMES = [
  'Real-Time',
  '1 Hour/Sec',
  '4 Hours/Sec',
  '8 Hours/Sec',
  '1 Day/Sec',
  '1 Week/Sec'
];

export const TIME_SCALE_VALUES = [
  TIME_SCALES.REAL_TIME,
  TIME_SCALES.ONE_HOUR_PER_SEC,
  TIME_SCALES.FOUR_HOURS_PER_SEC,
  TIME_SCALES.EIGHT_HOURS_PER_SEC,
  TIME_SCALES.ONE_DAY_PER_SEC,
  TIME_SCALES.ONE_WEEK_PER_SEC,
];
