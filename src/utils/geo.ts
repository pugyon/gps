import { TrackingStats } from '../types';

/**
 * Converts degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees
 */
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Computes great-circle distance between two GPS coordinates using the Haversine formula (meters)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes initial bearing (azimuth) from point 1 to point 2 in degrees [0, 360)
 * 0° = North, 90° = East, 180° = South, 270° = West
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (toDeg(θ) + 360) % 360;
  return bearing;
}

/**
 * Computes relative bearing to target taking current device compass heading into account.
 * Result is in range [-180, 180]:
 * 0° = straight ahead
 * +90° = turn right 90°
 * -90° = turn left 90°
 * 180° / -180° = directly behind
 */
export function calculateRelativeBearing(
  targetBearing: number,
  deviceHeading: number
): number {
  let diff = targetBearing - deviceHeading;
  // normalize to [-180, 180]
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

/**
 * Returns Japanese clock direction based on relative bearing (-180 to +180)
 */
export function getClockDirection(relativeBearing: number): string {
  // Normalize to 0..360 where 0 is 12 o'clock
  let normalized = (relativeBearing + 360) % 360;
  const hour = Math.round(normalized / 30) % 12;
  const clockHour = hour === 0 ? 12 : hour;

  if (Math.abs(relativeBearing) <= 15) {
    return '12時方向（直進）';
  } else if (Math.abs(relativeBearing) >= 165) {
    return '6時方向（真後ろ）';
  } else if (relativeBearing > 0) {
    if (relativeBearing >= 75 && relativeBearing <= 105) {
      return '3時方向（真右）';
    }
    return `${clockHour}時方向（右前方）`;
  } else {
    if (relativeBearing <= -75 && relativeBearing >= -105) {
      return '9時方向（真左）';
    }
    return `${clockHour}時方向（左前方）`;
  }
}

/**
 * 16-point Japanese cardinal compass direction
 */
const CARDINAL_NAMES = [
  '北 (N)',
  '北北東 (NNE)',
  '北東 (NE)',
  '東北東 (ENE)',
  '東 (E)',
  '東南東 (ESE)',
  '南東 (SE)',
  '南南東 (SSE)',
  '南 (S)',
  '南南西 (SSW)',
  '南西 (SW)',
  '西南西 (WSW)',
  '西 (W)',
  '西北西 (WNW)',
  '北西 (NW)',
  '北北西 (NNW)',
];

export function getCardinalDirection(bearing: number): string {
  const index = Math.round(((bearing % 360) / 22.5)) % 16;
  return CARDINAL_NAMES[index];
}

/**
 * Computes full tracking statistics between current location and target waypoint
 */
export function computeTrackingStats(
  currentLat: number,
  currentLon: number,
  currentAlt: number | null,
  targetLat: number,
  targetLon: number,
  targetAlt: number | null,
  currentHeading: number | null
): TrackingStats {
  const distance = calculateHaversineDistance(
    currentLat,
    currentLon,
    targetLat,
    targetLon
  );
  const bearing = calculateBearing(
    currentLat,
    currentLon,
    targetLat,
    targetLon
  );

  const heading = currentHeading !== null ? currentHeading : 0;
  const relativeBearing = calculateRelativeBearing(bearing, heading);

  // Elevation diff: targetAlt - currentAlt
  // Positive means target is above us (we need to go UP)
  // Negative means target is below us (we need to go DOWN)
  let elevationDiff: number | null = null;
  if (targetAlt !== null && currentAlt !== null) {
    elevationDiff = targetAlt - currentAlt;
  }

  const clockDirection = getClockDirection(relativeBearing);
  const cardinalDirection = getCardinalDirection(bearing);
  const isClose = distance < 15;
  const isArrived = distance < 5;

  return {
    distance,
    bearing,
    relativeBearing,
    elevationDiff,
    clockDirection,
    cardinalDirection,
    isClose,
    isArrived,
  };
}

/**
 * Formats distance with appropriate units (m or km)
 */
export function formatDistance(meters: number): { value: string; unit: string } {
  if (meters < 1) {
    return { value: (meters).toFixed(1), unit: 'm' };
  } else if (meters < 10) {
    return { value: meters.toFixed(1), unit: 'm' };
  } else if (meters < 1000) {
    return { value: Math.round(meters).toString(), unit: 'm' };
  } else if (meters < 10000) {
    return { value: (meters / 1000).toFixed(2), unit: 'km' };
  } else {
    return { value: (meters / 1000).toFixed(1), unit: 'km' };
  }
}

/**
 * Formats altitude difference
 */
export function formatElevation(diff: number | null): {
  text: string;
  subtext: string;
  direction: 'up' | 'down' | 'same' | 'unknown';
} {
  if (diff === null) {
    return {
      text: '高度差計測中',
      subtext: 'GPS高度取得後に表示されます',
      direction: 'unknown',
    };
  }

  const abs = Math.abs(diff);
  const formatted = abs < 10 ? abs.toFixed(1) : Math.round(abs).toString();

  if (abs < 1.0) {
    return {
      text: 'ほぼ同じ高さ (±1m)',
      subtext: '水平移動で到達可能',
      direction: 'same',
    };
  } else if (diff > 0) {
    const floors = Math.round(diff / 3);
    const floorHint = floors > 1 ? `（ビル約${floors}階分上）` : '';
    return {
      text: `目標は ${formatted}m 上`,
      subtext: `上り坂・階段へ向かってください ${floorHint}`,
      direction: 'up',
    };
  } else {
    const floors = Math.round(abs / 3);
    const floorHint = floors > 1 ? `（ビル約${floors}階分下）` : '';
    return {
      text: `目標は ${formatted}m 下`,
      subtext: `下り坂・階段へ向かってください ${floorHint}`,
      direction: 'down',
    };
  }
}

/**
 * Multi-story parking garage & building floor elevation difference helper
 * Assuming ~3.0m per standard commercial/parking floor
 */
export function formatFloorElevation(diff: number | null): {
  floors: number;
  floorLabel: string;
  shortLabel: string;
  badgeText: string;
  actionHint: string;
  status: 'up' | 'down' | 'same' | 'unknown';
} {
  if (diff === null || isNaN(diff)) {
    return {
      floors: 0,
      floorLabel: '高度差計測中',
      shortLabel: '--',
      badgeText: '高度計測中',
      actionHint: 'GPS高度測位中',
      status: 'unknown',
    };
  }

  const abs = Math.abs(diff);
  const formatted = abs < 10 ? abs.toFixed(1) : Math.round(abs).toString();

  // Threshold: within +/- 1.3 meters is considered the same floor
  if (abs <= 1.3) {
    return {
      floors: 0,
      floorLabel: '同一フロア (±0m)',
      shortLabel: '同階',
      badgeText: '✔ 同階 (±0m)',
      actionHint: '同じ階層にあります（水平移動で到達）',
      status: 'same',
    };
  }

  const floors = Math.max(1, Math.round(abs / 3.0));
  if (diff > 0) {
    return {
      floors,
      floorLabel: `▲ 約${floors}階 上 (+${formatted}m)`,
      shortLabel: `▲${floors}F上`,
      badgeText: `▲ ${floors}F上 (+${formatted}m)`,
      actionHint: `上階にあります（階段・EVで${floors}フロア上へ）`,
      status: 'up',
    };
  } else {
    return {
      floors,
      floorLabel: `▼ 約${floors}階 下 (-${formatted}m)`,
      shortLabel: `▼${floors}F下`,
      badgeText: `▼ ${floors}F下 (-${formatted}m)`,
      actionHint: `下階にあります（階段・EVで${floors}フロア下へ）`,
      status: 'down',
    };
  }
}
