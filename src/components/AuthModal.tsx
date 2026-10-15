import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LogIn,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  googleProvider,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import TermsAndConditionsModal from './TermsAndConditionsModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationComplete: (email: string, userId: string) => void;
  onLoginSuccess: (email: string, userName?: string) => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({
  isOpen,
  onClose,
  onRegistrationComplete,
  onLoginSuccess,
  initialMode = 'register',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Congratulatory state after successful registration
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredUid, setRegisteredUid] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false);
    setErrorMessage(null);
    setIsRegisteredSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const mapAuthError = (errCode: string, defaultMsg: string): string => {
    switch (errCode) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled (the Google popup was closed before completing).';
      case 'auth/cancelled-popup-request':
        return 'Previous popup sign-in request was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup blocked by browser. Please allow popups for this site or use redirect.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for OAuth operations in Firebase. Please add this domain to Authorized Domains in Firebase Console Authentication settings.';
      case 'auth/operation-not-allowed':
        return 'Google Sign-In is not enabled for this Firebase project. Please enable Google provider in Firebase Authentication -> Sign-in method.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using another login provider.';
      case 'auth/user-disabled':
        return 'This user account has been disabled. Please contact support.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please log in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials.';
      default:
        return defaultMsg;
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms and Conditions to create an account.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Auth user creation
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Persist initial user profile in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email || email.trim(),
          termsAccepted: true,
          fullName: '',
          bio: 'Community Explorer & Gig Worker',
          location: '',
          province: '',
          contact: '',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          idDocName: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (firestoreErr) {
        // Fallback or log firestore error
        console.warn('Firestore initial doc write warning:', firestoreErr);
      }

      // 3. Trigger Congratulations State
      setRegisteredEmail(user.email || email.trim());
      setRegisteredUid(user.uid);
      setIsRegisteredSuccess(true);
    } catch (err: any) {
      const msg = mapAuthError(err?.code, err?.message || 'Failed to create account.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login for Registered User
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Retrieve existing profile name if available
      let fetchedName = '';
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          fetchedName = data.fullName || '';
        }
      } catch {
        // Ignore read errors gracefully
      }

      onLoginSuccess(user.email || email.trim(), fetchedName);
      handleClose();
    } catch (err: any) {
      const msg = mapAuthError(err?.code, err?.message || 'Login failed. Please check your credentials.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In helper: popup with redirect fallback, never overwrite existing profile
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        // If popup was blocked or unsupported, fallback to redirect
        if (
          popupErr?.code === 'auth/popup-blocked' ||
          popupErr?.code === 'auth/operation-not-supported-in-this-environment'
        ) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }

      const user = result.user;

      // Check if user profile already exists in Firestore using user.uid (never share or overwrite)
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        // New user: create their own profile using Firebase UID
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email || '',
          termsAccepted: true,
          fullName: user.displayName || '',
          bio: 'Community Explorer & Gig Worker',
          location: '',
          province: '',
          contact: '',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          idDocName: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setRegisteredEmail(user.email || '');
        setRegisteredUid(user.uid);
        setIsRegisteredSuccess(true);
      } else {
        // Existing user: preserve their profile, do not overwrite
        const existingData = snap.data();
        onLoginSuccess(user.email || '', existingData?.fullName || user.displayName || '');
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(mapAuthError(err?.code, err?.message || 'Google authentication failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToProfile = () => {
    const targetEmail = registeredEmail;
    const targetUid = registeredUid;
    handleClose();
    onRegistrationComplete(targetEmail, targetUid);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-7 overflow-hidden animate-scaleUp">
          
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ================= STAGE 1: CONGRATULATIONS SCREEN (Post-Signup) ================= */}
          {isRegisteredSuccess ? (
            <div className="py-4 text-center space-y-5 animate-fadeIn">
              {/* Celebratory Icon & Animation */}
              <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-emerald-500 animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Account Created Successfully
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  🎉 Congratulations!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Welcome to <span className="font-semibold text-blue-600 dark:text-blue-400">GiGs & Explorer</span>!
                  Your account has been registered with <span className="font-medium text-slate-900 dark:text-white">{registeredEmail}</span>.
                </p>
              </div>

              {/* Informative next-step card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-left space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Next Step: Complete Your Profile
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Add your photo selfie, contact phone number, and location so seekers and gig posters can connect with you safely.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleProceedToProfile}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Complete Your Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ================= STAGE 2: LOGIN / REGISTER FORMS ================= */
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                  {mode === 'register' ? (
                    <UserCheck className="w-5 h-5" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {mode === 'register' ? 'Create an Account' : 'Welcome Back'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'register'
                      ? 'Sign up with email to start exploring & posting gigs'
                      : 'Log in with your details to access your account'}
                  </p>
                </div>
              </div>

              {/* Segmented Mode Toggle Tabs */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    mode === 'register'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  New User? Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Registered? Log In
                </button>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Main Auth Form */}
              <form
                onSubmit={mode === 'register' ? handleRegister : handleLogin}
                className="space-y-3.5"
              >
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {mode === 'register' && (
                      <span className="text-[10px] text-slate-400">Min. 6 characters</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-2.5 pl-9 pr-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Register mode only) */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Terms and Conditions Checkbox (Register mode only) */}
                {mode === 'register' && (
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-[11px] leading-tight">
                        I accept the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsTermsModalOpen(true);
                          }}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Terms and Conditions
                        </button>{' '}
                        and Privacy Policy
                      </span>
                    </label>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || (mode === 'register' && !termsAccepted)}
                  className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : mode === 'register' ? (
                    <>
                      <span>Sign Up & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Log In to Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Alternative Divider & Google Sign-In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-900 px-2">
                  Or
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Bottom switcher helper */}
              <div className="text-center pt-2">
                {mode === 'register' ? (
                  <p className="text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                      }}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Log in here
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage(null);
                      }}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Register now
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        hasAccepted={termsAccepted}
        onAccept={() => setTermsAccepted(true)}
      />
    </>
  );
}
