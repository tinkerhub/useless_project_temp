import { Coordinates } from '../types';
import { toRadians, toDegrees } from './geo';

const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW'
];

/**
 * Converts degrees (0-360) to a 16-point compass label.
 */
export function degreesToCompass(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_POINTS[index];
}

/**
 * Calculates the initial forward bearing (azimuth) from coord1 to coord2 in degrees (0-360).
 */
export function calculateShortestInitialBearing(coord1: Coordinates, coord2: Coordinates): number {
  // Check coincident points
  if (Math.abs(coord1.lat - coord2.lat) < 1e-7 && Math.abs(coord1.lng - coord2.lng) < 1e-7) {
    return 0;
  }

  const phi1 = toRadians(coord1.lat);
  const phi2 = toRadians(coord2.lat);
  const deltaLambda = toRadians(coord2.lng - coord1.lng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const initialBearingRadians = Math.atan2(y, x);
  const initialBearingDegrees = (toDegrees(initialBearingRadians) + 360) % 360;

  return Math.round(initialBearingDegrees * 10) / 10;
}

/**
 * Calculates the initial bearing for the long-way complementary route.
 * Because the long route follows the exact same great circle in the opposite direction,
 * its initial bearing is antipodal: (shortestBearing + 180°) % 360°.
 */
export function calculateLongWayInitialBearing(coord1: Coordinates, coord2: Coordinates): number {
  if (Math.abs(coord1.lat - coord2.lat) < 1e-7 && Math.abs(coord1.lng - coord2.lng) < 1e-7) {
    return 180;
  }
  const shortest = calculateShortestInitialBearing(coord1, coord2);
  return Math.round(((shortest + 180) % 360) * 10) / 10;
}
