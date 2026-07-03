/**
 * User Profile Firestore Service
 * Handles all operations for the 'users' collection.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile, UserRole } from '../types';

const COLLECTION = 'users';

/**
 * Create a user profile document on signup.
 * Uses setDoc with the user's auth UID as the document ID.
 * @param uid - The Firebase Auth UID.
 * @param data - Initial profile data (without uid, createdAt, lastLogin).
 */
export const createUserProfile = async (
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'lastLogin'>
): Promise<void> => {
  try {
    const now = Timestamp.now().toDate().toISOString();
    await setDoc(doc(db, COLLECTION, uid), {
      uid,
      ...data,
      role: data.role ?? 'customer',
      isActive: data.isActive ?? true,
      createdAt: now,
      lastLogin: now,
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Fetch a single user profile by UID.
 * @param uid - The Firebase Auth UID.
 * @returns The UserProfile or null if not found.
 */
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Partially update a user's profile.
 * @param uid - The Firebase Auth UID.
 * @param data - Partial UserProfile fields to update.
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, uid);
    await updateDoc(ref, { ...data });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Subscribe to ALL user profiles in real-time (admin / super-admin view).
 * @param callback - Called with the latest array of UserProfiles.
 * @returns An unsubscribe function.
 */
export const getAllUsers = (
  callback: (users: UserProfile[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = snapshot.docs.map((d) =>
      d.data() as UserProfile
    );
    callback(users);
  });
};

/**
 * Change a user's role (super-admin only operation).
 * @param uid - The Firebase Auth UID of the target user.
 * @param role - The new UserRole.
 */
export const updateUserRole = async (
  uid: string,
  role: UserRole
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, uid);
    await updateDoc(ref, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Enable or disable a user account (super-admin only operation).
 * @param uid - The Firebase Auth UID.
 * @param isActive - Whether the account should be active.
 */
export const toggleUserActive = async (
  uid: string,
  isActive: boolean
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, uid);
    await updateDoc(ref, { isActive });
  } catch (error) {
    console.error('Error toggling user active status:', error);
    throw error;
  }
};
