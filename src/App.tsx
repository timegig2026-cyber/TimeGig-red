import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Search,
  Plus,
  Minus,
  Globe,
  X,
  MapPin,
  Users,
  Flame,
  Briefcase,
  Camera,
  Upload,
  FileText,
  Mail,
  Phone,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Coordinates, SearchResult } from './types/map';
import {
  Seeker,
  Gig,
  ActiveGigAssignment,
  CancellationRecord,
} from './types/navigation';
import { reverseGeocode, searchNominatim } from './utils/geo';
import {
  fetchNavigationRoute,
  getRealisticSeekerLocation,
} from './utils/navigation';
import {
  getMediaItem,
  saveMediaItem,
  safeLoadProfile,
  safeSaveProfile,
} from './utils/storage';
import { SelectGigToHireModal } from './components/SelectGigToHireModal';
import { HiringWaitingModal } from './components/HiringWaitingModal';
import { ApplyingWaitingModal } from './components/ApplyingWaitingModal';
import { NavigationHud } from './components/NavigationHud';
import { CancelGigModal } from './components/CancelGigModal';
import { GigCompletedModal } from './components/GigCompletedModal';
import { GigCancelledAlertModal } from './components/GigCancelledAlertModal';
import AuthModal from './components/AuthModal';
import {
  auth,
  db,
  signOut,
  onAuthStateChanged,
  testFirestoreConnection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getRedirectResult,
} from './firebase';

interface SocialLink {
  platform: string;
  url: string;
}

interface ProfileState {
  avatar: string;
  idDocName: string;
  fullName: string;
  bio: string;
  location: string;
  province: string;
  contact: string;
  email: string;
  socials: SocialLink[];
  lastAvatarUpdate: number;
}

const CURRENT_USER_ID = 'current_user';

const DEFAULT_PROFILE: ProfileState = {
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  idDocName: '',
  fullName: '',
  bio: '',
  location: '',
  province: '',
  contact: '',
  email: '',
  socials: [],
  lastAvatarUpdate: 0,
};

const INITIAL_SEEKERS: Seeker[] = [];

const normalizeRewardToRands = (rewardStr: string): string => {
  if (!rewardStr) return 'R250';
  const trimmed = rewardStr.trim();
  if (trimmed.startsWith('$')) {
    return 'R' + trimmed.slice(1);
  }
  if (!trimmed.toUpperCase().startsWith('R')) {
    return 'R' + trimmed;
  }
  return trimmed;
};

const CASUAL_GIG_CATEGORIES = [
  'Gardening & Lawn Mowing',
  'House Cleaning & Chores',
  'Car Wash & Detailing',
  'Dog Walking & Pet Sitting',
  'Babysitting & Childcare',
  'Moving & Heavy Lifting',
  'Grocery Shopping & Errands',
  'Painting & Minor Repairs',
  'Furniture Assembly & Handyman',
  'Flyer Distribution & Promo',
  'Event Staff & Waitering',
  'Tutoring & Homework Help',
  'Pool Cleaning & Maintenance',
  'Laundry & Ironing',
  'Delivery & Courier',
  'Tech Help & Device Setup',
  'General Casual Labor',
  'Field Mapping',
  'Civic Survey',
  'Trail Mapping',
  'Photography & Drone',
  'Geospatial Audit',
];

const INITIAL_GIGS: Gig[] = [];

export default function App() {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const seekersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gigsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const navLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Satellite view toggle state
  const [isSatellite, setIsSatellite] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Bottom Menu Active Tab ('seekers' | 'gigs' | 'profile' | null)
  const [activeTab, setActiveTab] = useState<'seekers' | 'gigs' | 'profile' | null>('seekers');

  // Interactive state
  const [seekers] = useState<Seeker[]>(INITIAL_SEEKERS);
  const [gigs, setGigs] = useState<Gig[]>(() => {
    const loaded = safeLoadProfile<Gig[]>('user_posted_gigs', INITIAL_GIGS);
    return loaded.map((g) => ({
      ...g,
      reward: normalizeRewardToRands(g.reward),
    }));
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active GiG Navigation Assignment state
  const [activeAssignment, setActiveAssignment] = useState<ActiveGigAssignment | null>(() => {
    return safeLoadProfile<ActiveGigAssignment | null>('active_gig_assignment', null);
  });
  const [actingRole, setActingRole] = useState<'owner' | 'seeker'>('owner');

  // Hiring process modal states
  const [hiringModalSeeker, setHiringModalSeeker] = useState<Seeker | null>(null);
  const [waitingHiringState, setWaitingHiringState] = useState<{ seeker: Seeker; gig: Gig; attempt?: number } | null>(null);
  const [applyingGigState, setApplyingGigState] = useState<Gig | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState<boolean>(false);
  const [cancellationAlert, setCancellationAlert] = useState<CancellationRecord | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('register');
  const [welcomeBannerMessage, setWelcomeBannerMessage] = useState<string | null>(null);
  const [isCompletingProfileAfterRegister, setIsCompletingProfileAfterRegister] = useState<boolean>(false);

  useEffect(() => {
    safeSaveProfile('active_gig_assignment', activeAssignment);
  }, [activeAssignment]);

  useEffect(() => {
    localStorage.removeItem('user_posted_gigs');
    setGigs([]);
  }, []);

  // Create a GiG form state
  const [isCreateGigOpen, setIsCreateGigOpen] = useState<boolean>(false);
  const [isDetectingGigLoc, setIsDetectingGigLoc] = useState<boolean>(false);
  const [gigTitle, setGigTitle] = useState<string>('');
  const [gigCategory, setGigCategory] = useState<string>('Gardening & Lawn Mowing');
  const [gigReward, setGigReward] = useState<string>('R250');
  const [gigLocation, setGigLocation] = useState<string>('');
  const [gigDescription, setGigDescription] = useState<string>('');
  const [gigImage, setGigImage] = useState<string | null>(null);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleDeleteGig = useCallback((gigId: string) => {
    setGigs(gigs.filter(g => g.id !== gigId));
    showToast('GiG deleted successfully.');
  }, [gigs, showToast]);

  const handleEditGig = useCallback((gig: Gig) => {
    setEditingGig(gig);
    setGigTitle(gig.title);
    setGigCategory(gig.category);
    setGigReward(gig.reward);
    setGigLocation(gig.location);
    setGigDescription(gig.description || '');
    setGigImage(null);
    setIsCreateGigOpen(true);
  }, []);

  const handleUpdateGig = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGig) return;
    setGigs(gigs.map(g => g.id === editingGig.id ? { ...g, title: gigTitle, category: gigCategory, reward: gigReward, location: gigLocation, description: gigDescription } : g));
    showToast('GiG updated successfully.');
    setIsCreateGigOpen(false);
    setEditingGig(null);
    setGigTitle('');
    setGigCategory(CASUAL_GIG_CATEGORIES[0]);
    setGigReward('R250');
    setGigLocation('');
    setGigDescription('');
  }, [editingGig, gigTitle, gigCategory, gigReward, gigLocation, gigDescription, gigs, showToast]);

  // Location / Area autocomplete suggestions for Create a GiG
  const [gigLocationSuggestions, setGigLocationSuggestions] = useState<SearchResult[]>([]);
  const [isSearchingGigLoc, setIsSearchingGigLoc] = useState<boolean>(false);
  const [showGigLocDropdown, setShowGigLocDropdown] = useState<boolean>(false);
  const [gigCustomCoords, setGigCustomCoords] = useState<Coordinates | null>(null);

  // Suggestions for Profile Location / City
  const [profileLocationSuggestions, setProfileLocationSuggestions] = useState<SearchResult[]>([]);
  const [isSearchingProfileLoc, setIsSearchingProfileLoc] = useState<boolean>(false);
  const [showProfileLocDropdown, setShowProfileLocDropdown] = useState<boolean>(false);

  useEffect(() => {
    safeSaveProfile('user_posted_gigs', gigs);
  }, [gigs]);

  // Profile state with quota-safe isolated storage & IndexedDB for media
  const [profile, setProfile] = useState<ProfileState>(() => {
    return safeLoadProfile<ProfileState>(CURRENT_USER_ID, DEFAULT_PROFILE);
  });

  const [isProfileLocked, setIsProfileLocked] = useState<boolean>(() => {
    return safeLoadProfile<boolean>(`${CURRENT_USER_ID}_locked`, true);
  });

  // Load persisted avatar from IndexedDB (device storage) on mount
  useEffect(() => {
    let isMounted = true;
    getMediaItem(`avatar_${CURRENT_USER_ID}`).then((storedAvatar) => {
      if (isMounted && storedAvatar) {
        setProfile((prev) => ({
          ...prev,
          avatar: storedAvatar,
        }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save profile metadata to localStorage safely without storing large base64 strings
  useEffect(() => {
    const profileToStore: ProfileState = {
      ...profile,
      avatar: profile.avatar.startsWith('data:') ? '' : profile.avatar,
    };
    const storageKey = auth.currentUser ? `user_profile_${auth.currentUser.uid}` : CURRENT_USER_ID;
    safeSaveProfile(storageKey, profileToStore);
  }, [profile]);

  useEffect(() => {
    const storageKey = auth.currentUser ? `user_locked_${auth.currentUser.uid}` : `${CURRENT_USER_ID}_locked`;
    safeSaveProfile(storageKey, isProfileLocked);
  }, [isProfileLocked]);

  // Listen for Firebase Auth changes and sync Firestore profile
  useEffect(() => {
    testFirestoreConnection();

    // Check for redirect result from Google signInWithRedirect fallback
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const user = result.user;
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              id: user.uid,
              email: user.email || '',
              termsAccepted: true,
              fullName: user.displayName || '',
              bio: 'Community Explorer & Gig Worker',
              location: '',
              province: '',
              contact: '',
              avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              idDocName: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            handleRegistrationComplete(user.email || '', user.uid);
          } else {
            const data = snap.data();
            handleLoginSuccess(user.email || '', data?.fullName || user.displayName || '');
          }
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            // Load existing user profile without overwriting
            const data = docSnap.data();
            setProfile((prev) => ({
              ...prev,
              email: currentUser.email || prev.email,
              fullName: data.fullName ?? prev.fullName,
              bio: data.bio ?? prev.bio,
              location: data.location ?? prev.location,
              province: data.province ?? prev.province,
              contact: data.contact ?? prev.contact,
              avatar: data.avatar || currentUser.photoURL || prev.avatar,
              idDocName: data.idDocName ?? prev.idDocName,
            }));
          } else {
            setProfile((prev) => ({
              ...prev,
              email: currentUser.email || prev.email,
              fullName: currentUser.displayName || prev.fullName,
              avatar: currentUser.photoURL || prev.avatar,
            }));
          }
        } catch (err) {
          console.warn('Could not load user profile from Firestore:', err);
        }
      } else {
        setIsLoggedIn(false);
        setProfile(DEFAULT_PROFILE);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle completion of registration -> congratulate and direct user to complete profile
  const handleRegistrationComplete = (userEmail: string, userId: string) => {
    setIsLoggedIn(true);
    setProfile((prev) => ({
      ...prev,
      email: userEmail,
      fullName: prev.fullName || '',
      bio: prev.bio || 'Community Explorer & Gig Worker',
    }));
    setActiveTab('profile');
    setIsProfileLocked(false);
    setIsCompletingProfileAfterRegister(true);
    showToast('🎉 Welcome to GiGs! Please complete your profile details below.');
  };

  // Handle successful login of existing registered user -> welcome user back
  const handleLoginSuccess = (userEmail: string, userName?: string) => {
    setIsLoggedIn(true);
    setIsCompletingProfileAfterRegister(false);
    const greetingName = userName && userName.trim() ? userName.trim() : (userEmail ? userEmail.split('@')[0] : 'Explorer');
    const welcomeMsg = `Welcome back, ${greetingName}! 👋`;
    setWelcomeBannerMessage(welcomeMsg);
    showToast(welcomeMsg);
    setTimeout(() => {
      setWelcomeBannerMessage(null);
    }, 6000);
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setIsCompletingProfileAfterRegister(false);
      setProfile(DEFAULT_PROFILE);
      showToast('You have been signed out.');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Save profile & synchronize with Firestore
  const handleSaveProfile = async () => {
    setIsProfileLocked(true);
    setIsCompletingProfileAfterRegister(false);
    showToast('Profile saved and locked successfully!');

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      safeSaveProfile(`user_profile_${uid}`, profile);
      safeSaveProfile(`user_locked_${uid}`, true);
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          fullName: profile.fullName || '',
          bio: profile.bio || '',
          location: profile.location || '',
          province: profile.province || '',
          contact: profile.contact || '',
          email: profile.email || auth.currentUser.email || '',
          avatar: profile.avatar || '',
          idDocName: profile.idDocName || '',
          updatedAt: serverTimestamp(),
        });
        showToast('Profile saved and synced to your cloud account! ☁️');
      } catch (err) {
        console.warn('Firestore profile update sync warning:', err);
      }
    }
  };


  // Center map on coordinates

  const isValidCoord = (c: { lat: number; lng: number }) => !isNaN(c.lat) && !isNaN(c.lng);
  
  const flyToCoords = useCallback((coords: Coordinates, zoom = 16) => {
    if (mapRef.current && isValidCoord(coords)) {
      mapRef.current.flyTo([coords.lat, coords.lng], zoom, {
        duration: 1.2,
      });
    }
  }, []);

  // Handlers for Seeker Hiring, Live Route Navigation, Completion & Cancellation
  const handleStartHire = useCallback(
    (seeker: Seeker) => {
      if (activeAssignment && activeAssignment.status === 'navigating') {
        showToast(
          `A GiG assignment is already in progress with ${activeAssignment.seekerName}. Complete or cancel it first.`
        );
        setActiveTab('gigs');
        return;
      }
      setHiringModalSeeker(seeker);
    },
    [activeAssignment, showToast]
  );

  const handleConfirmSendOffer = useCallback((seeker: Seeker, gig: Gig) => {
    setHiringModalSeeker(null);
    setWaitingHiringState({ seeker, gig });
  }, []);

  const handleSeekerAccepted = useCallback(
    async (seeker: Seeker, gig: Gig) => {
      setWaitingHiringState(null);
      showToast(`🎉 ${seeker.name} accepted your GiG offer! Calculating navigation route...`);

      const startCoords = getRealisticSeekerLocation(seeker.coords, gig.coords);
      const route = await fetchNavigationRoute(startCoords, gig.coords);

      const newAssignment: ActiveGigAssignment = {
        gigId: gig.id,
        gigTitle: gig.title,
        gigReward: gig.reward,
        gigLocation: gig.location,
        gigCoords: gig.coords,
        gigOwnerName: gig.postedBy || profile.fullName || 'Alex Morgan (Gig Owner)',
        isCurrentUserOwner: true,
        seekerId: seeker.id,
        seekerName: seeker.name,
        seekerAvatar: seeker.avatar,
        seekerCoords: startCoords,
        routeCoords: route.coordinates,
        routeDistanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        status: 'navigating',
        startTime: Date.now(),
      };

      setActiveAssignment(newAssignment);
      setActingRole('owner');
      // Direct user to GiGs feature where map navigates seeker to gig destination
      setActiveTab('gigs');
      showToast(`📍 Live navigation active: Navigating ${seeker.name} to ${gig.location}`);
    },
    [profile.fullName, showToast]
  );

  const handleFocusRoute = useCallback(() => {
    if (!mapRef.current || !activeAssignment || !activeAssignment.routeCoords.length) return;
    const validBounds = activeAssignment.routeCoords.filter((c) => isValidCoord({ lat: c[0], lng: c[1] }));
    if (validBounds.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(validBounds), {
        padding: [90, 90],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [activeAssignment]);

  const handleConfirmCompleteGig = useCallback(() => {
    if (!activeAssignment) return;
    const completedSeekerName = activeAssignment.seekerName;
    const completedReward = activeAssignment.gigReward;
    setActiveAssignment(null);
    setIsCompletedModalOpen(false);
    showToast(`🎉 GiG Completed! ${completedReward} released to ${completedSeekerName}.`);
  }, [activeAssignment, showToast]);

  const handleConfirmCancelGig = useCallback(
    (cancelledBy: 'owner' | 'seeker', reason: string) => {
      if (!activeAssignment) return;
      const record: CancellationRecord = {
        cancelledBy,
        cancelledByName:
          cancelledBy === 'owner' ? activeAssignment.gigOwnerName : activeAssignment.seekerName,
        reason,
        timestamp: Date.now(),
      };
      setCancellationAlert(record);
      setActiveAssignment(null);
      setIsCancelModalOpen(false);
      showToast(`GiG assignment cancelled with reason: "${reason}"`);
    },
    [activeAssignment, showToast]
  );

  // Reusable device location requester with user-friendly error messages (no silent fake coords)
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser or device.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserCoords(coords);
        setAccuracy(position.coords.accuracy);
        setHeading(position.coords.heading);
        setIsLocating(false);
        setLocationError(null);

        if (mapRef.current) {
        if (isValidCoord(coords)) mapRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 });
        }
      },
      (error) => {
        setIsLocating(false);
        let message = 'Location access failed.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location access was denied. Please allow location access in your browser to view your exact location.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Device location is currently unavailable. Please check your GPS settings.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out. Please check your signal and retry.';
        }
        setLocationError(message);
        // We strictly NEVER silently set userCoords to fake San Francisco coordinates!
      },
      options
    );
  }, []);

  // 1. Initialize full-screen Leaflet Map
  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const map = L.map(mapElementRef.current, {
      center: [20, 0], // neutral global view until actual location is retrieved
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    const initialUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(initialUrl, {
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    seekersLayerGroupRef.current = L.layerGroup().addTo(map);
    gigsLayerGroupRef.current = L.layerGroup().addTo(map);
    navLayerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Handle Tile Layer switching (Standard OSM vs Satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const url = isSatellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const newLayer = L.tileLayer(url, {
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [isSatellite]);

  // 3. Request actual device location respecting browser permissions
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((res) => {
          if (res.state === 'granted' || res.state === 'prompt') {
            requestLocation();
          } else if (res.state === 'denied') {
            setIsLocating(false);
            setLocationError('Location permission is denied in browser settings.');
          }
          res.onchange = () => {
            if (res.state === 'granted') {
              requestLocation();
            } else if (res.state === 'denied') {
              setLocationError('Location permission is denied in browser settings.');
            }
          };
        })
        .catch(() => {
          requestLocation();
        });
    } else {
      requestLocation();
    }
  }, [requestLocation]);

  // Watch position only once actual device coordinates have been established
  useEffect(() => {
    if (!('geolocation' in navigator) || !userCoords) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setAccuracy(pos.coords.accuracy);
        setHeading(pos.coords.heading);
      },
      (err) => {
        console.warn('Geolocation watch notice:', err.message);
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [userCoords !== null]);

  // 4. Update User Exact Location Marker & Accuracy Circle (Only when actual coordinates exist)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userCoords) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
      return;
    }

    const { lat, lng } = userCoords;
    const currentAccuracy = accuracy || 15;

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: currentAccuracy,
        color: '#2563eb',
        weight: 1.5,
        opacity: 0.6,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
      }).addTo(map);
    } else {
      if (isValidCoord({ lat, lng })) accuracyCircleRef.current.setLatLng([lat, lng]);
      accuracyCircleRef.current.setRadius(currentAccuracy);
    }

    const headingHtml =
      heading !== null && heading !== undefined
        ? `<div class="user-location-heading" style="transform: translateX(-50%) rotate(${heading}deg);"></div>`
        : '';

    const avatarUrl = profile.avatar || DEFAULT_PROFILE.avatar;
    const userName = profile.fullName || 'You';
    const userRole = profile.bio || 'Explorer';
    const userLocation = profile.location
      ? `${profile.location}, ${profile.province}`
      : 'Your Location';

    const iconHtml = `
      <div class="user-location-marker">
        <div class="user-location-pulse"></div>
        <div class="user-location-pulse-inner"></div>
        <div class="user-avatar-marker-pin" style="position: relative; width: 44px; height: 44px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(37,99,235,0.45); display: flex; align-items: center; justify-content: center; z-index: 10; cursor: pointer;">
          <img src="${avatarUrl}" alt="${userName}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" />
          <span style="position: absolute; bottom: -2px; right: -2px; width: 13px; height: 13px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="Online"></span>
          <span style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: #2563eb; color: #ffffff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 8px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">You</span>
        </div>
        ${headingHtml}
      </div>
    `;

    const userIcon = L.divIcon({
      html: iconHtml,
      className: 'user-location-div-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });

    const popupHtml = `
      <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 190px; color: #0f172a;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <img src="${avatarUrl}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb;" />
          <div>
            <strong style="font-size: 13px; display: block; color: #0f172a;">${userName} <span style="font-size: 10px; color: #2563eb; font-weight: 700;">(You)</span></strong>
            <span style="font-size: 11px; color: #64748b;">${userRole}</span>
          </div>
        </div>
        <div style="font-size: 11px; color: #2563eb; margin-bottom: 4px;">📍 ${userLocation}</div>
        <div style="font-size: 11px; color: #64748b;">
          ${lat.toFixed(5)}°, ${lng.toFixed(5)}° · &plusmn;${Math.round(currentAccuracy)}m
        </div>
      </div>
    `;

    if (!userMarkerRef.current) {
      const marker = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindPopup(popupHtml);
      userMarkerRef.current = marker;
    } else {
      if (isValidCoord({ lat, lng })) userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setIcon(userIcon);
      userMarkerRef.current.setPopupContent(popupHtml);
    }
  }, [userCoords, accuracy, heading, profile.avatar, profile.fullName, profile.bio, profile.location, profile.province]);

  // 5. Render Online Seekers on Map
  useEffect(() => {
    const group = seekersLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    const onlineSeekers = seekers.filter((s) => s.isOnline && s.readyToHire);

    onlineSeekers.forEach((seeker) => {
      const seekerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer;">
          <img src="${seeker.avatar}" alt="${seeker.name}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;" />
          <span style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: #10b981; border: 2px solid #ffffff;"></span>
        </div>
      `;

      const icon = L.divIcon({
        html: seekerHtml,
        className: 'seeker-map-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([seeker.coords.lat, seeker.coords.lng], { icon });

      marker.bindPopup(
        `<div style="font-family: system-ui, sans-serif; padding: 8px; min-width: 180px; color: #0f172a;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <img src="${seeker.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
            <div>
              <strong style="font-size: 13px; display: block;">${seeker.name}</strong>
              <span style="font-size: 11px; color: #64748b;">${seeker.role}</span>
            </div>
          </div>
          <div style="font-size: 11px; color: #2563eb; margin-bottom: 8px;">${seeker.location}, ${seeker.province} · <span style="color: #059669; font-weight: 600;">Ready to hire</span></div>
          <button id="hire-seeker-popup-${seeker.id}" style="width: 100%; padding: 6px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; transition: background 0.15s ease;">Hire Seeker</button>
        </div>`
      );

      marker.on('popupopen', () => {
        const btn = document.getElementById(`hire-seeker-popup-${seeker.id}`);
        if (btn) {
          btn.onclick = () => {
            marker.closePopup();
            handleStartHire(seeker);
          };
        }
      });

      group.addLayer(marker);
    });
  }, [seekers, handleStartHire]);

  // 5b. Render Gigs on Map with Apply action for seekers
  useEffect(() => {
    const group = gigsLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    gigs.forEach((gig) => {
      const gigHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(234,88,12,0.45); cursor: pointer; transition: transform 0.15s ease;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
          <span style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: #ea580c; color: #ffffff; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 8px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">${gig.reward}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: gigHtml,
        className: 'gig-map-marker',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([gig.coords.lat, gig.coords.lng], { icon });

      const descHtml = gig.description
        ? `<p style="font-size: 12px; color: #475569; margin: 6px 0 10px 0; line-height: 1.4;">${gig.description}</p>`
        : '';

      const isOwner = gig.postedBy === 'me'; // Assuming 'me' is the current user ID
      const actionHtml = isOwner
        ? `<div style="display: flex; gap: 8px;">
             <button id="edit-gig-${gig.id}" style="flex: 1; padding: 7px; background: #e2e8f0; color: #475569; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer;">Edit</button>
             <button id="delete-gig-${gig.id}" style="flex: 1; padding: 7px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer;">Delete</button>
           </div>`
        : `<button id="apply-gig-${gig.id}" style="width: 100%; padding: 7px; background: #ea580c; color: white; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">Apply to GiG</button>`;

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 8px; min-width: 210px; color: #0f172a;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="background: #ffedd5; color: #c2410c; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">${gig.category}</span>
            <span style="font-size: 13px; font-weight: 800; color: #ea580c;">${gig.reward}</span>
          </div>
          <strong style="font-size: 14px; display: block; color: #0f172a; margin-bottom: 2px;">${gig.title}</strong>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${gig.location} · <span>${gig.distance || 'Near you'}</span></div>
          ${descHtml}
          ${actionHtml}
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        if (isOwner) {
          document.getElementById(`edit-gig-${gig.id}`)?.addEventListener('click', () => {
            marker.closePopup();
            handleEditGig(gig);
          });
          document.getElementById(`delete-gig-${gig.id}`)?.addEventListener('click', () => {
            marker.closePopup();
            handleDeleteGig(gig.id);
          });
        } else {
          document.getElementById(`apply-gig-${gig.id}`)?.addEventListener('click', () => {
            marker.closePopup();
            setApplyingGigState(gig);
          });
        }
      });

      group.addLayer(marker);
    });
  }, [gigs, handleStartHire, handleEditGig, handleDeleteGig]);

  // 5c. Render Active Navigation Route & Telemetry on Map
  useEffect(() => {
    const group = navLayerGroupRef.current;
    const map = mapRef.current;
    if (!group) return;

    group.clearLayers();

    if (
      !activeAssignment ||
      activeAssignment.status !== 'navigating' ||
      !activeAssignment.routeCoords ||
      activeAssignment.routeCoords.length === 0
    ) {
      return;
    }

    const { routeCoords, seekerName, seekerAvatar, gigTitle, gigReward } = activeAssignment;

    // 1. Soft glowing outer casing line
    const casing = L.polyline(routeCoords, {
      color: '#1d4ed8',
      weight: 9,
      opacity: 0.3,
      lineCap: 'round',
      lineJoin: 'round',
    });
    group.addLayer(casing);

    // 2. High-contrast active navigation polyline
    const navLine = L.polyline(routeCoords, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.95,
      dashArray: '8, 10',
      lineCap: 'round',
      lineJoin: 'round',
    });
    group.addLayer(navLine);

    // 3. Seeker Start Marker with pulsing beacon
    const startPoint = routeCoords[0];
    const seekerMarkerHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="position: relative; width: 44px; height: 44px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center;">
          <img src="${seekerAvatar}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" />
          <span style="position: absolute; -inset: 6px; border-radius: 50%; border: 2px solid #3b82f6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></span>
        </div>
        <div style="background: #2563eb; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; white-space: nowrap; margin-top: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          ${seekerName} (En Route)
        </div>
      </div>
    `;
    const seekerIcon = L.divIcon({
      html: seekerMarkerHtml,
      className: 'nav-seeker-marker',
      iconSize: [44, 60],
      iconAnchor: [22, 22],
    });
    const seekerMarker = L.marker(startPoint, { icon: seekerIcon, zIndexOffset: 1200 });
    group.addLayer(seekerMarker);

    // 4. Gig Destination Marker with checkered flag
    const endPoint = routeCoords[routeCoords.length - 1];
    const destMarkerHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #ea580c, #c2410c); border: 3px solid #ffffff; box-shadow: 0 4px 16px rgba(234,88,12,0.6); display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 20px;">🏁</span>
        </div>
        <div style="background: #ea580c; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px; white-space: nowrap; margin-top: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          Destination: ${gigTitle} (${gigReward})
        </div>
      </div>
    `;
    const destIcon = L.divIcon({
      html: destMarkerHtml,
      className: 'nav-dest-marker',
      iconSize: [44, 60],
      iconAnchor: [22, 22],
    });
    const destMarker = L.marker(endPoint, { icon: destIcon, zIndexOffset: 1200 });
    group.addLayer(destMarker);

    // Fit map bounds to show complete navigation path
    if (map) {
      const validBounds = routeCoords.filter((c) => isValidCoord({ lat: c[0], lng: c[1] }));
      if (validBounds.length > 0) {
        map.fitBounds(L.latLngBounds(validBounds), {
          padding: [90, 90],
          maxZoom: 16,
          animate: true,
        });
      }
    }
  }, [activeAssignment]);

  const handleCreateGig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gigTitle.trim()) {
      showToast('Please enter a title for your GiG.');
      return;
    }

    // Determine coords: if user selected a suggested location, use exact suggestion coordinates
    let postCoords: Coordinates = { lat: -26.1465, lng: 28.0416 };
    if (gigCustomCoords) {
      postCoords = gigCustomCoords;
    } else if (userCoords) {
      postCoords = {
        lat: Number((userCoords.lat + (Math.random() - 0.5) * 0.004).toFixed(5)),
        lng: Number((userCoords.lng + (Math.random() - 0.5) * 0.004).toFixed(5)),
      };
    } else if (mapRef.current) {
      const center = mapRef.current.getCenter();
      postCoords = {
        lat: Number((center.lat + (Math.random() - 0.5) * 0.004).toFixed(5)),
        lng: Number((center.lng + (Math.random() - 0.5) * 0.004).toFixed(5)),
      };
    }

    const newGig: Gig = {
      id: `gig_${Date.now()}`,
      title: gigTitle.trim(),
      reward: normalizeRewardToRands(gigReward),
      location: gigLocation.trim() || profile.location || 'Local Area',
      distance: 'Just posted',
      category: gigCategory,
      coords: postCoords,
      description: gigDescription.trim(),
      postedBy: profile.fullName || 'You',
    };

    setGigs((prev) => [newGig, ...prev]);
    setIsCreateGigOpen(false);
    setGigTitle('');
    setGigDescription('');
    setGigCustomCoords(null);
    setGigLocationSuggestions([]);
    setShowGigLocDropdown(false);

    // Smoothly fly to newly posted gig on the map
    if (mapRef.current) {
      flyToCoords(postCoords, 16);
    }

    showToast(`🔥 GiG "${newGig.title}" posted on the map! Seekers can now apply.`);
  };

  // Automatically fill location area box when user clicks "Use My Location"
  const handleUseMyLocationForGig = async () => {
    setIsDetectingGigLoc(true);
    setGigLocationSuggestions([]);
    setShowGigLocDropdown(false);

    // 1. If device GPS coordinates are already available
    if (userCoords) {
      try {
        showToast('Detecting location area via GPS...');
        const res = await reverseGeocode(userCoords.lat, userCoords.lng);
        const resolvedArea = res.city
          ? `${res.city}${res.province ? `, ${res.province}` : res.country ? `, ${res.country}` : ''}`
          : res.address;
        const finalLoc = resolvedArea || (profile.location ? `${profile.location}${profile.province ? `, ${profile.province}` : ''}` : '');
        if (finalLoc) {
          setGigLocation(finalLoc);
          setGigCustomCoords(userCoords);
          showToast(`📍 Location area set: ${finalLoc}`);
        } else {
          setGigLocation(`${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`);
          setGigCustomCoords(userCoords);
          showToast('GPS coordinates filled into location box!');
        }
      } catch {
        if (profile.location) {
          setGigLocation(`${profile.location}${profile.province ? `, ${profile.province}` : ''}`);
        }
      } finally {
        setIsDetectingGigLoc(false);
      }
      return;
    }

    // 2. If userCoords not yet loaded, query browser/hardware GPS
    if (!('geolocation' in navigator)) {
      if (profile.location) {
        setGigLocation(`${profile.location}${profile.province ? `, ${profile.province}` : ''}`);
        showToast(`Filled from profile: ${profile.location}`);
      } else {
        showToast('Geolocation is not supported by your browser.');
      }
      setIsDetectingGigLoc(false);
      return;
    }

    showToast('Requesting GPS location from device...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords: Coordinates = { lat: latitude, lng: longitude };
        setUserCoords(coords);
        setAccuracy(pos.coords.accuracy);
        setHeading(pos.coords.heading);

        try {
          const res = await reverseGeocode(latitude, longitude);
          const resolvedArea = res.city
            ? `${res.city}${res.province ? `, ${res.province}` : res.country ? `, ${res.country}` : ''}`
            : res.address;
          const finalLoc = resolvedArea || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setGigLocation(finalLoc);
          setGigCustomCoords(coords);
          showToast(`📍 Location area set: ${finalLoc}`);
        } catch {
          setGigLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setGigCustomCoords(coords);
          showToast('GPS coordinates filled into location box!');
        } finally {
          setIsDetectingGigLoc(false);
        }
      },
      (err) => {
        setIsDetectingGigLoc(false);
        if (profile.location) {
          setGigLocation(`${profile.location}${profile.province ? `, ${profile.province}` : ''}`);
          showToast(`Filled from profile: ${profile.location}`);
        } else {
          showToast('Unable to detect GPS location: ' + err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Autocomplete suggestions when typing in Location / Area box
  useEffect(() => {
    if (!gigLocation || gigLocation.trim().length < 2) {
      setGigLocationSuggestions([]);
      setIsSearchingGigLoc(false);
      setShowGigLocDropdown(false);
      return;
    }

    if (gigCustomCoords) {
      return;
    }

    setIsSearchingGigLoc(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchNominatim(gigLocation);
        setGigLocationSuggestions(results || []);
        setShowGigLocDropdown((results && results.length > 0) || false);
      } catch (err) {
        console.warn('Location suggestion error:', err);
      } finally {
        setIsSearchingGigLoc(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [gigLocation, gigCustomCoords]);

  // Autocomplete suggestions when typing in Profile Location / City
  useEffect(() => {
    if (!profile.location || profile.location.trim().length < 2 || isProfileLocked) {
      setProfileLocationSuggestions([]);
      setIsSearchingProfileLoc(false);
      setShowProfileLocDropdown(false);
      return;
    }

    setIsSearchingProfileLoc(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchNominatim(profile.location);
        setProfileLocationSuggestions(results || []);
        setShowProfileLocDropdown((results && results.length > 0) || false);
      } catch (err) {
        console.warn('Profile location suggestion error:', err);
      } finally {
        setIsSearchingProfileLoc(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [profile.location, isProfileLocked]);

  // 6. Search handling: Nominatim for worldwide locations, local filter by location/province when in Seekers tab
  useEffect(() => {
    if (activeTab === 'seekers' || activeTab === 'profile') {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(searchQuery.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=6&addressdetails=1`,
          {
            headers: { 'Accept-Language': 'en' },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Search request notice:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleSelectResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      flyToCoords({ lat, lng: lon }, 15);
      setSearchQuery(item.display_name.split(',')[0]);
      setShowDropdown(false);
      setActiveTab(null);
    }
  };

  const filteredSeekers = seekers.filter((s) => {
    const matchesOnline = s.isOnline && s.readyToHire;
    if (!matchesOnline) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const loc = (s.location || '').toLowerCase();
    const prov = (s.province || '').toLowerCase();
    return loc.includes(q) || prov.includes(q);
  });

  // Profile handlers enforcing 1-month picture update restriction & auto-location with IndexedDB storage
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (profile.lastAvatarUpdate && now - profile.lastAvatarUpdate < ONE_MONTH_MS) {
      const daysLeft = Math.ceil((ONE_MONTH_MS - (now - profile.lastAvatarUpdate)) / (24 * 60 * 60 * 1000));
      showToast(`Profile picture can only be updated once a month. Approx ${daysLeft} days remaining.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        // Save to IndexedDB (device storage) to avoid filling localStorage quota
        await saveMediaItem(`avatar_${CURRENT_USER_ID}`, dataUrl);
        setProfile((prev) => ({
          ...prev,
          avatar: dataUrl,
          lastAvatarUpdate: now,
        }));
        showToast('Face selfie / profile picture updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIdDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        // Save ID doc scan to IndexedDB
        await saveMediaItem(`iddoc_${CURRENT_USER_ID}`, dataUrl);
      }
    };
    reader.readAsDataURL(file);

    setProfile((prev) => ({ ...prev, idDocName: file.name }));
    showToast(`ID document "${file.name}" uploaded successfully!`);
  };

  const handleAutoLocation = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation is not supported by your browser');
      return;
    }
    showToast('Detecting location automatically via GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setAccuracy(pos.coords.accuracy);
        setHeading(pos.coords.heading);
        try {
          const res = await reverseGeocode(latitude, longitude);
          const city = res.city || (res.address ? res.address.split(',')[0].trim() : '');
          const prov = res.province || res.country || '';
          setProfile((prev) => ({
            ...prev,
            location: city || res.address || prev.location || '',
            province: prov || prev.province || '',
          }));
          showToast('Location and province filled automatically via GPS!');
        } catch {
          setProfile((prev) => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
          showToast('GPS coordinates set into location box!');
        }
      },
      (err) => {
        showToast('Unable to detect location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden m-0 p-0 font-sans bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Full-Screen OpenStreetMap Background Wallpaper */}
      <div
        ref={mapElementRef}
        id="map"
        className="w-full h-full absolute inset-0 z-0 bg-slate-900"
        style={{ touchAction: 'none' }}
      />

      {/* Blur Overlay when Seekers or Profile feature is active */}
      {(activeTab === 'seekers' || activeTab === 'profile') && (
        <div className="absolute inset-0 z-10 backdrop-blur-md bg-slate-950/40 transition-all pointer-events-none" />
      )}

      {/* Welcome Back Notification Banner when registered user logs in */}
      {welcomeBannerMessage && (
        <div className="fixed top-5 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 rounded-2xl shadow-2xl border border-blue-400/40 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs md:text-sm font-bold truncate">{welcomeBannerMessage}</h4>
              <p className="text-[11px] text-blue-100">Welcome back to GiGs! You are successfully signed in.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWelcomeBannerMessage(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Search Bar & User Profile / Login Button (Hidden in Profile feature) */}
      {activeTab !== 'profile' && (
        <div className="absolute top-4 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] z-30">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 flex items-center shadow-2xl rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-blue-500">
              <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (activeTab !== 'seekers' && searchResults.length > 0) setShowDropdown(true);
                }}
                placeholder={
                  activeTab === 'seekers'
                    ? 'Search seekers by location or province...'
                    : 'Search any place, location, province worldwide...'
                }
                className="w-full py-3 px-3 text-sm bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearching && activeTab !== 'seekers' && (
                <div className="mr-4 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </div>

            {/* User Profile Picture Logo or Login Button */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  if (userCoords) {
                    flyToCoords(userCoords, 16);
                    showToast(`Centered on your location, ${profile.fullName}!`);
                  } else {
                    setActiveTab('profile');
                  }
                }}
                title={userCoords ? 'Center on your location' : 'View Profile'}
                className="shrink-0 relative flex items-center justify-center p-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <img
                  src={profile.avatar || DEFAULT_PROFILE.avatar}
                  alt={profile.fullName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-600 shadow-sm"
                />
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
                  title="Online"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalInitialMode('login');
                  setIsAuthModalOpen(true);
                }}
                title="Log In / Sign Up"
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log In</span>
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown (Only for worldwide search outside Seekers tab) */}
          {activeTab !== 'seekers' && showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 inset-x-0 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 overflow-hidden z-40 max-h-80 overflow-y-auto">
              <div className="px-3.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Search Results
              </div>
              {searchResults.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.display_name.split(',')[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.display_name.split(',').slice(1).join(',').trim()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User-friendly Location Error & Retry Banner (Never fake coordinates, hidden in Profile and Seekers) */}
      {locationError && !userCoords && activeTab !== 'seekers' && activeTab !== 'profile' && (
        <div className="absolute top-20 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-30 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white text-xs backdrop-blur-md border border-slate-700 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{locationError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={requestLocation}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Control Group: Create a GiG, Zoom, Satellite View, and Locate Me attached together (Hidden when in Seekers view) */}
      {activeTab !== 'seekers' && (
        <div className="absolute bottom-40 right-6 z-20 flex flex-col shadow-2xl rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Create a GiG small icon on top of the zoom feature */}
          <button
            type="button"
            onClick={() => {
              if (!gigLocation) {
                if (profile.location) {
                  setGigLocation(`${profile.location}${profile.province ? `, ${profile.province}` : ''}`);
                } else if (userCoords) {
                  reverseGeocode(userCoords.lat, userCoords.lng).then((res) => {
                    const resolved = res.city
                      ? `${res.city}${res.province ? `, ${res.province}` : res.country ? `, ${res.country}` : ''}`
                      : res.address;
                    if (resolved) setGigLocation(resolved);
                  });
                }
              }
              setIsCreateGigOpen(true);
            }}
            className="p-3 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors flex items-center justify-center relative group"
            title="Create a GiG & Post on Map"
            aria-label="Create a GiG"
          >
            <div className="relative flex items-center justify-center">
              <Flame className="w-4 h-4 fill-orange-500 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-orange-600 text-[8px] font-bold text-white leading-none">
                +
              </span>
            </div>
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />
          {/* Satellite View Toggle */}
          <button
            type="button"
            onClick={() => setIsSatellite(!isSatellite)}
            className={`p-3 transition-colors flex items-center justify-center ${
              isSatellite
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isSatellite ? 'Switch to Standard Map' : 'Switch to Satellite View'}
            aria-label="Toggle Satellite View"
          >
            <Globe className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />
          {/* Locate Me (Always available to center or request permission) */}
          <button
            type="button"
            onClick={() => {
              if (userCoords) {
                flyToCoords(userCoords, 16);
              } else {
                requestLocation();
              }
            }}
            className="p-3 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            title={userCoords ? 'Center on my exact location' : 'Request device location'}
            aria-label="Locate me"
          >
            <Navigation className={`w-4 h-4 fill-current ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Seekers Feature: Showing ONLY seeker listings and top search bar filtered by location and province */}
      {activeTab === 'seekers' && (
        <div className="absolute inset-x-4 top-20 bottom-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:top-24 md:bottom-28 z-30 flex flex-col space-y-3.5 overflow-y-auto animate-fadeIn pr-1">
          {filteredSeekers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No online seekers found matching that location or province.
            </div>
          ) : (
            filteredSeekers.map((seeker) => (
              <div
                key={seeker.id}
                onClick={() => {
                  flyToCoords(seeker.coords, 16);
                  setActiveTab(null);
                  showToast(`Centered on ${seeker.name}`);
                }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer transition-all shadow-xl hover:scale-[1.01]"
              >
                <div className="relative shrink-0">
                  <img
                    src={seeker.avatar}
                    alt={seeker.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {seeker.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {seeker.role}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{seeker.location}, {seeker.province}</span>
                    <span>·</span>
                    <span>{seeker.distance}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartHire(seeker);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Hire Seeker</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Comprehensive Facebook-Style Profile Feature & Verification (Without back cover) */}
      {activeTab === 'profile' && (
        <div className="absolute inset-x-4 top-6 bottom-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[620px] md:top-8 md:bottom-28 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-6 animate-fadeIn">
          
          {/* Facebook-style Top Profile Header (Centered without cover photo) */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-200 dark:border-slate-800 relative">
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative mb-3">
              <img
                src={profile.avatar}
                alt="Profile Selfie"
                className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-2xl"
              />
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold" title="Verified Explorer">✓</span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{profile.fullName}</h2>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">{profile.bio}</p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {profile.location}, {profile.province}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {isProfileLocked ? (
                <button
                  type="button"
                  onClick={() => setIsProfileLocked(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> Save Profile
                </button>
              )}

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  title="Sign out of your account"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalInitialMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> Log In / Register
                </button>
              )}
            </div>
          </div>

          {/* New User Profile Completion Guidance Banner */}
          {isCompletingProfileAfterRegister && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-dashed border-emerald-500/50 text-slate-800 dark:text-slate-200 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>🎉 Step 2: Complete Your Explorer Profile</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                Welcome to GiG Explorer! Your account has been registered with <strong>{profile.email}</strong>. Please fill out your <strong>Full Name</strong>, <strong>Role / Bio</strong>, <strong>Location</strong>, and <strong>Contact Phone</strong> below so clients and seekers can connect with you. When finished, click <strong>"Save Profile"</strong> above to lock in your details.
              </p>
            </div>
          )}

          {/* Section 1: Face Selfie / Profile Picture (Once a month limit, stored in IndexedDB) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Face Selfie / Profile Picture (Update once a month)
            </label>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={profile.avatar}
                alt="Selfie"
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Active Face Verification Photo</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Restrictions apply: You can only update your profile picture once every 30 days.
                </div>
                {!isProfileLocked && (
                  <label className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all">
                    <Camera className="w-3.5 h-3.5" /> Upload / Capture Selfie
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: ID Document Upload (Stored in IndexedDB) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. ID Document Verification
            </label>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {profile.idDocName || 'No ID document uploaded'}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Secure Government ID Verified
                  </div>
                </div>
              </div>
              {!isProfileLocked && (
                <label className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shrink-0">
                  <Upload className="w-3.5 h-3.5 inline mr-1" /> Upload ID
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleIdDocChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Section 3: Basic Personal Information */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Basic Personal Information
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  disabled={isProfileLocked}
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Role / Bio</label>
                <input
                  type="text"
                  disabled={isProfileLocked}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Location & Province (Manual or Auto-detect GPS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                4. Location & Province
              </label>
              {!isProfileLocked && (
                <button
                  type="button"
                  onClick={handleAutoLocation}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Use My Location
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-[11px] text-slate-500 mb-1">Location / City</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    disabled={isProfileLocked}
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    onFocus={() => {
                      if (profileLocationSuggestions.length > 0) setShowProfileLocDropdown(true);
                    }}
                    placeholder="e.g. Rosebank, Cape Town"
                    className="w-full py-2.5 pl-3 pr-7 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isSearchingProfileLoc && (
                    <div className="absolute right-2 flex items-center pointer-events-none">
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Profile Location Suggestions Dropdown */}
                {showProfileLocDropdown && profileLocationSuggestions.length > 0 && !isProfileLocked && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 max-h-48 overflow-y-auto">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Location Suggestions
                    </div>
                    {profileLocationSuggestions.map((item) => {
                      const city =
                        item.address?.city ||
                        item.address?.town ||
                        item.address?.suburb ||
                        item.display_name.split(',')[0].trim();
                      const prov =
                        item.address?.state ||
                        item.address?.province ||
                        item.address?.region ||
                        item.address?.country ||
                        '';
                      return (
                        <button
                          key={item.place_id}
                          type="button"
                          onClick={() => {
                            setProfile((prev) => ({
                              ...prev,
                              location: city,
                              province: prov || prev.province,
                            }));
                            setShowProfileLocDropdown(false);
                            showToast(`📍 Selected ${city}, ${prov}`);
                          }}
                          className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {city}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.display_name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Province / State</label>
                <input
                  type="text"
                  disabled={isProfileLocked}
                  value={profile.province}
                  onChange={(e) => setProfile({ ...profile, province: e.target.value })}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Contact & Email Information */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              5. Contact & Email Information
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Contact Phone
                </label>
                <input
                  type="text"
                  disabled={isProfileLocked}
                  value={profile.contact}
                  onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <input
                  type="email"
                  disabled={isProfileLocked}
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Social Media Links (Dynamic add/remove) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                6. Social Media Links
              </label>
              {!isProfileLocked && (
                <button
                  type="button"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      socials: [...prev.socials, { platform: '', url: '' }],
                    }))
                  }
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              )}
            </div>
            <div className="space-y-2">
              {profile.socials.map((social, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isProfileLocked}
                    placeholder="Platform (e.g. GitHub)"
                    value={social.platform}
                    onChange={(e) => {
                      const updated = [...profile.socials];
                      updated[index].platform = e.target.value;
                      setProfile({ ...profile, socials: updated });
                    }}
                    className="w-1/3 py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none"
                  />
                  <input
                    type="url"
                    disabled={isProfileLocked}
                    placeholder="Profile URL (https://...)"
                    value={social.url}
                    onChange={(e) => {
                      const updated = [...profile.socials];
                      updated[index].url = e.target.value;
                      setProfile({ ...profile, socials: updated });
                    }}
                    className="flex-1 py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none"
                  />
                  {!isProfileLocked && profile.socials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfile({
                          ...profile,
                          socials: profile.socials.filter((_, i) => i !== index),
                        });
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700 transition-colors"
                      title="Remove link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Docked Bottom Menu Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around px-6 py-3.5">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'seekers' ? null : 'seekers')}
            className={`flex flex-col items-center gap-1 outline-none focus:outline-none transition-colors ${
              activeTab === 'seekers' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px]">Seekers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'gigs' ? null : 'gigs')}
            className={`flex flex-col items-center gap-1 outline-none focus:outline-none transition-colors ${
              activeTab === 'gigs' ? 'text-orange-500 dark:text-orange-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-7 h-7" />
            <span className="text-[11px]">GiGs</span>
          </button>

          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                setAuthModalInitialMode('login');
                setIsAuthModalOpen(true);
              }}
              className={`flex flex-col items-center gap-1 outline-none focus:outline-none transition-colors ${
                isAuthModalOpen ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span className="text-[11px]">Login</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'profile' ? null : 'profile')}
              className={`flex flex-col items-center gap-1 outline-none focus:outline-none transition-colors ${
                activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <img
                  src={profile.avatar || DEFAULT_PROFILE.avatar}
                  alt={profile.fullName}
                  className="w-5 h-5 rounded-full object-cover border border-blue-500"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
              </div>
              <span className="text-[11px]">Profile</span>
            </button>
          )}


          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <span className="text-[11px]">Settings</span>
          </button>

        </div>
      </nav>

      {/* Create a GiG Modal */}
      {isCreateGigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/80 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create a GiG</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Post a gig on the map for seekers to apply to</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateGigOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingGig ? handleUpdateGig : handleCreateGig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GiG Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={gigTitle}
                  onChange={(e) => setGigTitle(e.target.value)}
                  placeholder="e.g. Historic Facade Photo Survey"
                  className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={gigCategory}
                    onChange={(e) => setGigCategory(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {CASUAL_GIG_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reward / Pay (Rands)
                  </label>
                  <input
                    type="text"
                    value={gigReward}
                    onChange={(e) => setGigReward(e.target.value)}
                    placeholder="e.g. R250 or R150/hr"
                    className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Location / Area
                  </label>
                  <button
                    type="button"
                    onClick={handleUseMyLocationForGig}
                    disabled={isDetectingGigLoc}
                    className="text-[11px] text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
                    title="Automatically fill location box with your GPS location"
                  >
                    <Navigation className={`w-3 h-3 ${isDetectingGigLoc ? 'animate-spin' : ''}`} />
                    {isDetectingGigLoc ? 'Detecting...' : 'Use My Location'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={gigLocation}
                    onChange={(e) => {
                      setGigLocation(e.target.value);
                      setGigCustomCoords(null);
                    }}
                    onFocus={() => {
                      if (gigLocationSuggestions.length > 0) setShowGigLocDropdown(true);
                    }}
                    placeholder="Type a location, area, suburb or city..."
                    className="w-full py-2.5 pl-3.5 pr-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {isSearchingGigLoc ? (
                    <div className="absolute right-2.5 flex items-center pointer-events-none">
                      <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : gigLocation ? (
                    <button
                      type="button"
                      onClick={() => {
                        setGigLocation('');
                        setGigCustomCoords(null);
                        setGigLocationSuggestions([]);
                        setShowGigLocDropdown(false);
                      }}
                      className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Suggestions Dropdown for Location / Area */}
                {showGigLocDropdown && gigLocationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 max-h-56 overflow-y-auto">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Location Suggestions
                    </div>
                    {gigLocationSuggestions.map((item) => {
                      const title =
                        item.address?.suburb ||
                        item.address?.city ||
                        item.address?.town ||
                        item.address?.road ||
                        item.display_name.split(',')[0];
                      const subtitle = item.display_name;
                      return (
                        <button
                          key={item.place_id}
                          type="button"
                          onClick={() => {
                            const formatted = item.display_name.split(',').slice(0, 3).join(',').trim();
                            setGigLocation(formatted);
                            setGigCustomCoords({
                              lat: parseFloat(item.lat),
                              lng: parseFloat(item.lon),
                            });
                            setShowGigLocDropdown(false);
                            showToast(`📍 Selected: ${formatted}`);
                          }}
                          className="w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                        >
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Details & Requirements
                </label>
                <textarea
                  rows={3}
                  value={gigDescription}
                  onChange={(e) => setGigDescription(e.target.value)}
                  placeholder="Describe the tasks, deliverables, or qualifications needed for seekers to apply..."
                  className="w-full py-2.5 px-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 flex items-center gap-2.5 text-[11px] text-orange-800 dark:text-orange-300">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <span>
                  This GiG will be pinned directly onto the map with an interactive marker for online seekers to discover and apply to.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGigOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  Post GiG on Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Navigation HUD: Active when a gig is assigned and user is on map / GiGs feature */}
      {activeAssignment && (activeTab === 'gigs' || activeTab === null) && (
        <NavigationHud
          assignment={activeAssignment}
          actingRole={actingRole}
          onChangeActingRole={setActingRole}
          onRequestComplete={() => setIsCompletedModalOpen(true)}
          onRequestCancel={() => setIsCancelModalOpen(true)}
          onFocusRoute={handleFocusRoute}
        />
      )}

      {/* Select GiG to Hire Modal */}
      {hiringModalSeeker && (
        <SelectGigToHireModal
          seeker={hiringModalSeeker}
          gigs={gigs}
          onClose={() => setHiringModalSeeker(null)}
          onConfirmHire={handleConfirmSendOffer}
        />
      )}

      {/* Circle Loading Waiting for Seeker to Accept Modal */}
      {waitingHiringState && (
        <HiringWaitingModal
          seeker={waitingHiringState.seeker}
          gig={waitingHiringState.gig}
          attempt={waitingHiringState.attempt || 1}
          onAccepted={handleSeekerAccepted}
          onCancel={() => {
            setWaitingHiringState(null);
            showToast('Hiring request cancelled.');
          }}
        />
      )}

      {/* Circle Loading Waiting for Owner to Accept Modal */}
      {applyingGigState && (
        <ApplyingWaitingModal
          gig={applyingGigState}
          onClose={() => setApplyingGigState(null)}
        />
      )}

      {/* Cancel GiG Assignment Modal with required reason */}
      {isCancelModalOpen && activeAssignment && (
        <CancelGigModal
          assignment={activeAssignment}
          currentRole={actingRole}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirmCancel={handleConfirmCancelGig}
        />
      )}

      {/* Gig Completed Modal (Verified Owner only) */}
      {isCompletedModalOpen && activeAssignment && (
        <GigCompletedModal
          assignment={activeAssignment}
          onClose={() => setIsCompletedModalOpen(false)}
          onConfirmComplete={handleConfirmCompleteGig}
        />
      )}

      {/* Mutual Cancellation Reason Alert Modal */}
      {cancellationAlert && (
        <GigCancelledAlertModal
          cancellation={cancellationAlert}
          onClose={() => setCancellationAlert(null)}
        />
      )}

      {/* Firebase Auth Modal: Register & Login flows with Terms Acceptance */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalInitialMode}
        onRegistrationComplete={handleRegistrationComplete}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 right-6 z-40 bg-slate-900/95 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border border-slate-700 animate-fadeIn pointer-events-none">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
