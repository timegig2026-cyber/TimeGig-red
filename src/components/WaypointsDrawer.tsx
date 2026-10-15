import { useState } from 'react';
import { X, Bookmark, MapPin, Trash2, Download, Navigation2, Copy, Check } from 'lucide-react';
import { Coordinates, Waypoint } from '../types/map';
import { calculateDistance, formatCoordinates, formatDistance } from '../utils/geo';

interface WaypointsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  waypoints: Waypoint[];
  userCoords: Coordinates | null;
  onFlyToWaypoint: (coords: Coordinates) => void;
  onDeleteWaypoint: (id: string) => void;
  onClearAllWaypoints: () => void;
}

export default function WaypointsDrawer({
  isOpen,
  onClose,
  waypoints,
  userCoords,
  onFlyToWaypoint,
  onDeleteWaypoint,
  onClearAllWaypoints,
}: WaypointsDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (wp: Waypoint) => {
    const text = `${wp.coords.lat.toFixed(6)}, ${wp.coords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(wp.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: waypoints.map((wp) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [wp.coords.lng, wp.coords.lat],
        },
        properties: {
          name: wp.name,
          address: wp.address || '',
          notes: wp.notes || '',
          createdAt: new Date(wp.createdAt).toISOString(),
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osm_waypoints_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white/98 dark:bg-slate-900/98 backdrop-blur-md shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Saved Waypoints
            </h3>
            <p className="text-xs text-slate-500">
              {waypoints.length} {waypoints.length === 1 ? 'place' : 'places'} pinned
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {waypoints.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No pins saved yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Click anywhere on the map or search for any location to drop and save waypoints.
            </p>
          </div>
        ) : (
          waypoints.map((wp) => {
            const distance = userCoords
              ? calculateDistance(userCoords, wp.coords)
              : null;

            return (
              <div
                key={wp.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: wp.color || '#3b82f6' }}
                    />
                    <h4 className="font-semibold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                      {wp.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(wp)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Copy coordinates"
                    >
                      {copiedId === wp.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onFlyToWaypoint(wp.coords)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      title="Fly to waypoint"
                    >
                      <Navigation2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWaypoint(wp.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete waypoint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {wp.address && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                    {wp.address}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono tabular-nums">
                  <span>{formatCoordinates(wp.coords, 4)}</span>
                  {distance !== null && (
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatDistance(distance)} away
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      {waypoints.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClearAllWaypoints}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleExportGeoJSON}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            Export GeoJSON
          </button>
        </div>
      )}
    </div>
  );
}
