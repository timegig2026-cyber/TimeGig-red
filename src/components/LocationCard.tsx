import { useState } from 'react';
import {
  Navigation,
  Compass,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Sliders,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UserLocationState } from '../types/map';
import { formatCoordinates, DEMO_LOCATIONS, DemoLocation } from '../utils/geo';

interface LocationCardProps {
  userLocation: UserLocationState;
  autoFollow: boolean;
  onToggleAutoFollow: () => void;
  highAccuracy: boolean;
  onToggleHighAccuracy: () => void;
  onRequestLocation: () => void;
  onSelectDemoLocation: (demo: DemoLocation) => void;
  onCenterMap: () => void;
}

export default function LocationCard({
  userLocation,
  autoFollow,
  onToggleAutoFollow,
  highAccuracy,
  onToggleHighAccuracy,
  onRequestLocation,
  onSelectDemoLocation,
  onCenterMap,
}: LocationCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const coords = userLocation.coords;

  const handleCopyCoords = () => {
    if (!coords) return;
    const text = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (userLocation.isSimulated) {
      return (
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Demo Location
        </span>
      );
    }
    if (userLocation.status === 'located') {
      return (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> GPS Active
        </span>
      );
    }
    if (userLocation.status === 'requesting') {
      return (
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Locating...
        </span>
      );
    }
    if (userLocation.status === 'denied') {
      return (
        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> Permission Denied
        </span>
      );
    }
    return (
      <span className="text-xs text-slate-500 font-medium">Idle</span>
    );
  };

  return (
    <div className="absolute bottom-6 left-3 md:left-6 z-20 w-[calc(100%-1.5rem)] sm:w-84 md:w-96 select-none transition-all duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Header Bar */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                User Geolocation
              </div>
              <div>{getStatusBadge()}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCenterMap}
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Center Map on User"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand details' : 'Collapse'}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="p-4 space-y-3.5">
            {/* Address Line */}
            <div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Detected Address (OSM Reverse Geocode)
              </div>
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {userLocation.address || 'Resolving address from OpenStreetMap...'}
                </span>
              </div>
            </div>

            {/* Coordinates & Copy */}
            {coords && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Coordinates
                  </div>
                  <div className="font-mono text-xs font-medium text-slate-900 dark:text-white tabular-nums">
                    {formatCoordinates(coords, 5)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 transition-colors"
                  title="Copy Lat, Lng to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Telemetry Metrics Row */}
            {coords && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Accuracy</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    &plusmn;{Math.round(userLocation.accuracy || 15)}m
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Altitude</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {userLocation.altitude !== null ? `${Math.round(userLocation.altitude)}m` : 'N/A'}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Speed</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {userLocation.speed !== null ? `${(userLocation.speed * 3.6).toFixed(1)} km/h` : '0 km/h'}
                  </div>
                </div>
              </div>
            )}

            {/* Error or Denied Note */}
            {userLocation.status === 'denied' && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Browser Geolocation Disabled
                </div>
                <div className="text-[11px] leading-relaxed">
                  Click below to retry browser permission or choose a simulated city location to test the map features.
                </div>
              </div>
            )}

            {/* Controls & Demo Locations */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <label htmlFor="autofollow-toggle" className="cursor-pointer font-medium">
                  Auto-follow camera
                </label>
                <button
                  id="autofollow-toggle"
                  type="button"
                  onClick={onToggleAutoFollow}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoFollow ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={autoFollow}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoFollow ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons: Retry GPS & Demo City Picker */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRequestLocation}
                  className="flex-1 py-1.5 px-3 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-request GPS
                </button>

                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setShowDemoMenu(!showDemoMenu)}
                    className="w-full py-1.5 px-3 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">Demo Cities</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>

                  {showDemoMenu && (
                    <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                        Select Demo Location
                      </div>
                      {DEMO_LOCATIONS.map((demo) => (
                        <button
                          key={demo.name}
                          type="button"
                          onClick={() => {
                            onSelectDemoLocation(demo);
                            setShowDemoMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between"
                        >
                          <span className="font-medium">{demo.name}</span>
                          <span className="text-[10px] text-slate-400">{demo.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
