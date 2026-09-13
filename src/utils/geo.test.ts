import { describe, it, expect } from 'vitest';
import {
  EARTH_CIRCUMFERENCE_KM,
  calculateShortestDistance,
  calculateLongWayDistance,
  formatDistance
} from './geo';
import {
  calculateShortestInitialBearing,
  calculateLongWayInitialBearing,
  degreesToCompass
} from './bearing';
import {
  generateLongWayRouteCoordinates,
  computeRouteTelemetry
} from './route';

describe('Geographic Calculations & Long-Way Route Mathematics', () => {
  // Test case 1: Nearby locations (Eiffel Tower to Louvre, ~3.5 km)
  const eiffel = { lat: 48.8584, lng: 2.2945 };
  const louvre = { lat: 48.8606, lng: 2.3376 };

  // Test case 2: Intercontinental (New York to London)
  const nyc = { lat: 40.7128, lng: -74.0060 };
  const london = { lat: 51.5074, lng: -0.1278 };

  // Test case 3: Crossing International Date Line (Tokyo to Honolulu)
  const tokyo = { lat: 35.6762, lng: 139.6503 };
  const honolulu = { lat: 21.3069, lng: -157.8583 };

  // Test case 4: Antipodal pair (near Madrid, Spain and Weber, New Zealand)
  const madrid = { lat: 40.4168, lng: -3.7038 };
  const nzAntipode = { lat: -40.4168, lng: 176.2962 };

  it('verifies that shortestDistance + longWayDistance equals Earth circumference', () => {
    const pairs = [
      [eiffel, louvre],
      [nyc, london],
      [tokyo, honolulu],
      [madrid, nzAntipode]
    ];

    for (const [p1, p2] of pairs) {
      const shortDist = calculateShortestDistance(p1, p2);
      const longDist = calculateLongWayDistance(p1, p2);
      const total = shortDist + longDist;

      expect(Math.abs(total - EARTH_CIRCUMFERENCE_KM)).toBeLessThan(0.01);
    }
  });

  it('correctly calculates nearby locations with huge multiplier', () => {
    const telemetry = computeRouteTelemetry(eiffel, louvre);
    expect(telemetry.shortestDistanceKm).toBeGreaterThan(3.0);
    expect(telemetry.shortestDistanceKm).toBeLessThan(4.0);
    expect(telemetry.longWayDistanceKm).toBeGreaterThan(40070);
    expect(telemetry.multiplier).toBeGreaterThan(10000);
  });

  it('correctly calculates initial bearings for shortest and long-way paths', () => {
    const shortBearing = calculateShortestInitialBearing(eiffel, louvre);
    const longBearing = calculateLongWayInitialBearing(eiffel, louvre);

    // Initial bearing for the long route should be exactly 180° opposite
    const diff = Math.abs((longBearing - shortBearing + 360) % 360);
    expect(Math.abs(diff - 180)).toBeLessThan(0.1);
  });

  it('generates a valid continuous coordinate array along the complementary arc', () => {
    const numPoints = 180;
    const coords = generateLongWayRouteCoordinates(eiffel, louvre, numPoints);

    expect(coords.length).toBe(numPoints + 1);

    // Endpoints match exactly
    expect(coords[0].lat).toBeCloseTo(eiffel.lat, 4);
    expect(coords[0].lng).toBeCloseTo(eiffel.lng, 4);
    expect(coords[coords.length - 1].lat).toBeCloseTo(louvre.lat, 4);
    expect(coords[coords.length - 1].lng).toBeCloseTo(louvre.lng, 4);

    // No coordinate is NaN or infinite
    for (const c of coords) {
      expect(Number.isFinite(c.lat)).toBe(true);
      expect(Number.isFinite(c.lng)).toBe(true);
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lng).toBeGreaterThanOrEqual(-180);
      expect(c.lng).toBeLessThanOrEqual(180);
    }
  });

  it('gracefully handles identical FROM and TO locations', () => {
    const same1 = { lat: 37.7749, lng: -122.4194 };
    const same2 = { lat: 37.7749, lng: -122.4194 };

    const shortDist = calculateShortestDistance(same1, same2);
    const longDist = calculateLongWayDistance(same1, same2);

    expect(shortDist).toBe(0);
    expect(longDist).toBeCloseTo(EARTH_CIRCUMFERENCE_KM, 1);

    const coords = generateLongWayRouteCoordinates(same1, same2, 100);
    expect(coords.length).toBe(101);
    expect(coords[0].lat).toBeCloseTo(same1.lat, 4);
    expect(coords[coords.length - 1].lat).toBeCloseTo(same2.lat, 4);
  });

  it('handles International Date Line crossing without numerical divergence', () => {
    const coords = generateLongWayRouteCoordinates(tokyo, honolulu, 100);
    expect(coords.length).toBe(101);
    for (const c of coords) {
      expect(Number.isFinite(c.lat)).toBe(true);
      expect(Number.isFinite(c.lng)).toBe(true);
    }
  });
});
