/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReservationSection from '../components/ReservationSection';
import { Calendar, Phone, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function ReservationView() {
  const { settings } = useSettings();
  return (
    <div id="reservation-view-stage" className="space-y-16 pt-24 pb-12">
      
      {/* Visual Header Banner for standalone booking */}
      <section className="max-w-4xl mx-auto px-6 text-center space-y-4">
        <span className="font-sans text-[10px] tracking-[0.4em] text-brand-gold uppercase block">THE ROYAL DESK</span>
        <h1 className="font-serif text-3xl md:text-5xl font-light text-brand-text-primary tracking-wide leading-tight">
          Securing Your Sanctuary Table
        </h1>
        <p className="font-sans text-xs text-brand-text-secondary leading-relaxed max-w-xl mx-auto">
          Indulge in a century of culinary excellence. Select your preferred date, hour, and custom arrangements below. Your sanctuary is fully secured upon confirmation.
        </p>
      </section>

      {/* Standalone informational panel */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        
        <div className="bg-brand-card border border-brand-divider p-8 space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full bg-brand-bg-secondary flex items-center justify-center text-brand-gold">
            <Clock size={16} />
          </div>
          <h3 className="font-serif text-sm font-medium text-brand-text-primary">Ceremonial Hours</h3>
          <p className="font-sans text-xs text-brand-text-secondary">
            Lunch: 12:00 PM – 3:30 PM<br />
            Dinner: 6:00 PM – 11:30 PM
          </p>
        </div>

        <div className="bg-brand-card border border-brand-divider p-8 space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full bg-brand-bg-secondary flex items-center justify-center text-brand-gold">
            <ShieldCheck size={16} />
          </div>
          <h3 className="font-serif text-sm font-medium text-brand-text-primary">Dress Code</h3>
          <p className="font-sans text-xs text-brand-text-secondary">
            Smart Casual / Formal.<br />
            We request elegant evening attire.
          </p>
        </div>

        <div className="bg-brand-card border border-brand-divider p-8 space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full bg-brand-bg-secondary flex items-center justify-center text-brand-gold">
            <MapPin size={16} />
          </div>
          <h3 className="font-serif text-sm font-medium text-brand-text-primary">Sanctuary Location</h3>
          <p className="font-sans text-xs text-brand-text-secondary">
            {settings?.address || 'Ganpati Enclave, Dabwali Road, Bathinda, Punjab 151001, India'}
          </p>
        </div>

      </section>

      {/* Interactive Reservation Form */}
      <ReservationSection />

      {/* Standalone footer call to action */}
      <section className="max-w-3xl mx-auto px-6 text-center pt-8 border-t border-brand-divider">
        <p className="font-serif text-xs italic text-brand-text-secondary">
          For groups exceeding twelve guests or custom banqueting arrangements, kindly call our master of ceremonies directly.
        </p>
        <div className="flex items-center justify-center space-x-2 text-brand-gold mt-4 font-mono text-xs">
          <Phone size={14} />
          <span className="font-bold">{settings?.phone || '+91 98765 43210'}</span>
        </div>
      </section>

    </div>
  );
}
