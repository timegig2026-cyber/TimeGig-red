import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinates, UserLocationState } from '../types/map';
import { reverseGeocode, DEMO_LOCATIONS, DemoLocation } from '../utils/geo';

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocationState>({
    coords: null,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    status: 'idle',
    isSimulated: false,
  });

  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [highAccuracy, setHighAccuracy] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Reverse geocode whenever coordinates change (debounced)
  const lastGeocodedCoords = useRef<string>('');

  const fetchAddress = useCallback(async (coords: Coordinates) => {
    const key = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
    if (lastGeocodedCoords.current === key) return;
    lastGeocodedCoords.current = key;

    const info = await reverseGeocode(coords.lat, coords.lng);
    setLocation((prev) => ({
      ...prev,
      address: info.address,
      city: info.city,
      country: info.country,
    }));
  }, []);

  const setSimulatedLocation = useCallback((demo: DemoLocation) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocation({
      coords: demo.coords,
      accuracy: 15,
      altitude: 24,
      altitudeAccuracy: 5,
      heading: 45,
      speed: 1.2, // ~4.3 km/h walking speed
      timestamp: Date.now(),
      address: demo.label,
      city: demo.city,
      country: demo.country,
      status: 'located',
      isSimulated: true,
    });
  }, []);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocation((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, status: 'requesting', errorMessage: undefined }));

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 15000,
      maximumAge: 10000,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const coords: Coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setLocation({
        coords,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        status: 'located',
        isSimulated: false,
      });

      fetchAddress(coords);
    };

    const handleError = (error: GeolocationPositionError) => {
      let message = 'Unable to retrieve your location.';
      let status: 'denied' | 'error' = 'error';

      if (error.code === error.PERMISSION_DENIED) {
        status = 'denied';
        message = 'Location access was denied. You can enable permissions or use a demo location.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = 'Location information is currently unavailable.';
      } else if (error.code === error.TIMEOUT) {
        message = 'The request to get user location timed out.';
      }

      setLocation((prev) => ({
        ...prev,
        status,
        errorMessage: message,
      }));

      // If denied or unavailable and no coordinates set yet, load default demo location as gentle fallback
      setLocation((prev) => {
        if (!prev.coords) {
          const defaultDemo = DEMO_LOCATIONS[0];
          return {
            ...prev,
            coords: defaultDemo.coords,
            accuracy: 25,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            timestamp: Date.now(),
            address: defaultDemo.label,
            city: defaultDemo.city,
            country: defaultDemo.country,
            isSimulated: true,
            status,
            errorMessage: message,
          };
        }
        return prev;
      });
    };

    try {
      // First get current position immediately
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

      // Then subscribe to live updates
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    } catch (err) {
      console.warn('Geolocation call failed:', err);
      setLocation((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Failed to access browser geolocation API.',
      }));
    }
  }, [highAccuracy, fetchAddress]);

  // Start location request on mount
  useEffect(() => {
    requestLocation();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestLocation]);

  return {
    location,
    autoFollow,
    setAutoFollow,
    highAccuracy,
    setHighAccuracy,
    requestLocation,
    setSimulatedLocation,
  };
}
