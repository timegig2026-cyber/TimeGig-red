import { Coordinates, TileLayerConfig } from '../types/map';
import { formatCoordinates } from '../utils/geo';

interface BottomStatusHudProps {
  cursorCoords: Coordinates | null;
  mapStats: { zoom: number; center: Coordinates };
  activeLayer: TileLayerConfig;
}

export default function BottomStatusHud({
  cursorCoords,
  mapStats,
  activeLayer,
}: BottomStatusHudProps) {
  const displayCoords = cursorCoords || mapStats.center;

  return (
    <footer className="absolute bottom-2 inset-x-3 md:inset-x-6 z-10 pointer-events-none flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 select-none">
      {/* Coordinates & Zoom HUD */}
      <div className="pointer-events-auto hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-lg bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-sm font-mono tabular-nums">
        <span className="text-slate-800 dark:text-slate-200 font-medium">
          {formatCoordinates(displayCoords, 4)}
        </span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="text-slate-500">Zoom {mapStats.zoom}</span>
      </div>

      {/* Clean OSM Tile Attribution */}
      <div className="pointer-events-auto ml-auto px-2.5 py-1 rounded-lg bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-sm text-[10px] text-slate-500 max-w-[280px] md:max-w-none truncate">
        <span>Map data © </span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          OpenStreetMap contributors
        </a>
        <span className="hidden md:inline"> · Zero API Cost</span>
      </div>
    </footer>
  );
}
