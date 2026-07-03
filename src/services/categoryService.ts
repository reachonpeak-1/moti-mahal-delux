/**
 * Category Firestore Service
 * Handles all CRUD operations for the 'categories' collection.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Category } from '../types';

const COLLECTION = 'categories';

/**
 * Subscribe to all categories in real-time, sorted by sortOrder.
 * @param callback - Called with the latest array of Categories on every change.
 * @returns An unsubscribe function to stop listening.
 */
export const getCategories = (
  callback: (categories: Category[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('sortOrder', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const categories: Category[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Category[];
    callback(categories);
  });
};

/**
 * Create a new category with an auto-generated ID.
 * @param data - Category data (without id).
 * @returns The newly created document ID.
 */
export const addCategory = async (
  data: Omit<Category, 'id'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

/**
 * Partially update an existing category.
 * @param id - The document ID.
 * @param data - Partial Category fields to update.
 */
export const updateCategory = async (
  id: string,
  data: Partial<Omit<Category, 'id'>>
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { ...data });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete a category by its document ID.
 * @param id - The document ID.
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

/**
 * Batch-update the sortOrder of multiple categories at once.
 * @param items - Array of { id, sortOrder } pairs.
 */
export const reorderCategories = async (
  items: { id: string; sortOrder: number }[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    items.forEach(({ id, sortOrder }) => {
      const ref = doc(db, COLLECTION, id);
      batch.update(ref, { sortOrder });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error reordering categories:', error);
    throw error;
  }
};
