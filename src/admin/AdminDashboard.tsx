/**
 * AdminDashboard.tsx
 * Main dashboard overview page with KPI cards, revenue chart, order status pie,
 * popular items, recent orders table, and quick action buttons.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  ShoppingCart,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  CalendarDays,
  ArrowRight,
  Package,
  IndianRupee,
  Flame,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import type { Order, MenuItem } from '../types';
import toast from 'react-hot-toast';

// ─── Skeleton Components ────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-slate-700" />
      <div className="w-16 h-5 rounded bg-slate-700" />
    </div>
    <div className="w-24 h-8 rounded bg-slate-700 mb-2" />
    <div className="w-20 h-4 rounded bg-slate-700" />
  </div>
);

const SkeletonChart = () => (
  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 animate-pulse">
    <div className="w-40 h-6 rounded bg-slate-700 mb-4" />
    <div className="w-full h-64 rounded bg-slate-700/50" />
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <div className="w-10 h-10 rounded-lg bg-slate-700" />
    <div className="flex-1 space-y-2">
      <div className="w-32 h-4 rounded bg-slate-700" />
      <div className="w-20 h-3 rounded bg-slate-700" />
    </div>
    <div className="w-16 h-6 rounded bg-slate-700" />
  </div>
);

// ─── Mock Data (to be replaced by service calls) ────────────────
const generateRevenueData = (period: 'daily' | 'weekly' | 'monthly') => {
  const data = [];
  const days = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    if (period === 'daily') date.setDate(date.getDate() - i);
    else if (period === 'weekly') date.setDate(date.getDate() - i * 7);
    else date.setMonth(date.getMonth() - i);

    data.push({
      label:
        period === 'daily'
          ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          : period === 'weekly'
          ? `W${days - i}`
          : date.toLocaleDateString('en-IN', { month: 'short' }),
      revenue: Math.floor(Math.random() * 50000) + 15000,
      orders: Math.floor(Math.random() * 80) + 20,
    });
  }
  return data;
};

const ORDER_STATUS_DATA = [
  { name: 'Received', value: 12, color: '#988B80' },
  { name: 'Confirmed', value: 8, color: '#B68A44' },
  { name: 'Preparing', value: 15, color: '#A6763C' },
  { name: 'Ready', value: 5, color: '#849F65' },
  { name: 'On the Way', value: 7, color: '#7C6552' },
  { name: 'Delivered', value: 156, color: '#667B57' },
  { name: 'Cancelled', value: 4, color: '#B56B6B' },
];

const POPULAR_ITEMS = [
  { name: 'Butter Chicken', orders: 342, image: '', price: 450 },
  { name: 'Tandoori Roti', orders: 298, image: '', price: 40 },
  { name: 'Dal Makhani', orders: 256, image: '', price: 320 },
  { name: 'Paneer Tikka', orders: 221, image: '', price: 380 },
  { name: 'Biryani Special', orders: 198, image: '', price: 550 },
];

const RECENT_ORDERS: Array<{
  id: string;
  customer: string;
  total: number;
  status: string;
  time: string;
  type: string;
}> = [
  { id: 'ORD-7821', customer: 'Rajesh Kumar', total: 1250, status: 'preparing', time: '5 min ago', type: 'delivery' },
  { id: 'ORD-7820', customer: 'Priya Sharma', total: 890, status: 'confirmed', time: '12 min ago', type: 'dinein' },
  { id: 'ORD-7819', customer: 'Amit Patel', total: 2100, status: 'ready', time: '18 min ago', type: 'delivery' },
  { id: 'ORD-7818', customer: 'Neha Singh', total: 670, status: 'delivered', time: '25 min ago', type: 'takeaway' },
  { id: 'ORD-7817', customer: 'Vikram Joshi', total: 1560, status: 'on_the_way', time: '30 min ago', type: 'delivery' },
  { id: 'ORD-7816', customer: 'Kavita Rao', total: 440, status: 'received', time: '35 min ago', type: 'dinein' },
  { id: 'ORD-7815', customer: 'Suresh Mehra', total: 3200, status: 'delivered', time: '42 min ago', type: 'delivery' },
  { id: 'ORD-7814', customer: 'Anita Gupta', total: 980, status: 'cancelled', time: '1 hr ago', type: 'takeaway' },
  { id: 'ORD-7813', customer: 'Rohit Verma', total: 1750, status: 'delivered', time: '1.5 hr ago', type: 'delivery' },
  { id: 'ORD-7812', customer: 'Meena Iyer', total: 560, status: 'delivered', time: '2 hr ago', type: 'dinein' },
];

// ─── Status badge helper ────────────────────────────────────────
const statusColors: Record<string, string> = {
  received: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  preparing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ready: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  on_the_way: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  delivered: 'bg-green-500/15 text-green-400 border-green-500/30',
  cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const typeColors: Record<string, string> = {
  delivery: 'bg-blue-500/15 text-blue-400',
  takeaway: 'bg-amber-500/15 text-amber-400',
  dinein: 'bg-emerald-500/15 text-emerald-400',
};

// ─── Custom Tooltip for Recharts ────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-card border border-brand-divider rounded p-3 shadow-lg">
        <p className="text-brand-text-secondary text-[8px] font-sans font-bold tracking-wider uppercase mb-1">{label}</p>
        <p className="text-brand-text-primary font-serif font-bold text-sm">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
        {payload[1] && (
          <p className="text-brand-text-secondary text-[9px] font-sans mt-0.5">{payload[1].value} orders</p>
        )}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [revenueData, setRevenueData] = useState(generateRevenueData('daily'));

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setRevenueData(generateRevenueData(revenuePeriod));
  }, [revenuePeriod]);

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: '₹4,85,200',
      icon: IndianRupee,
      trend: '+12.5%',
      trendUp: true,
      color: 'from-amber-500 to-yellow-600',
    },
    {
      label: 'Total Orders',
      value: '1,247',
      icon: ShoppingCart,
      trend: '+8.2%',
      trendUp: true,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Pending Orders',
      value: '23',
      icon: Clock,
      trend: '-3.1%',
      trendUp: false,
      color: 'from-orange-500 to-amber-500',
    },
    {
      label: 'Total Customers',
      value: '864',
      icon: Users,
      trend: '+15.7%',
      trendUp: true,
      color: 'from-emerald-500 to-green-500',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-48 h-8 rounded bg-slate-800 animate-pulse mb-2" />
          <div className="w-72 h-4 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SkeletonChart />
          </div>
          <SkeletonChart />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
          <div className="xl:col-span-2">
            <SkeletonChart />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Welcome back! Here's what's happening at Moti Mahal Delux today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-brand-card border border-brand-divider rounded-xl p-5 hover:border-brand-gold/30 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl bg-brand-bg-secondary/65 border border-brand-divider flex items-center justify-center flex-shrink-0 group-hover:border-brand-gold/45 transition-colors"
                >
                  <Icon className="w-5 h-5 text-brand-gold" />
                </div>
                <span
                  className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    card.trendUp
                      ? 'bg-emerald-500/10 text-brand-success border-brand-success/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {card.trendUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {card.trend}
                </span>
              </div>
              <p className="text-2xl lg:text-3xl font-serif font-medium text-brand-text-primary mt-1.5 transition-colors">
                {card.value}
              </p>
              <p className="text-[10px] text-brand-text-secondary font-sans font-bold uppercase tracking-[0.2em] mt-0.5">
                {card.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Revenue Overview</h2>
              <p className="text-sm text-slate-400">Revenue trend analysis</p>
            </div>
            <div className="flex bg-slate-900 rounded-xl p-1">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    revenuePeriod === period
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(45, 39, 35, 0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#75695D', fontSize: 10, fontFamily: 'Inter' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#75695D', fontSize: 10, fontFamily: 'Inter' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C9A96E"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Order Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-2">Order Status</h2>
          <p className="text-sm text-slate-400 mb-4">Distribution by status</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={ORDER_STATUS_DATA}
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {ORDER_STATUS_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  padding: '8px 12px',
                }}
                itemStyle={{ color: '#fff', fontSize: 13 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Popular Items + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Popular Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Popular Items</h2>
              <p className="text-xs text-slate-400">Top sellers this month</p>
            </div>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-3">
            {POPULAR_ITEMS.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/10 flex items-center justify-center text-amber-400 font-bold text-sm border border-amber-500/20">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">₹{item.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#C9A96E]">{item.orders}</p>
                  <p className="text-[10px] text-slate-500 uppercase">orders</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="xl:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <p className="text-xs text-slate-400">Latest 10 orders received</p>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-1 text-sm text-[#C9A96E] hover:text-amber-400 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-slate-700">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">
                    Order
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                    Total
                  </th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {RECENT_ORDERS.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-700/20 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/orders')}
                  >
                    <td className="px-6 py-3">
                      <span className="text-sm font-mono text-white">{order.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{order.customer}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          typeColors[order.type] || 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {order.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-white">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${
                          statusColors[order.status] || 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right hidden md:table-cell">
                      <span className="text-xs text-slate-500">{order.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <button
          onClick={() => navigate('/admin/menu')}
          className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-2xl hover:border-amber-500/30 hover:bg-slate-800/80 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors">
            <Plus className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Add Menu Item</p>
            <p className="text-xs text-slate-500">Create a new dish</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-amber-400 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-2xl hover:border-sky-500/30 hover:bg-slate-800/80 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center group-hover:bg-sky-500/25 transition-colors">
            <Eye className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Pending Orders</p>
            <p className="text-xs text-slate-500">23 orders waiting</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-sky-400 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/admin/reservations')}
          className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Reservations</p>
            <p className="text-xs text-slate-500">Check today's bookings</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-emerald-400 transition-colors" />
        </button>
      </motion.div>
    </div>
  );
}
