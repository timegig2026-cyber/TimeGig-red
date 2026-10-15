import { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { Coordinates } from '../types/map';
import { formatCoordinates, reverseGeocode } from '../utils/geo';

interface AddWaypointModalProps {
  coords: Coordinates | null;
  onClose: () => void;
  onSave: (name: string, notes: string, color: string) => void;
}

const PIN_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export default function AddWaypointModal({ coords, onClose, onSave }: AddWaypointModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(PIN_COLORS[0]);
  const [address, setAddress] = useState<string>('Resolving address...');

  useEffect(() => {
    if (!coords) return;
    let isCurrent = true;

    reverseGeocode(coords.lat, coords.lng).then((res) => {
      if (isCurrent) {
        setAddress(res.address);
        setName(res.address.split(',')[0] || 'Waypoint');
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [coords]);

  if (!coords) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim() || 'Custom Pin', notes.trim(), color);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Save Waypoint Pin
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pin Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Favorite cafe, Meeting spot, Basecamp"
              required
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Address / Location
            </label>
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
              {address}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Coordinates
            </label>
            <div className="font-mono text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 tabular-nums">
              {formatCoordinates(coords, 5)}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Marker Color
            </label>
            <div className="flex items-center gap-2">
              {PIN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add brief description or reminders..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              Save Pin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
