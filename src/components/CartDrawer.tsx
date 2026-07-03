/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Tag, Ticket, Plus, Minus, ArrowRight, Sparkles } from 'lucide-react';
import { CartItem, MenuItem } from '../types';
import { MENU_ITEMS } from '../data';
import { getOptimizedImageUrl } from '../utils/image';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onQuickAdd: (item: MenuItem) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onQuickAdd,
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  if (!isOpen) return null;

  // Pricing math
  const subtotal = cartItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const deliveryFee = subtotal > 0 ? 50.00 : 0;
  const tax = subtotal > 0 ? (subtotal - discountAmount) * 0.08 : 0; // 8% luxury sales tax
  const total = subtotal > 0 ? (subtotal - discountAmount) + deliveryFee + tax : 0;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase();
    if (cleanCode === 'DELUX1920') {
      setDiscountPercent(15);
      setPromoMessage('15% Heritage Discount Applied.');
    } else if (cleanCode === 'BUTTERLOVE') {
      setDiscountPercent(10);
      setPromoMessage('10% Butter Love Promo Activated.');
    } else {
      setPromoMessage('Invalid invitation code.');
      setDiscountPercent(0);
    }
  };

  // Recommend 3 bestseller items for the Empty State or quick purchase
  const recommendations = MENU_ITEMS.filter((item) => item.isBestSeller).slice(0, 3);

  return (
    <AnimatePresence>
      <div id="cart-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden">
        
        {/* Dark blur backdrop */}
        <motion.div
          id="cart-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-brand-text-primary/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer container on the right side */}
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <motion.div
            id="cart-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            className="w-screen max-w-md bg-brand-surface flex flex-col shadow-2xl border-l border-brand-divider"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-brand-divider bg-brand-surface">
              <div className="flex items-center space-x-2">
                <span className="font-serif text-xl tracking-wide text-brand-text-primary font-medium">Your Selection</span>
                <span className="font-mono text-xs text-brand-text-muted">({cartItems.length} items)</span>
              </div>
              <button
                id="close-cart-drawer"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-brand-hover text-brand-text-secondary hover:text-brand-text-primary transition-colors duration-300 focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Drawer list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                /* EMPTY STATE SUGGESTIONS */
                <div id="cart-empty-state" className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-brand-bg-secondary flex items-center justify-center text-brand-gold mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-serif text-lg text-brand-text-primary font-medium tracking-wide">
                    An Empty Banquet
                  </h4>
                  <p className="mt-2 font-sans text-xs text-brand-text-secondary max-w-xs leading-relaxed">
                    Add a taste of Delhi heritage to start your dining experience. Explore our recommended masterpiece selections:
                  </p>

                  {/* Curated Mini Suggestions List */}
                  <div id="cart-empty-recommendations" className="mt-8 w-full space-y-4">
                    <div className="text-left font-sans text-[9px] tracking-widest text-brand-text-muted uppercase mb-2">
                      MASTERPIECES TO START
                    </div>
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-3 border border-brand-divider bg-brand-card hover:border-brand-gold transition-colors duration-300"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <img
                            src={getOptimizedImageUrl(rec.image, 100)}
                            alt={rec.name}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 object-cover border border-brand-divider"
                          />
                          <div>
                            <h5 className="font-serif text-xs font-medium text-brand-text-primary leading-tight line-clamp-1">{rec.name}</h5>
                            <span className="font-mono text-[10px] text-brand-gold font-semibold">₹{rec.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onQuickAdd(rec)}
                          className="font-sans text-[9px] tracking-widest uppercase border border-brand-text-primary hover:border-brand-gold hover:bg-brand-gold hover:text-brand-surface py-1.5 px-3 transition-all duration-300 focus:outline-none"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* CART ITEMS */
                <div id="cart-items-list" className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border border-brand-divider bg-brand-card transition-all duration-300"
                    >
                      {/* Image Thumbnail */}
                      <img
                        src={getOptimizedImageUrl(item.menuItem.image, 100)}
                        alt={item.menuItem.name}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 object-cover border border-brand-divider flex-shrink-0"
                      />

                      {/* Info & Editing */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-serif text-sm font-medium text-brand-text-primary line-clamp-1">
                            {item.menuItem.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-brand-text-muted hover:text-red-700 transition-colors duration-300 focus:outline-none p-0.5 flex-shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Spice Customization Marker */}
                        <div className="mt-1 flex flex-wrap gap-2 text-[9px] font-sans tracking-wide">
                          <span className="text-brand-gold uppercase font-semibold">
                            Spice: {item.customSpice}
                          </span>
                          {item.specialInstructions && (
                            <span className="text-brand-text-secondary truncate max-w-[180px]" title={item.specialInstructions}>
                              • {item.specialInstructions}
                            </span>
                          )}
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-brand-divider p-0.5 bg-brand-surface">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-brand-text-secondary hover:text-brand-text-primary font-mono text-xs focus:outline-none"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs px-2.5 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-brand-text-secondary hover:text-brand-text-primary font-mono text-xs focus:outline-none"
                            >
                              +
                            </button>
                          </div>

                          {/* Line price */}
                          <span className="font-mono text-xs font-semibold text-brand-text-primary">
                            ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promo code & Summary footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-brand-divider p-6 bg-brand-surface space-y-4">
                
                {/* Promo Coupon Form */}
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input
                      type="text"
                      placeholder="Invitation code (e.g. DELUX1920)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full bg-brand-bg-primary text-brand-text-primary border border-brand-divider py-2 pl-9 pr-3 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-muted"
                    />
                  </div>
                  <button
                    type="submit"
                    className="border border-brand-text-primary hover:border-brand-gold hover:bg-brand-gold hover:text-brand-surface text-brand-text-primary px-4 text-[10px] tracking-widest uppercase font-sans transition-all duration-300 focus:outline-none"
                  >
                    Apply
                  </button>
                </form>

                {promoMessage && (
                  <p className={`font-sans text-[10px] tracking-wide ${discountPercent > 0 ? 'text-brand-success' : 'text-red-700'}`}>
                    {promoMessage}
                  </p>
                )}

                {/* Bill details */}
                <div className="space-y-2 border-t border-brand-divider pt-4 text-brand-text-secondary font-sans text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-brand-success">
                      <span>Heritage Discount ({discountPercent}%)</span>
                      <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Heritage Hand Delivery</span>
                    <span className="font-mono">₹{deliveryFee.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Luxury Sales Tax (8%)</span>
                    <span className="font-mono">₹{tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-brand-text-primary font-bold text-sm border-t border-brand-divider pt-2 mt-2">
                    <span className="font-serif">Grand Total</span>
                    <span className="font-mono text-brand-gold">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  id="cart-checkout-btn"
                  onClick={onCheckout}
                  className="w-full mt-4 bg-brand-text-primary hover:bg-brand-gold text-brand-surface font-sans text-xs tracking-widest uppercase py-4 px-6 transition-all duration-300 focus:outline-none flex justify-between items-center group shadow-md"
                >
                  <span>Proceed to Banquet Checkout</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
