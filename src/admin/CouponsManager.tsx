/**
 * CouponsManager.tsx
 * Management interface for Promotional Coupons.
 * Handles Coupon CRUD, auto-generation, date validation, and tracking usage.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Plus, Edit2, Trash2, X, Check, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../services/couponService';
import type { Coupon, CouponType } from '../types';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState(0);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(100);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = getAllCoupons((data) => {
      setCoupons(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setCode('');
    setType('percentage');
    setValue(0);
    setMinOrderValue(0);
    setMaxDiscount(0);
    setUsageLimit(100);
    
    // Default valid dates (today to next month)
    const today = new Date().toISOString().split('T')[0];
    const nextMonthObj = new Date();
    nextMonthObj.setMonth(nextMonthObj.getMonth() + 1);
    const nextMonth = nextMonthObj.toISOString().split('T')[0];

    setValidFrom(today);
    setValidTo(nextMonth);
    setIsActive(true);
    setCurrentCoupon(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setCurrentCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value);
    setMinOrderValue(coupon.minOrderValue);
    setMaxDiscount(coupon.maxDiscount || 0);
    setUsageLimit(coupon.usageLimit);
    setValidFrom(coupon.validFrom.split('T')[0]);
    setValidTo(coupon.validTo.split('T')[0]);
    setIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'MOTI';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (value <= 0) {
      toast.error('Coupon value must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      const couponData = {
        code: code.toUpperCase().replace(/\s+/g, ''),
        type,
        value: Number(value),
        minOrderValue: Number(minOrderValue),
        maxDiscount: type === 'percentage' ? Number(maxDiscount) : undefined,
        usageLimit: Number(usageLimit),
        validFrom: new Date(validFrom).toISOString(),
        validTo: new Date(validTo).toISOString(),
        isActive,
      };

      if (currentCoupon) {
        await updateCoupon(currentCoupon.id, couponData);
        toast.success('Coupon updated successfully');
      } else {
        await createCoupon({
          ...couponData,
          usedCount: 0,
        });
        toast.success('Coupon created successfully');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeleteId) return;
    try {
      await deleteCoupon(selectedDeleteId);
      toast.success('Coupon deleted successfully');
      setIsDeleteConfirmOpen(false);
      setSelectedDeleteId(null);
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      toast.success(`Coupon ${coupon.code} is now ${!coupon.isActive ? 'active' : 'inactive'}`);
    } catch {
      toast.error('Failed to update coupon status');
    }
  };

  const getStatus = (coupon: Coupon) => {
    const now = new Date();
    const expiry = new Date(coupon.validTo);
    if (!coupon.isActive) return 'inactive';
    if (now > expiry) return 'expired';
    if (coupon.usedCount >= coupon.usageLimit) return 'exhausted';
    return 'active';
  };

  const statusBadges: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    expired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    exhausted: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    inactive: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
                <div className="w-1/5 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/6 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/6 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/12 h-6 rounded bg-brand-bg-secondary" />
                <div className="w-1/6 h-4 rounded bg-brand-bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl text-white">Coupons</h1>
          <p className="text-xs text-slate-400">Manage promo codes and customer discounts</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700/50">
          <Ticket className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 text-sm">No coupons found</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Promo Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Min. Order</th>
                  <th className="px-6 py-4">Max. Discount</th>
                  <th className="px-6 py-4">Usage (Used / Limit)</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {coupons.map((coupon) => {
                  const status = getStatus(coupon);
                  return (
                    <tr key={coupon.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1.5 border border-slate-700">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {coupon.type === 'percentage' ? `${coupon.value}% Off` : `₹${coupon.value} Off`}
                      </td>
                      <td className="px-6 py-4 font-mono">₹{coupon.minOrderValue}</td>
                      <td className="px-6 py-4 font-mono">
                        {coupon.maxDiscount ? `₹${coupon.maxDiscount}` : 'No Cap'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{coupon.usedCount}</span>
                          <span className="text-slate-500">/</span>
                          <span>{coupon.usageLimit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p>{new Date(coupon.validTo).toLocaleDateString('en-IN')}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Expires</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`px-2.5 py-1 border text-[10px] uppercase font-semibold tracking-wider ${
                            statusBadges[status] || 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-amber-400 border border-slate-700 rounded transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDeleteId(coupon.id);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-700 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                  <h3 className="font-serif text-lg text-white">
                    {currentCoupon ? 'Edit Coupon' : 'Create Coupon'}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g. WELCOME50"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 flex items-center justify-center text-slate-400 hover:text-amber-400 rounded transition-colors"
                        title="Generate Random Code"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Coupon Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                        Discount Type
                      </label>
                      <div className="flex border border-slate-700 rounded overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setType('percentage')}
                          className={`flex-1 py-2 text-xs transition-all ${
                            type === 'percentage'
                              ? 'bg-amber-500 text-slate-950 font-semibold'
                              : 'text-slate-400 hover:text-white bg-slate-800'
                          }`}
                        >
                          Percentage (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('flat')}
                          className={`flex-1 py-2 text-xs transition-all ${
                            type === 'flat'
                              ? 'bg-amber-500 text-slate-950 font-semibold'
                              : 'text-slate-400 hover:text-white bg-slate-800'
                          }`}
                        >
                          Flat (₹)
                        </button>
                      </div>
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                        {type === 'percentage' ? 'Percentage Value (%)' : 'Flat Value (₹)'}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Minimum Order Value */}
                    <div>
                      <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                        Min. Order Value (₹)
                      </label>
                      <input
                        type="number"
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    {/* Maximum Discount Cap (Percentage only) */}
                    <div>
                      <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                        Max. Discount Cap (₹)
                      </label>
                      <input
                        type="number"
                        value={maxDiscount}
                        disabled={type === 'flat'}
                        onChange={(e) => setMaxDiscount(Math.max(0, Number(e.target.value)))}
                        placeholder={type === 'flat' ? 'N/A' : '0 for no cap'}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-55 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Validity Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                        Valid From
                      </label>
                      <input
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                        Valid To (Expiry)
                      </label>
                      <input
                        type="date"
                        value={validTo}
                        onChange={(e) => setValidTo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between py-2 border-t border-slate-800">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">
                      Active Status
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? 'bg-amber-500' : 'bg-slate-750'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                          isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3 text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : currentCoupon ? (
                      'Save Changes'
                    ) : (
                      'Create Coupon'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-sm w-full shadow-2xl z-10"
            >
              <h3 className="font-serif text-lg text-white mb-2">Delete Coupon?</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Are you sure you want to delete this coupon? Customers will no longer be able to apply this promo code during checkout.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
