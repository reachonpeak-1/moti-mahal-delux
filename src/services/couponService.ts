/**
 * Coupon Firestore Service
 * Handles all operations for the 'coupons' collection.
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
  orderBy,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Coupon } from '../types';

const COLLECTION = 'coupons';

/**
 * Create a new coupon.
 * @param data - Coupon data (without id, createdAt).
 * @returns The newly created document ID.
 */
export const createCoupon = async (
  data: Omit<Coupon, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now().toDate().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      usedCount: data.usedCount ?? 0,
      createdAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
};

/**
 * Subscribe to ALL coupons in real-time (admin view).
 * @param callback - Called with the latest array of Coupons.
 * @returns An unsubscribe function.
 */
export const getAllCoupons = (
  callback: (coupons: Coupon[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const coupons: Coupon[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Coupon[];
    callback(coupons);
  });
};

/**
 * Partially update an existing coupon.
 * @param id - The document ID.
 * @param data - Partial Coupon fields to update.
 */
export const updateCoupon = async (
  id: string,
  data: Partial<Omit<Coupon, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { ...data });
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
};

/**
 * Delete a coupon by its document ID.
 * @param id - The document ID.
 */
export const deleteCoupon = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
};

/** Result returned by {@link validateCoupon}. */
export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  message: string;
}

/**
 * Validate a coupon code against the current order total.
 * Checks: existence, active flag, date range, min order value, and usage limit.
 * @param code - The coupon code entered by the user.
 * @param orderTotal - The current cart / order subtotal.
 * @returns A validation result with computed discount if valid.
 */
export const validateCoupon = async (
  code: string,
  orderTotal: number
): Promise<CouponValidationResult> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('code', '==', code.toUpperCase())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { valid: false, message: 'Invalid coupon code.' };
    }

    const couponDoc = snapshot.docs[0];
    const coupon: Coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

    if (!coupon.isActive) {
      return { valid: false, message: 'This coupon is no longer active.' };
    }

    const now = new Date();
    if (new Date(coupon.validFrom) > now) {
      return { valid: false, message: 'This coupon is not yet valid.' };
    }
    if (new Date(coupon.validTo) < now) {
      return { valid: false, message: 'This coupon has expired.' };
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'This coupon has reached its usage limit.' };
    }

    if (orderTotal < coupon.minOrderValue) {
      return {
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} is required.`,
      };
    }

    // Calculate discount
    let discount: number;
    if (coupon.type === 'percentage') {
      discount = (orderTotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    // Ensure discount does not exceed order total
    discount = Math.min(discount, orderTotal);

    return {
      valid: true,
      coupon,
      discount: Math.round(discount * 100) / 100,
      message: `Coupon applied! You save ₹${discount.toFixed(2)}.`,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    throw error;
  }
};

/**
 * Atomically increment the usedCount of a coupon by 1.
 * Should be called after a successful order placement that used this coupon.
 * @param id - The coupon document ID.
 */
export const incrementCouponUsage = async (id: string): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { usedCount: increment(1) });
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
    throw error;
  }
};
