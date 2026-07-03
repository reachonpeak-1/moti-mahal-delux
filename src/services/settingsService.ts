/**
 * Restaurant Settings Firestore Service
 * Handles the singleton 'restaurant' document in the 'settings' collection.
 */

import {
  doc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { RestaurantSettings, HeroSlide, GalleryPhoto } from '../types';

const COLLECTION = 'settings';
const DOC_ID = 'restaurant';

/**
 * Subscribe to the restaurant settings document in real-time.
 * @param callback - Called with the latest RestaurantSettings on every change.
 * @returns An unsubscribe function.
 */
export const getSettings = (
  callback: (settings: RestaurantSettings | null) => void
): (() => void) => {
  const ref = doc(db, COLLECTION, DOC_ID);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as RestaurantSettings);
  });
};

/**
 * Update any fields on the restaurant settings document.
 * @param data - Partial RestaurantSettings fields to update.
 */
export const updateSettings = async (
  data: Partial<Omit<RestaurantSettings, 'id'>>
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

/**
 * Replace the hero slider banners array.
 * @param sliders - The new array of HeroSlide items.
 */
export const updateHeroSliders = async (
  sliders: HeroSlide[]
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    await updateDoc(ref, {
      heroSliders: sliders,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error updating hero sliders:', error);
    throw error;
  }
};

/**
 * Replace the gallery photos array.
 * @param photos - The new array of GalleryPhoto items.
 */
export const updateGallery = async (
  photos: GalleryPhoto[]
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    await updateDoc(ref, {
      galleryPhotos: photos,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error updating gallery:', error);
    throw error;
  }
};

/**
 * Manually toggle the restaurant's open / closed status.
 * @param isOpen - Whether the restaurant should be shown as open.
 */
export const toggleRestaurantOpen = async (
  isOpen: boolean
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    await updateDoc(ref, {
      isOpen,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling restaurant open status:', error);
    throw error;
  }
};

/** Map of JS day index (0 = Sunday) to operating-hours key. */
const DAY_KEYS: Record<number, keyof RestaurantSettings['operatingHours']> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

/**
 * Determine if the restaurant is currently open based on
 * the manual override flag and the operating-hours schedule.
 *
 * Logic:
 * 1. If the manual override `isOpen` is false → closed.
 * 2. If today's schedule has `isClosed: true` → closed.
 * 3. Otherwise, compare current time against the open/close window.
 *
 * @param settings - The current RestaurantSettings.
 * @returns `true` if the restaurant is currently open.
 */
export const isRestaurantCurrentlyOpen = (
  settings: RestaurantSettings
): boolean => {
  // Manual override
  if (!settings.isOpen) return false;

  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const todayHours = settings.operatingHours[dayKey];

  if (todayHours.isClosed) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Handle overnight ranges (e.g. open 18:00, close 02:00)
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};
