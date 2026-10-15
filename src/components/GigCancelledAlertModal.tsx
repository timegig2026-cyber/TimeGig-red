import React from 'react';
import { XCircle, MessageSquare, Check } from 'lucide-react';
import { CancellationRecord } from '../types/navigation';

interface GigCancelledAlertModalProps {
  cancellation: CancellationRecord;
  onClose: () => void;
}

export const GigCancelledAlertModal: React.FC<GigCancelledAlertModalProps> = ({
  cancellation,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/40 p-6 text-center space-y-5 animate-scaleUp">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
          <XCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            GiG Notice
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            GiG Assignment Cancelled
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This assignment was cancelled by{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {cancellation.cancelledByName} (
              {cancellation.cancelledBy === 'owner' ? 'Gig Owner' : 'Seeker'})
            </strong>
            .
          </p>
        </div>

        {/* Reason card */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 text-left space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reason provided:</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 italic pl-1 leading-relaxed">
            &ldquo;{cancellation.reason}&rdquo;
          </p>
        </div>

        <p className="text-[11px] text-slate-400">
          Navigation route has been cleared and the seeker status is restored to available.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Understood</span>
        </button>
      </div>
    </div>
  );
};
