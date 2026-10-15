import { Ruler, Trash2, X, RotateCcw } from 'lucide-react';
import { Coordinates } from '../types/map';
import { calculateDistance, formatDistance } from '../utils/geo';

interface MeasureBarProps {
  points: Coordinates[];
  onClear: () => void;
  onUndo: () => void;
  onClose: () => void;
}

export default function MeasureBar({ points, onClear, onUndo, onClose }: MeasureBarProps) {
  // Calculate total cumulative distance
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(points[i], points[i + 1]);
  }

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 pointer-events-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-amber-300 dark:border-amber-700/60 p-3.5 flex items-center justify-between gap-3 text-slate-900 dark:text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Ruler className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Measurement Ruler</span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                {points.length > 1 ? formatDistance(totalDistance) : '0 m'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {points.length === 0
                ? 'Click anywhere on map to add 1st point'
                : `${points.length} point${points.length === 1 ? '' : 's'} placed · Click to extend path`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {points.length > 0 && (
            <>
              <button
                type="button"
                onClick={onUndo}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Undo last point"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Clear all points"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Exit measurement tool"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
