/**
 * Authentication Context
 * Manages user auth state, role-based access, and provides auth methods
 * across the entire application.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  updateProfile,
  ConfirmationResult,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { UserProfile, UserRole } from '../types';

// ==================== TYPES ====================

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;

  // Auth Methods
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, displayName: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  loginWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== PROVIDER ====================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Fetch or create user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const profile = { uid: firebaseUser.uid, ...userDoc.data() } as UserProfile;
            setUserProfile(profile);
            setUserRole(profile.role);

            // Update last login
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              lastLogin: new Date().toISOString(),
            }, { merge: true });
          } else {
            // First-time login — create customer profile
            const newProfile: Omit<UserProfile, 'uid'> = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              phone: firebaseUser.phoneNumber || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'customer',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              isActive: true,
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile({ uid: firebaseUser.uid, ...newProfile });
            setUserRole('customer');
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('Failed to load user profile.');
        }
      } else {
        setUserProfile(null);
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ==================== AUTH METHODS ====================

  /** Sign in with email and password */
  const loginWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /** Create new account with email and password */
  const signupWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    phone?: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Update Firebase Auth display name
      await updateProfile(cred.user, { displayName });

      // Create Firestore profile
      const profile: Omit<UserProfile, 'uid'> = {
        email,
        displayName,
        phone: phone || '',
        photoURL: '',
        role: 'customer',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
      };

      await setDoc(doc(db, 'users', cred.user.uid), profile);

      // Send verification email
      try {
        await sendEmailVerification(cred.user);
      } catch (emailErr) {
        console.warn('Could not send verification email:', emailErr);
      }
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /** Sign in with Google popup */
  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithPopup(auth, provider);
      // Profile creation is handled by onAuthStateChanged listener above
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return; // User cancelled, no error
      }
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /** Set up reCAPTCHA verifier for phone auth */
  const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    });
    return verifier;
  };

  /** Send OTP to phone number */
  const loginWithPhone = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    try {
      setError(null);
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return result;
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    }
  };

  /** Verify OTP code */
  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
    try {
      setError(null);
      setLoading(true);
      await confirmationResult.confirm(otp);
      // Profile creation is handled by onAuthStateChanged
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /** Sign out */
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setUserRole(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  /** Update display name */
  const updateUserDisplayName = async (name: string) => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, 'users', user.uid), { displayName: name }, { merge: true });
      setUserProfile((prev) => prev ? { ...prev, displayName: name } : null);
    } catch (err) {
      console.error('Error updating display name:', err);
    }
  };

  /** Clear error state */
  const clearError = () => setError(null);

  // ==================== VALUE ====================

  const value: AuthContextType = {
    user,
    userProfile,
    userRole,
    loading,
    error,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    setupRecaptcha,
    loginWithPhone,
    verifyOTP,
    logout,
    updateUserDisplayName,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==================== HOOK ====================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ==================== HELPERS ====================

/** Convert Firebase error codes to user-friendly messages */
function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number with country code.';
    case 'auth/invalid-verification-code':
      return 'Invalid OTP. Please check the code and try again.';
    case 'auth/code-expired':
      return 'OTP has expired. Please request a new one.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
