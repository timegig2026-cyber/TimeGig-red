import React from 'react';
import { X, HelpCircle, MapPin, Users, Briefcase, User, Zap, Shield, LayoutDashboard } from 'lucide-react';

interface AppHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export default function AppHelpModal({ isOpen, onClose, feature = 'general' }: AppHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl rounded-3xl p-6 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">App Guide & Help</h3>
              <p className="text-xs text-slate-500">Learn how to use TimeGig features</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 dark:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Map & Navigation</span>
            </div>
            <p className="leading-relaxed">
              Explore casual labor seekers and gigs around your location. Click any marker to view details, distance, and initiate route navigation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Seekers & Gigs List</span>
            </div>
            <p className="leading-relaxed">
              Browse available task workers or posted casual gigs. Apply for tasks or hire qualified seekers instantly with secure verification.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <User className="w-4 h-4 text-purple-500" />
              <span>Profile & Verification</span>
            </div>
            <p className="leading-relaxed">
              Upload your profile selfie and government ID document. Verified profiles unlock full access to tenant and subscription activations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Activation & Membership</span>
            </div>
            <p className="leading-relaxed">
              Click the <strong>Activate</strong> button in the bottom menu to choose between becoming a <strong>Tenant</strong> (earn passive income) or purchasing a <strong>User Subscription</strong> (30-day active timer).
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all text-xs md:text-sm"
        >
          Got it, let's explore!
        </button>
      </div>
    </div>
  );
}
