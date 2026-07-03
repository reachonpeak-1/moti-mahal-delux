/**
 * UsersManager.tsx
 * Management interface for User Accounts (Super Admin only).
 * Handles role updates, account activation toggling, and staff account creation.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, ShieldCheck, Mail, Phone, Clock, Search, X, Loader2, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllUsers, updateUserRole, toggleUserActive } from '../services/userService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile, UserRole } from '../types';

export default function UsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Add Staff Modal Form State
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('staff');
  const [creatingStaff, setCreatingStaff] = useState(false);

  useEffect(() => {
    const unsub = getAllUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await updateUserRole(uid, role);
      toast.success('User role updated successfully');
      if (selectedUser?.uid === uid) {
        setSelectedUser((prev) => prev ? { ...prev, role } : null);
      }
    } catch {
      toast.error('Failed to update user role');
    }
  };

  const handleToggleActive = async (uid: string, currentActive: boolean) => {
    try {
      await toggleUserActive(uid, !currentActive);
      toast.success(`Account has been ${!currentActive ? 'activated' : 'deactivated'}`);
      if (selectedUser?.uid === uid) {
        setSelectedUser((prev) => prev ? { ...prev, isActive: !currentActive } : null);
      }
    } catch {
      toast.error('Failed to change activation status');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }

    try {
      setCreatingStaff(true);

      // Call Firebase Auth to create user (Note: This signs in the user, so in a real app,
      // you would use a Cloud Function to create users, or use a secondary Firebase App instance.
      // For this implementation, we will use a separate HTTPS callable function or create via Firestore secondary auth.
      // Since secondary app is complex, the easiest secure way is letting the super admin add staff via auth and restore super admin session.
      // However, we will create the Firestore doc directly assuming they sign in, or recommend a Cloud Function.
      // To bypass superadmin log-out, we create a secondary Firebase app client initialization dynamically!)
      
      // Let's create a temporary secondary auth helper inside the script to avoid super admin logout:
      const secondaryAppName = `TempSecondaryApp-${Date.now()}`;
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword: secondaryCreate } = await import('firebase/auth');
      
      const config = {
        apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
        authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
      };

      const tempApp = initializeApp(config, secondaryAppName);
      const tempAuth = getAuth(tempApp);

      const cred = await secondaryCreate(tempAuth, staffEmail, staffPassword);
      
      // Create Firestore User doc
      const staffProfile = {
        email: staffEmail,
        displayName: staffName,
        phone: staffPhone,
        photoURL: '',
        role: staffRole,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
      };

      await setDoc(doc(db, 'users', cred.user.uid), staffProfile);
      
      // Clean up secondary auth
      const { deleteApp } = await import('firebase/app');
      await deleteApp(tempApp);

      toast.success(`${staffRole} account created successfully!`);
      setIsAddStaffModalOpen(false);
      
      // Reset form
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffPassword('');
      setStaffRole('staff');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create staff account');
    } finally {
      setCreatingStaff(false);
    }
  };

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);

    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    return matchesRole && matchesStatus && matchesSearch;
  });

  const roleColors: Record<UserRole, string> = {
    superadmin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    staff: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    delivery: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    customer: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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
                <div className="w-1/12 h-6 rounded bg-brand-bg-secondary" />
                <div className="w-1/6 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/12 h-4 rounded bg-brand-bg-secondary" />
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
          <h1 className="font-serif text-2xl text-white">Users</h1>
          <p className="text-xs text-slate-400">Manage user accounts, credentials, and credentials roles</p>
        </div>
        <button
          onClick={() => setIsAddStaffModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          <Plus size={16} /> Add Staff Account
        </button>
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
            placeholder="Search by name, email, phone..."
            className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="delivery">Delivery Boy</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700/50">
          <Users className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 text-sm">No users found</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Join Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-500 font-bold uppercase overflow-hidden">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                          ) : (
                            u.displayName.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.displayName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{u.email}</p>
                          {u.phone && <p className="text-[10px] text-slate-500">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className={`bg-slate-950 border text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 focus:outline-none ${
                          roleColors[u.role]
                        }`}
                      >
                        <option value="superadmin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="delivery">Delivery Boy</option>
                        <option value="customer">Customer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(u.uid, u.isActive)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase font-semibold tracking-wider transition-colors ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserCheck size={10} /> Active
                          </>
                        ) : (
                          <>
                            <UserX size={10} /> Suspended
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Drawer Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
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
                  <h3 className="font-serif text-lg text-white">User Information</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 text-xs">
                  {/* User Profile Summary */}
                  <div className="flex items-center gap-4 bg-slate-950 p-4 border border-slate-800">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-500 font-bold uppercase text-lg overflow-hidden">
                      {selectedUser.photoURL ? (
                        <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-full h-full object-cover" />
                      ) : (
                        selectedUser.displayName.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <h4 className="font-serif text-base text-white">{selectedUser.displayName}</h4>
                      <p className="text-[10px] text-slate-500 capitalize">{selectedUser.role} Account</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Email Address</span>
                      <span className="text-white font-mono">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Phone Number</span>
                      <span className="text-white font-mono">{selectedUser.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Account Created</span>
                      <span className="text-white font-mono">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Last Authentication</span>
                      <span className="text-white font-mono">
                        {new Date(selectedUser.lastLogin).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Active Status</span>
                      <span className={selectedUser.isActive ? 'text-emerald-400 font-semibold' : 'text-rose-450 font-semibold'}>
                        {selectedUser.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
                    <button
                      onClick={() => handleToggleActive(selectedUser.uid, selectedUser.isActive)}
                      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded ${
                        selectedUser.isActive
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                      }`}
                    >
                      {selectedUser.isActive ? 'Suspend User' : 'Activate User'}
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider rounded"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Staff Account Modal */}
      <AnimatePresence>
        {isAddStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddStaffModalOpen(false)}
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
                  <h3 className="font-serif text-lg text-white">Create Staff Account</h3>
                  <button
                    onClick={() => setIsAddStaffModalOpen(false)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                  {/* Name */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Chef Sanjay"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="sanjay@motimahal.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>

                  {/* Staff Role */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Assign Role
                    </label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as UserRole)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="staff">Staff / Chef</option>
                      <option value="admin">Admin</option>
                      <option value="delivery">Delivery Boy</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={creatingStaff}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 mt-6"
                  >
                    {creatingStaff ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
