/**
 * HeroSlider.tsx
 * Cinematic slider reading dynamic slides from Firestore Settings.
 * Falls back to static HERO_SLIDES if settings are not loaded yet or empty.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES as STATIC_SLIDES } from '../data';
import { getSettings } from '../services/settingsService';
import type { HeroSlide } from '../types';

interface HeroSliderProps {
  onOrderNow: () => void;
  onBookTable: () => void;
}

export default function HeroSlider({ onOrderNow, onBookTable }: HeroSliderProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load slides from settings
  useEffect(() => {
    const unsub = getSettings((data) => {
      if (data && data.heroSliders && data.heroSliders.length > 0) {
        // Sort slides by sortOrder
        const sorted = [...data.heroSliders].sort((a, b) => a.sortOrder - b.sortOrder);
        setSlides(sorted);
      } else {
        // Fallback to static slides mapped to HeroSlide format
        const mapped = STATIC_SLIDES.map((s, idx) => ({
          id: s.id,
          image: s.image,
          headline: s.headline,
          subline: s.subline,
          sortOrder: idx,
        }));
        setSlides(mapped);
      }
    });
    return () => unsub();
  }, []);

  // Autoplay rotation
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides]);

  const handlePrev = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div className="h-[98dvh] w-full bg-brand-text-primary flex items-center justify-center">
        <span className="text-brand-gold tracking-[0.2em] uppercase text-xs animate-pulse">
          Entering Sanctuary...
        </span>
      </div>
    );
  }

  const activeSlide = slides[currentIndex];

  return (
    <section id="hero-slider" className="relative h-[98dvh] w-full bg-brand-text-primary overflow-hidden">
      
      {/* Slides transition layer */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {/* Ambient image background */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-out scale-105"
              style={{
                backgroundImage: `url(${activeSlide.image})`,
              }}
            />
            {/* Dark vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-text-primary/95 via-brand-text-primary/45 to-brand-text-primary/30" />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating typography & actions overlay */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 md:px-12 z-10">
        <div className="max-w-4xl">
          
          {/* Miniature sub-marker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={`sub-${currentIndex}`}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-col items-center gap-1.5 mb-4"
          >
            {/* Elegant Punjabi Welcome Text */}
            <span className="font-serif text-lg md:text-2xl text-brand-gold italic tracking-wide mb-1 font-medium">
              ਜੀ ਆਇਆਂ ਨੂੰ
            </span>
            <span className="font-sans text-[10px] md:text-xs tracking-[0.4em] text-brand-bg-secondary uppercase font-semibold">
              MOTI MAHAL DELUX • GK REGENCY
            </span>
          </motion.div>

          {/* Master Serif Headline */}
          <motion.h2
            id="hero-headline"
            key={`headline-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-3xl sm:text-5xl md:text-7xl font-light text-brand-bg-primary tracking-wide leading-tight"
          >
            {activeSlide.headline.toUpperCase().includes('BATHINDA')
              ? activeSlide.headline
              : `${activeSlide.headline} - BATHINDA`}
          </motion.h2>

          {/* Elegant Sans Description */}
          <motion.p
            id="hero-description"
            key={`description-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 font-sans text-xs sm:text-sm md:text-base text-brand-bg-secondary tracking-wider sm:tracking-widest max-w-xl mx-auto leading-relaxed"
          >
            {activeSlide.subline}
          </motion.p>

          {/* Majestic Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            key={`buttons-${currentIndex}`}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <button
              onClick={onOrderNow}
              className="w-full sm:w-auto bg-brand-gold hover:bg-brand-bg-secondary hover:text-brand-text-primary text-brand-surface font-sans text-xs font-bold tracking-[0.25em] uppercase py-4 px-8 border border-brand-gold transition-all duration-300 hover:shadow-lg focus:outline-none"
            >
              Order Online
            </button>
            <button
              onClick={onBookTable}
              className="w-full sm:w-auto bg-transparent hover:bg-brand-gold hover:text-brand-surface text-brand-bg-primary font-sans text-xs font-bold tracking-[0.25em] uppercase py-4 px-8 border border-white/40 hover:border-brand-gold transition-all duration-300 focus:outline-none"
            >
              Book Banquet Table
            </button>
          </motion.div>

        </div>
      </div>

      {/* Manual Slider Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full border border-white/10 hover:border-brand-gold text-brand-bg-secondary hover:text-brand-gold transition-all duration-300 z-20 focus:outline-none hidden md:block"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full border border-white/10 hover:border-brand-gold text-brand-bg-secondary hover:text-brand-gold transition-all duration-300 z-20 focus:outline-none hidden md:block"
        aria-label="Next Slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Progress Line Indicator at bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-25">
        <motion.div
          key={`progress-${currentIndex}`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
          className="h-full bg-brand-gold"
        />
      </div>

      {/* Decorative slider indices dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-3.5 z-20">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 transition-all duration-300 ${
              currentIndex === idx ? 'w-8 bg-brand-gold' : 'w-1.5 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Hidden preloader to cache all slide images in the browser */}
      <div className="hidden" aria-hidden="true" style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
        {slides.map((slide) => (
          <img key={slide.id} src={slide.image} alt="" />
        ))}
      </div>

    </section>
  );
}
