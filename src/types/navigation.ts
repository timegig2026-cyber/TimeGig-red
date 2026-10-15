import { Coordinates } from './map';

export interface Seeker {
  id: string;
  name: string;
  role: string;
  distance: string;
  avatar: string;
  status: string;
  isOnline: boolean;
  readyToHire: boolean;
  coords: Coordinates;
  location: string;
  province: string;
}

export interface Gig {
  id: string;
  title: string;
  reward: string;
  location: string;
  distance: string;
  category: string;
  coords: Coordinates;
  description?: string;
  postedBy?: string;
}

export interface CancellationRecord {
  cancelledBy: 'owner' | 'seeker';
  cancelledByName: string;
  reason: string;
  timestamp: number;
}

export interface ActiveGigAssignment {
  gigId: string;
  gigTitle: string;
  gigReward: string;
  gigLocation: string;
  gigCoords: Coordinates;
  gigOwnerName: string;
  isCurrentUserOwner: boolean;
  seekerId: string;
  seekerName: string;
  seekerAvatar: string;
  seekerCoords: Coordinates;
  routeCoords: [number, number][];
  routeDistanceMeters: number;
  durationSeconds: number;
  status: 'navigating' | 'completed' | 'cancelled';
  startTime: number;
}
