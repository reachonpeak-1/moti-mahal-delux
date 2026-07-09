/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import HeroSlider from '../components/HeroSlider';
import MenuItemCard from '../components/MenuItemCard';
import { MenuItem, CartItem } from '../types';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

interface HomeViewProps {
  bestSellers: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem, e?: React.MouseEvent) => void;
}

export default function HomeView({ bestSellers, onSelectItem, onAddToCart }: HomeViewProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();

  return (
    <div id="home-view-stage" className="bg-brand-bg-primary overflow-hidden">
      {/* Majestic Hero Slider */}
      <HeroSlider
        onOrderNow={() => navigate('/menu')}
        onBookTable={() => navigate('/reservation')}
      />

      {/* G.K. Regency complex Introduction - Luxury Editorial Welcome */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 border-b border-brand-divider">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="lg:col-span-8 space-y-5">
            <span className="font-sans text-[10px] tracking-[0.45em] text-brand-gold uppercase font-semibold block">GK REGENCY BATHINDA</span>
            <h2 className="font-serif text-3xl md:text-5xl font-light text-brand-text-primary tracking-wide leading-tight">
              A Premier Landmark of Luxury and Heritage
            </h2>
            <p className="font-sans text-xs md:text-sm text-brand-text-secondary leading-relaxed max-w-3xl">
              Situated on Dabwali Road in Bathinda, G.K. Regency stands as the city's foremost destination for elite experiences. The complex brings together three legendary pillars of hospitality: the world-famous tandoori legacy of <strong>Moti Mahal Delux</strong>, the grand celebrations of <strong>Regency Banquet Hall</strong>, and the refined boutique comfort of our luxury suites.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col space-y-4 pt-2 lg:pt-8 w-full">
            <Link
              to="/menu"
              className="group flex items-center justify-between pb-3 text-[11px] font-sans tracking-[0.25em] uppercase text-brand-text-primary border-b border-brand-divider/70 hover:border-brand-gold hover:text-brand-gold transition-all duration-300"
            >
              <span>Explore Moti Mahal Menu</span>
              <ArrowRight size={14} className="text-brand-gold group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
            <Link
              to="/reservation"
              className="group flex items-center justify-between pb-3 text-[11px] font-sans tracking-[0.25em] uppercase text-brand-text-secondary hover:text-brand-gold border-b border-brand-divider/30 hover:border-brand-gold transition-all duration-300"
            >
              <span>Book Table & Banquets</span>
              <ArrowRight size={14} className="text-brand-gold opacity-60 group-hover:opacity-100 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
            <a
              href={settings?.googleMapsUrl || "https://www.google.co.in/maps/place/G.K+Regency/@30.1801981,74.9389857,17z/data=!3m1!4b1!4m9!3m8!1s0x39172d0010c5f109:0x4b03d5773f4aec5f!5m2!4m1!1i2!8m2!3d30.1801981!4d74.9415606!16s%2Fg%2F11w3nwkgl2"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between pb-3 text-[11px] font-sans tracking-[0.25em] uppercase text-brand-text-secondary hover:text-brand-gold border-b border-brand-divider/30 hover:border-brand-gold transition-all duration-300"
            >
              <span>Locate Us on Maps</span>
              <ArrowRight size={14} className="text-brand-gold opacity-60 group-hover:opacity-100 group-hover:translate-x-1.5 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </section>

      {/* The 3 Pillars of G.K. Regency Section - Redesigned Cards */}
      <section className="bg-brand-card/30 border-b border-brand-divider py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
          <div className="text-center space-y-3">
            <span className="font-sans text-[10px] tracking-[0.45em] text-brand-gold uppercase font-semibold block">OUR EXPERIENCES</span>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-text-primary tracking-wide">
              The Venues of G.K. Regency
            </h2>
            <p className="font-sans text-xs text-brand-text-secondary max-w-xl mx-auto leading-relaxed">
              Discover culinary excellence, grand event sanctuaries, and boutique lodgings, all housed within the prestigious G.K. Regency complex.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Pillar 1: Moti Mahal */}
            <div className="bg-brand-card border border-brand-divider rounded-xl overflow-hidden flex flex-col group hover:border-brand-gold/35 hover:-translate-y-1 transition-all duration-300 shadow-sm">
              <div className="h-48 overflow-hidden bg-brand-bg-secondary relative">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
                  alt="Moti Mahal Dining"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="font-sans text-[8px] tracking-[0.3em] text-brand-gold uppercase font-bold block">FINE DINING RESTAURANT</span>
                  <h3 className="font-serif text-xl text-brand-text-primary">Moti Mahal Delux</h3>
                  <p className="font-sans text-xs text-brand-text-secondary leading-relaxed">
                    Savor the world's most famous Butter Chicken and slow charcoal-cooked Dal Makhani, created with authentic centenary recipes.
                  </p>
                </div>
                <div className="pt-2 flex gap-3">
                  <Link
                    to="/menu"
                    className="px-4 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-surface text-[9px] tracking-wider uppercase font-bold transition-all"
                  >
                    Order Online
                  </Link>
                  <Link
                    to="/reservation"
                    className="px-4 py-2 border border-brand-divider text-brand-text-secondary hover:border-brand-gold hover:text-brand-gold text-[9px] tracking-wider uppercase font-bold transition-all"
                  >
                    Book Table
                  </Link>
                </div>
              </div>
            </div>

            {/* Pillar 2: Regency Banquets */}
            <div className="bg-brand-card border border-brand-divider rounded-xl overflow-hidden flex flex-col group hover:border-brand-gold/35 hover:-translate-y-1 transition-all duration-300 shadow-sm">
              <div className="h-48 overflow-hidden bg-brand-bg-secondary relative">
                <img
                  src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800"
                  alt="Regency Banquet Hall"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="font-sans text-[8px] tracking-[0.3em] text-brand-gold uppercase font-bold block">WEDDINGS & EVENTS</span>
                  <h3 className="font-serif text-xl text-brand-text-primary">Regency Banquet Hall</h3>
                  <p className="font-sans text-xs text-brand-text-secondary leading-relaxed">
                    Celebrate weddings, ring ceremonies, corporate events, and ring ceremonies in our grand, luxury-furnished halls.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/reservation"
                    className="inline-block px-4 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-surface text-[9px] tracking-wider uppercase font-bold transition-all"
                  >
                    Reserve Banquet
                  </Link>
                </div>
              </div>
            </div>

            {/* Pillar 3: Hotel Rooms */}
            <div className="bg-brand-card border border-brand-divider rounded-xl overflow-hidden flex flex-col group hover:border-brand-gold/35 hover:-translate-y-1 transition-all duration-300 shadow-sm">
              <div className="h-48 overflow-hidden bg-brand-bg-secondary relative">
                <img
                  src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800"
                  alt="GK Regency Hotel Rooms"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="font-sans text-[8px] tracking-[0.3em] text-brand-gold uppercase font-bold block">BOUTIQUE ROOMS & SUITES</span>
                  <h3 className="font-serif text-xl text-brand-text-primary">GK Regency Hotel Stays</h3>
                  <p className="font-sans text-xs text-brand-text-secondary leading-relaxed">
                    Luxurious accommodations featuring state-of-the-art designer suites, high-speed Wi-Fi, and 24/7 dedicated services. For room booking queries, contact our front desk directly as online reservations are not available.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="https://www.google.co.in/maps/place/G.K+Regency/@30.1801981,74.9389857,17z/data=!3m1!4b1!4m9!3m8!1s0x39172d0010c5f109:0x4b03d5773f4aec5f!5m2!4m1!1i2!8m2!3d30.1801981!4d74.9415606!16s%2Fg%2F11w3nwkgl2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-surface text-[9px] tracking-wider uppercase font-bold transition-all"
                  >
                    Locate Hotel on Maps
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section id="bestsellers-section" className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 space-y-12">
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
          <div className="space-y-2">
            <span className="font-sans text-[10px] tracking-[0.45em] text-brand-gold uppercase font-semibold block">THE HIGH PEAKS</span>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-text-primary tracking-wide">
              Our Historic Best Sellers
            </h2>
          </div>
          <Link
            to="/menu"
            className="group flex items-center space-x-2 font-sans text-[10px] tracking-[0.2em] uppercase text-brand-gold hover:text-brand-text-primary transition-colors duration-300"
          >
            <span>View Full Menu</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        <div 
          className="flex overflow-x-auto pb-4 -mx-6 px-6 space-x-6 scrollbar-none lg:grid lg:grid-cols-3 lg:space-x-0 lg:gap-12 lg:mx-0 lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {bestSellers.slice(0, 3).map((item) => (
            <div key={item.id} className="w-[82vw] sm:w-[48vw] lg:w-auto flex-shrink-0">
              <MenuItemCard
                item={item}
                onSelectItem={onSelectItem}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Live Kitchen & Atmosphere Teaser - Styled cleanly with generous padding */}
      <section className="bg-brand-card/70 border-y border-brand-divider py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <span className="font-sans text-[10px] tracking-[0.45em] text-brand-gold uppercase font-semibold block">FIRESIDE SPECTACLE</span>
            <h3 className="font-serif text-3xl md:text-4xl font-light text-brand-text-primary leading-tight">
              Watch Our Clay Ovens Dance with Live Embers
            </h3>
            <p className="font-sans text-xs md:text-sm text-brand-text-secondary leading-relaxed">
              Our open show kitchen features three custom-engineered clay tandoors heated with genuine slow-burning oak charcoal. It is a spectacle of light, heat, and precise culinary synchronization.
            </p>
            <div className="grid grid-cols-3 gap-4 md:gap-6 pt-6 border-t border-brand-divider">
              <div>
                <span className="block font-serif text-xl sm:text-2xl text-brand-gold font-light">900°F</span>
                <span className="font-sans text-[8px] tracking-widest text-brand-text-muted uppercase block mt-1">Intense Hearth Heat</span>
              </div>
              <div className="border-l border-brand-divider pl-4 md:pl-6">
                <span className="block font-serif text-xl sm:text-2xl text-brand-gold font-light">100%</span>
                <span className="font-sans text-[8px] tracking-widest text-brand-text-muted uppercase block mt-1">Authentic Oak Charcoal</span>
              </div>
              <div className="border-l border-brand-divider pl-4 md:pl-6">
                <span className="block font-serif text-xl sm:text-2xl text-brand-gold font-light">1920</span>
                <span className="font-sans text-[8px] tracking-widest text-brand-text-muted uppercase block mt-1">Recipe Integrity</span>
              </div>
            </div>
          </div>
          <div className="h-72 md:h-96 relative overflow-hidden bg-brand-bg-secondary border border-brand-divider">
            <img
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
              alt="Live show kitchen tandoori"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div>
                <span className="font-sans text-[8px] tracking-widest text-brand-gold uppercase block mb-1">LIVE SHOWCASE</span>
                <span className="block font-serif text-sm text-white font-light tracking-wide">Master Hearth Artisans</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Testimonials - Refactored to transparent elegant columns */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 space-y-16">
        <div className="text-center space-y-3">
          <span className="font-sans text-[10px] tracking-[0.45em] text-brand-gold uppercase font-semibold block">CRITICAL ACCLAIM</span>
          <h2 className="font-serif text-3xl font-light text-brand-text-primary tracking-wide">
            Praised by Royalty & Modern Connoisseurs
          </h2>
        </div>

        <div 
          className="flex overflow-x-auto pb-6 -mx-6 px-6 space-x-6 scrollbar-none lg:grid lg:grid-cols-3 lg:space-x-0 lg:gap-12 lg:mx-0 lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-[82vw] sm:w-[48vw] lg:w-auto flex-shrink-0 flex flex-col space-y-5 border border-brand-divider p-6 bg-brand-card hover:border-brand-gold transition-colors duration-300 lg:border-0 lg:p-0 lg:bg-transparent">
            <div className="flex text-brand-gold space-x-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" strokeWidth={0} />)}
            </div>
            <p className="font-serif text-sm italic text-brand-text-secondary leading-relaxed flex-1">
              "To eat the original Butter Chicken at Moti Mahal is to understand the history of modern Indian cuisine. The velvety balance of cream, spice, and smoke is completely unmatched anywhere else."
            </p>
            <div className="border-t border-brand-divider/60 pt-4 flex items-center justify-between">
              <div>
                <span className="block font-sans text-[10px] font-semibold tracking-wider uppercase text-brand-text-primary">Michelin Guide Review</span>
                <span className="font-sans text-[8px] text-brand-text-muted uppercase tracking-wider block mt-0.5">International Authority</span>
              </div>
              <Quote size={14} className="text-brand-gold/30" />
            </div>
          </div>

          <div className="w-[82vw] sm:w-[48vw] lg:w-auto flex-shrink-0 flex flex-col space-y-5 border border-brand-divider p-6 bg-brand-card hover:border-brand-gold transition-colors duration-300 lg:border-l lg:border-brand-divider/60 lg:pl-12 lg:border-y-0 lg:border-r-0 lg:p-0 lg:bg-transparent">
            <div className="flex text-brand-gold space-x-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" strokeWidth={0} />)}
            </div>
            <p className="font-serif text-sm italic text-brand-text-secondary leading-relaxed flex-1">
              "Moti Mahal has maintained its recipe integrity for over a century. The Dal Makhani is legendary, cooked slow over wood embers till it achieves a deep, buttery complexity."
            </p>
            <div className="border-t border-brand-divider/60 pt-4 flex items-center justify-between">
              <div>
                <span className="block font-sans text-[10px] font-semibold tracking-wider uppercase text-brand-text-primary">Sovereign Gourmet Club</span>
                <span className="font-sans text-[8px] text-brand-text-muted uppercase tracking-wider block mt-0.5">Centenary Gastronomy</span>
              </div>
              <Quote size={14} className="text-brand-gold/30" />
            </div>
          </div>

          <div className="w-[82vw] sm:w-[48vw] lg:w-auto flex-shrink-0 flex flex-col space-y-5 border border-brand-divider p-6 bg-brand-card hover:border-brand-gold transition-colors duration-300 lg:border-l lg:border-brand-divider/60 lg:pl-12 lg:border-y-0 lg:border-r-0 lg:p-0 lg:bg-transparent">
            <div className="flex text-brand-gold space-x-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" strokeWidth={0} />)}
            </div>
            <p className="font-serif text-sm italic text-brand-text-secondary leading-relaxed flex-1">
              "Their tandoori breads are incredibly light and perfectly crisped. Every single order is hand-made to perfection. Truly the golden standard of North Indian fine dining."
            </p>
            <div className="border-t border-brand-divider/60 pt-4 flex items-center justify-between">
              <div>
                <span className="block font-sans text-[10px] font-semibold tracking-wider uppercase text-brand-text-primary">The New York Journal</span>
                <span className="font-sans text-[8px] text-brand-text-muted uppercase tracking-wider block mt-0.5">Global Food Columnist</span>
              </div>
              <Quote size={14} className="text-brand-gold/30" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
