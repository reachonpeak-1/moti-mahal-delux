/**
 * Favorites Firestore Service
 * Handles all operations for the 'favorites' collection.
 */

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Favorite } from '../types';

const COLLECTION = 'favorites';

/**
 * Toggle a menu item as favorite for a customer.
 * If already favorited, removes it; otherwise adds it.
 * @param customerId - The customer's UID.
 * @param menuItemId - The menu item's document ID.
 * @returns `true` if the item was added, `false` if removed.
 */
export const toggleFavorite = async (
  customerId: string,
  menuItemId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('customerId', '==', customerId),
      where('menuItemId', '==', menuItemId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Already favorited → remove
      const existingDoc = snapshot.docs[0];
      await deleteDoc(doc(db, COLLECTION, existingDoc.id));
      return false;
    }

    // Not favorited → add
    const now = Timestamp.now().toDate().toISOString();
    await addDoc(collection(db, COLLECTION), {
      customerId,
      menuItemId,
      createdAt: now,
    });
    return true;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

/**
 * Subscribe to a customer's favorites in real-time.
 * @param customerId - The customer's UID.
 * @param callback - Called with the latest array of Favorites.
 * @returns An unsubscribe function.
 */
export const getFavorites = (
  customerId: string,
  callback: (favorites: Favorite[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const favorites: Favorite[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Favorite[];
    callback(favorites);
  });
};

/**
 * Check if a specific menu item is favorited by a customer (one-time read).
 * @param customerId - The customer's UID.
 * @param menuItemId - The menu item's document ID.
 * @returns `true` if the item is in the customer's favorites.
 */
export const isFavorite = async (
  customerId: string,
  menuItemId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('customerId', '==', customerId),
      where('menuItemId', '==', menuItemId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking favorite:', error);
    throw error;
  }
};
