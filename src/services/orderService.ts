/**
 * Order Firestore Service
 * Handles all operations for the 'orders' collection.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Order, OrderStatus } from '../types';

const COLLECTION = 'orders';

/**
 * Create a new order.
 * @param orderData - Order data (without id, createdAt, updatedAt).
 * @returns The newly created order document ID.
 */
export const createOrder = async (
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now().toDate().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...orderData,
      status: orderData.status ?? 'received',
      paymentStatus: orderData.paymentStatus ?? 'pending',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Subscribe to a specific customer's orders in real-time (newest first).
 * @param customerId - The customer's UID.
 * @param callback - Called with the latest array of Orders on every change.
 * @returns An unsubscribe function.
 */
export const getOrdersByCustomer = (
  customerId: string,
  callback: (orders: Order[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Order[];
    callback(orders);
  });
};

/**
 * Subscribe to ALL orders in real-time (admin dashboard, newest first).
 * @param callback - Called with the latest array of Orders on every change.
 * @returns An unsubscribe function.
 */
export const getAllOrders = (
  callback: (orders: Order[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Order[];
    callback(orders);
  });
};

/**
 * Fetch a single order by its document ID.
 * @param id - The Firestore document ID.
 * @returns The Order or null if not found.
 */
export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

/**
 * Update the status of an order.
 * @param id - The document ID.
 * @param status - The new OrderStatus.
 */
export const updateOrderStatus = async (
  id: string,
  status: OrderStatus
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      status,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Cancel an order with a reason.
 * @param id - The document ID.
 * @param reason - The cancellation reason.
 */
export const cancelOrder = async (
  id: string,
  reason: string
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      status: 'cancelled' as OrderStatus,
      cancelReason: reason,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

/** Aggregated order statistics for the admin dashboard. */
export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  countByStatus: Record<OrderStatus, number>;
  averageOrderValue: number;
}

/**
 * Fetch aggregated order statistics (one-time read).
 * Computes totals, revenue, counts by status, and average order value.
 * @returns An OrderStats object.
 */
export const getOrderStats = async (): Promise<OrderStats> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));

    const statuses: OrderStatus[] = [
      'received',
      'confirmed',
      'preparing',
      'ready',
      'on_the_way',
      'delivered',
      'cancelled',
    ];

    const countByStatus = statuses.reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<OrderStatus, number>
    );

    let totalRevenue = 0;
    let totalOrders = 0;

    snapshot.docs.forEach((d) => {
      const order = d.data() as Omit<Order, 'id'>;
      totalOrders++;
      countByStatus[order.status] = (countByStatus[order.status] || 0) + 1;
      if (order.status !== 'cancelled') {
        totalRevenue += order.total;
      }
    });

    return {
      totalOrders,
      totalRevenue,
      countByStatus,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    throw error;
  }
};
