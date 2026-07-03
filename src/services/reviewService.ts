/**
 * Review Firestore Service
 * Handles all operations for the 'reviews' collection.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Review, ReviewStatus } from '../types';

const COLLECTION = 'reviews';

/**
 * Submit a new review.
 * @param data - Review data (without id, createdAt). Status defaults to 'pending'.
 * @returns The newly created document ID.
 */
export const submitReview = async (
  data: Omit<Review, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now().toDate().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      status: data.status ?? 'pending',
      createdAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

/**
 * Subscribe to approved reviews in real-time.
 * Optionally filter by a specific menu item.
 * @param menuItemId - If provided, only reviews for this item are returned.
 * @param callback - Called with the latest array of approved Reviews.
 * @returns An unsubscribe function.
 */
export const getApprovedReviews = (
  menuItemId: string | null,
  callback: (reviews: Review[]) => void
): (() => void) => {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
  ];

  if (menuItemId) {
    constraints.push(where('menuItemId', '==', menuItemId));
  }

  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const reviews: Review[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Review[];
    callback(reviews);
  });
};

/**
 * Subscribe to ALL reviews in real-time (admin moderation queue, newest first).
 * @param callback - Called with the latest array of Reviews.
 * @returns An unsubscribe function.
 */
export const getAllReviews = (
  callback: (reviews: Review[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reviews: Review[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Review[];
    callback(reviews);
  });
};

/**
 * Moderate a review (approve / reject) with an optional admin response.
 * @param id - The document ID.
 * @param status - The new ReviewStatus ('approved' | 'rejected').
 * @param adminResponse - Optional response from the admin/owner.
 */
export const moderateReview = async (
  id: string,
  status: ReviewStatus,
  adminResponse?: string
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    const updateData: Record<string, unknown> = { status };
    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
    }
    await updateDoc(ref, updateData);
  } catch (error) {
    console.error('Error moderating review:', error);
    throw error;
  }
};

/**
 * Delete a review by its document ID.
 * @param id - The document ID.
 */
export const deleteReview = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};
