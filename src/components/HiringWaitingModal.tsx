import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Seeker, Gig } from '../types/navigation';

interface HiringWaitingModalProps {
  seeker: Seeker;
  gig: Gig;
  attempt: number;
  onAccepted: (seeker: Seeker, gig: Gig) => void;
  onCancel: () => void;
}

export const HiringWaitingModal: React.FC<HiringWaitingModalProps> = ({
  seeker,
  gig,
  attempt,
  onAccepted,
  onCancel,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    `Sending offer for "${gig.title}" (Attempt ${attempt}/4)...`
  );
  const [isAccepted, setIsAccepted] = useState<boolean>(false);

  useEffect(() => {
    // 60 seconds timer
    const duration = 60000;
    const interval = 1000;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);

      if (p >= 100) {
        clearInterval(timer);
        // Simulate potential acceptance here or call parent to check
      } else {
        setStatusMessage(`Waiting for ${seeker.name} to accept (Attempt ${attempt}/4)...`);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [seeker, gig, attempt]);


  // SVG circle circumference for r = 44: 2 * Math.PI * 44 = 276.46
  const circumference = 276.46;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-6 animate-scaleUp">
        {/* Top Cancel button (disabled once accepted) */}
        {!isAccepted && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cancel Offer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Circular Loading Animation Ring */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center pt-2">
          {/* Animated SVG Circle */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-500 ease-out ${
                isAccepted ? 'stroke-emerald-500' : 'stroke-blue-600'
              }`}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Rotating outer spinner ring when waiting */}
          {!isAccepted && (
            <div className="absolute inset-0.5 rounded-full border-4 border-transparent border-t-blue-400 dark:border-t-blue-400/80 animate-spin pointer-events-none" />
          )}

          {/* Center avatar or acceptance icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isAccepted ? (
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl animate-scaleUp">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={seeker.avatar}
                  alt={seeker.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-xl"
                />
                <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            {isAccepted ? 'Offer Accepted!' : 'Awaiting Seeker Acceptance'}
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {isAccepted ? `${seeker.name} Accepted!` : `Hiring ${seeker.name}`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 px-3 min-h-[32px] flex items-center justify-center">
            {statusMessage}
          </p>
        </div>

        {/* Gig pill info */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div className="text-left truncate mr-2">
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {gig.title}
            </div>
            <div className="text-[11px] text-slate-400 truncate">📍 {gig.location}</div>
          </div>
          <span className="font-extrabold text-orange-600 dark:text-orange-400 shrink-0">
            {gig.reward}
          </span>
        </div>

        {/* Footer / Cancel option */}
        {!isAccepted ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-medium transition-colors"
            >
              Cancel hiring request
            </button>
          </div>
        ) : (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
            Directing to GiGs map navigation...
          </div>
        )}
      </div>
    </div>
  );
};
