import React, { useState } from 'react';
import {
  Navigation2,
  CheckCircle2,
  XCircle,
  Lock,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ActiveGigAssignment } from '../types/navigation';
import { formatDistance } from '../utils/geo';
import { formatDuration } from '../utils/navigation';

interface NavigationHudProps {
  assignment: ActiveGigAssignment;
  actingRole: 'owner' | 'seeker';
  onChangeActingRole: (role: 'owner' | 'seeker') => void;
  onRequestComplete: () => void;
  onRequestCancel: () => void;
  onFocusRoute: () => void;
}

export const NavigationHud: React.FC<NavigationHudProps> = ({
  assignment,
  actingRole,
  onChangeActingRole,
  onRequestComplete,
  onRequestCancel,
  onFocusRoute,
}) => {
  const [deniedTooltip, setDeniedTooltip] = useState<boolean>(false);

  const isOwner = actingRole === 'owner';

  const handleCompleteClick = () => {
    if (!isOwner) {
      setDeniedTooltip(true);
      setTimeout(() => setDeniedTooltip(false), 3000);
      return;
    }
    onRequestComplete();
  };

  return (
    <div className="absolute bottom-20 inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[580px] z-30 animate-slideUp">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 md:p-5 space-y-4">
        {/* Top bar: Live navigation status + role switcher */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live GiG Navigation
            </span>
            <button
              type="button"
              onClick={onFocusRoute}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold ml-1"
              title="Center view on route"
            >
              <Navigation2 className="w-3 h-3" /> Center
            </button>
          </div>

          {/* Role switcher toggle (enables verifying that only owner can complete gig) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px]">
            <span className="text-slate-400 px-1 font-medium hidden sm:inline">Role:</span>
            <button
              type="button"
              onClick={() => onChangeActingRole('owner')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                isOwner
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Gig Owner
            </button>
            <button
              type="button"
              onClick={() => onChangeActingRole('seeker')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                !isOwner
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Seeker
            </button>
          </div>
        </div>

        {/* Middle: Seeker en route to destination */}
        <div className="flex items-center justify-between gap-3">
          {/* Seeker side */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={assignment.seekerAvatar}
                alt={assignment.seekerName}
                className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {assignment.seekerName}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <Navigation2 className="w-3 h-3 shrink-0" />
                <span className="truncate">Navigating to destination</span>
              </div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />

          {/* Gig destination side */}
          <div className="text-right min-w-0">
            <div className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
              {assignment.gigReward}
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {assignment.gigTitle}
            </div>
            <div className="text-[11px] text-slate-400 truncate flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{assignment.gigLocation}</span>
            </div>
          </div>
        </div>

        {/* Telemetry info row */}
        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>ETA: {formatDuration(assignment.durationSeconds)}</span>
          </div>
          <div className="text-slate-300 dark:text-slate-600">·</div>
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            Distance: {formatDistance(assignment.routeDistanceMeters)}
          </div>
          <div className="text-slate-300 dark:text-slate-600">·</div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
            En Route ✓
          </div>
        </div>

        {/* Permission Denied Tooltip / Notice for Seeker trying to complete */}
        {deniedTooltip && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Permission Denied: Only the gig owner ({assignment.gigOwnerName}) can click on
              &quot;GiG Completed&quot;.
            </span>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Cancel button: Available to BOTH seeker and gig owner */}
          <button
            type="button"
            onClick={onRequestCancel}
            className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel GiG</span>
          </button>

          {/* Completed button: Strictly ONLY for gig owner */}
          {isOwner ? (
            <button
              type="button"
              onClick={handleCompleteClick}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>GiG Completed</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteClick}
              className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
              title="Only gig owner can click on gig completed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>GiG Completed (Owner Only)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
