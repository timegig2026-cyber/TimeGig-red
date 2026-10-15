import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Layers, Ruler, Bookmark, Info, X, Navigation } from 'lucide-react';
import { Coordinates, SearchResult, TileLayerConfig } from '../types/map';
import { searchNominatim } from '../utils/geo';

interface TopBarProps {
  activeLayer: TileLayerConfig;
  onLayerChangeClick: () => void;
  onSelectSearchResult: (result: SearchResult) => void;
  onToggleWaypointsDrawer: () => void;
  waypointsCount: number;
  measuringMode: boolean;
  onToggleMeasuring: () => void;
  onOpenGuide: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

export default function TopBar({
  activeLayer,
  onLayerChangeClick,
  onSelectSearchResult,
  onToggleWaypointsDrawer,
  waypointsCount,
  measuringMode,
  onToggleMeasuring,
  onOpenGuide,
  onLocateMe,
  isLocating,
}: TopBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search via Nominatim (Free, no API key)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const data = await searchNominatim(query);
      setResults(data);
      setIsLoading(false);
      setShowDropdown(true);
      setSelectedIndex(-1);
    }, 380);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResult) => {
    onSelectSearchResult(item);
    setQuery(item.display_name.split(',')[0]);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <header className="absolute top-3 inset-x-3 md:inset-x-6 z-30 pointer-events-none">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Zone 1: Brand Wordmark */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white shrink-0">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Navigation className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-semibold text-sm tracking-tight whitespace-nowrap">
            OpenStreetMap Explorer
          </span>
        </div>

        {/* Zone 2: Search Input with Autocomplete */}
        <div
          ref={searchContainerRef}
          className="pointer-events-auto flex-1 max-w-md relative"
        >
          <div className="relative flex items-center shadow-md rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search places, addresses, cities worldwide..."
              className="w-full py-2 px-2.5 text-xs md:text-sm bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setShowDropdown(false);
                }}
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isLoading && (
              <div className="mr-3 w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full mt-1.5 inset-x-0 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-1.5 overflow-hidden z-40 max-h-72 overflow-y-auto">
              <div className="px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                OpenStreetMap Search Results
              </div>
              {results.map((item, idx) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors ${
                    selectedIndex === idx
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
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

        {/* Zone 3: Actions & Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
          {/* Layer Selector Button */}
          <button
            type="button"
            onClick={onLayerChangeClick}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Change Map Style"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline whitespace-nowrap">{activeLayer.name.split(' ')[0]}</span>
          </button>

          {/* Measure Tool Button */}
          <button
            type="button"
            onClick={onToggleMeasuring}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl backdrop-blur-md shadow-md border transition-colors ${
              measuringMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={measuringMode ? 'Exit Ruler Tool' : 'Measure Distance Tool'}
          >
            <Ruler className="w-4 h-4" />
            <span className="hidden md:inline whitespace-nowrap">Measure</span>
          </button>

          {/* Waypoints Drawer Toggle */}
          <button
            type="button"
            onClick={onToggleWaypointsDrawer}
            className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Saved Waypoints"
          >
            <Bookmark className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline whitespace-nowrap">Pins</span>
            {waypointsCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white tabular-nums">
                {waypointsCount}
              </span>
            )}
          </button>

          {/* Template Info Guide Button */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="OpenStreetMap Template Guide"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Locate Me Primary Action */}
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
            title="Center on My Location"
          >
            <Navigation className={`w-3.5 h-3.5 fill-current ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>
      </div>
    </header>
  );
}
