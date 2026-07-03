/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Sparkles, Clock, ShieldAlert, Heart } from 'lucide-react';
import { MenuItem } from '../types';
import { getOptimizedImageUrl } from '../utils/image';

interface ProductDrawerProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCartWithCustom: (item: MenuItem, quantity: number, spice: 'mild' | 'medium' | 'spicy' | 'heritage', instructions: string) => void;
}

export default function ProductDrawer({ item, onClose, onAddToCartWithCustom }: ProductDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState<'mild' | 'medium' | 'spicy' | 'heritage'>('medium');
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!item) return null;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAdd = () => {
    onAddToCartWithCustom(item, quantity, spiceLevel, specialInstructions);
    // Reset state & close
    setQuantity(1);
    setSpiceLevel('medium');
    setSpecialInstructions('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div id="product-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden">
        
        {/* Dark blur backdrop */}
        <motion.div
          id="product-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-brand-text-primary/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer container from right */}
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <motion.div
            id="product-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            className="w-screen max-w-xl bg-brand-surface flex flex-col shadow-2xl border-l border-brand-divider"
          >
            {/* Header toolbar */}
            <div className="flex justify-between items-center p-6 border-b border-brand-divider bg-brand-surface">
              <span className="font-sans text-[10px] tracking-[0.3em] text-brand-text-muted uppercase">Heritage Recipe Profile</span>
              <button
                id="close-product-drawer"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-brand-hover text-brand-text-secondary hover:text-brand-text-primary transition-colors duration-300 focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content box */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              
              {/* Majestic Food Stage Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden border border-brand-divider">
                <img
                  src={getOptimizedImageUrl(item.image, 600)}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {item.isBestSeller && (
                  <span className="absolute top-4 left-4 bg-brand-surface/90 backdrop-blur-md text-brand-gold text-[8px] font-sans font-bold tracking-[0.2em] uppercase px-3 py-1 shadow-sm">
                    Signature Secret Sauce
                  </span>
                )}
              </div>

              {/* Title & Price Header */}
              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-normal text-brand-text-primary tracking-wide">
                  {item.name}
                </h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="font-mono text-xl font-bold text-brand-gold">
                    ₹{item.price.toFixed(2)}
                  </span>
                  <span className="h-3 w-[1px] bg-brand-divider" />
                  <span className="font-sans text-xs text-brand-text-secondary tracking-wider">
                    {item.calories} Calories
                  </span>
                  <span className="h-3 w-[1px] bg-brand-divider" />
                  <span className="font-sans text-xs text-brand-text-secondary tracking-wider flex items-center space-x-1">
                    <Clock size={12} className="inline mr-1" />
                    {item.prepTime} Preparation
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-brand-divider pt-6">
                <p className="font-sans text-sm text-brand-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Chef Notes Block */}
              {item.chefRecommendation && (
                <div className="bg-brand-bg-primary border-l-2 border-brand-gold p-4">
                  <div className="flex items-center space-x-2 text-brand-gold mb-1">
                    <Sparkles size={14} />
                    <span className="font-serif text-sm italic font-medium">Chef’s Recommendation</span>
                  </div>
                  <p className="font-sans text-xs text-brand-text-secondary leading-relaxed">
                    {item.chefRecommendation}
                  </p>
                </div>
              )}

              {/* Customization Options Section */}
              <div className="border-t border-b border-brand-divider py-6 space-y-6">
                
                {/* 1. Custom Spice Tuning */}
                <div>
                  <label className="block font-sans text-xs font-bold tracking-widest text-brand-text-primary uppercase mb-3">
                    Heritage Spice Calibration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'mild', label: 'Mild', desc: 'Graceful aroma' },
                      { key: 'medium', label: 'Medium', desc: 'Spiced harmony' },
                      { key: 'spicy', label: 'Spicy', desc: 'Blazing embers' },
                      { key: 'heritage', label: 'Heritage', desc: 'Original heat' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSpiceLevel(opt.key as any)}
                        className={`flex flex-col items-center justify-center p-3 border text-center transition-all duration-300 ${
                          spiceLevel === opt.key
                            ? 'border-brand-gold bg-brand-bg-secondary text-brand-gold'
                            : 'border-brand-divider hover:border-brand-text-muted text-brand-text-secondary bg-brand-surface'
                        }`}
                      >
                        <span className="font-serif text-sm font-medium tracking-wide">{opt.label}</span>
                        <span className="font-sans text-[8px] text-brand-text-muted mt-0.5 uppercase tracking-wider">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Special Instructions Box */}
                <div>
                  <label className="block font-sans text-xs font-bold tracking-widest text-brand-text-primary uppercase mb-2">
                    Special Demands & Instructions
                  </label>
                  <textarea
                    id="special-requests-input"
                    rows={2}
                    placeholder="E.g. No dairy garnish, extra tender chicken, medium warm serving..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full bg-brand-bg-primary text-brand-text-primary border border-brand-divider p-3 font-sans text-xs focus:outline-none focus:border-brand-gold focus:ring-0 rounded-none placeholder-brand-text-muted"
                  />
                </div>
              </div>

              {/* Ingredients & Allergens Bento Style */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <h4 className="font-sans text-xs font-bold tracking-widest text-brand-text-primary uppercase mb-3">
                    Selected Ingredients
                  </h4>
                  <ul className="space-y-1.5">
                    {item.ingredients.map((ing, i) => (
                      <li key={i} className="font-sans text-xs text-brand-text-secondary flex items-center space-x-2">
                        <span className="text-brand-gold text-xs">•</span>
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  {/* Allergens Warn */}
                  {item.allergens.length > 0 && (
                    <div>
                      <h4 className="font-sans text-xs font-bold tracking-widest text-brand-text-primary uppercase mb-2 flex items-center space-x-1.5">
                        <ShieldAlert size={12} className="text-brand-gold" />
                        <span>Allergens Alert</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {item.allergens.map((alg, i) => (
                          <span key={i} className="bg-orange-100/50 border border-orange-200 text-orange-800 text-[9px] font-sans px-2 py-0.5 tracking-wider uppercase font-medium">
                            {alg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nutritional details */}
                  <div>
                    <h4 className="font-sans text-xs font-bold tracking-widest text-brand-text-primary uppercase mb-2">
                      Nutritional Value
                    </h4>
                    <div className="grid grid-cols-3 gap-1 bg-brand-bg-secondary p-2.5 text-center text-brand-text-secondary font-sans text-[10px]">
                      <div>
                        <span className="block text-brand-text-muted font-mono uppercase tracking-widest text-[8px]">PRO</span>
                        <span className="font-medium">{item.nutritionalInfo.protein}</span>
                      </div>
                      <div>
                        <span className="block text-brand-text-muted font-mono uppercase tracking-widest text-[8px]">CARB</span>
                        <span className="font-medium">{item.nutritionalInfo.carbs}</span>
                      </div>
                      <div>
                        <span className="block text-brand-text-muted font-mono uppercase tracking-widest text-[8px]">FAT</span>
                        <span className="font-medium">{item.nutritionalInfo.fat}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom sticky checkout purchase section */}
            <div className="border-t border-brand-divider p-6 bg-brand-surface grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              
              {/* Quantity selectors */}
              <div className="flex items-center justify-between border border-brand-divider p-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="px-3 py-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover font-mono text-base focus:outline-none transition-all duration-300"
                >
                  -
                </button>
                <span className="font-mono text-sm font-semibold px-4">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="px-3 py-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover font-mono text-base focus:outline-none transition-all duration-300"
                >
                  +
                </button>
              </div>

              {/* Add to order button */}
              <button
                type="button"
                id="add-to-order-btn"
                onClick={handleAdd}
                className="md:col-span-2 w-full bg-brand-gold hover:bg-brand-text-primary text-brand-surface font-sans text-xs tracking-widest uppercase py-4 px-6 hover:shadow-lg transition-all duration-300 focus:outline-none flex justify-between items-center"
              >
                <span>Add To Order</span>
                <span className="font-mono text-sm font-bold">${(item.price * quantity).toFixed(2)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
