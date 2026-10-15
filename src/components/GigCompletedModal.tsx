import React, { useState } from 'react';
import { CheckCircle2, Award, X, Sparkles } from 'lucide-react';
import { ActiveGigAssignment } from '../types/navigation';

interface GigCompletedModalProps {
  assignment: ActiveGigAssignment;
  onClose: () => void;
  onConfirmComplete: () => void;
}

export const GigCompletedModal: React.FC<GigCompletedModalProps> = ({
  assignment,
  onClose,
  onConfirmComplete,
}) => {
  const [isSuccessState, setIsSuccessState] = useState<boolean>(false);

  const handleConfirm = () => {
    setIsSuccessState(true);
    setTimeout(() => {
      onConfirmComplete();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-5 animate-scaleUp">
        {!isSuccessState && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isSuccessState ? (
          /* Celebratory Success State */
          <div className="py-4 space-y-4 animate-scaleUp">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                GiG Successfully Completed!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Reward of <strong className="text-emerald-600 dark:text-emerald-400">{assignment.gigReward}</strong> has been released to {assignment.seekerName}.
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Navigation completed · Returning to map
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <>
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Gig Owner Verification
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Mark GiG as Completed?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                As the gig owner, please confirm that <strong>{assignment.seekerName}</strong> has
                arrived at <strong>{assignment.gigLocation}</strong> and completed &quot;{assignment.gigTitle}&quot;.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Release Reward
                </span>
              </div>
              <span className="font-extrabold text-orange-600 dark:text-orange-400 text-sm">
                {assignment.gigReward}
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Not Yet
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Completed</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
