/**
 * Admin Login Page
 * Separate dark-themed admin login at /admin/login
 * Only email + password authentication for admin users.
 * Validates that the user has admin/superadmin/staff role.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { UserRole } from '../../types';

const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin', 'staff'];

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Enter your admin email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Sign in with Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Step 2: Check if user has admin role in Firestore
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));

      if (!userDoc.exists()) {
        await auth.signOut();
        setError('No admin account found. Contact the Super Admin.');
        return;
      }

      const userData = userDoc.data();
      const role = userData.role as UserRole;

      if (!ADMIN_ROLES.includes(role)) {
        await auth.signOut();
        setError('Access denied. This login is for admin, staff, and management only.');
        return;
      }

      if (userData.isActive === false) {
        await auth.signOut();
        setError('Your account has been deactivated. Contact the Super Admin.');
        return;
      }

      // Success — redirect to admin dashboard
      navigate('/admin', { replace: true });
    } catch (err: any) {
      const code = err?.code;
      switch (code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait and try again.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Check your internet connection.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+Cjwvc3ZnPg==')] opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Admin Brand Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/20 flex items-center justify-center"
          >
            <Crown className="w-8 h-8 text-amber-400" />
          </motion.div>
          <h1 className="font-serif text-xl font-bold tracking-[0.15em] text-white">
            MOTI MAHAL DELUX
          </h1>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-amber-400/70 mt-1">
            Admin Control Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="font-sans text-sm font-semibold text-white tracking-wide">
                Secure Admin Login
              </h2>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-sans">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@motimahal.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-sans">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 py-3 rounded-lg text-sm font-bold tracking-wider uppercase hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Access Dashboard <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security note */}
            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 inline mr-1" />
                Authorized personnel only • All access is logged
              </p>
            </div>
          </div>
        </div>

        {/* Back to website */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-widest"
          >
            ← Return to Website
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
