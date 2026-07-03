/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data';
import { getOptimizedImageUrl } from '../utils/image';

interface CategoryNavProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categories?: any[];
}

export default function CategoryNav({
  activeCategory,
  onSelectCategory,
  categories,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div id="category-navigation-container" className="w-full bg-brand-surface py-6 border-b border-brand-divider">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-5">
          <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-text-muted">CHEF'S CABINET</span>
          <h3 className="font-serif text-xl md:text-2xl text-brand-text-primary mt-1 font-light tracking-wide">
            Select Your Culinary Path
          </h3>
        </div>

        {/* Scrollable wrapper with edge-fade arrows */}
        <div className="relative">
          {/* Left fade + arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-brand-surface/90 border border-brand-divider shadow-sm text-brand-text-secondary hover:text-brand-gold transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
          )}

          {/* Right fade + arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-brand-surface/90 border border-brand-divider shadow-sm text-brand-text-secondary hover:text-brand-gold transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          )}

          {/* Scrollable Categories Strip */}
          <div
            ref={scrollRef}
            id="categories-flex-scroll"
            onScroll={checkScroll}
            className="flex items-start space-x-5 md:space-x-6 overflow-x-auto pb-2 px-2 justify-start lg:justify-center"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {(categories || CATEGORIES).map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  id={`category-btn-${category.id}`}
                  onClick={() => onSelectCategory(category.id)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none flex-shrink-0"
                  style={{ minWidth: '72px', maxWidth: '80px' }}
                >
                  {/* Circular thumbnail */}
                  <div
                    className={`relative h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 transition-all duration-500 ease-out p-0.5 ${
                      isActive
                        ? 'border-brand-gold scale-105 shadow-md'
                        : 'border-transparent group-hover:border-brand-text-muted group-hover:scale-102'
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(category.image, 120)}
                      alt={category.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full rounded-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-brand-gold/10" />
                    )}
                  </div>

                  {/* Label — constrained width, multi-line allowed */}
                  <span
                    className={`mt-2 font-sans text-[9px] md:text-[10px] tracking-wider uppercase leading-tight text-center transition-all duration-300 ${
                      isActive
                        ? 'text-brand-gold font-semibold'
                        : 'text-brand-text-secondary group-hover:text-brand-text-primary'
                    }`}
                  >
                    {category.name}
                  </span>

                  {/* Active underline */}
                  <div
                    className={`h-[1.5px] bg-brand-gold mt-1 transition-all duration-300 ${
                      isActive ? 'w-5' : 'w-0 group-hover:w-3'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
