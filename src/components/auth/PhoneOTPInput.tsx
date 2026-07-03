/**
 * Phone OTP Input Component
 * Handles phone number input with country code and OTP verification flow.
 * Uses Firebase Phone Authentication with invisible reCAPTCHA.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

interface PhoneOTPInputProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function PhoneOTPInput({ onSuccess, onError }: PhoneOTPInputProps) {
  const { setupRecaptcha, loginWithPhone, verifyOTP } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  /** Send OTP to phone number */
  const handleSendOTP = async () => {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    if (formattedPhone.length < 12) {
      onError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setLoading(true);

      // Set up reCAPTCHA if not already set
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container-phone');
      }

      const result = await loginWithPhone(formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      setCountdown(30);

      // Auto-focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      onError(err.message || 'Failed to send OTP. Please try again.');
      // Reset reCAPTCHA on error
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  /** Verify entered OTP */
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      onError('Please enter the complete 6-digit OTP.');
      return;
    }

    if (!confirmationResult) {
      onError('Session expired. Please request a new OTP.');
      return;
    }

    try {
      setLoading(true);
      await verifyOTP(confirmationResult, otpCode);
      onSuccess();
    } catch (err: any) {
      onError(err.message || 'Invalid OTP. Please check and try again.');
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  /** Handle OTP digit input with auto-focus to next */
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  /** Handle backspace key to move to previous input */
  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && otp.join('').length === 6) {
      handleVerifyOTP();
    }
  };

  /** Resend OTP */
  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    recaptchaVerifierRef.current = null;
    handleSendOTP();
  };

  return (
    <div className="space-y-4">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container-phone" ref={recaptchaContainerRef} />

      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Phone Number Input */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-brand-gold mb-2 font-sans">
                Mobile Number
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-brand-bg-secondary border border-brand-divider px-3 py-3 text-sm text-brand-text-secondary font-mono">
                  <span className="text-brand-gold mr-1">🇮🇳</span> +91
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 bg-brand-bg-secondary border border-brand-divider px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/40 font-mono focus:outline-none focus:border-brand-gold/50 transition-colors"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.length < 10}
              className="w-full flex items-center justify-center gap-2 bg-brand-gold text-brand-surface py-3 text-sm font-semibold tracking-wider uppercase hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <p className="text-xs text-brand-text-secondary text-center">
              Enter the 6-digit code sent to{' '}
              <span className="text-brand-gold font-mono">+91 {phoneNumber}</span>
            </p>

            {/* OTP Digit Inputs */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  className="w-11 h-13 text-center text-lg font-mono bg-brand-bg-secondary border border-brand-divider text-brand-text-primary focus:outline-none focus:border-brand-gold transition-colors"
                  maxLength={1}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-brand-gold text-brand-surface py-3 text-sm font-semibold tracking-wider uppercase hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Verify & Sign In'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-xs text-brand-text-secondary">
                  Resend OTP in <span className="text-brand-gold font-mono">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  className="text-xs text-brand-gold hover:underline flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" /> Resend OTP
                </button>
              )}
            </div>

            {/* Back to phone input */}
            <button
              onClick={() => {
                setStep('phone');
                setOtp(['', '', '', '', '', '']);
              }}
              className="w-full text-xs text-brand-text-secondary hover:text-brand-gold transition-colors"
            >
              ← Change phone number
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
