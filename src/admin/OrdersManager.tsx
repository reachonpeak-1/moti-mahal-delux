/**
 * OrdersManager.tsx
 * Full order management page with filtering, status management, detail modal,
 * cancel dialog, real-time status updates, and pagination.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import type { Order, OrderStatus, OrderType, PaymentStatus } from '../types';
import toast from 'react-hot-toast';

// ─── Status Config ──────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  received: { label: 'Received', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: ShoppingBag },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  ready: { label: 'Ready', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Package },
  on_the_way: { label: 'On the Way', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: XCircle },
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  paid: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-rose-500/15 text-rose-400',
  refunded: 'bg-sky-500/15 text-sky-400',
  cod: 'bg-orange-500/15 text-orange-400',
};

const TYPE_COLORS: Record<OrderType, string> = {
  delivery: 'bg-blue-500/15 text-blue-400',
  takeaway: 'bg-amber-500/15 text-amber-400',
  dinein: 'bg-emerald-500/15 text-emerald-400',
};

const STATUS_FLOW: OrderStatus[] = ['received', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'];

// ─── Mock Orders ────────────────────────────────────────────────
const generateMockOrders = (): Order[] => {
  const names = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Neha Singh', 'Vikram Joshi', 'Kavita Rao', 'Suresh Mehra', 'Anita Gupta'];
  const statuses: OrderStatus[] = ['received', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled'];
  const types: OrderType[] = ['delivery', 'takeaway', 'dinein'];
  const paymentStatuses: PaymentStatus[] = ['pending', 'paid', 'cod'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `ORD-${(7850 - i).toString().padStart(4, '0')}`,
    customerId: `cust_${i}`,
    items: [
      {
        id: `item_${i}_1`,
        menuItem: { id: 'mi1', name: 'Butter Chicken', description: '', price: 450, image: '', category: 'Main Course', calories: 420, spiceLevel: 2 as const, prepTime: '25 min', isVegetarian: false, ingredients: [], allergens: [], nutritionalInfo: { protein: '28g', carbs: '12g', fat: '18g' }, isAvailable: true, sortOrder: 1 },
        quantity: 2,
        customSpice: 'medium' as const,
        specialInstructions: '',
      },
      {
        id: `item_${i}_2`,
        menuItem: { id: 'mi2', name: 'Tandoori Roti', description: '', price: 40, image: '', category: 'Breads', calories: 120, spiceLevel: 0 as const, prepTime: '5 min', isVegetarian: true, ingredients: [], allergens: [], nutritionalInfo: { protein: '4g', carbs: '22g', fat: '2g' }, isAvailable: true, sortOrder: 2 },
        quantity: 4,
        customSpice: 'mild' as const,
        specialInstructions: '',
      },
    ],
    subtotal: 1060,
    deliveryFee: i % 3 === 0 ? 50 : 0,
    tax: 53,
    discount: i % 4 === 0 ? 100 : 0,
    total: 1060 + (i % 3 === 0 ? 50 : 0) + 53 - (i % 4 === 0 ? 100 : 0),
    orderType: types[i % 3],
    customerName: names[i % names.length],
    customerPhone: `+91 98765 ${(43210 + i).toString().slice(-5)}`,
    customerEmail: `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
    deliveryAddress: i % 3 === 0 ? '42, MG Road, Connaught Place, New Delhi - 110001' : '',
    deliveryTime: 'As soon as possible',
    paymentMethod: i % 3 === 2 ? 'cod' : 'razorpay',
    paymentStatus: paymentStatuses[i % paymentStatuses.length],
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - i * 1800000).toISOString(),
  }));
};

// ─── Skeleton ───────────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="space-y-1">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
        <div className="w-20 h-4 rounded bg-slate-700" />
        <div className="w-28 h-4 rounded bg-slate-700" />
        <div className="w-12 h-4 rounded bg-slate-700" />
        <div className="w-16 h-4 rounded bg-slate-700" />
        <div className="w-20 h-6 rounded-full bg-slate-700" />
        <div className="w-20 h-6 rounded-full bg-slate-700" />
        <div className="w-24 h-4 rounded bg-slate-700" />
      </div>
    ))}
  </div>
);

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(generateMockOrders());
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (typeFilter !== 'all' && order.orderType !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !order.id.toLowerCase().includes(q) &&
          !order.customerName.toLowerCase().includes(q)
        )
          return false;
      }
      if (dateFrom && new Date(order.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(order.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [orders, statusFilter, typeFilter, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
    );
    toast.success(`Order ${orderId} status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleCancelOrder = () => {
    if (!cancellingOrderId || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancellingOrderId
          ? { ...o, status: 'cancelled' as OrderStatus, cancelReason, updatedAt: new Date().toISOString() }
          : o
      )
    );
    toast.success(`Order ${cancellingOrderId} has been cancelled`);
    setShowCancelDialog(false);
    setCancelReason('');
    setCancellingOrderId(null);
  };

  const openCancelDialog = (orderId: string) => {
    setCancellingOrderId(orderId);
    setShowCancelDialog(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white">Orders</h1>
          <p className="text-slate-400 mt-1">Manage and track all customer orders</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => {
              setOrders(generateMockOrders());
              setLoading(false);
            }, 600);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | 'all'); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as OrderType | 'all'); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="delivery">Delivery</option>
            <option value="takeaway">Takeaway</option>
            <option value="dinein">Dine-In</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
            placeholder="From date"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : paginatedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <ShoppingBag className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No orders found</h3>
            <p className="text-slate-400 text-sm text-center">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Order ID</th>
                    <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Customer</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Items</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Total</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Type</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Payment</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Date</th>
                    <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-mono text-white">{order.id}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-300">{order.customerName}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden md:table-cell">
                        <span className="text-sm text-slate-400">{order.items.length}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-semibold text-white">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                        <span className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${TYPE_COLORS[order.orderType]}`}>
                          {order.orderType === 'dinein' ? 'dine-in' : order.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <span className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus]}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                            className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border appearance-none cursor-pointer bg-transparent text-center ${STATUS_CONFIG[order.status].color}`}
                          >
                            {STATUS_FLOW.map((s) => (
                              <option key={s} value={s} className="bg-slate-900 text-white text-xs">
                                {STATUS_CONFIG[s].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-block text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${STATUS_CONFIG[order.status].color}`}>
                            {STATUS_CONFIG[order.status].label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => openCancelDialog(order.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-white px-3">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Order Detail Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                <div>
                  <h2 className="text-lg font-semibold text-white font-mono">{selectedOrder.id}</h2>
                  <p className="text-sm text-slate-400">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status + Type Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase px-3 py-1.5 rounded-full border ${STATUS_CONFIG[selectedOrder.status].color}`}>
                    {React.createElement(STATUS_CONFIG[selectedOrder.status].icon, { className: 'w-3.5 h-3.5' })}
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </span>
                  <span className={`inline-block text-xs font-semibold uppercase px-3 py-1.5 rounded-full ${TYPE_COLORS[selectedOrder.orderType]}`}>
                    {selectedOrder.orderType === 'dinein' ? 'Dine-In' : selectedOrder.orderType}
                  </span>
                  <span className={`inline-block text-xs font-semibold uppercase px-3 py-1.5 rounded-full ${PAYMENT_COLORS[selectedOrder.paymentStatus]}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-white mb-3">Customer Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-500" />
                      </div>
                      {selectedOrder.customerName}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      {selectedOrder.customerPhone}
                    </div>
                    {selectedOrder.customerEmail && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-slate-500" />
                        </div>
                        {selectedOrder.customerEmail}
                      </div>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <div className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-slate-500" />
                        </div>
                        {selectedOrder.deliveryAddress}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/10 flex items-center justify-center border border-amber-500/20">
                            <span className="text-amber-400 text-xs font-bold">{item.quantity}x</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{item.menuItem.name}</p>
                            <p className="text-xs text-slate-500">
                              Spice: {item.customSpice}
                              {item.specialInstructions && ` • ${item.specialInstructions}`}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-white">
                          ₹{(item.menuItem.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Delivery Fee</span>
                        <span>₹{selectedOrder.deliveryFee.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Tax</span>
                      <span>₹{selectedOrder.tax.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount</span>
                        <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-semibold pt-2 border-t border-slate-700">
                      <span>Total</span>
                      <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Status Timeline</h3>
                  <div className="flex items-center gap-1">
                    {STATUS_FLOW.map((status, i) => {
                      const currentIdx = STATUS_FLOW.indexOf(selectedOrder.status as any);
                      const isCompleted = selectedOrder.status !== 'cancelled' && i <= currentIdx;
                      const isCurrent = selectedOrder.status === status;

                      return (
                        <React.Fragment key={status}>
                          <div
                            className={`flex flex-col items-center gap-1 ${
                              i > 0 ? 'flex-1' : ''
                            }`}
                          >
                            {i > 0 && (
                              <div
                                className={`w-full h-0.5 mb-1 rounded ${
                                  isCompleted ? 'bg-[#C9A96E]' : 'bg-slate-700'
                                }`}
                              />
                            )}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCurrent
                                  ? 'bg-[#C9A96E] text-slate-900'
                                  : isCompleted
                                  ? 'bg-[#C9A96E]/30 text-[#C9A96E]'
                                  : 'bg-slate-700 text-slate-500'
                              }`}
                            >
                              {i + 1}
                            </div>
                            <span className="text-[9px] text-slate-500 text-center leading-tight hidden sm:block">
                              {STATUS_CONFIG[status].label}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {selectedOrder.status === 'cancelled' && (
                    <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <p className="text-xs text-rose-400 font-medium">Order Cancelled</p>
                      {selectedOrder.cancelReason && (
                        <p className="text-xs text-rose-300/70 mt-1">{selectedOrder.cancelReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Cancel Dialog ───────────────────────────────────────── */}
      <AnimatePresence>
        {showCancelDialog && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowCancelDialog(false); setCancelReason(''); setCancellingOrderId(null); }}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Cancel Order</h3>
                  <p className="text-sm text-slate-400">Order {cancellingOrderId}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowCancelDialog(false); setCancelReason(''); setCancellingOrderId(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-sm font-medium"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors text-sm font-medium"
                >
                  Cancel Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
