import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, UserCheck, Shield, Zap } from 'lucide-react';
import { db, doc, updateDoc } from '../firebase';
import { getMediaItem } from '../utils/storage';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  userId: string;
  onActivate: () => void;
}

export default function ActivationModal({ isOpen, onClose, profile, userId, onActivate }: ActivationModalProps) {
  const [selectedOption, setSelectedOption] = useState<'tenant' | 'subscription' | null>(null);
  const [showSubmission, setShowSubmission] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<'idle' | 'activating' | 'success'>('idle');
  const [idDocData, setIdDocData] = useState<string>('');

  useEffect(() => {
    if (isOpen && userId) {
      getMediaItem(`iddoc_${userId}`).then((res) => {
        if (res) setIdDocData(res);
        else if (profile?.idDocName) setIdDocData(profile.idDocName);
      });
    } else if (profile?.idDocName) {
      setIdDocData(profile.idDocName);
    }
  }, [isOpen, userId, profile]);

  const activeIdDoc = idDocData || profile?.idDocName;
  const hasDocuments = profile && profile.avatar && activeIdDoc;

  const handleActivate = async () => {
    if (!selectedOption || !userId) return;
    setStatus('activating');
    try {
      await updateDoc(doc(db, 'users', userId), {
        activationOption: selectedOption,
        activationDate: Date.now(),
      });
      setStatus('success');
      setTimeout(() => {
        onActivate();
        onClose();
        setStatus('idle');
        setSelectedOption(null);
        setShowSubmission(false);
        setAcceptedTerms(false);
      }, 2500);
    } catch (error) {
      console.error('Error activating:', error);
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
        <div className="text-center space-y-4 animate-bounce">
          <div className="mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Activation Complete!</h2>
          <p className="text-emerald-200">Welcome to your new membership tier.</p>
        </div>
      </div>
    );
  }

  if (showSubmission && selectedOption) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full h-full max-h-[80vh] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl p-6 flex flex-col space-y-6">
          <button onClick={() => setShowSubmission(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 dark:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mt-6">Confirm {selectedOption === 'tenant' ? 'Tenant' : 'Subscription'} Submission</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">Selfie</p>
              <img src={profile.avatar} alt="Selfie" className="w-full aspect-square object-cover rounded-2xl" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">ID Document</p>
              <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs text-center p-2 break-all overflow-hidden">
                {activeIdDoc && activeIdDoc.startsWith('data:') ? (
                  <img src={activeIdDoc} alt="ID Document" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  activeIdDoc || 'No ID Document'
                )}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">I accept the terms and conditions for this activation.</span>
          </label>
          <button
            disabled={!acceptedTerms || status === 'activating'}
            onClick={handleActivate}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl disabled:opacity-50"
          >
            {status === 'activating' ? 'Submitting...' : 'Submit Activation'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full h-full max-h-[80vh] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl p-6 flex flex-col space-y-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 dark:bg-slate-800">
          <X className="w-5 h-5" />
        </button>

        {!hasDocuments && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold border border-rose-200 dark:border-rose-900 mt-6">
            Please complete your profile by uploading a selfie and your ID document to proceed with activation.
          </div>
        )}

        <div className="grid gap-4 flex-1 mt-6">
          {/* Become a Tenant */}
          <button
            disabled={!hasDocuments || status === 'activating'}
            onClick={() => setSelectedOption('tenant')}
            className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 transform ${
              selectedOption === 'tenant'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-[0_10px_25px_rgba(16,185,129,0.2)] scale-[1.02]'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
            } ${!hasDocuments ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 rounded-2xl ${selectedOption === 'tenant' ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <UserCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Become a Tenant</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Earn passive monthly income.
            </p>
          </button>

          {/* User Subscription */}
          <button
            disabled={!hasDocuments || status === 'activating'}
            onClick={() => setSelectedOption('subscription')}
            className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 transform ${
              selectedOption === 'subscription'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-[0_10px_25px_rgba(59,130,246,0.2)] scale-[1.02]'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
            } ${!hasDocuments ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 rounded-2xl ${selectedOption === 'subscription' ? 'bg-blue-100 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">User Subscription</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlock full app features.
            </p>
          </button>
        </div>

        <button
          disabled={!selectedOption || !hasDocuments || status === 'activating'}
          onClick={() => setShowSubmission(true)}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl disabled:opacity-50"
        >
          Proceed to Submission
        </button>
      </div>
    </div>
  );
}
