/**
 * Saved Addresses Firestore Service
 * Handles all operations for the 'savedAddresses' collection.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { SavedAddress } from '../types';

const COLLECTION = 'savedAddresses';

/**
 * Add a new saved address for a customer.
 * @param customerId - The customer's UID.
 * @param data - Address data (without id, customerId).
 * @returns The newly created document ID.
 */
export const addAddress = async (
  customerId: string,
  data: Omit<SavedAddress, 'id' | 'customerId'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      customerId,
      isDefault: data.isDefault ?? false,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
};

/**
 * Subscribe to a customer's saved addresses in real-time.
 * Default address is returned first.
 * @param customerId - The customer's UID.
 * @param callback - Called with the latest array of SavedAddresses.
 * @returns An unsubscribe function.
 */
export const getAddresses = (
  customerId: string,
  callback: (addresses: SavedAddress[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId)
  );
  return onSnapshot(q, (snapshot) => {
    const addresses: SavedAddress[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SavedAddress[];
    // Sort so default address comes first
    addresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    callback(addresses);
  });
};

/**
 * Partially update a saved address.
 * @param id - The document ID.
 * @param data - Partial SavedAddress fields to update.
 */
export const updateAddress = async (
  id: string,
  data: Partial<Omit<SavedAddress, 'id' | 'customerId'>>
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { ...data });
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

/**
 * Delete a saved address by its document ID.
 * @param id - The document ID.
 */
export const deleteAddress = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

/**
 * Set one address as the default for a customer.
 * Uses a batch write to unset `isDefault` on all other addresses
 * and set it on the specified one.
 * @param customerId - The customer's UID.
 * @param addressId - The document ID of the address to make default.
 */
export const setDefaultAddress = async (
  customerId: string,
  addressId: string
): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('customerId', '==', customerId)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      const ref = doc(db, COLLECTION, d.id);
      batch.update(ref, { isDefault: d.id === addressId });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};
