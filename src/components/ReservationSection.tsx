/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, Clock, Mail, Phone, User, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createReservation } from '../services/reservationService';
import toast from 'react-hot-toast';

export default function ReservationSection() {
  const { user, userProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [requests, setRequests] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prefill details if user logged in
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !date || !time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await createReservation({
        customerId: user?.uid || '',
        name,
        email,
        phone,
        guests: Number(guests),
        date,
        time,
        specialRequests: requests,
        status: 'pending',
      });
      setIsConfirmed(true);
      toast.success('Banquet table booking request sent!');
    } catch {
      toast.error('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reservation-section" className="py-24 bg-brand-bg-secondary border-t border-brand-divider">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Authentic, Warm Candle-lit Luxury Table Photo */}
        <div className="lg:col-span-6 relative">
          <div className="aspect-square md:aspect-[4/3] lg:aspect-[4/5] overflow-hidden border border-brand-divider relative shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center hover:scale-102 transition-transform duration-[4000ms] ease-out"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800')`,
              }}
            />
            {/* Soft dark sepia filter */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-text-primary/95 via-brand-text-primary/30 to-transparent" />

            {/* Float text badge */}
            <div className="absolute bottom-8 left-8 right-8 text-left text-brand-surface space-y-2">
              <span className="font-sans text-[9px] tracking-[0.4em] text-brand-gold uppercase block">THE SANCTUARY</span>
              <h3 className="font-serif text-2xl font-light text-brand-bg-primary tracking-wide">
                Secure Your Place at the Fire
              </h3>
              <p className="font-sans text-xs text-brand-bg-secondary/80 leading-relaxed max-w-sm">
                Reserve your dining space under our copper domes and experience sensory excellence curated for culinary enthusiasts.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Table Reservation Card */}
        <div className="lg:col-span-6 relative z-10">
          <AnimatePresence mode="wait">
            {!isConfirmed ? (
              /* THE BOOKING FORM */
              <motion.div
                key="booking-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.6 }}
                className="bg-brand-surface p-8 md:p-10 border border-brand-divider shadow-xl relative"
              >
                {/* Thin inner gold luxury line */}
                <div className="absolute inset-2 border border-brand-gold/10 pointer-events-none" />

                <div className="text-center md:text-left mb-8 space-y-1">
                  <span className="font-sans text-[10px] tracking-[0.4em] text-brand-gold uppercase block">BANQUET TABLE</span>
                  <h3 className="font-serif text-2xl font-light text-brand-text-primary tracking-wide">
                    Imperial Table Reservation
                  </h3>
                </div>

                <form onSubmit={handleBooking} className="space-y-4 relative z-10">
                  
                  {/* Name field */}
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-brand-bg-primary text-brand-text-primary border border-brand-divider py-3.5 pl-10 pr-4 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-muted"
                      required
                    />
                  </div>

                  {/* Contact details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-brand-bg-primary text-brand-text-primary border border-brand-divider py-3.5 pl-10 pr-4 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-muted"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-brand-bg-primary text-brand-text-primary border border-brand-divider py-3.5 pl-10 pr-4 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-muted"
                        required
                      />
                    </div>
                  </div>

                  {/* Guest count, Date, Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Guests selector */}
                    <div className="relative flex items-center bg-brand-bg-primary border border-brand-divider px-3.5 py-2">
                      <Users size={13} className="text-brand-text-muted mr-2" />
                      <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full bg-transparent text-brand-text-primary font-sans text-xs focus:outline-none rounded-none cursor-pointer"
                      >
                        <option value={2}>2 Guests</option>
                        <option value={4}>4 Guests</option>
                        <option value={6}>6 Guests</option>
                        <option value={8}>8 Guests</option>
                        <option value={12}>Private Chamber (12+)</option>
                      </select>
                    </div>

                    {/* Date picker */}
                    <div className="relative flex items-center bg-brand-bg-primary border border-brand-divider px-3.5 py-2">
                      <Calendar size={13} className="text-brand-text-muted mr-2" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-transparent text-brand-text-primary font-sans text-xs focus:outline-none rounded-none cursor-pointer"
                        required
                      />
                    </div>

                    {/* Time selection */}
                    <div className="relative flex items-center bg-brand-bg-primary border border-brand-divider px-3.5 py-2">
                      <Clock size={13} className="text-brand-text-muted mr-2" />
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-transparent text-brand-text-primary font-sans text-xs focus:outline-none rounded-none cursor-pointer"
                        required
                      >
                        <option value="">Select Time</option>
                        <option value="12:30 PM">12:30 PM</option>
                        <option value="1:30 PM">1:30 PM</option>
                        <option value="6:00 PM">6:00 PM</option>
                        <option value="7:00 PM">7:00 PM</option>
                        <option value="8:00 PM">8:00 PM</option>
                        <option value="9:30 PM">9:30 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <textarea
                      placeholder="Special Demands (E.g. Table near the clay oven view, anniversary flowers, wheelchair access...)"
                      value={requests}
                      onChange={(e) => setRequests(e.target.value)}
                      rows={3}
                      className="w-full bg-brand-bg-primary text-brand-text-primary border border-brand-divider p-3.5 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-muted"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-text-primary hover:bg-brand-gold text-brand-surface font-sans text-xs tracking-widest uppercase py-4 px-6 transition-all duration-300 focus:outline-none flex justify-center items-center space-x-2 shadow-md"
                  >
                    {loading ? (
                      <span className="animate-pulse">TRANSMITTING PETITION...</span>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-brand-gold" />
                        <span>Authorize Reservation</span>
                      </>
                    )}
                  </button>

                </form>
              </motion.div>
            ) : (
              /* EXQUISITE SUCCESS LETTER SCREEN */
              <motion.div
                key="booking-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-brand-surface p-8 md:p-12 border border-brand-gold shadow-2xl text-center relative"
              >
                {/* Vintage ornamental borders */}
                <div className="absolute inset-3 border border-brand-gold/20 pointer-events-none" />

                <div className="h-14 w-14 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto mb-6">
                  <Check size={26} strokeWidth={2.5} />
                </div>

                <span className="font-sans text-[10px] tracking-[0.4em] text-brand-gold uppercase block">BOOKING CONFIRMED</span>
                <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-text-primary tracking-wide mt-2">
                  The Table Awaits You
                </h3>

                <div className="w-16 h-[1.5px] bg-brand-gold mx-auto my-6" />

                {/* Simulated Wax Seal Card letter details */}
                <div className="font-serif italic text-sm text-brand-text-secondary space-y-4 max-w-sm mx-auto leading-relaxed">
                  <p>
                    Greetings, Honored Guest <span className="font-sans not-italic text-xs font-bold text-brand-text-primary uppercase tracking-widest">{name}</span>.
                  </p>
                  <p>
                    We have reserved our premium sanctuary space for you on <span className="font-sans not-italic text-xs font-bold text-brand-text-primary">{date}</span> at <span className="font-sans not-italic text-xs font-bold text-brand-text-primary">{time}</span> for <span className="font-sans not-italic text-xs font-bold text-brand-text-primary">{guests} guests</span>.
                  </p>
                  {requests && (
                    <p className="text-xs text-brand-text-muted">
                      Your special instructions: "{requests}" have been logged into our chef registry.
                    </p>
                  )}
                  <p className="text-xs font-sans not-italic uppercase tracking-widest text-brand-text-muted mt-8 border-t border-brand-divider pt-6">
                    A verification invitation has been sent to {email}.
                  </p>
                </div>

                <button
                  onClick={() => setIsConfirmed(false)}
                  className="mt-8 border border-brand-text-primary hover:border-brand-gold hover:bg-brand-gold hover:text-brand-surface text-brand-text-primary py-2.5 px-6 text-[10px] tracking-widest uppercase font-sans transition-all duration-300 focus:outline-none"
                >
                  Configure Another Table
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
