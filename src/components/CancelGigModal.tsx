import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { ActiveGigAssignment } from '../types/navigation';

interface CancelGigModalProps {
  assignment: ActiveGigAssignment;
  currentRole: 'owner' | 'seeker';
  onClose: () => void;
  onConfirmCancel: (cancelledBy: 'owner' | 'seeker', reason: string) => void;
}

const PRESET_REASONS = [
  'Emergency occurred',
  'Cannot reach location in time due to transport delay',
  'Required equipment or tools unavailable',
  'Weather conditions unsuitable for work',
  'Job scope or instructions changed',
  'Agreed mutually to reschedule or cancel',
];

export const CancelGigModal: React.FC<CancelGigModalProps> = ({
  assignment,
  currentRole,
  onClose,
  onConfirmCancel,
}) => {
  const [cancellingRole, setCancellingRole] = useState<'owner' | 'seeker'>(currentRole);
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 5) {
      setErrorMsg('Please provide a specific reason for cancelling (at least 5 characters).');
      return;
    }
    onConfirmCancel(cancellingRole, trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cancel GiG Assignment
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Both parties can cancel, but a reason is required
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gig Info Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
          <div className="font-bold text-slate-900 dark:text-white">
            {assignment.gigTitle} ({assignment.gigReward})
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Assigned to Seeker: <span className="font-semibold text-blue-600 dark:text-blue-400">{assignment.seekerName}</span> · Owner: <span className="font-semibold">{assignment.gigOwnerName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Who is cancelling */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Who is initiating this cancellation?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCancellingRole('owner')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  cancellingRole === 'owner'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>Gig Owner</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {assignment.gigOwnerName}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCancellingRole('seeker')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  cancellingRole === 'seeker'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>Seeker</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {assignment.seekerName}
                </div>
              </button>
            </div>
          </div>

          {/* Quick preset reason chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select or type reason for cancellation (Required)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setErrorMsg(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    reason === preset
                      ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim().length >= 5) setErrorMsg(null);
              }}
              placeholder="State the reason clearly so the other party is informed..."
              className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Notice */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
            ⚠️ This cancellation reason will be immediately transmitted and displayed to the other
            party. Navigation will stop immediately.
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Keep GiG Active
            </button>
            <button
              type="submit"
              disabled={reason.trim().length < 5}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm &amp; Send Cancellation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
