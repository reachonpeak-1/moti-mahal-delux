/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Heart, Flame, Plus, Clock } from 'lucide-react';
import { MenuItem } from '../types';
import { getOptimizedImageUrl } from '../utils/image';

interface MenuItemCardProps {
  key?: React.Key;
  item: MenuItem;
  onSelectItem: (item: any) => void;
  onAddToCart: (item: MenuItem, e?: React.MouseEvent) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: string, e: React.MouseEvent) => void;
}

export default function MenuItemCard({
  item,
  onSelectItem,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
}: MenuItemCardProps) {
  // Renders premium level indicator
  const renderSpice = (level: number) => {
    if (level === 0) return null;
    return (
      <div className="flex items-center space-x-0.5 text-brand-gold" title={`Spice Level: ${level}/3`}>
        {Array.from({ length: level }).map((_, i) => (
          <Flame key={i} size={11} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
    );
  };

  return (
    <div
      id={`menu-card-${item.id}`}
      className="group relative flex flex-col bg-brand-surface border border-brand-divider overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-1.5"
    >
      {/* Product Image Stage */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-brand-bg-secondary cursor-pointer"
        onClick={() => onSelectItem(item)}
      >
        <img
          src={getOptimizedImageUrl(item.image, 400)}
          alt={item.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />
        
        {/* Out of Stock Overlay */}
        {item.isAvailable === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <span className="bg-rose-600 text-white text-[9px] font-sans font-bold tracking-[0.25em] uppercase px-3 py-1.5 shadow">
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Subtle premium gradient bottom overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Dynamic high-end status labels (e.g. Vegetarian, Bestseller) */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
          {item.isBestSeller && (
            <span className="bg-brand-surface/90 backdrop-blur-md text-brand-gold text-[8px] font-sans font-bold tracking-[0.2em] uppercase px-2 py-1 shadow-sm">
              Legendary Selection
            </span>
          )}
          {item.isChefSpecial && (
            <span className="bg-brand-gold text-brand-surface text-[8px] font-sans font-bold tracking-[0.2em] uppercase px-2 py-1 shadow-sm">
              Chef’s Pride
            </span>
          )}
        </div>

        {/* Floating Heart Favorite Icon */}
        {onToggleFavorite && (
          <button
            onClick={(e) => onToggleFavorite(item.id, e)}
            className="absolute top-4 right-11 z-10 w-5 h-5 flex items-center justify-center border border-brand-divider text-brand-text-secondary hover:text-rose-500 bg-brand-surface/95 transition-all focus:outline-none"
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart size={11} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-500'} />
          </button>
        )}

        {/* Vegetarian indicator icon */}
        <div className="absolute top-4 right-4 z-10">
          <span
            className={`flex h-5 w-5 items-center justify-center border text-[9px] font-bold ${
              item.isVegetarian
                ? 'border-brand-success text-brand-success bg-brand-surface/95'
                : 'border-red-800 text-red-800 bg-brand-surface/95'
            }`}
            title={item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            ●
          </span>
        </div>

        {/* Floating Quick View Hint */}
        {item.isAvailable !== false && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={() => onSelectItem(item)}
              className="bg-brand-text-primary/90 text-brand-surface font-sans text-[10px] tracking-widest uppercase py-3 px-6 hover:bg-brand-gold transition-colors duration-300"
            >
              Heritage Profile
            </button>
          </div>
        )}
      </div>

      {/* Card Detail Section */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-5 md:p-6">
        
        {/* Header - Name and Spice Level */}
        <div className="flex items-start justify-between gap-1">
          <h4
            onClick={() => onSelectItem(item)}
            className="font-serif text-sm sm:text-lg md:text-xl font-medium tracking-wide text-brand-text-primary hover:text-brand-gold transition-colors duration-300 cursor-pointer line-clamp-1"
          >
            {item.name}
          </h4>
          <div className="flex items-center space-x-1.5 mt-0.5 flex-shrink-0">
            {renderSpice(item.spiceLevel)}
          </div>
        </div>

        {/* Brief Description - Hidden on mobile 2x2 grid for cleanliness */}
        <p className="mt-2 font-sans text-xs text-brand-text-secondary leading-relaxed line-clamp-2 hidden sm:block">
          {item.description}
        </p>

        {/* Prep Time & Calories Metadata */}
        <div className="mt-3 sm:mt-4 flex items-center space-x-2 sm:space-x-4 text-brand-text-muted font-sans text-[8px] sm:text-[10px] tracking-widest uppercase">
          <div className="flex items-center space-x-1">
            <Clock size={10} />
            <span>{item.prepTime}</span>
          </div>
          <span>•</span>
          <span>{item.calories} Kcal</span>
        </div>

        {/* Divider line */}
        <div className="w-full h-[1px] bg-brand-divider my-3 sm:my-4" />

        {/* Card Footer: Price & Add to Cart CTA */}
        <div className="flex items-center justify-between mt-auto">
          {/* Sizing of Currency */}
          <div className="flex flex-col">
            <span className="font-sans text-[7px] sm:text-[8px] tracking-wider text-brand-text-muted uppercase">VALUE</span>
            <span className="font-mono text-sm sm:text-base font-semibold text-brand-text-primary">
              ₹{item.price.toFixed(2)}
            </span>
          </div>

          <button
            id={`add-to-cart-${item.id}`}
            onClick={(e) => onAddToCart(item, e)}
            disabled={item.isAvailable === false}
            className="flex items-center space-x-0.5 sm:space-x-1 border border-brand-text-primary hover:border-brand-gold hover:bg-brand-gold hover:text-brand-surface text-brand-text-primary py-1.5 px-2 sm:py-2 sm:px-3 text-[9px] sm:text-[10px] tracking-widest uppercase font-sans transition-all duration-300 focus:outline-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-text-primary disabled:hover:border-brand-text-primary disabled:cursor-not-allowed"
          >
            <Plus size={10} />
            <span>{item.isAvailable === false ? 'Sold Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
