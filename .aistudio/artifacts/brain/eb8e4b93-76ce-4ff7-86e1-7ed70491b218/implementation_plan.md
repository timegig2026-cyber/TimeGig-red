# Implementation Plan - TimeGiG Account Persistence & Separation Fix

## Objectives
1. **Explicit Firebase Auth Persistence**: Configure `setPersistence` with `browserLocalPersistence` in `src/firebase.ts`.
2. **Eliminate Shared Key Race Conditions**: Remove initialization from the generic `'current_user'` profile key on app boot. Initialize profile state safely with `DEFAULT_PROFILE` and wait for `onAuthStateChanged` to resolve the user's authentic UID before loading from localStorage (`user_profile_<uid>`) or Firestore (`users/<uid>`).
3. **Prevent Accidental Overwrites**: Guard profile save effects so that autosave to localStorage/Firestore only triggers *after* auth has resolved and loading is complete.
4. **Account Separation**: Ensure each account remains strictly tied to its own UID across refreshes, logins, and logouts.

## Affected Code Locations
- **`src/firebase.ts`**:
  - Import `setPersistence`, `browserLocalPersistence`.
  - Configure auth persistence.
- **`src/App.tsx`**:
  - Update `useState` initializers for `profile` and `isProfileLocked` to start with clean defaults (`DEFAULT_PROFILE` and `true`).
  - Introduce an `authInitialized` or `authLoading` gate boolean.
  - Refactor `useEffect` for `onAuthStateChanged` to load user-specific localStorage and Firestore data keyed strictly by `currentUser.uid`.
  - Guard the profile autosave `useEffect` so it does not overwrite stored data with default values before auth resolves.

## Implementation Sequence
1. Update `src/firebase.ts` to set browser local persistence.
2. Update `src/App.tsx` state initialization and auth state listener to ensure strictly UID-isolated profile loading.
3. Add guards to prevent autosave before auth resolution.
4. Run `npx tsc --noEmit` and `npm run build`.

## Testing Plan
1. Sign in with Account A, edit profile details (Name, Bio), and upload verification documents.
2. Hard refresh the browser page (`F5`) and verify that Account A's profile and data are restored instantly without resetting.
3. Sign out, sign in with Account B, and verify Account B has a separate profile.
4. Refresh Account B and confirm Account B's data remains distinct and Account A's data is untouched.
