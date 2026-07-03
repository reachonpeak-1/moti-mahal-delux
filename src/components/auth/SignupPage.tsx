/**
 * Customer Signup Page
 * Registration form with name, email, phone, password.
 * Creates Firebase Auth user + Firestore profile document.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupPage() {
  const { signupWithEmail, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const displayError = localError || error;

  // Password strength checks
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please create a password.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await signupWithEmail(email, password, name, phone);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-primary flex items-center justify-center px-4 py-12">
      {/* Background ambiance */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold/5 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="font-serif text-2xl font-bold tracking-[0.25em] text-brand-surface block">
              MOTI MAHAL
            </span>
            <span className="font-sans text-[8px] tracking-[0.5em] uppercase text-brand-gold block mt-1">
              DELUX • EST. 1920
            </span>
          </Link>
          <p className="text-brand-text-secondary text-sm mt-4 font-sans">
            Join the Moti Mahal family
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-brand-surface border border-brand-divider shadow-2xl relative">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
          <div className="absolute inset-2 border border-brand-gold/5 pointer-events-none" />

          <div className="p-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="font-serif text-xl text-brand-text-primary mb-2">
                    Welcome to Moti Mahal!
                  </h3>
                  <p className="text-sm text-brand-text-secondary">
                    Your account has been created. Redirecting you now...
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <Sparkles className="w-5 h-5 text-brand-gold mx-auto mb-2" />
                    <h2 className="font-serif text-lg text-brand-text-primary">
                      Create Your Account
                    </h2>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {displayError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-rose-500/10 border border-rose-500/20 flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-300">{displayError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2 font-sans">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/40" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Kamalpreet Singh"
                        className="w-full bg-brand-bg-secondary border border-brand-divider pl-10 pr-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/40 focus:outline-none focus:border-brand-gold/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2 font-sans">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-brand-bg-secondary border border-brand-divider pl-10 pr-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/40 focus:outline-none focus:border-brand-gold/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2 font-sans">
                      Phone <span className="text-brand-text-secondary/40 normal-case tracking-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/40" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full bg-brand-bg-secondary border border-brand-divider pl-10 pr-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/40 focus:outline-none focus:border-brand-gold/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2 font-sans">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full bg-brand-bg-secondary border border-brand-divider pl-10 pr-10 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/40 focus:outline-none focus:border-brand-gold/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary/40 hover:text-brand-text-primary"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password strength indicators */}
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-400' : 'bg-brand-text-secondary/30'}`} />
                          <span className={hasMinLength ? 'text-emerald-400' : 'text-brand-text-secondary/50'}>
                            At least 6 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <div className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-emerald-400' : 'bg-brand-text-secondary/30'}`} />
                          <span className={hasUppercase ? 'text-emerald-400' : 'text-brand-text-secondary/50'}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-400' : 'bg-brand-text-secondary/30'}`} />
                          <span className={hasNumber ? 'text-emerald-400' : 'text-brand-text-secondary/50'}>
                            One number
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2 font-sans">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full bg-brand-bg-secondary border pl-10 pr-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/40 focus:outline-none transition-colors ${
                          confirmPassword.length > 0
                            ? passwordsMatch
                              ? 'border-emerald-500/50'
                              : 'border-rose-500/50'
                            : 'border-brand-divider focus:border-brand-gold/50'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-brand-gold text-brand-surface py-3 text-sm font-semibold tracking-wider uppercase hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create Account <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Login Link */}
            {!success && (
              <p className="text-center text-xs text-brand-text-secondary mt-6 pt-6 border-t border-brand-divider">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-brand-gold hover:underline font-semibold"
                >
                  Sign In
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-xs text-brand-text-secondary/60 hover:text-brand-gold transition-colors uppercase tracking-widest"
          >
            ← Return to Moti Mahal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
