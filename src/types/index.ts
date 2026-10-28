export interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number | null; // meters above sea level
  altitudeAccuracy?: number | null; // meters
  accuracy: number; // horizontal accuracy in meters
  timestamp: number;
  note?: string;
  icon?: 'home' | 'car' | 'dragon-ball' | 'pin' | 'camp' | 'mountain' | 'flag';
  category?: 'home' | 'parking' | 'custom';
}

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  altitude: number | null; // raw GPS altitude in meters
  smoothedAltitude?: number | null; // smoothed/fused altitude in meters
  altitudeAccuracy: number | null; // meters
  accuracy: number; // horizontal accuracy in meters
  heading: number | null; // 0-360 deg from true north (from GPS or compass)
  speed: number | null; // m/s
  timestamp: number;
  barometricPressure?: number | null; // atmospheric pressure in hPa
  elevationQuality?: 'baro-fused' | 'gps-smoothed' | 'gps-raw' | 'simulated';
  elevationTrend?: 'climbing' | 'descending' | 'stable';
}

export interface TrackingStats {
  distance: number; // in meters
  bearing: number; // in degrees [0, 360), direction from current to target relative to North
  relativeBearing: number; // in degrees [-180, 180], relative to phone heading (0 = straight ahead)
  elevationDiff: number | null; // smoothed target altitude - current altitude (positive = climb up, negative = descend down)
  rawElevationDiff?: number | null; // un-smoothed raw elevation diff
  clockDirection: string; // e.g. "12時方向 (直進)"
  cardinalDirection: string; // e.g. "北北東 (NNE)"
  isClose: boolean; // < 15 meters
  isArrived: boolean; // < 5 meters
  floorCount?: number; // estimated floors to climb/descend
  floorBadge?: string; // e.g. "▲ 3F上" or "同階"
  elevationSource?: 'baro-fused' | 'gps-smoothed' | 'gps-raw' | 'simulated';
}

export type RadarMode = 'dragon' | 'tactical';
export type RadarZoom = 10 | 50 | 200 | 1000 | 5000 | 'auto';
