import React from 'react';
import { X, Settings } from 'lucide-react';
import {
  FontStyleKey,
  FontSizeKey,
} from '../types/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontStyle?: FontStyleKey;
  onChangeFontStyle?: (style: FontStyleKey) => void;
  fontSize?: FontSizeKey;
  onChangeFontSize?: (size: FontSizeKey) => void;
  onResetTypography?: () => void;
  isLoggedIn?: boolean;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  onLogout?: () => void;
  onOpenLogin?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  isLoggedIn,
  userEmail,
  userName,
  onLogout,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-7 space-y-6 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1">
            <Settings className="w-7 h-7" />
          </div>
          {isLoggedIn ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{userName || 'Active User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Log Out
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">Settings configured and active</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
