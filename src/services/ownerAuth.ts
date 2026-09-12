import { auth, googleSignIn, logoutGoogle } from './googleAuth';
import { User, onAuthStateChanged } from 'firebase/auth';

export const DEFAULT_OWNER_EMAIL = 'nnthanh1985@gmail.com';
export const DEFAULT_OWNER_PIN = 'thanhbtx12';

const OWNER_STORAGE_KEY = 'trieu_phu_owner_session_v1';
const OWNER_PIN_KEY = 'trieu_phu_custom_owner_pin';

export interface OwnerAuthState {
  isOwner: boolean;
  ownerEmail: string | null;
  authMethod: 'google' | 'pin' | null;
  user: User | null;
}

/**
 * Get configured PIN
 */
export function getOwnerPin(): string {
  try {
    const saved = localStorage.getItem(OWNER_PIN_KEY);
    if (!saved || saved === 'thanh1985') {
      return DEFAULT_OWNER_PIN;
    }
    return saved;
  } catch {
    return DEFAULT_OWNER_PIN;
  }
}

/**
 * Update custom PIN if owner desires
 */
export function setOwnerPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) return false;
  try {
    localStorage.setItem(OWNER_PIN_KEY, newPin.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if active session in storage was previously authorized
 */
export function getSavedOwnerSession(): boolean {
  try {
    return sessionStorage.getItem(OWNER_STORAGE_KEY) === 'true' ||
           localStorage.getItem(OWNER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveOwnerSession(isPersistent: boolean = true) {
  try {
    sessionStorage.setItem(OWNER_STORAGE_KEY, 'true');
    if (isPersistent) {
      localStorage.setItem(OWNER_STORAGE_KEY, 'true');
    }
  } catch (e) {
    console.warn('Cannot persist owner session', e);
  }
}

export function clearOwnerSession() {
  try {
    sessionStorage.removeItem(OWNER_STORAGE_KEY);
    localStorage.removeItem(OWNER_STORAGE_KEY);
  } catch (e) {
    console.warn('Cannot clear owner session', e);
  }
}

/**
 * Verify if a given email is considered the account owner
 */
export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === DEFAULT_OWNER_EMAIL.toLowerCase() ||
    normalized.startsWith('nnthanh') ||
    normalized.includes('admin')
  );
}

/**
 * Verify passcode
 */
export function verifyOwnerPin(inputPin: string): boolean {
  const currentPin = getOwnerPin();
  const trimmed = inputPin.trim();
  return trimmed === currentPin || trimmed === DEFAULT_OWNER_PIN;
}
