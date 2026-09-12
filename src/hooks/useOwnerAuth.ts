import { useState, useEffect, useCallback } from 'react';
import { auth, googleSignIn, logoutGoogle } from '../services/googleAuth';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  DEFAULT_OWNER_EMAIL,
  isOwnerEmail,
  verifyOwnerPin,
  getSavedOwnerSession,
  saveOwnerSession,
  clearOwnerSession,
  getOwnerPin,
  setOwnerPin
} from '../services/ownerAuth';

export function useOwnerAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(() => getSavedOwnerSession());
  const [authMethod, setAuthMethod] = useState<'google' | 'pin' | null>(() => {
    return getSavedOwnerSession() ? 'pin' : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);

      if (user && isOwnerEmail(user.email)) {
        setIsOwner(true);
        setAuthMethod('google');
        saveOwnerSession(true);
      } else if (!user && authMethod === 'google') {
        // Only revoke owner if logged in via Google and signed out
        setIsOwner(false);
        setAuthMethod(null);
        clearOwnerSession();
      }
    });

    return () => unsubscribe();
  }, [authMethod]);

  const loginWithPin = useCallback((pin: string, remember: boolean = true): boolean => {
    if (verifyOwnerPin(pin)) {
      setIsOwner(true);
      setAuthMethod('pin');
      saveOwnerSession(remember);
      return true;
    }
    return false;
  }, []);

  const loginWithGoogleOwner = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user } = await googleSignIn();
      if (isOwnerEmail(user.email)) {
        setIsOwner(true);
        setAuthMethod('google');
        saveOwnerSession(true);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `Tài khoản ${user.email} không phải là chủ tài khoản (${DEFAULT_OWNER_EMAIL}). Vui lòng đăng nhập đúng tài khoản giáo viên/quản trị.` 
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Đăng nhập Google không thành công.' };
    }
  }, []);

  const lockOrLogout = useCallback(async () => {
    clearOwnerSession();
    setIsOwner(false);
    setAuthMethod(null);
    if (currentUser) {
      try {
        await logoutGoogle();
      } catch {
        // ignore logout errors
      }
    }
  }, [currentUser]);

  return {
    isOwner,
    currentUser,
    authMethod,
    isLoading,
    ownerEmail: currentUser?.email || (isOwner ? DEFAULT_OWNER_EMAIL : null),
    loginWithPin,
    loginWithGoogleOwner,
    lockOrLogout,
    updatePin: setOwnerPin,
    currentPin: getOwnerPin()
  };
}
