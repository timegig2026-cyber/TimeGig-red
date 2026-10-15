import React, { useState } from 'react';
import { X, Flame, MapPin, Check, Briefcase } from 'lucide-react';
import { Seeker, Gig } from '../types/navigation';

interface SelectGigToHireModalProps {
  seeker: Seeker;
  gigs: Gig[];
  onClose: () => void;
  onConfirmHire: (seeker: Seeker, gig: Gig) => void;
}

export const SelectGigToHireModal: React.FC<SelectGigToHireModalProps> = ({
  seeker,
  gigs,
  onClose,
  onConfirmHire,
}) => {
  const [selectedGigId, setSelectedGigId] = useState<string>(gigs[0]?.id || '');

  const selectedGig = gigs.find((g) => g.id === selectedGigId) || gigs[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={seeker.avatar}
                alt={seeker.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Hire {seeker.name}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{seeker.role}</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Ready to hire
                </span>
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

        {/* Gig Selection Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Select a GiG for {seeker.name}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Choose which active gig offer to send. Once accepted, live navigation will guide{' '}
            {seeker.name} from their exact location to the gig destination.
          </p>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {gigs.map((gig) => {
              const isSelected = gig.id === selectedGigId;
              return (
                <div
                  key={gig.id}
                  onClick={() => setSelectedGigId(gig.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        {gig.category}
                      </span>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {gig.reward}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {gig.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{gig.location}</span>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Details */}
        {selectedGig && (
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Total Offer Reward
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Payment released upon owner completion
                </div>
              </div>
            </div>
            <div className="text-base font-extrabold text-orange-600 dark:text-orange-400">
              {selectedGig.reward}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedGig}
            onClick={() => {
              if (selectedGig) {
                onConfirmHire(seeker, selectedGig);
              }
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Briefcase className="w-4 h-4" />
            <span>Send GiG Offer to {seeker.name.split(' ')[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
