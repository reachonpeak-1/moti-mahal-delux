/**
 * Menu Items Firestore Service
 * Handles all CRUD operations for the 'menuItems' collection.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { MenuItem } from '../types';

const COLLECTION = 'menuItems';

/**
 * Subscribe to all menu items in real-time, sorted by sortOrder.
 * @param callback - Called with the latest array of MenuItems on every change.
 * @returns An unsubscribe function to stop listening.
 */
export const getMenuItems = (
  callback: (items: MenuItem[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('sortOrder', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const items: MenuItem[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as MenuItem[];
    callback(items);
  });
};

/**
 * Fetch a single menu item by its document ID.
 * @param id - The Firestore document ID.
 * @returns The MenuItem or null if not found.
 */
export const getMenuItemById = async (
  id: string
): Promise<MenuItem | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as MenuItem;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    throw error;
  }
};

/**
 * Create a new menu item with an auto-generated ID.
 * @param data - MenuItem data (without id, createdAt, updatedAt).
 * @returns The newly created document ID.
 */
export const addMenuItem = async (
  data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now().toDate().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
};

/**
 * Partially update an existing menu item.
 * @param id - The document ID.
 * @param data - Partial MenuItem fields to update.
 */
export const updateMenuItem = async (
  id: string,
  data: Partial<Omit<MenuItem, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

/**
 * Delete a menu item by its document ID.
 * @param id - The document ID.
 */
export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

/**
 * Quickly toggle the availability (in-stock) status of a menu item.
 * @param id - The document ID.
 * @param isAvailable - The new availability flag.
 */
export const toggleAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      isAvailable,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    throw error;
  }
};

/**
 * Batch-update the sortOrder of multiple menu items at once.
 * @param items - Array of { id, sortOrder } pairs.
 */
export const reorderMenuItems = async (
  items: { id: string; sortOrder: number }[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const now = Timestamp.now().toDate().toISOString();
    items.forEach(({ id, sortOrder }) => {
      const ref = doc(db, COLLECTION, id);
      batch.update(ref, { sortOrder, updatedAt: now });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error reordering menu items:', error);
    throw error;
  }
};
