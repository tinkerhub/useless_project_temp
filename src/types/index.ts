export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationItem {
  id: string;
  name: string;
  shortName?: string;
  coords: Coordinates;
  type?: string;
}

export interface RouteTelemetry {
  shortestDistanceKm: number;
  longWayDistanceKm: number;
  extraDistanceKm: number;
  multiplier: number;
  shortestBearing: number;
  shortestBearingCompass: string;
  longWayBearing: number;
  longWayBearingCompass: string;
  shortestWalkingDays: number;
  longWayWalkingDays: number;
  longWayFlyingHours: number;
  normalFlyingHours: number;
}

export interface RouteData {
  from: LocationItem;
  to: LocationItem;
  telemetry: RouteTelemetry;
  // Shared dense array of geographic waypoints along the long-way complementary arc
  coordinates: Coordinates[];
  // Shortest arc coordinates for optional comparison rendering
  shortestCoordinates: Coordinates[];
}

export interface PresetRoute {
  id: string;
  title: string;
  description: string;
  from: LocationItem;
  to: LocationItem;
  standardDistanceKm: number;
  longDistanceKm: number;
  multiplier: number;
  highlight: string;
}

export type AppPhase =
  | 'idle'                // 3D globe spinning smoothly
  | 'dive_to_departure'   // Smooth 3D camera dive from orbit into departure coordinate
  | 'local_sector_2d'     // Zoomed into 2D display of 80km x 80km origin sector
  | 'zoom_out_to_globe'   // Smooth zoom out transition back to globe
  | 'drawing_route'       // Glowing trajectory animating along Earth's surface
  | 'settled';            // Final camera position with results HUD open
