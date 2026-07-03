/**
 * TrackOrderView.tsx
 * Real-time order tracking component.
 * Connects to Firestore to listen for status changes and displays cooking/delivery progress.
 */

import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, Bike, ShieldCheck, MapPin, Search, ArrowRight, Sparkles, AlertTriangle, MessageSquare, Star, Loader2 } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { submitReview } from '../services/reviewService';
import toast from 'react-hot-toast';

interface TrackOrderViewProps {
  activeOrder: Order | null;
}

export default function TrackOrderView({ activeOrder: initialActiveOrder }: TrackOrderViewProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(initialActiveOrder);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  
  // Review submission state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewedItemId, setReviewedItemId] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Status index mapping
  const getStatusIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'received':
        return 0;
      case 'confirmed':
      case 'preparing':
        return 1;
      case 'ready':
      case 'on_the_way':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  // 1. Subscribe to the order document dynamically from Firestore
  useEffect(() => {
    let activeId = order?.id || initialActiveOrder?.id;

    if (!activeId && user) {
      // Find user's most recent active order
      setLoading(true);
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      getDocs(q).then((snap) => {
        if (!snap.empty) {
          const docData = snap.docs[0];
          const latestOrder = { id: docData.id, ...docData.data() } as Order;
          if (latestOrder.status !== 'delivered' && latestOrder.status !== 'cancelled') {
            setOrder(latestOrder);
          }
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
      return;
    }

    if (!activeId) return;

    // Real-time subscription to order doc
    const unsub = onSnapshot(doc(db, 'orders', activeId), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      }
    });

    return () => unsub();
  }, [initialActiveOrder, user]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    const unsub = onSnapshot(doc(db, 'orders', searchId.trim()), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
        setSearchId('');
      } else {
        toast.error('Order not found. Please check the ID.');
      }
      setLoading(false);
    }, () => {
      setLoading(false);
      toast.error('Failed to look up order.');
    });
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !order || !reviewedItemId) return;

    const item = order.items.find((i) => i.menuItem.id === reviewedItemId)?.menuItem;
    if (!item) return;

    try {
      setSubmittingReview(true);
      await submitReview({
        customerId: user.uid,
        customerName: user.displayName || 'Moti Mahal Guest',
        customerPhoto: user.photoURL || '',
        orderId: order.id,
        menuItemId: item.id,
        menuItemName: item.name,
        rating,
        reviewText,
        status: 'pending',
      });
      toast.success('Thank you! Review submitted for moderation.');
      setReviewSubmitted(true);
      setReviewText('');
    } catch {
      toast.error('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const steps = [
    { label: 'Hearth Received', desc: 'Order entered into our master kitchen ledger.', icon: ShieldCheck },
    { label: 'Chef Blending Spices', desc: 'Master artisans cooking over charcoal embers.', icon: ChefHat },
    { label: 'Carrier Departing', desc: 'Sovereign temperature-controlled carrier is on the way.', icon: Bike },
    { label: 'Arrived at Sanctuary', desc: 'The meal is placed on your table with elegance.', icon: MapPin }
  ];

  const statusIndex = order ? getStatusIndex(order.status) : 0;

  return (
    <div id="track-order-view-stage" className="max-w-4xl mx-auto px-6 pt-32 pb-16 space-y-12 min-h-[75vh]">
      
      <div className="text-center space-y-2">
        <span className="font-sans text-[10px] tracking-[0.45em] text-brand-gold uppercase block">DISPATCH TERMINAL</span>
        <h1 className="font-serif text-3xl md:text-5xl font-light text-brand-text-primary tracking-wide leading-tight">
          Banquet Order Tracker
        </h1>
        <p className="font-sans text-xs text-brand-text-secondary leading-relaxed max-w-lg mx-auto">
          Monitor your royal culinary journey in real-time. Below is the precise location and stage of your hearth preparation.
        </p>
      </div>

      {/* Manual Search */}
      <form onSubmit={handleSearchOrder} className="max-w-md mx-auto flex border border-brand-divider p-2 bg-brand-card">
        <Search size={16} className="text-brand-text-secondary ml-2 mr-3 self-center" />
        <input
          type="text"
          placeholder="Lookup another order ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="w-full bg-transparent text-brand-text-primary font-sans text-xs focus:outline-none py-1"
        />
        <button
          type="submit"
          disabled={loading || !searchId.trim()}
          className="font-sans text-[10px] tracking-wider text-brand-gold uppercase hover:text-brand-text-primary px-2 disabled:opacity-40"
        >
          Track
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : order ? (
        <div className="bg-brand-card border border-brand-divider p-8 space-y-8 relative">
          <div className="absolute inset-2 border border-brand-gold/5 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 border-b border-brand-divider pb-6 relative z-10">
            <div>
              {order.status === 'cancelled' ? (
                <span className="relative inline-flex items-center space-x-2 bg-rose-500/10 px-3 py-1 border border-rose-500/20 text-[9px] font-mono tracking-widest text-rose-450 uppercase mb-3">
                  <AlertTriangle size={10} className="mr-1" />
                  <span>Sovereign Order Cancelled</span>
                </span>
              ) : (
                <span className="relative inline-flex items-center space-x-2 bg-brand-bg-secondary px-3 py-1 border border-brand-gold/10 text-[9px] font-mono tracking-widest text-brand-gold uppercase mb-3">
                  <span className="animate-ping absolute left-1 inline-flex h-1.5 w-1.5 rounded-full bg-brand-success opacity-75"></span>
                  <span className="relative h-1.5 w-1.5 rounded-full bg-brand-success mr-1"></span>
                  <span>Active Sovereign Dispatch</span>
                </span>
              )}
              
              <h2 className="font-serif text-2xl font-light text-brand-text-primary">
                Order #{order.id.slice(0, 12).toUpperCase()}
              </h2>
              <p className="font-sans text-xs text-brand-text-secondary mt-1">
                Prepared for <span className="text-brand-text-primary font-semibold">{order.customerName}</span> • Destined for <span className="text-brand-text-primary font-semibold">{order.deliveryAddress}</span>
              </p>
            </div>

            <div className="bg-brand-bg-primary border border-brand-divider p-4 text-center min-w-[140px]">
              <span className="font-sans text-[9px] text-brand-text-secondary/50 uppercase tracking-wider block">Estimated Wait</span>
              <div className="flex items-center justify-center space-x-1.5 mt-1">
                <Clock size={16} className="text-brand-gold" />
                <span className="font-mono text-xl font-bold text-brand-text-primary">
                  {order.status === 'delivered' ? 'Completed' : order.status === 'cancelled' ? 'Cancelled' : order.orderType === 'delivery' ? '25-35 Mins' : '15-20 Mins'}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Status Indicators */}
          {order.status !== 'cancelled' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                {steps.map((step, idx) => {
                  const isPast = idx < statusIndex;
                  const isActive = idx === statusIndex;
                  const Icon = step.icon;
                  return (
                    <div
                      key={idx}
                      className={`border p-5 space-y-3 transition-all duration-500 flex flex-col justify-between ${
                        isActive
                          ? 'bg-brand-surface border-brand-gold shadow-lg ring-1 ring-brand-gold/20'
                          : isPast
                          ? 'bg-brand-bg-secondary/40 border-brand-success/30'
                          : 'bg-brand-bg-secondary/20 border-brand-divider/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                          isActive
                            ? 'bg-brand-gold text-brand-surface border-brand-gold'
                            : isPast
                            ? 'bg-brand-success/10 text-brand-success border-brand-success/20'
                            : 'bg-brand-surface text-brand-text-secondary border-brand-divider'
                        }`}>
                          <Icon size={14} />
                        </div>
                        {isPast && (
                          <span className="font-sans text-[8px] font-bold text-brand-success uppercase tracking-widest">
                            Done
                          </span>
                        )}
                        {isActive && (
                          <span className="font-sans text-[8px] font-bold text-brand-gold uppercase tracking-widest animate-pulse">
                            Active
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className={`font-serif text-sm font-medium ${isActive ? 'text-brand-gold' : 'text-brand-text-primary'}`}>
                          {step.label}
                        </h3>
                        <p className="font-sans text-[10px] text-brand-text-secondary leading-relaxed mt-1">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connecting Progress Bar */}
              <div className="relative h-1.5 bg-brand-bg-secondary overflow-hidden border border-brand-divider relative z-10">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-brand-gold transition-all duration-500"
                  style={{ width: `${((statusIndex) / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </>
          )}

          {/* Cancellation Notice */}
          {order.status === 'cancelled' && (
            <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded relative z-10">
              <h4 className="font-serif text-sm font-semibold text-rose-400 mb-2">Order Cancellation Details</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {order.cancelReason ? `Reason: "${order.cancelReason}"` : 'Your order has been cancelled by Moti Mahal hospitality staff. Please call our service counter at +1 (800) 1920-DELUX for details or refund assistance.'}
              </p>
            </div>
          )}

          {/* Itemized Inventory */}
          <div className="bg-brand-bg-secondary p-6 border border-brand-divider relative z-10">
            <h4 className="font-serif text-sm font-medium text-brand-text-primary mb-4">
              Your Dispatch Inventory
            </h4>
            <div className="divide-y divide-brand-divider">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-sans font-semibold text-brand-text-primary">
                      {item.menuItem.name} <span className="text-brand-gold font-mono">× {item.quantity}</span>
                    </span>
                    <span className="block font-sans text-[10px] text-brand-text-secondary uppercase">
                      Spice: {item.customSpice}
                    </span>
                  </div>
                  <span className="font-mono text-brand-text-primary">
                    ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-divider pt-4 mt-4 flex flex-col items-end text-xs space-y-1">
              <div className="flex justify-between w-full max-w-[200px]">
                <span className="text-brand-text-secondary">Subtotal:</span>
                <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between w-full max-w-[200px] text-brand-gold font-semibold">
                  <span>Promo Discount:</span>
                  <span className="font-mono">-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between w-full max-w-[200px]">
                <span className="text-brand-text-secondary">Luxury Surtax (5%):</span>
                <span className="font-mono">₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full max-w-[200px] border-t border-brand-divider pt-2 mt-2 font-bold text-brand-text-primary">
                <span>Grand Total:</span>
                <span className="font-mono text-brand-gold">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Feedback Form for Delivered Orders */}
          {order.status === 'delivered' && user && (
            <div className="bg-brand-bg-primary border border-brand-divider p-6 relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-brand-gold">
                <MessageSquare size={16} />
                <h4 className="font-serif text-sm font-medium">Leave Culinary Feedback</h4>
              </div>

              {reviewSubmitted ? (
                <p className="text-xs text-brand-success font-sans">
                  ✔ Thank you for sharing your experience! Your review has been submitted for moderation.
                </p>
              ) : (
                <form onSubmit={handlePostReview} className="space-y-4">
                  {/* Select menu item to review */}
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-brand-text-secondary mb-1">
                      Choose dish to review
                    </label>
                    <select
                      value={reviewedItemId}
                      onChange={(e) => setReviewedItemId(e.target.value)}
                      className="w-full bg-brand-surface border border-brand-divider p-2.5 text-xs text-brand-text-primary focus:outline-none"
                      required
                    >
                      <option value="">-- Select a dish --</option>
                      {order.items.map((i) => (
                        <option key={i.menuItem.id} value={i.menuItem.id}>
                          {i.menuItem.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rating stars */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-brand-text-secondary">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="focus:outline-none"
                        >
                          <Star
                            size={16}
                            className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your culinary feedback (spices, presentation, naans...)..."
                      rows={3}
                      className="w-full bg-brand-surface border border-brand-divider p-3 text-xs text-brand-text-primary focus:outline-none resize-none font-sans"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview || !reviewedItemId}
                    className="bg-brand-gold hover:bg-brand-text-primary text-brand-surface px-6 py-2.5 text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-divider p-12 text-center space-y-6 max-w-xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-full bg-brand-bg-secondary flex items-center justify-center text-brand-gold">
            <Search size={20} />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-medium text-brand-text-primary">
              No Dispatch Located
            </h3>
            <p className="font-sans text-xs text-brand-text-secondary max-w-sm mx-auto leading-relaxed">
              If you have recently ordered an elegant tandoori feast, it will show up here. Feel free to browse our dishes and complete your order.
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-block bg-brand-text-primary hover:bg-brand-gold text-brand-surface font-sans text-xs tracking-widest uppercase py-3.5 px-6 transition-all duration-300"
          >
            Sovereign Menu
          </Link>
        </div>
      )}

    </div>
  );
}
