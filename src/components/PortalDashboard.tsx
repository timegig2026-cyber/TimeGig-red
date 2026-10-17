import React, { useState, useEffect } from 'react';
import { X, LayoutDashboard, ShieldCheck, Building2, FileCheck, CheckCircle2 } from 'lucide-react';
import { db, collection, query, where, onSnapshot, updateDoc, doc } from '../firebase';
import { soundManager } from '../utils/sound';

interface PortalDashboardProps {
  onClose: () => void;
  userEmail: string;
  activationOption?: 'tenant' | 'subscription' | null;
  activationDate?: number;
}

export default function PortalDashboard({ onClose, userEmail, activationOption, activationDate }: PortalDashboardProps) {
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'verification' | 'tenant_pop' | 'user_pop'>('overview');
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const showLocalFeedback = (msg: string) => {
    setToastFeedback(msg);
    soundManager.playSuccessChime('profile');
    setTimeout(() => setToastFeedback(null), 3500);
  };

  useEffect(() => {
    if (userEmail) {
      const q = query(
        collection(db, 'users'),
        where('referredBy', '==', userEmail)
      );
      let isFirstSnapshot = true;
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users: any[] = [];
        snapshot.docChanges().forEach((change) => {
          if (!isFirstSnapshot && change.type === 'added') {
            soundManager.playSuccessChime('signup');
          }
        });
        isFirstSnapshot = false;
        snapshot.forEach((docSnap) => {
          users.push({ id: docSnap.id, ...docSnap.data() });
        });
        setReferredUsers(users);
      });
      return () => unsubscribe();
    }
  }, [userEmail]);

  const tenantCount = referredUsers.filter(u => u.activationOption === 'tenant').length;
  const subscriptionCount = referredUsers.filter(u => u.activationOption === 'subscription').length;
  const daysRemaining = activationDate && activationDate > 0
    ? Math.max(0, 30 - Math.floor((Date.now() - activationDate) / (24 * 60 * 60 * 1000)))
    : 30;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-fadeIn">
      {toastFeedback && (
        <div className="absolute top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2 rounded-xl shadow-xl">
          {toastFeedback}
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Tenant Portal Dashboard</h2>
            <p className="text-xs text-slate-500">Manage referrals, verifications, and proofs of payment</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 dark:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {dashboardTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto w-full">
            {activationOption === 'subscription' && (
              <div className="p-5 rounded-3xl bg-blue-600 text-white shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold text-blue-200">User Subscription Status</p>
                  <p className="text-2xl font-black mt-1">{daysRemaining} Days Remaining</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-xl">
                  {daysRemaining}d
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400">Active Tenants</p>
                <p className="text-3xl font-black text-emerald-900 dark:text-white mt-1">{tenantCount}</p>
              </div>
              <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400">Active Subscriptions</p>
                <p className="text-3xl font-black text-blue-900 dark:text-white mt-1">{subscriptionCount}</p>
              </div>
              <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400">Tenant Profit</p>
                <p className="text-2xl font-black text-emerald-900 dark:text-white mt-1">R{(tenantCount * 299.99).toFixed(2)}</p>
              </div>
              <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400">User Sub Profit</p>
                <p className="text-2xl font-black text-blue-900 dark:text-white mt-1">R{(subscriptionCount * 99.99).toFixed(2)}</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
              <p className="text-xs uppercase font-bold text-slate-500 mb-2">Your Referral Link</p>
              <code className="text-xs font-mono break-all text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 block">
                {`${window.location.protocol}//${window.location.host}/?ref=${userEmail || 'unknown'}`}
              </code>
            </div>
          </div>
        )}

        {dashboardTab === 'verification' && (
          <div className="space-y-4 animate-fadeIn max-w-2xl mx-auto w-full">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Referred Users Verification</h3>
            {referredUsers.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-12">No users have joined through your referral link yet.</p>
            ) : (
              referredUsers.map(user => (
                <div key={user.id} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.fullName || 'Unnamed User'}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.verificationStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          user.verificationStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {user.verificationStatus || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          await updateDoc(doc(db, 'users', user.id), { verificationStatus: 'approved' });
                          showLocalFeedback('User approved successfully.');
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
                      >Approve</button>
                      <button 
                        onClick={async () => {
                          await updateDoc(doc(db, 'users', user.id), { verificationStatus: 'rejected' });
                          showLocalFeedback('User rejected.');
                        }}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all"
                      >Reject</button>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Selfie</p>
                      <img src={user.avatar} alt="Selfie" className="w-full h-32 object-cover rounded-xl border" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">ID Document</p>
                      <div className="w-full h-32 rounded-xl bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden border">
                        {user.idDocName && user.idDocName.startsWith('data:') ? (
                          <img src={user.idDocName} alt="ID Doc" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500 text-center p-2">{user.idDocName || 'No ID uploaded'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {dashboardTab === 'tenant_pop' && (
          <div className="space-y-4 animate-fadeIn max-w-2xl mx-auto w-full">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Tenant Proof of Payment</h3>
            {referredUsers.filter(u => u.activationOption === 'tenant').length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-12">No tenant activation proofs submitted.</p>
            ) : (
              referredUsers.filter(u => u.activationOption === 'tenant').map(user => (
                <div key={user.id} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300">Tenant POP Document / Receipt</p>
                    {user.paymentProofUrl ? (
                      <img src={user.paymentProofUrl} alt="Tenant PoP" className="w-full h-48 object-cover rounded-xl" />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        Simulated Tenant Proof of Payment Active
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {dashboardTab === 'user_pop' && (
          <div className="space-y-4 animate-fadeIn max-w-2xl mx-auto w-full">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">User Subscription Proof of Payment</h3>
            {referredUsers.filter(u => u.activationOption === 'subscription').length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-12">No user subscription proofs submitted.</p>
            ) : (
              referredUsers.filter(u => u.activationOption === 'subscription').map(user => (
                <div key={user.id} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300">User Subscription POP Receipt</p>
                    {user.paymentProofUrl ? (
                      <img src={user.paymentProofUrl} alt="User PoP" className="w-full h-48 object-cover rounded-xl" />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        Simulated User Subscription Proof of Payment Active
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Menu Bar */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-4 gap-1.5 max-w-sm mx-auto">
          <button 
            type="button" 
            onClick={() => setDashboardTab('overview')} 
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${dashboardTab === 'overview' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[9.5px]">Overview</span>
          </button>

          <button 
            type="button" 
            onClick={() => setDashboardTab('verification')} 
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${dashboardTab === 'verification' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9.5px]">Verification</span>
          </button>

          <button 
            type="button" 
            onClick={() => setDashboardTab('tenant_pop')} 
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${dashboardTab === 'tenant_pop' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[9.5px]">Tenant PoP</span>
          </button>

          <button 
            type="button" 
            onClick={() => setDashboardTab('user_pop')} 
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${dashboardTab === 'user_pop' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <FileCheck className="w-4 h-4" />
            <span className="text-[9.5px]">User PoP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
