import { useState, useEffect } from 'react';
import { Plus, Minus, Navigation, Maximize2, Minimize2, Compass, Ruler } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe: () => void;
  onResetNorth: () => void;
  isLocating: boolean;
  measuringMode: boolean;
  onToggleMeasuring: () => void;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onLocateMe,
  onResetNorth,
  isLocating,
  measuringMode,
  onToggleMeasuring,
}: MapControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error enabling fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="absolute right-3 md:right-6 bottom-24 md:bottom-20 z-20 flex flex-col gap-2 select-none">
      {/* Zoom Controls */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={onZoomIn}
          className="p-3 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200/60 dark:bg-slate-800" />
        <button
          type="button"
          onClick={onZoomOut}
          className="p-3 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Locate Me Floating Button */}
      <button
        type="button"
        onClick={onLocateMe}
        className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        title="Find My Location"
        aria-label="Find My Location"
      >
        <Navigation className={`w-4 h-4 fill-current ${isLocating ? 'animate-spin' : ''}`} />
      </button>

      {/* Measure Tool Floating Button */}
      <button
        type="button"
        onClick={onToggleMeasuring}
        className={`p-3 rounded-2xl backdrop-blur-md shadow-xl border transition-all hover:scale-105 active:scale-95 ${
          measuringMode
            ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/30'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={measuringMode ? 'Exit Distance Ruler' : 'Measure Distance'}
        aria-label="Measure Distance"
      >
        <Ruler className="w-4 h-4" />
      </button>

      {/* Reset Compass / North */}
      <button
        type="button"
        onClick={onResetNorth}
        className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        title="Reset North Orientation"
        aria-label="Reset North"
      >
        <Compass className="w-4 h-4" />
      </button>

      {/* Fullscreen Toggle */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
