import { LocationItem, Coordinates } from '../types';

// In-memory cache for search queries to reduce network requests
const searchCache = new Map<string, LocationItem[]>();

/**
 * Parses raw text input if it represents coordinate numbers like "37.7749, -122.4194"
 */
export function parseCoordinates(query: string): Coordinates | null {
  const trimmed = query.trim();
  const match = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Searches places via OpenStreetMap Nominatim API with fallback support.
 */
export async function searchLocations(query: string): Promise<LocationItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  // Check direct coordinate input first
  const parsed = parseCoordinates(trimmed);
  if (parsed) {
    return [
      {
        id: `coord-${parsed.lat}-${parsed.lng}`,
        name: `Coordinates (${parsed.lat.toFixed(4)}°, ${parsed.lng.toFixed(4)}°)`,
        shortName: `${parsed.lat.toFixed(4)}°, ${parsed.lng.toFixed(4)}°`,
        coords: parsed,
        type: 'coordinate'
      }
    ];
  }

  // Check cache
  const cacheKey = trimmed.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&limit=6&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();
    const results: LocationItem[] = data.map((item: any) => {
      const parts = item.display_name.split(',');
      const shortName = parts.slice(0, 2).join(',').trim();

      return {
        id: `osm-${item.place_id}`,
        name: item.display_name,
        shortName: shortName || item.display_name,
        coords: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        type: item.type || 'place'
      };
    });

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.warn('Geocoding search failed or timed out:', error);
    return [];
  }
}

/**
 * Requests the browser's current geolocation.
 */
export function getCurrentPosition(): Promise<LocationItem> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Try reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
          );
          if (res.ok) {
            const data = await res.json();
            resolve({
              id: 'my-location',
              name: data.display_name || 'My Current Location',
              shortName: data.address?.city || data.address?.town || 'Current Location',
              coords,
              type: 'current_position'
            });
            return;
          }
        } catch {
          // Fallback if reverse geocoding fails
        }

        resolve({
          id: 'my-location',
          name: `Current Location (${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°)`,
          shortName: 'My Location',
          coords,
          type: 'current_position'
        });
      },
      (error) => {
        let message = 'Unable to retrieve location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission was denied. You can manually search for any place.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out.';
        }
        reject(new Error(message));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}
