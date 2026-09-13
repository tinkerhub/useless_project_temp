import { Coordinates, RouteTelemetry } from '../types';
import {
  EARTH_RADIUS_KM,
  EARTH_CIRCUMFERENCE_KM,
  calculateShortestDistance,
  calculateLongWayDistance,
  latLngToVector3,
  vector3ToLatLng
} from './geo';
import {
  calculateShortestInitialBearing,
  calculateLongWayInitialBearing,
  degreesToCompass
} from './bearing';

/**
 * Normalizes an orthogonal vector to unit length.
 */
function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len < 1e-12) return [1, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Computes the dot product of two 3D vectors.
 */
function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two 3D vectors.
 */
function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

/**
 * Finds an arbitrary unit vector orthogonal to v.
 */
function findOrthogonal(v: [number, number, number]): [number, number, number] {
  const absX = Math.abs(v[0]);
  const absY = Math.abs(v[1]);
  const absZ = Math.abs(v[2]);

  let other: [number, number, number];
  if (absX <= absY && absX <= absZ) {
    other = [1, 0, 0];
  } else if (absY <= absZ) {
    other = [0, 1, 0];
  } else {
    other = [0, 0, 1];
  }

  return normalize(cross(v, other));
}

/**
 * Generates the dense array of geographic coordinates for the LONGEST surface route
 * (the complementary arc of the exact same great circle).
 *
 * @param from Starting coordinate
 * @param to Destination coordinate
 * @param numPoints Number of sampled waypoints (defaults to 360 for high geometric fidelity)
 */
export function generateLongWayRouteCoordinates(
  from: Coordinates,
  to: Coordinates,
  numPoints: number = 360
): Coordinates[] {
  const vA = normalize(latLngToVector3(from));
  const vB = normalize(latLngToVector3(to));

  const d = Math.max(-1, Math.min(1, dot(vA, vB)));
  const theta0 = Math.acos(d); // shortest central angle [0, π]

  // Determine orthonormal basis for the great circle plane:
  // e1 = vA
  // e2 = normalized perpendicular component of vB relative to vA
  const e1: [number, number, number] = vA;
  let e2: [number, number, number];

  if (theta0 < 1e-6) {
    // Same location: create a full 360° circumnavigation orbit starting and ending at 'from'
    e2 = findOrthogonal(e1);
  } else if (Math.PI - theta0 < 1e-6) {
    // Antipodal locations: shortest and longest are both half-circumference
    e2 = findOrthogonal(e1);
  } else {
    // Perpendicular component of vB
    const perp: [number, number, number] = [
      vB[0] - d * vA[0],
      vB[1] - d * vA[1],
      vB[2] - d * vA[2]
    ];
    e2 = normalize(perp);
  }

  // The shortest arc goes along theta: 0 -> theta0
  // The long-way complementary arc goes along theta: 0 -> -(2π - theta0)
  // At t = 1, theta = theta0 - 2π, so cos(theta) = cos(theta0) and sin(theta) = sin(theta0),
  // which lands exactly on vB.
  const totalAngle = -(2 * Math.PI - theta0);
  const coordinates: Coordinates[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const theta = t * totalAngle;

    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const x = cosT * e1[0] + sinT * e2[0];
    const y = cosT * e1[1] + sinT * e2[1];
    const z = cosT * e1[2] + sinT * e2[2];

    const coord = vector3ToLatLng(x, y, z);
    coordinates.push(coord);
  }

  // Ensure exact match at endpoints to prevent floating point drift
  coordinates[0] = { lat: from.lat, lng: from.lng };
  coordinates[coordinates.length - 1] = { lat: to.lat, lng: to.lng };

  return coordinates;
}

/**
 * Generates coordinates for the shortest great-circle arc for comparison.
 */
export function generateShortestRouteCoordinates(
  from: Coordinates,
  to: Coordinates,
  numPoints: number = 60
): Coordinates[] {
  const vA = normalize(latLngToVector3(from));
  const vB = normalize(latLngToVector3(to));

  const d = Math.max(-1, Math.min(1, dot(vA, vB)));
  const theta0 = Math.acos(d);

  if (theta0 < 1e-6) {
    return [{ ...from }, { ...to }];
  }

  const sinTheta = Math.sin(theta0);
  const coords: Coordinates[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    let x: number, y: number, z: number;

    if (sinTheta < 1e-6) {
      x = vA[0];
      y = vA[1];
      z = vA[2];
    } else {
      const a = Math.sin((1 - t) * theta0) / sinTheta;
      const b = Math.sin(t * theta0) / sinTheta;
      x = a * vA[0] + b * vB[0];
      y = a * vA[1] + b * vB[1];
      z = a * vA[2] + b * vB[2];
    }

    coords.push(vector3ToLatLng(x, y, z));
  }

  coords[0] = { lat: from.lat, lng: from.lng };
  coords[coords.length - 1] = { lat: to.lat, lng: to.lng };

  return coords;
}

/**
 * Calculates complete telemetry comparing the standard route with the long-way detour.
 */
export function computeRouteTelemetry(from: Coordinates, to: Coordinates): RouteTelemetry {
  const shortestDistanceKm = calculateShortestDistance(from, to);
  const longWayDistanceKm = calculateLongWayDistance(from, to);
  const extraDistanceKm = Math.max(0, longWayDistanceKm - shortestDistanceKm);

  // Multiplier calculation (avoid divide by zero)
  let multiplier: number;
  if (shortestDistanceKm < 0.05) {
    multiplier = Math.round(longWayDistanceKm / 0.05);
  } else {
    multiplier = Math.round((longWayDistanceKm / shortestDistanceKm) * 10) / 10;
  }

  const shortestBearing = calculateShortestInitialBearing(from, to);
  const shortestBearingCompass = degreesToCompass(shortestBearing);

  const longWayBearing = calculateLongWayInitialBearing(from, to);
  const longWayBearingCompass = degreesToCompass(longWayBearing);

  // Approximate travel times
  // Walking speed ≈ 5 km/h, 8h walking per day = 40 km/day
  const shortestWalkingDays = Math.max(0.1, Math.round((shortestDistanceKm / 40) * 10) / 10);
  const longWayWalkingDays = Math.round(longWayDistanceKm / 40);

  // Commercial passenger jet speed ≈ 850 km/h
  const normalFlyingHours = Math.max(0.1, Math.round((shortestDistanceKm / 850) * 10) / 10);
  const longWayFlyingHours = Math.round((longWayDistanceKm / 850) * 10) / 10;

  return {
    shortestDistanceKm: Math.round(shortestDistanceKm * 10) / 10,
    longWayDistanceKm: Math.round(longWayDistanceKm * 10) / 10,
    extraDistanceKm: Math.round(extraDistanceKm * 10) / 10,
    multiplier,
    shortestBearing,
    shortestBearingCompass,
    longWayBearing,
    longWayBearingCompass,
    shortestWalkingDays,
    longWayWalkingDays,
    normalFlyingHours,
    longWayFlyingHours
  };
}
