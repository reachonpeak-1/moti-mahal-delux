/**
 * ReservationsManager.tsx
 * Management interface for Table Reservations.
 * Allows approval, rejection, completion, and recording admin notes for table bookings.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Check, X, Loader2, Eye, Calendar, Users, Clock, Mail, Phone, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllReservations, updateReservationStatus } from '../services/reservationService';
import type { Reservation, ReservationStatus } from '../types';

export default function ReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const unsub = getAllReservations((data) => {
      setReservations(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenDetailModal = (res: Reservation) => {
    setSelectedReservation(res);
    setAdminNotes(res.adminNotes || '');
  };

  const handleUpdateStatus = async (id: string, status: ReservationStatus, notes?: string) => {
    try {
      await updateReservationStatus(id, status, notes || adminNotes);
      toast.success(`Reservation status updated to ${status}`);
      if (selectedReservation && selectedReservation.id === id) {
        setSelectedReservation((prev) => prev ? { ...prev, status, adminNotes: notes || adminNotes } : null);
      }
    } catch {
      toast.error('Failed to update reservation status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReservation) return;
    try {
      setSavingNotes(true);
      await updateReservationStatus(selectedReservation.id, selectedReservation.status, adminNotes);
      toast.success('Admin notes saved successfully');
      setSelectedReservation((prev) => prev ? { ...prev, adminNotes } : null);
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Filter logic
  const filteredReservations = reservations.filter((res) => {
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    const matchesDate = !selectedDate || res.date === selectedDate;
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.phone.includes(searchQuery);

    return matchesStatus && matchesDate && matchesSearch;
  });

  const statusColors: Record<ReservationStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    completed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-48 h-6 rounded bg-brand-bg-secondary animate-pulse mb-2" />
          <div className="w-72 h-4 rounded bg-brand-bg-secondary animate-pulse" />
        </div>
        <div className="bg-brand-card border border-brand-divider rounded-xl overflow-hidden animate-pulse">
          <div className="h-12 bg-brand-bg-secondary border-b border-brand-divider" />
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-brand-divider last:border-b-0">
                <div className="w-1/4 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/6 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/12 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/6 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/12 h-6 rounded bg-brand-bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-white">Reservations</h1>
        <p className="text-xs text-slate-400">Manage fine-dining table bookings and statuses</p>
      </div>

      {/* Filter and search bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="w-full md:w-48">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Clear Date
          </button>
        )}
      </div>

      {filteredReservations.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700/50">
          <CalendarDays className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 text-sm">No reservations found</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Guests</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{res.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{res.email}</p>
                        <p className="text-[10px] text-slate-500">{res.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-amber-400">{res.guests} Pax</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white">{res.date}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{res.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 border text-[10px] uppercase font-semibold tracking-wider ${
                          statusColors[res.status] || 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetailModal(res)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {res.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(res.id, 'approved')}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded transition-colors"
                              title="Approve Booking"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(res.id, 'rejected')}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition-colors"
                              title="Reject Booking"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {res.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(res.id, 'completed')}
                            className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded transition-colors"
                            title="Mark Completed"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reservation Details Modal */}
      <AnimatePresence>
        {selectedReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReservation(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full shadow-2xl overflow-hidden z-10"
            >
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-lg text-white">Reservation Details</h3>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Customer details */}
                  <div className="bg-slate-950 p-4 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users size={14} className="text-amber-500" />
                      <span className="font-semibold text-white">{selectedReservation.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-mono">
                      <Mail size={14} />
                      <span>{selectedReservation.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-mono">
                      <Phone size={14} />
                      <span>{selectedReservation.phone}</span>
                    </div>
                  </div>

                  {/* Booking details */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 border border-slate-800 text-center">
                    <div>
                      <Calendar size={16} className="text-amber-500 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Date</p>
                      <p className="font-semibold text-white mt-0.5">{selectedReservation.date}</p>
                    </div>
                    <div>
                      <Clock size={16} className="text-amber-500 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Time</p>
                      <p className="font-semibold text-white mt-0.5">{selectedReservation.time}</p>
                    </div>
                    <div>
                      <Users size={16} className="text-amber-500 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Guests</p>
                      <p className="font-semibold text-white mt-0.5">{selectedReservation.guests} Pax</p>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {selectedReservation.specialRequests && (
                    <div>
                      <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-1">
                        Special Requests
                      </label>
                      <div className="bg-slate-950 border border-slate-800 p-3 text-slate-300 italic leading-relaxed">
                        "{selectedReservation.specialRequests}"
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add dining table allocation, customer preferences or staff instructions..."
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex gap-2 justify-between pt-4 border-t border-slate-800">
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="bg-slate-800 hover:bg-slate-750 text-white px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-slate-700"
                    >
                      {savingNotes ? <Loader2 size={12} className="animate-spin" /> : null}
                      Save Notes
                    </button>

                    <div className="flex gap-2">
                      {selectedReservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(selectedReservation.id, 'rejected')}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-2.5 font-semibold uppercase tracking-wider"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedReservation.id, 'approved')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 font-semibold uppercase tracking-wider"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {selectedReservation.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedReservation.id, 'completed')}
                          className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2.5 font-semibold uppercase tracking-wider"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
