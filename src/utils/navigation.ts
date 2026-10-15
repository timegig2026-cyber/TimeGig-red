import { Coordinates } from '../types/map';
import { calculateDistance } from './geo';

export interface RouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Ensures the seeker's starting location is realistic for navigation to the gig.
 * If the seeker is already in the same city/region (within 50km), uses exact seeker coords.
 * Otherwise, dispatches seeker from a realistic nearby suburb (~1.2 - 1.8km from gig destination).
 */
export function getRealisticSeekerLocation(
  seekerCoords: Coordinates,
  gigCoords: Coordinates
): Coordinates {
  const dist = calculateDistance(seekerCoords, gigCoords);
  if (dist <= 50000) {
    return seekerCoords;
  }
  // Realistic nearby dispatch location within ~1.5km
  return {
    lat: Number((gigCoords.lat + 0.0092).toFixed(5)),
    lng: Number((gigCoords.lng - 0.0084).toFixed(5)),
  };
}

/**
 * Fetches turn-by-turn driving/walking route using OSRM with fast timeout and smooth interpolation fallback
 */
export async function fetchNavigationRoute(
  start: Coordinates,
  dest: Coordinates
): Promise<RouteResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        if (coordinates.length >= 2) {
          return {
            coordinates,
            distanceMeters: Math.round(route.distance),
            durationSeconds: Math.round(route.duration),
          };
        }
      }
    }
  } catch (err) {
    console.warn('OSRM routing fetch failed or timed out, generating interpolated fallback:', err);
  }

  // Smooth fallback interpolation with natural curved road appearance
  const dist = calculateDistance(start, dest);
  const steps = 24;
  const coordinates: [number, number][] = [];

  const midLat = (start.lat + dest.lat) / 2 + (dest.lng - start.lng) * 0.06;
  const midLng = (start.lng + dest.lng) / 2 - (dest.lat - start.lat) * 0.06;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * midLat + t * t * dest.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * midLng + t * t * dest.lng;
    coordinates.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  return {
    coordinates,
    distanceMeters: Math.round(dist),
    durationSeconds: Math.max(60, Math.round(dist / 8.33)), // ~30 km/h driving
  };
}

/**
 * Format duration in minutes / hours into readable string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `~${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `~${hours}h ${remainingMins}m`;
}
