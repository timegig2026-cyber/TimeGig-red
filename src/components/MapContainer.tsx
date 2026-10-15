import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import { Coordinates, MapHandle, TileLayerConfig, UserLocationState, Waypoint } from '../types/map';
import { calculateDistance, formatCoordinates, formatDistance } from '../utils/geo';

interface MapContainerProps {
  userLocation: UserLocationState;
  activeLayer: TileLayerConfig;
  waypoints: Waypoint[];
  measuringMode: boolean;
  measurePoints: Coordinates[];
  autoFollow: boolean;
  onMapClick: (coords: Coordinates) => void;
  onMeasurePointAdd: (coords: Coordinates) => void;
  onWaypointSelect?: (waypoint: Waypoint) => void;
  onUserDrag?: () => void;
  onCursorMove?: (coords: Coordinates | null) => void;
  onMapStatsChange?: (stats: { zoom: number; center: Coordinates }) => void;
}

const MapContainer = forwardRef<MapHandle, MapContainerProps>(function MapContainer(
  {
    userLocation,
    activeLayer,
    waypoints,
    measuringMode,
    measurePoints,
    autoFollow,
    onMapClick,
    onMeasurePointAdd,
    onWaypointSelect,
    onUserDrag,
    onCursorMove,
    onMapStatsChange,
  },
  ref
) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // User location marker and accuracy circle
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  // Waypoints layer group
  const waypointsGroupRef = useRef<L.LayerGroup | null>(null);

  // Measure ruler polyline & markers
  const measureGroupRef = useRef<L.LayerGroup | null>(null);

  // Keep track of initial fly to user location
  const initialCenteredRef = useRef<boolean>(false);

  // Expose imperative map controls (flyTo, zoomIn, zoomOut, resetNorth)
  useImperativeHandle(
    ref,
    () => ({
      flyTo: (coords: Coordinates, zoom?: number) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            [coords.lat, coords.lng],
            zoom ?? Math.max(mapInstanceRef.current.getZoom(), 16),
            { duration: 1.2 }
          );
        }
      },
      zoomIn: () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.zoomIn();
        }
      },
      zoomOut: () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.zoomOut();
        }
      },
      resetNorth: () => {
        if (mapInstanceRef.current && userLocation.coords) {
          mapInstanceRef.current.flyTo(
            [userLocation.coords.lat, userLocation.coords.lng],
            mapInstanceRef.current.getZoom(),
            { duration: 0.8 }
          );
        }
      },
    }),
    [userLocation.coords]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    // Default center until geolocation resolves
    const defaultCoords = userLocation.coords || { lat: 37.7749, lng: -122.4194 };
    const defaultZoom = userLocation.coords ? 15 : 12;

    const map = L.map(mapElementRef.current, {
      center: [defaultCoords.lat, defaultCoords.lng],
      zoom: defaultZoom,
      zoomControl: false, // We provide custom sleek zoom controls
      attributionControl: false, // We render clean attribution bar
    });

    mapInstanceRef.current = map;

    // Initialize Tile Layer
    const tileLayer = L.tileLayer(activeLayer.url, {
      attribution: activeLayer.attribution,
      maxZoom: activeLayer.maxZoom,
      subdomains: activeLayer.subdomains || ['a', 'b', 'c'],
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;

    // Initialize Layer Groups
    waypointsGroupRef.current = L.layerGroup().addTo(map);
    measureGroupRef.current = L.layerGroup().addTo(map);

    // Event Listeners
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedCoords: Coordinates = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (measuringMode) {
        onMeasurePointAdd(clickedCoords);
      } else {
        onMapClick(clickedCoords);
      }
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (onCursorMove) {
        onCursorMove({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    map.on('dragstart', () => {
      if (onUserDrag) {
        onUserDrag();
      }
    });

    const updateMapStats = () => {
      if (onMapStatsChange && map) {
        const center = map.getCenter();
        onMapStatsChange({
          zoom: map.getZoom(),
          center: { lat: center.lat, lng: center.lng },
        });
      }
    };

    map.on('moveend', updateMapStats);
    map.on('zoomend', updateMapStats);
    updateMapStats();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when activeLayer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(activeLayer.url, {
      attribution: activeLayer.attribution,
      maxZoom: activeLayer.maxZoom,
      subdomains: activeLayer.subdomains || ['a', 'b', 'c'],
    }).addTo(map);

    currentTileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // Update User Location Marker & Accuracy Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!userLocation.coords) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        map.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      return;
    }

    const { lat, lng } = userLocation.coords;
    const accuracy = userLocation.accuracy || 15;
    const heading = userLocation.heading;

    // Create or update accuracy circle
    if (!userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: '#2563eb',
        weight: 1.5,
        opacity: 0.65,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
      }).addTo(map);
    } else {
      userAccuracyCircleRef.current.setLatLng([lat, lng]);
      userAccuracyCircleRef.current.setRadius(accuracy);
    }

    // Create custom user location pulse HTML icon
    const headingHtml =
      heading !== null && heading !== undefined
        ? `<div class="user-location-heading" style="transform: translateX(-50%) rotate(${heading}deg);"></div>`
        : '';

    const userIconHtml = `
      <div class="user-location-marker">
        <div class="user-location-pulse"></div>
        <div class="user-location-pulse-inner"></div>
        <div class="user-location-core"></div>
        ${headingHtml}
      </div>
    `;

    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'user-location-div-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!userMarkerRef.current) {
      const marker = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindPopup(
        `<div class="p-3 text-slate-900 min-w-[200px]">
          <div class="flex items-center gap-1.5 font-semibold text-sm text-blue-600 mb-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            ${userLocation.isSimulated ? 'Simulated Location' : 'Your Live Location'}
          </div>
          <div class="text-xs text-slate-600 mb-2 leading-relaxed">
            ${userLocation.address || 'Locating address...'}
          </div>
          <div class="text-[11px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 tabular-nums">
            ${formatCoordinates(userLocation.coords)}
          </div>
          <div class="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Accuracy: &plusmn;${Math.round(accuracy)}m</span>
            ${userLocation.speed ? `<span>${(userLocation.speed * 3.6).toFixed(1)} km/h</span>` : ''}
          </div>
        </div>`
      );

      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setIcon(userIcon);
    }

    // Auto-center on first location fix or when autoFollow is on
    if (!initialCenteredRef.current || autoFollow) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), {
        duration: 1.2,
      });
      initialCenteredRef.current = true;
    }
  }, [userLocation, autoFollow]);

  // Update Saved Waypoints on map
  useEffect(() => {
    const group = waypointsGroupRef.current;
    if (!group) return;

    group.clearLayers();

    waypoints.forEach((wp) => {
      const pinColor = wp.color || '#ef4444';
      const distanceText = userLocation.coords
        ? formatDistance(calculateDistance(userLocation.coords, wp.coords))
        : null;

      const pinSvg = `
        <div class="custom-pin-marker" style="cursor: pointer;">
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 13.5 22.8 15.1 23.9.5.3 1.2.3 1.8 0C18.5 38.8 32 26.5 32 16 32 7.163 24.837 0 16 0z" fill="${pinColor}"/>
            <circle cx="16" cy="15" r="6" fill="#ffffff"/>
            <circle cx="16" cy="15" r="3" fill="${pinColor}"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        html: pinSvg,
        className: 'custom-waypoint-div-icon',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([wp.coords.lat, wp.coords.lng], { icon });

      marker.bindPopup(
        `<div class="p-3 text-slate-900 min-w-[210px]">
          <div class="font-semibold text-sm text-slate-900 mb-1 flex items-center justify-between">
            <span>${wp.name}</span>
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${pinColor}"></span>
          </div>
          ${wp.address ? `<div class="text-xs text-slate-600 mb-2 leading-relaxed">${wp.address}</div>` : ''}
          ${wp.notes ? `<div class="text-xs italic text-slate-500 mb-2">${wp.notes}</div>` : ''}
          <div class="text-[11px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 tabular-nums mb-2">
            ${formatCoordinates(wp.coords)}
          </div>
          ${
            distanceText
              ? `<div class="text-xs font-medium text-blue-600 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Distance from you:</span>
                  <span class="font-semibold tabular-nums">${distanceText}</span>
                </div>`
              : ''
          }
        </div>`
      );

      marker.on('click', () => {
        if (onWaypointSelect) {
          onWaypointSelect(wp);
        }
      });

      group.addLayer(marker);
    });
  }, [waypoints, userLocation.coords, onWaypointSelect]);

  // Update Measure Ruler Polyline & Points
  useEffect(() => {
    const group = measureGroupRef.current;
    if (!group) return;

    group.clearLayers();

    if (measurePoints.length === 0) return;

    const latlngs = measurePoints.map((p) => [p.lat, p.lng] as [number, number]);

    // Draw line connecting measured points
    if (measurePoints.length > 1) {
      const polyline = L.polyline(latlngs, {
        color: '#f59e0b',
        weight: 3.5,
        dashArray: '6, 8',
        opacity: 0.9,
      });
      group.addLayer(polyline);
    }

    // Add point markers
    measurePoints.forEach((point, index) => {
      const markerHtml = `
        <div class="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs border-2 border-white shadow-md tabular-nums">
          ${index + 1}
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'measure-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([point.lat, point.lng], { icon });
      group.addLayer(marker);
    });
  }, [measurePoints]);

  return (
    <div
      ref={mapElementRef}
      id="leaflet-map"
      className="w-full h-full absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900 outline-none select-none"
      style={{ touchAction: 'none' }}
    />
  );
});

export default MapContainer;
