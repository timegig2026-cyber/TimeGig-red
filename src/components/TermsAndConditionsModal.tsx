import React from 'react';
import { X, ShieldCheck, Check } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  hasAccepted?: boolean;
}

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  hasAccepted,
}: TermsAndConditionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 max-h-[88vh] flex flex-col space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Terms and Conditions & Privacy Policy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please review our terms and community guidelines
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors"
            title="Close terms"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-b border-slate-100 dark:border-slate-800 pb-4">
          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Introduction & Acceptance of Terms</h4>
            <p>
              By creating an account, registering with email and password, or using the GiG Explorer platform,
              you agree to comply with and be legally bound by these Terms and Conditions and our Privacy Policy.
              If you do not agree, you must discontinue the registration process.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. User Account & Authentication</h4>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials, including your email
              address and password. You agree to provide true, accurate, current, and complete information during
              the registration and profile completion process.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. GiG Platform & Casual Labor Conduct</h4>
            <p>
              GiG Explorer connects individuals offering and seeking local casual tasks, services, and neighborhood
              gigs. Users agree to engage in respectful, safe, and lawful interactions. Fraudulent gig postings,
              harassment, or misleading location information are strictly prohibited and will result in account suspension.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">4. Location Services & Map Privacy</h4>
            <p>
              GiG Explorer utilizes mapping services and GPS coordinates to facilitate local matching. Your approximate
              city or suburb is displayed publicly on the map. Precise physical coordinates are only shared for active,
              mutually accepted gig navigation assignments.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">5. Profile Verification & Media Storage</h4>
            <p>
              To maintain community trust and prevent bot accounts, users complete their profile with verified contact
              information, photo/selfie, and optional ID documentation. Profile media is handled with enterprise-grade
              cloud security and local sandboxed storage.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">6. Updates to Terms</h4>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform following any
              revisions constitutes your acceptance of the updated terms.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            Last updated: October 2026
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {hasAccepted ? 'Accepted' : 'Accept Terms'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
