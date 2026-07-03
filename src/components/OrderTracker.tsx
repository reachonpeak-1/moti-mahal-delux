/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChefHat, Bike, ShieldCheck, CheckCircle2, Flame, MapPin, X } from 'lucide-react';
import { Order } from '../types';

interface OrderTrackerProps {
  activeOrder: Order | null;
  onClose: () => void;
}

export default function OrderTracker({ activeOrder, onClose }: OrderTrackerProps) {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [statusIndex, setStatusIndex] = useState(0);

  // Status step configuration
  const steps = [
    { label: 'Hearth Received', desc: 'Order entered into our master kitchen ledger.', icon: ShieldCheck },
    { label: 'Chef Blending Spices', desc: 'Master artisans cooking over charcoal embers.', icon: ChefHat },
    { label: 'Carrier Departing', desc: 'Sovereign temperature-controlled carrier is on the way.', icon: Bike },
    { label: 'Arrived at Sanctuary', desc: 'The meal is placed on your table with elegance.', icon: MapPin }
  ];

  useEffect(() => {
    if (!activeOrder) return;

    // Fast simulated status changes for interactive delight
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(statusTimer);
        return prev;
      });
    }, 15000); // Advance status every 15 seconds for demonstration

    // Timer tick
    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(statusTimer);
      clearInterval(countdownTimer);
    };
  }, [activeOrder]);

  if (!activeOrder) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentStep = steps[statusIndex];

  return (
    <AnimatePresence>
      <div id="order-tracker-floating-box" className="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-brand-surface border-2 border-brand-gold p-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-brand-text-muted hover:text-brand-text-primary p-0.5 focus:outline-none"
          aria-label="Dismiss tracker"
        >
          <X size={14} />
        </button>

        {/* Header with live green flashing pulse */}
        <div className="flex items-center space-x-2.5 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-success"></span>
          </span>
          <span className="font-sans text-[9px] tracking-[0.3em] text-brand-gold uppercase font-bold">Banquet Dispatch Tracker</span>
        </div>

        {/* Simulated Progress Details */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-serif text-lg font-medium text-brand-text-primary">
                Order #{activeOrder.id.slice(0, 8).toUpperCase()}
              </h4>
              <p className="font-sans text-[10px] text-brand-text-secondary mt-0.5 uppercase tracking-wider">
                Recipient: {activeOrder.customerName}
              </p>
            </div>

            {/* Simulated Live Timer */}
            <div className="text-right flex items-center space-x-1 bg-brand-bg-primary py-1 px-2.5 border border-brand-divider">
              <Clock size={12} className="text-brand-gold" />
              <span className="font-mono text-xs font-bold text-brand-text-primary">
                {minutes}:{seconds < 10 ? '0' + seconds : seconds}
              </span>
            </div>
          </div>

          {/* Current Step Big Icon Indicator */}
          <div className="flex items-center space-x-3 bg-brand-bg-secondary p-3 border border-brand-divider">
            <div className="h-10 w-10 rounded-full bg-brand-surface text-brand-gold flex items-center justify-center border border-brand-gold/20">
              {React.createElement(currentStep.icon, { size: 20 })}
            </div>
            <div>
              <span className="font-serif text-xs italic font-semibold text-brand-gold">Current Status</span>
              <h5 className="font-sans text-[11px] font-bold text-brand-text-primary uppercase tracking-wider">{currentStep.label}</h5>
              <p className="font-sans text-[10px] text-brand-text-secondary line-clamp-1">{currentStep.desc}</p>
            </div>
          </div>

          {/* Graphical Stepper Progress bar */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {steps.map((step, idx) => {
              const isPast = idx < statusIndex;
              const isActive = idx === statusIndex;
              return (
                <div key={idx} className="space-y-1">
                  <div className={`h-1.5 w-full transition-colors duration-500 ${
                    isActive ? 'bg-brand-gold' : isPast ? 'bg-brand-success' : 'bg-brand-divider'
                  }`} />
                  <span className={`block font-sans text-[7px] text-center uppercase tracking-widest leading-none ${
                    isActive ? 'text-brand-gold font-bold' : isPast ? 'text-brand-success' : 'text-brand-text-muted'
                  }`}>
                    {step.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Little footer reminder */}
          <div className="text-center border-t border-brand-divider pt-3 text-[9px] font-sans text-brand-text-muted leading-tight">
            Est. Arrival time: <span className="font-semibold text-brand-text-primary">{activeOrder.deliveryTime}</span> • Tracking with absolute safety.
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
