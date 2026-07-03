/**
 * ReviewsManager.tsx
 * Moderation interface for Customer Reviews.
 * Handles approval/rejection of reviews, ratings statistics, and typing admin responses.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Check, X, Trash2, MessageSquare, Loader2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllReviews, moderateReview, deleteReview } from '../services/reviewService';
import type { Review, ReviewStatus } from '../types';

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = getAllReviews((data) => {
      setReviews(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleModerate = async (id: string, status: ReviewStatus) => {
    try {
      await moderateReview(id, status);
      toast.success(`Review ${status}`);
    } catch {
      toast.error('Failed to moderate review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await deleteReview(id);
      toast.success('Review deleted permanently');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleReplySubmit = async (review: Review) => {
    const text = replyText[review.id];
    if (!text || !text.trim()) {
      toast.error('Reply content cannot be empty');
      return;
    }

    try {
      setSubmittingReply((prev) => ({ ...prev, [review.id]: true }));
      // Automatically approves the review if admin replies to it, or keeps existing status
      const targetStatus = review.status === 'pending' ? 'approved' : review.status;
      await moderateReview(review.id, targetStatus, text);
      toast.success('Reply saved successfully');
      setReplyText((prev) => ({ ...prev, [review.id]: '' }));
    } catch {
      toast.error('Failed to submit reply');
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  // Filter logic
  const filteredReviews = reviews.filter((rev) => {
    const matchesStatus = statusFilter === 'all' || rev.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || rev.rating === ratingFilter;
    const matchesSearch =
      rev.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rev.reviewText && rev.reviewText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rev.menuItemName && rev.menuItemName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesRating && matchesSearch;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={12}
            className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-650'}
          />
        ))}
      </div>
    );
  };

  const statusColors: Record<ReviewStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-48 h-6 rounded bg-brand-bg-secondary animate-pulse mb-2" />
          <div className="w-72 h-4 rounded bg-brand-bg-secondary animate-pulse" />
        </div>
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-brand-card border border-brand-divider rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-brand-bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 rounded bg-brand-bg-secondary" />
                  <div className="w-20 h-3 rounded bg-brand-bg-secondary" />
                </div>
              </div>
              <div className="w-full h-12 rounded bg-brand-bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-white">Reviews</h1>
        <p className="text-xs text-slate-400">Moderate customer reviews and feedback responses</p>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, menu item, review content..."
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
          </select>
        </div>

        {/* Rating Filter */}
        <div className="w-full md:w-48">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700/50">
          <Star className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 text-sm">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-slate-900 border rounded-lg p-6 space-y-4 transition-all ${
                rev.status === 'pending'
                  ? 'border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Header: Customer + Rating */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 text-amber-500 font-bold uppercase">
                    {rev.customerPhoto ? (
                      <img src={rev.customerPhoto} alt={rev.customerName} className="w-full h-full object-cover" />
                    ) : (
                      rev.customerName.slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{rev.customerName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(rev.rating)}
                      <span className="text-[10px] text-slate-500">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 border text-[9px] uppercase font-semibold tracking-wider ${
                      statusColors[rev.status]
                    }`}
                  >
                    {rev.status}
                  </span>

                  <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                  <div className="flex gap-1">
                    {rev.status !== 'approved' && (
                      <button
                        onClick={() => handleModerate(rev.id, 'approved')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 rounded transition-colors"
                        title="Approve Review"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    {rev.status !== 'rejected' && (
                      <button
                        onClick={() => handleModerate(rev.id, 'rejected')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-750 text-rose-450 border border-slate-700 rounded transition-colors"
                        title="Reject Review"
                      >
                        <X size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-700 rounded transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-1">
                {rev.menuItemName && (
                  <p className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold">
                    Menu Item: {rev.menuItemName}
                  </p>
                )}
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  "{rev.reviewText}"
                </p>
              </div>

              {/* Admin Response/Reply Panel */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                {rev.adminResponse ? (
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded text-xs space-y-1">
                    <p className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold">
                      Moti Mahal Delux Response
                    </p>
                    <p className="text-slate-400 italic leading-relaxed">
                      "{rev.adminResponse}"
                    </p>
                  </div>
                ) : null}

                {/* Reply Input Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText[rev.id] || ''}
                    onChange={(e) =>
                      setReplyText((prev) => ({ ...prev, [rev.id]: e.target.value }))
                    }
                    placeholder={rev.adminResponse ? 'Update your response...' : 'Type a public response to this review...'}
                    className="flex-1 bg-slate-850 border border-slate-750 rounded px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={() => handleReplySubmit(rev)}
                    disabled={submittingReply[rev.id]}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1 rounded transition-colors disabled:opacity-50"
                  >
                    {submittingReply[rev.id] ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <MessageSquare size={12} />
                    )}
                    {rev.adminResponse ? 'Update' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
