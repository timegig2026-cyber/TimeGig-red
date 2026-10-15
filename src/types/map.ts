export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserLocationState {
  coords: Coordinates | null;
  accuracy: number | null; // in meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  address?: string;
  city?: string;
  country?: string;
  status: 'idle' | 'requesting' | 'located' | 'denied' | 'error';
  errorMessage?: string;
  isSimulated?: boolean;
}

export interface TileLayerConfig {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  description: string;
}

export interface Waypoint {
  id: string;
  name: string;
  coords: Coordinates;
  address?: string;
  createdAt: number;
  color?: string;
  notes?: string;
}

export interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    province?: string;
    region?: string;
    country?: string;
    postcode?: string;
    [key: string]: string | undefined;
  };
}

export interface MapHandle {
  flyTo: (coords: Coordinates, zoom?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
}

