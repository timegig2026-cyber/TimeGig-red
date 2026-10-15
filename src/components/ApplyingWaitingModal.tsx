import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Gig } from '../types/navigation';

interface ApplyingWaitingModalProps {
  gig: Gig;
  onClose: () => void;
}

export const ApplyingWaitingModal: React.FC<ApplyingWaitingModalProps> = ({
  gig,
  onClose,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    `Submitting application for "${gig.title}"...`
  );

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
        onClose(); // Automatically close after 60s
      } else {
        setStatusMessage(`Application submitted for "${gig.title}". Waiting for owner to accept...`);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [gig, onClose]);

  // SVG circle circumference for r = 44: 2 * Math.PI * 44 = 276.46
  const circumference = 276.46;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-6 animate-scaleUp">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative w-36 h-36 mx-auto flex items-center justify-center pt-2">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-orange-500 transition-all duration-500 ease-out"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Application Sent</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{statusMessage}</p>
        </div>
      </div>
    </div>
  );
};
