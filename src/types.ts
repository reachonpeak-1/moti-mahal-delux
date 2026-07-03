/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==================== USER ROLES ====================

export type UserRole = 'superadmin' | 'admin' | 'staff' | 'delivery' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  photoURL: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

// ==================== MENU ====================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  calories: number;
  spiceLevel: 0 | 1 | 2 | 3; // 0 = mild/none, 1 = medium, 2 = spicy, 3 = very spicy
  prepTime: string;
  isBestSeller?: boolean;
  isChefSpecial?: boolean;
  isTodaySpecial?: boolean;
  isVegetarian: boolean;
  ingredients: string[];
  allergens: string[];
  nutritionalInfo: {
    protein: string;
    carbs: string;
    fat: string;
  };
  chefRecommendation?: string;
  isAvailable?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

// ==================== CART ====================

export interface CartItem {
  id: string; // unique for this specific line item (to allow same item with different customizations)
  menuItem: MenuItem;
  quantity: number;
  customSpice: 'mild' | 'medium' | 'spicy' | 'heritage';
  specialInstructions: string;
}

// ==================== ORDERS ====================

export type OrderType = 'delivery' | 'takeaway' | 'dinein';
export type OrderStatus = 'received' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod';

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  couponCode?: string;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryTime: string; // e.g., "As soon as possible" or "7:30 PM"
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: OrderStatus;
  assignedDeliveryBoy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== RESERVATIONS ====================

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  specialRequests?: string;
  status: ReservationStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== COUPONS ====================

export type CouponType = 'percentage' | 'flat';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
}

// ==================== REVIEWS ====================

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  customerPhoto?: string;
  orderId?: string;
  menuItemId?: string;
  menuItemName?: string;
  rating: number; // 1-5
  reviewText: string;
  status: ReviewStatus;
  adminResponse?: string;
  createdAt: string;
}

// ==================== SETTINGS ====================

export interface OperatingHour {
  open: string; // "09:00"
  close: string; // "23:00"
  isClosed: boolean;
}

export interface HeroSlide {
  id: string;
  image: string;
  headline: string;
  subline: string;
  sortOrder: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  sortOrder: number;
}

export interface RestaurantSettings {
  id: string; // always 'restaurant'
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: {
    mon: OperatingHour;
    tue: OperatingHour;
    wed: OperatingHour;
    thu: OperatingHour;
    fri: OperatingHour;
    sat: OperatingHour;
    sun: OperatingHour;
  };
  isOpen: boolean; // manual override
  closedMessage: string;
  deliveryZone: string;
  deliveryFee: number;
  freeDelivery: boolean;
  minOrderForDelivery: number;
  heroSliders: HeroSlide[];
  galleryPhotos: GalleryPhoto[];
  taxConfig: {
    gst: number;
    serviceCharge: number;
  };
  updatedAt?: string;
  whatsappPhone?: string;
  whatsappMessage?: string;
  instagramUsername?: string;
  googleMapsUrl?: string;
}

// ==================== SAVED ADDRESSES ====================

export interface SavedAddress {
  id: string;
  customerId: string;
  label: string; // 'Home' | 'Work' | 'Other'
  address: string;
  isDefault: boolean;
}

// ==================== FAVORITES ====================

export interface Favorite {
  id: string;
  customerId: string;
  menuItemId: string;
  createdAt: string;
}

// ==================== NOTIFICATION ====================

export interface AppNotification {
  id: string;
  type: 'order' | 'reservation' | 'review' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}
