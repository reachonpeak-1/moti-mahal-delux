/**
 * Reservation Firestore Service
 * Handles all operations for the 'reservations' collection.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Reservation, ReservationStatus } from '../types';

const COLLECTION = 'reservations';

/**
 * Create a new reservation.
 * @param data - Reservation data (without id, createdAt, updatedAt).
 * @returns The newly created document ID.
 */
export const createReservation = async (
  data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now().toDate().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      status: data.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

/**
 * Subscribe to a specific customer's reservations in real-time (newest first).
 * @param customerId - The customer's UID.
 * @param callback - Called with the latest array of Reservations.
 * @returns An unsubscribe function.
 */
export const getReservationsByCustomer = (
  customerId: string,
  callback: (reservations: Reservation[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const reservations: Reservation[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Reservation[];
    callback(reservations);
  });
};

/**
 * Subscribe to ALL reservations in real-time (admin view, newest first).
 * @param callback - Called with the latest array of Reservations.
 * @returns An unsubscribe function.
 */
export const getAllReservations = (
  callback: (reservations: Reservation[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reservations: Reservation[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Reservation[];
    callback(reservations);
  });
};

/**
 * Update the status of a reservation with an optional admin note.
 * @param id - The document ID.
 * @param status - The new ReservationStatus.
 * @param adminNotes - Optional note from the admin.
 */
export const updateReservationStatus = async (
  id: string,
  status: ReservationStatus,
  adminNotes?: string
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now().toDate().toISOString(),
    };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    await updateDoc(ref, updateData);
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
};
