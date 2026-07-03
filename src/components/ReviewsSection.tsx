/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { REVIEWS } from '../data';

export default function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Slow auto-advancing rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  return (
    <section id="reviews-section" className="py-24 bg-brand-bg-primary border-t border-b border-brand-divider overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative">
        
        {/* Floating background decorative quotation marks */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-brand-gold/5 pointer-events-none select-none">
          <Quote size={140} fill="currentColor" strokeWidth={0} />
        </div>

        {/* Section title */}
        <div className="space-y-2 mb-12">
          <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-text-muted">GLOBAL ACCLAIM</span>
          <h2 className="font-serif text-2xl md:text-3xl font-light text-brand-text-primary tracking-wide">
            Words of Devotion
          </h2>
        </div>

        {/* Main review slider container */}
        <div className="min-h-[160px] flex items-center justify-center relative z-10 px-4 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Star review ratings */}
              <div className="flex justify-center items-center space-x-1 text-brand-gold">
                {Array.from({ length: REVIEWS[activeIndex].stars }).map((_, idx) => (
                  <Star key={idx} size={13} fill="currentColor" strokeWidth={0} />
                ))}
              </div>

              {/* Quotation quote */}
              <p className="font-serif text-lg sm:text-2xl italic font-light text-brand-text-primary leading-relaxed max-w-2xl mx-auto">
                “{REVIEWS[activeIndex].quote}”
              </p>

              {/* Critic metadata */}
              <div>
                <span className="font-sans text-[10px] tracking-[0.25em] text-brand-text-secondary uppercase block font-semibold">
                  {REVIEWS[activeIndex].author}
                </span>
                <span className="font-sans text-[8px] tracking-widest text-brand-text-muted uppercase block mt-1">
                  OFFICIAL PUBLICATION
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slideline Dots & Small Navigation Arrows */}
        <div className="flex items-center justify-center space-x-6 mt-12 z-10 relative">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-full border border-brand-divider hover:border-brand-gold text-brand-text-secondary hover:text-brand-gold bg-brand-surface transition-all duration-300 focus:outline-none"
            aria-label="Previous review"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Dots */}
          <div className="flex space-x-2">
            {REVIEWS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-1 w-6 transition-all duration-500 focus:outline-none ${
                  idx === activeIndex ? 'bg-brand-gold' : 'bg-brand-divider'
                }`}
                aria-label={`Go to review ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-full border border-brand-divider hover:border-brand-gold text-brand-text-secondary hover:text-brand-gold bg-brand-surface transition-all duration-300 focus:outline-none"
            aria-label="Next review"
          >
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </section>
  );
}
