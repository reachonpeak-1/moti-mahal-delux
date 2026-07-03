/**
 * Customer Profile Page
 * Tabbed interface with: Profile Info, Order History, Saved Addresses, Favorites
 * Allows customers to manage their account and view past orders.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  LogOut,
  Edit3,
  Save,
  Loader2,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Star,
  RefreshCw,
  Package,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrdersByCustomer } from '../../services/orderService';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '../../services/addressService';
import { getFavorites } from '../../services/favoriteService';
import { updateUserProfile } from '../../services/userService';
import { Order, SavedAddress, Favorite, MenuItem } from '../../types';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'orders' | 'addresses' | 'favorites';

export default function ProfilePage() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.displayName || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubscribers: (() => void)[] = [];

    // Load orders
    const unsubOrders = getOrdersByCustomer(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    unsubscribers.push(unsubOrders);

    // Load addresses
    const unsubAddresses = getAddresses(user.uid, (data) => {
      setAddresses(data);
    });
    unsubscribers.push(unsubAddresses);

    // Load favorites
    const unsubFavorites = getFavorites(user.uid, (data) => {
      setFavorites(data);
    });
    unsubscribers.push(unsubFavorites);

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await updateUserProfile(user.uid, {
        displayName: editName,
        phone: editPhone,
      });
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user || !newAddressText.trim()) return;
    try {
      await addAddress(user.uid, {
        label: newAddressLabel,
        address: newAddressText,
        isDefault: addresses.length === 0,
      });
      setNewAddressText('');
      setShowAddAddress(false);
      toast.success('Address saved!');
    } catch {
      toast.error('Failed to save address.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Signed out successfully.');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={16} /> },
    { key: 'orders', label: 'Orders', icon: <ShoppingBag size={16} />, count: orders.length },
    { key: 'addresses', label: 'Addresses', icon: <MapPin size={16} />, count: addresses.length },
    { key: 'favorites', label: 'Favorites', icon: <Heart size={16} />, count: favorites.length },
  ];

  const statusColors: Record<string, string> = {
    received: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    on_the_way: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="min-h-screen bg-brand-bg-primary pt-24 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] tracking-[0.3em] text-brand-gold uppercase font-sans block">
              My Account
            </span>
            <h1 className="font-serif text-2xl text-brand-text-primary mt-1">
              Welcome, {userProfile?.displayName || 'Guest'}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-brand-text-secondary hover:text-rose-400 transition-colors uppercase tracking-wider"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-divider mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-brand-gold text-brand-gold'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 text-[10px] bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-brand-surface border border-brand-divider p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg text-brand-text-primary">Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => {
                      setEditing(true);
                      setEditName(userProfile?.displayName || '');
                      setEditPhone(userProfile?.phone || '');
                    }}
                    className="flex items-center gap-1 text-xs text-brand-gold hover:underline"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="text-xs text-brand-text-secondary hover:text-brand-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs bg-brand-gold text-brand-surface px-3 py-1.5 hover:bg-brand-gold/90 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-brand-bg-secondary border border-brand-divider px-4 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-gold/50"
                    />
                  ) : (
                    <p className="text-sm text-brand-text-primary">{userProfile?.displayName || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">
                    Email
                  </label>
                  <p className="text-sm text-brand-text-primary">{userProfile?.email || '—'}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-brand-bg-secondary border border-brand-divider px-4 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-gold/50"
                    />
                  ) : (
                    <p className="text-sm text-brand-text-primary">{userProfile?.phone || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">
                    Role
                  </label>
                  <p className="text-sm text-brand-gold capitalize">{userProfile?.role || 'customer'}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">
                    Member Since
                  </label>
                  <p className="text-sm text-brand-text-primary">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-brand-surface border border-brand-divider">
                  <Package className="w-12 h-12 mx-auto text-brand-text-secondary/30 mb-4" />
                  <p className="text-brand-text-secondary text-sm">No orders yet</p>
                  <button
                    onClick={() => navigate('/menu')}
                    className="mt-4 text-xs text-brand-gold hover:underline uppercase tracking-wider"
                  >
                    Browse Menu →
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-brand-surface border border-brand-divider p-6 hover:border-brand-gold/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-mono text-brand-text-secondary">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-brand-text-secondary/60 mt-1">
                          <Clock size={10} className="inline mr-1" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2.5 py-1 border ${
                          statusColors[order.status] || 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items.slice(0, 3).map((item, i) => (
                        <p key={i} className="text-xs text-brand-text-primary">
                          {item.menuItem.name} × {item.quantity}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-brand-text-secondary">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-brand-divider">
                      <p className="text-sm font-semibold text-brand-gold">
                        ₹{order.total.toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        {order.status === 'delivered' && (
                          <button className="text-[10px] uppercase tracking-wider text-brand-gold hover:underline flex items-center gap-1">
                            <Star size={10} /> Review
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/track')}
                          className="text-[10px] uppercase tracking-wider text-brand-text-secondary hover:text-brand-gold flex items-center gap-1"
                        >
                          Track <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <motion.div
              key="addresses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="flex items-center gap-2 text-xs bg-brand-gold text-brand-surface px-4 py-2.5 hover:bg-brand-gold/90 uppercase tracking-wider"
              >
                <Plus size={14} /> Add Address
              </button>

              {showAddAddress && (
                <div className="bg-brand-surface border border-brand-divider p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-gold mb-2">
                      Label
                    </label>
                    <select
                      value={newAddressLabel}
                      onChange={(e) => setNewAddressLabel(e.target.value)}
                      className="w-full bg-brand-bg-secondary border border-brand-divider px-4 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-gold/50"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-brand-gold mb-2">
                      Full Address
                    </label>
                    <textarea
                      value={newAddressText}
                      onChange={(e) => setNewAddressText(e.target.value)}
                      placeholder="Enter your complete delivery address..."
                      rows={3}
                      className="w-full bg-brand-bg-secondary border border-brand-divider px-4 py-2.5 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/40 focus:outline-none focus:border-brand-gold/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAddress}
                      className="flex items-center gap-1 text-xs bg-brand-gold text-brand-surface px-4 py-2 hover:bg-brand-gold/90"
                    >
                      <Check size={12} /> Save
                    </button>
                    <button
                      onClick={() => setShowAddAddress(false)}
                      className="text-xs text-brand-text-secondary hover:text-brand-text-primary px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {addresses.length === 0 && !showAddAddress ? (
                <div className="text-center py-16 bg-brand-surface border border-brand-divider">
                  <MapPin className="w-12 h-12 mx-auto text-brand-text-secondary/30 mb-4" />
                  <p className="text-brand-text-secondary text-sm">No saved addresses</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-brand-surface border p-5 flex items-start justify-between ${
                      addr.isDefault ? 'border-brand-gold/30' : 'border-brand-divider'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-brand-text-primary">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[9px] bg-brand-gold/10 text-brand-gold px-2 py-0.5 uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-text-secondary">{addr.address}</p>
                    </div>
                    <div className="flex gap-2">
                      {!addr.isDefault && user && (
                        <button
                          onClick={() => setDefaultAddress(user.uid, addr.id)}
                          className="text-[10px] text-brand-gold hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="text-brand-text-secondary/40 hover:text-rose-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {favorites.length === 0 ? (
                <div className="text-center py-16 bg-brand-surface border border-brand-divider">
                  <Heart className="w-12 h-12 mx-auto text-brand-text-secondary/30 mb-4" />
                  <p className="text-brand-text-secondary text-sm">No favorites yet</p>
                  <button
                    onClick={() => navigate('/menu')}
                    className="mt-4 text-xs text-brand-gold hover:underline uppercase tracking-wider"
                  >
                    Browse Menu →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="bg-brand-surface border border-brand-divider p-4 flex items-center gap-4"
                    >
                      <Heart className="w-5 h-5 text-rose-400 fill-rose-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-brand-text-primary">
                          Item ID: {fav.menuItemId}
                        </p>
                        <p className="text-[10px] text-brand-text-secondary mt-1">
                          Added {new Date(fav.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/menu')}
                        className="text-[10px] text-brand-gold hover:underline uppercase tracking-wider"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
