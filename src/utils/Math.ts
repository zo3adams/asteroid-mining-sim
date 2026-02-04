/**
 * Math utilities for orbital mechanics and 3D calculations
 */

import { AU } from './Constants';

/**
 * Convert AU to rendering units
 */
export function auToRenderUnits(au: number): number {
  return au * 100; // 1 AU = 100 units in scene
}

/**
 * Convert rendering units to AU
 */
export function renderUnitsToAU(units: number): number {
  return units / 100;
}

/**
 * Calculate orbital position from semi-major axis and angle
 * Simplified circular orbit for now
 */
export function orbitalPosition(semiMajorAxis: number, angle: number): { x: number; y: number; z: number } {
  const radius = auToRenderUnits(semiMajorAxis);
  return {
    x: radius * Math.cos(angle),
    y: 0, // Assuming all in ecliptic plane for now
    z: radius * Math.sin(angle),
  };
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate Hohmann transfer delta-v (simplified)
 * Returns delta-v in km/s
 */
export function hohmannDeltaV(r1AU: number, r2AU: number): number {
  const r1 = r1AU * AU; // Convert to km
  const r2 = r2AU * AU;
  const mu = 1.327e11; // Sun's gravitational parameter (km³/s²)

  const v1 = Math.sqrt(mu / r1); // Circular orbit velocity at r1
  const vTransfer1 = Math.sqrt((2 * mu * r2) / (r1 * (r1 + r2))); // Transfer orbit velocity at r1
  const deltaV1 = Math.abs(vTransfer1 - v1);

  const v2 = Math.sqrt(mu / r2); // Circular orbit velocity at r2
  const vTransfer2 = Math.sqrt((2 * mu * r1) / (r2 * (r1 + r2))); // Transfer orbit velocity at r2
  const deltaV2 = Math.abs(v2 - vTransfer2);

  return deltaV1 + deltaV2;
}

/**
 * Calculate Hohmann transfer time (simplified)
 * Returns time in days
 */
export function hohmannTransferTime(r1AU: number, r2AU: number): number {
  const r1 = r1AU * AU; // Convert to km
  const r2 = r2AU * AU;
  const a = (r1 + r2) / 2; // Semi-major axis of transfer orbit
  const mu = 1.327e11; // Sun's gravitational parameter (km³/s²)

  const period = 2 * Math.PI * Math.sqrt((a * a * a) / mu); // Full orbit period in seconds
  const transferTime = period / 2; // Half orbit

  return transferTime / 86400; // Convert to days
}

/**
 * Generate a random angle in radians
 */
export function randomAngle(): number {
  return Math.random() * Math.PI * 2;
}

/**
 * Degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
