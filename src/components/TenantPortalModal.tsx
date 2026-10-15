import React, { useState, useEffect } from 'react';
import { X, KeyRound, CheckCircle2, Shield, UserCheck, DollarSign, Sparkles, Info, Users, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface TenantPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  userEmail?: string;
  userName?: string;
  onOpenAuthModal?: () => void;
}

type SubscriptionOption = 'tenant' | 'subscription' | null;

const MAX_TENANTS = 10;
const MAX_SUBSCRIPTIONS = 50;

export default function TenantPortalModal({
  isOpen,
  onClose,
}: TenantPortalModalProps) {
  const [selectedOption, setSelectedOption] = useState<SubscriptionOption>(null);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // Live capacities stored in localStorage
  const [tenantCount, setTenantCount] = useState<number>(8);
  const [subscriptionCount, setSubscriptionCount] = useState<number>(42);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedTenants = localStorage.getItem('timegig_tenant_count');
        const savedSubs = localStorage.getItem('timegig_sub_count');
        if (savedTenants !== null) setTenantCount(parseInt(savedTenants, 10));
        if (savedSubs !== null) setSubscriptionCount(parseInt(savedSubs, 10));
      } catch (err) {
        console.warn('Failed to load counts', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (option: SubscriptionOption) => {
    if (option === 'tenant' && tenantCount >= MAX_TENANTS) return;
    if (option === 'subscription' && subscriptionCount >= MAX_SUBSCRIPTIONS) return;

    setSelectedOption(option);
    setConfirmed(false);
  };

  const handleConfirm = () => {
    if (!selectedOption) return;

    try {
      if (selectedOption === 'tenant' && tenantCount < MAX_TENANTS) {
        const next = tenantCount + 1;
        setTenantCount(next);
        localStorage.setItem('timegig_tenant_count', next.toString());
      } else if (selectedOption === 'subscription' && subscriptionCount < MAX_SUBSCRIPTIONS) {
        const next = subscriptionCount + 1;
        setSubscriptionCount(next);
        localStorage.setItem('timegig_sub_count', next.toString());
      }
      setConfirmed(true);
      soundManager.playSuccessChime('subscription');
    } catch (err) {
      console.warn('Failed to save subscription capacity', err);
      setConfirmed(true);
    }
  };

  const isTenantFull = tenantCount >= MAX_TENANTS;
  const isSubFull = subscriptionCount >= MAX_SUBSCRIPTIONS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 animate-scaleUp max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(16,185,129,0.3)] border border-emerald-400/40">
              <KeyRound className="w-6 h-6 drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Portal Subscriptions</span>
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Limited Capacity Membership Tiers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-2xl transition-all cursor-pointer border ${
                showInfo
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white border-slate-200 dark:border-slate-700'
              }`}
              title="How it works"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* How it Works Informational Banner */}
        {showInfo && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-2 animate-fadeIn shadow-sm">
            <div className="font-extrabold flex items-center gap-1.5 text-blue-700 dark:text-blue-300 text-sm">
              <Info className="w-4 h-4" /> How Tenant Portal Works & Limits
            </div>
            <p className="leading-relaxed">
              To maintain exclusivity and value, capacities are strictly limited:
            </p>
            <ul className="list-disc pl-4 space-y-1 font-medium">
              <li>
                <strong>Become a Tenant (Max {MAX_TENANTS} slots):</strong> Pay R299.99/mo to secure one of only {MAX_TENANTS} exclusive tenant slots and earn passive monthly income.
              </li>
              <li>
                <strong>User Subscription (Max {MAX_SUBSCRIPTIONS} slots):</strong> Open to up to {MAX_SUBSCRIPTIONS} active platform members for full access to app features and gig management.
              </li>
            </ul>
          </div>
        )}

        {/* Options List with White Credit Card Shaped Boxes & Real 4D Look */}
        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>Choose 1 Active Plan</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Users className="w-3.5 h-3.5" /> Strict Quota Limits
            </span>
          </div>

          {/* Option 1: Become a Tenant (Credit Card Shaped Box - White) */}
          <button
            type="button"
            disabled={isTenantFull}
            onClick={() => handleSelect('tenant')}
            className={`w-full text-left p-5 rounded-[24px] transition-all duration-300 relative group flex flex-col justify-between aspect-[1.7/1] sm:aspect-[1.9/1] transform ${
              isTenantFull
                ? 'bg-slate-100 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-800 opacity-70 cursor-not-allowed grayscale'
                : selectedOption === 'tenant'
                ? 'bg-white dark:bg-slate-900 border-4 border-emerald-500 shadow-[0_20px_45px_rgba(16,185,129,0.35)] scale-[1.02] cursor-pointer'
                : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:-translate-y-1 shadow-[0_12px_30px_rgba(0,0,0,0.12)] cursor-pointer'
            }`}
          >
            {/* Specular Highlight line */}
            {!isTenantFull && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent rounded-t-[24px]" />
            )}

            {/* Card Top Row: Chip & Badge */}
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-200 via-yellow-300 to-amber-400 border border-amber-400/60 shadow-inner flex items-center justify-center">
                <div className="w-8 h-6 grid grid-cols-2 gap-0.5 p-0.5 border border-amber-500/40 rounded">
                  <div className="bg-amber-500/30 rounded-xs"></div>
                  <div className="bg-amber-500/30 rounded-xs"></div>
                  <div className="bg-amber-500/30 rounded-xs"></div>
                  <div className="bg-amber-500/30 rounded-xs"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg border uppercase shadow-sm ${
                  isTenantFull
                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/80 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-500/30'
                }`}>
                  {isTenantFull ? 'SOLD OUT (10/10)' : `${tenantCount}/${MAX_TENANTS} Tenants`}
                </span>
                {!isTenantFull && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedOption === 'tenant'
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}>
                    {selectedOption === 'tenant' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                )}
              </div>
            </div>

            {/* Card Middle: Card Number & Details */}
            <div className="my-1 space-y-1">
              <div className="font-mono text-sm sm:text-base tracking-[0.2em] font-extrabold text-slate-800 dark:text-slate-100">
                •••• •••• •••• 2026
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Tier</span>
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Become a Tenant
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Monthly Fee</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">R299.99 / mo</span>
                </div>
              </div>
            </div>

            {/* Card Bottom Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Earn passive monthly income from user fees
              </span>
              <span className={`font-bold px-2 py-0.5 rounded border ${
                isTenantFull
                  ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/60'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/50'
              }`}>
                {isTenantFull ? 'CAPACITY FULL' : `${MAX_TENANTS - tenantCount} Slots Left`}
              </span>
            </div>
          </button>

          {/* Option 2: User Subscription (Credit Card Shaped Box - White) */}
          <button
            type="button"
            disabled={isSubFull}
            onClick={() => handleSelect('subscription')}
            className={`w-full text-left p-5 rounded-[24px] transition-all duration-300 relative group flex flex-col justify-between aspect-[1.7/1] sm:aspect-[1.9/1] transform ${
              isSubFull
                ? 'bg-slate-100 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-800 opacity-70 cursor-not-allowed grayscale'
                : selectedOption === 'subscription'
                ? 'bg-white dark:bg-slate-900 border-4 border-blue-500 shadow-[0_20px_45px_rgba(59,130,246,0.35)] scale-[1.02] cursor-pointer'
                : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:-translate-y-1 shadow-[0_12px_30px_rgba(0,0,0,0.12)] cursor-pointer'
            }`}
          >
            {/* Specular Highlight line */}
            {!isSubFull && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-t-[24px]" />
            )}

            {/* Card Top Row: Chip & Badge */}
            <div className="flex items-center justify-between w-full">
              <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-200 via-yellow-300 to-amber-400 border border-amber-400/60 shadow-inner flex items-center justify-center">
                <div className="w-8 h-6 grid grid-cols-2 gap-0.5 p-0.5 border border-amber-500/40 rounded">
                  <div className="bg-amber-500/30 rounded-xs"></div>
                  <div className="bg-amber-500/30 rounded-xs"></div>
                  <div className="bg-amber-500/30 rounded-xs"></div>
                  <div className="bg-amber-500/30 rounded-xs"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg border uppercase shadow-sm ${
                  isSubFull
                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/80 dark:text-rose-400'
                    : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-500/30'
                }`}>
                  {isSubFull ? 'SOLD OUT (50/50)' : `${subscriptionCount}/${MAX_SUBSCRIPTIONS} Members`}
                </span>
                {!isSubFull && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedOption === 'subscription'
                      ? 'border-blue-500 bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}>
                    {selectedOption === 'subscription' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                )}
              </div>
            </div>

            {/* Card Middle: Card Number & Details */}
            <div className="my-1 space-y-1">
              <div className="font-mono text-sm sm:text-base tracking-[0.2em] font-extrabold text-slate-800 dark:text-slate-100">
                •••• •••• •••• 2027
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Tier</span>
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600" /> User Subscription
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Access</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">Full App Access</span>
                </div>
              </div>
            </div>

            {/* Card Bottom Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-500" /> Use app features & pay monthly fee to keep account active
              </span>
              <span className={`font-bold px-2 py-0.5 rounded border ${
                isSubFull
                  ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/60'
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/50'
              }`}>
                {isSubFull ? 'CAPACITY FULL' : `${MAX_SUBSCRIPTIONS - subscriptionCount} Slots Left`}
              </span>
            </div>
          </button>
        </div>

        {confirmed && (
          <div className="relative z-10 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center shadow-md animate-fadeIn">
            🎉 Successfully activated <strong>{selectedOption === 'tenant' ? 'Become a Tenant (R299.99/mo)' : 'User Subscription'}</strong>! ({selectedOption === 'tenant' ? `${tenantCount}/${MAX_TENANTS}` : `${subscriptionCount}/${MAX_SUBSCRIPTIONS}`} slots filled)
          </div>
        )}

        {/* Footer Actions */}
        <div className="relative z-10 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedOption}
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-xs font-black rounded-2xl shadow-xl transition-all cursor-pointer transform active:scale-95 ${
              selectedOption
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-[0_10px_25px_rgba(16,185,129,0.3)] border border-emerald-500/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
            }`}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
