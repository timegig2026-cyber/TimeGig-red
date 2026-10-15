import { Coordinates, SearchResult } from '../types/map';

/**
 * Calculates straight line distance between two coordinates using the Haversine formula
 * returns distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formats distance in meters to readable metric string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(2) : km.toFixed(1)} km`;
}

/**
 * Formats coordinates into clean decimal string
 */
export function formatCoordinates(coords: Coordinates, precision = 5): string {
  const latDir = coords.lat >= 0 ? 'N' : 'S';
  const lngDir = coords.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(coords.lat).toFixed(precision)}° ${latDir}, ${Math.abs(coords.lng).toFixed(precision)}° ${lngDir}`;
}

// Memory cache for reverse geocoding to avoid repetitive requests
const reverseGeocodeCache = new Map<string, { address: string; city?: string; country?: string }>();

/**
 * Free Reverse Geocode using OpenStreetMap Nominatim API
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string; city?: string; province?: string; country?: string }> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const data = await res.json();
    const addressDetails = data.address || {};
    const road = addressDetails.road || addressDetails.pedestrian || addressDetails.suburb || '';
    const city =
      addressDetails.city ||
      addressDetails.town ||
      addressDetails.suburb ||
      addressDetails.village ||
      addressDetails.municipality ||
      addressDetails.county ||
      '';
    const province =
      addressDetails.state ||
      addressDetails.province ||
      addressDetails.region ||
      addressDetails.state_district ||
      '';
    const country = addressDetails.country || '';

    const formatted = data.display_name
      ? data.display_name.split(',').slice(0, 3).join(',').trim()
      : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const result = {
      address: formatted,
      city,
      province,
      country,
    };

    reverseGeocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
    return {
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  }
}

/**
 * Search locations using OpenStreetMap Nominatim
 */
export async function searchNominatim(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) throw new Error('Search failed');
    return await res.json();
  } catch (err) {
    console.warn('Nominatim search failed:', err);
    return [];
  }
}

/**
 * Preset Demo Locations for testing without real hardware GPS or if permission denied
 */
export interface DemoLocation {
  name: string;
  label: string;
  coords: Coordinates;
  city: string;
  country: string;
}

export const DEMO_LOCATIONS: DemoLocation[] = [
  {
    name: 'San Francisco',
    label: 'Ferry Building, San Francisco',
    coords: { lat: 37.7955, lng: -122.3937 },
    city: 'San Francisco',
    country: 'United States',
  },
  {
    name: 'London',
    label: 'Trafalgar Square, London',
    coords: { lat: 51.5080, lng: -0.1281 },
    city: 'London',
    country: 'United Kingdom',
  },
  {
    name: 'Paris',
    label: 'Eiffel Tower, Paris',
    coords: { lat: 48.8584, lng: 2.2945 },
    city: 'Paris',
    country: 'France',
  },
  {
    name: 'Tokyo',
    label: 'Shibuya Crossing, Tokyo',
    coords: { lat: 35.6595, lng: 139.7004 },
    city: 'Tokyo',
    country: 'Japan',
  },
  {
    name: 'Sydney',
    label: 'Sydney Opera House, Sydney',
    coords: { lat: -33.8568, lng: 151.2153 },
    city: 'Sydney',
    country: 'Australia',
  },
  {
    name: 'Berlin',
    label: 'Brandenburg Gate, Berlin',
    coords: { lat: 52.5163, lng: 13.3777 },
    city: 'Berlin',
    country: 'Germany',
  },
];
