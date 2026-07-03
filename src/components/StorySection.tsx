/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, ShieldCheck, Flame, Sparkles } from 'lucide-react';

export default function StorySection() {
  return (
    <section id="story-section" className="py-24 bg-brand-bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column - High-End Large Atmospheric Photo */}
        <div className="lg:col-span-5 relative">
          <div className="aspect-[4/5] overflow-hidden border border-brand-divider relative shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center hover:scale-105 transition-transform duration-[4000ms] ease-out"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800')`,
              }}
            />
            {/* Soft gold sepia filter overlay */}
            <div className="absolute inset-0 bg-brand-gold/5 mix-blend-color" />
          </div>

          {/* Symmetrical Floating Year Tag */}
          <div className="absolute -bottom-6 -right-6 bg-brand-text-primary text-brand-surface p-6 border border-brand-gold shadow-lg text-center min-w-[130px]">
            <span className="block font-serif text-3xl font-light tracking-widest text-brand-gold">GK</span>
            <span className="block font-sans text-[8px] tracking-[0.3em] text-brand-bg-secondary uppercase mt-1">REGENCY</span>
          </div>
        </div>

        {/* Right Column - Premium Editorial Storytelling */}
        <div className="lg:col-span-7 space-y-8 lg:pl-6">
          <div className="space-y-3">
            <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-text-muted">GK REGENCY COMPLEX</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-primary tracking-wide leading-tight">
              A landmark of luxury,<br />banqueting, and dining.
            </h2>
          </div>

          <div className="w-20 h-[1.5px] bg-brand-gold" />

          <p className="font-sans text-xs sm:text-sm text-brand-text-secondary leading-relaxed max-w-xl">
            Located at Ganpati Enclave, Dabwali Road in Bathinda, G.K. Regency represents the pinnacle of hospitality. Designed to offer a premium boutique environment, the hotel features elegant rooms and suites, free high-speed Wi-Fi, elevator access, full power backup, laundry service, and an on-site health gym.
          </p>

          <p className="font-sans text-xs sm:text-sm text-brand-text-secondary leading-relaxed max-w-xl">
            The complex is home to the majestic **Regency Banquet Hall**, a favorite destination for grand weddings and corporate milestones, alongside **Moti Mahal Delux**, serving the world-famous tandoori recipes and 100-year-old culinary traditions.
          </p>

          {/* Three exquisite icons showcasing pedigree */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-brand-divider">
            <div className="space-y-2">
              <div className="text-brand-gold"><Sparkles size={18} /></div>
              <h4 className="font-serif text-sm font-medium text-brand-text-primary">Boutique Stays</h4>
              <p className="font-sans text-[10px] text-brand-text-muted uppercase tracking-wider">Luxury Rooms</p>
            </div>

            <div className="space-y-2">
              <div className="text-brand-gold"><Flame size={18} /></div>
              <h4 className="font-serif text-sm font-medium text-brand-text-primary">Grand Banquets</h4>
              <p className="font-sans text-[10px] text-brand-text-muted uppercase tracking-wider">Weddings & Galas</p>
            </div>

            <div className="space-y-2">
              <div className="text-brand-gold"><Award size={18} /></div>
              <h4 className="font-serif text-sm font-medium text-brand-text-primary">Moti Mahal</h4>
              <p className="font-sans text-[10px] text-brand-text-muted uppercase tracking-wider">Legendary Taste</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
