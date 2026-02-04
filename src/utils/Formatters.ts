/**
 * Utility functions for formatting numbers and strings
 */

/**
 * Format currency with commas and dollar sign
 */
export function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format large numbers with K, M, B, T suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(0);
}

/**
 * Format distance in AU with precision
 */
export function formatDistance(au: number): string {
  if (au < 0.01) return (au * 1000).toFixed(2) + ' mAU';
  if (au < 1) return au.toFixed(3) + ' AU';
  return au.toFixed(2) + ' AU';
}

/**
 * Format time in days, months, years
 */
export function formatTime(days: number): string {
  if (days < 1) return (days * 24).toFixed(1) + ' hours';
  if (days < 30) return days.toFixed(0) + ' days';
  if (days < 365) return (days / 30).toFixed(1) + ' months';
  return (days / 365).toFixed(1) + ' years';
}

/**
 * Format mass in tons
 */
export function formatMass(tons: number): string {
  if (tons >= 1e9) return (tons / 1e9).toFixed(2) + ' Gt';
  if (tons >= 1e6) return (tons / 1e6).toFixed(2) + ' Mt';
  if (tons >= 1e3) return (tons / 1e3).toFixed(2) + ' kt';
  return tons.toFixed(0) + ' t';
}

/**
 * Format diameter with auto-scaling units (km or m)
 */
export function formatDiameter(km: number): string {
  if (km >= 1) {
    return km.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' km';
  }
  return (km * 1000).toFixed(0) + ' m';
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Random number between min and max
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random element from array
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
