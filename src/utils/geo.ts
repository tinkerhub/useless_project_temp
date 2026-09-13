import { Coordinates } from '../types';

/** Earth radius in kilometers (WGS-84 equatorial radius ensuring 40,075 km circumference) */
export const EARTH_RADIUS_KM = 6378.137;

/** Earth circumference in kilometers (≈ 40,075.017 km) */
export const EARTH_CIRCUMFERENCE_KM = 2 * Math.PI * EARTH_RADIUS_KM;

/** Convert degrees to radians */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Convert radians to degrees */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Normalize longitude to [-180, 180) */
export function normalizeLongitude(lng: number): number {
  let normalized = (lng + 180) % 360;
  if (normalized < 0) normalized += 360;
  return normalized - 180;
}

/**
 * Calculates the shortest great-circle distance between two points using the Haversine formula.
 */
export function calculateShortestDistance(coord1: Coordinates, coord2: Coordinates): number {
  const phi1 = toRadians(coord1.lat);
  const phi2 = toRadians(coord2.lat);
  const deltaPhi = toRadians(coord2.lat - coord1.lat);
  const deltaLambda = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  // Clamp to [0, 1] to guard against floating-point inaccuracies
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates the exact long-way distance along the complementary great-circle arc.
 * Distance = Earth Circumference - Shortest Distance.
 */
export function calculateLongWayDistance(coord1: Coordinates, coord2: Coordinates): number {
  const shortest = calculateShortestDistance(coord1, coord2);
  return Math.max(0, EARTH_CIRCUMFERENCE_KM - shortest);
}

/**
 * Converts spherical (lat, lng) in degrees to 3D Cartesian coordinates on a unit sphere.
 */
export function latLngToVector3(coord: Coordinates): [number, number, number] {
  const phi = toRadians(coord.lat);
  const theta = toRadians(coord.lng);

  // Y is up, X/Z in equatorial plane (matching Three.js conventions)
  const x = Math.cos(phi) * Math.sin(theta);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(theta);

  return [x, y, z];
}

/**
 * Converts 3D Cartesian unit vector to (lat, lng) in degrees.
 */
export function vector3ToLatLng(x: number, y: number, z: number): Coordinates {
  // Normalize vector
  const len = Math.sqrt(x * x + y * y + z * z);
  if (len === 0) return { lat: 0, lng: 0 };
  const nx = x / len;
  const ny = Math.max(-1, Math.min(1, y / len));
  const nz = z / len;

  const lat = toDegrees(Math.asin(ny));
  const lng = toDegrees(Math.atan2(nx, nz));

  return { lat, lng: normalizeLongitude(lng) };
}

/**
 * Formats kilometers into clean human-readable text.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000).toLocaleString()} m`;
  }
  return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

/**
 * Formats coordinates into Google Earth style DMS or decimal text.
 */
export function formatCoordinates(coord: Coordinates): string {
  const latDir = coord.lat >= 0 ? 'N' : 'S';
  const lngDir = coord.lng >= 0 ? 'E' : 'W';
  const latAbs = Math.abs(coord.lat).toFixed(4);
  const lngAbs = Math.abs(coord.lng).toFixed(4);
  return `${latAbs}° ${latDir}, ${lngAbs}° ${lngDir}`;
}
