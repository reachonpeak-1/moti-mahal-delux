/**
 * CheckoutModal.tsx
 * Rewrite of static CheckoutModal to support:
 * 1. User Authentication (auto prefill fields)
 * 2. Coupon Validation and Discounts
 * 3. Saved Addresses selection
 * 4. Razorpay payment integration (cards, UPI, netbanking, wallets)
 * 5. Cash on Delivery (COD) fallback
 * 6. Order type (Delivery, Takeaway, Dine-in) selection
 * 7. Firestore Order creation & real-time status update tracking transition
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, CreditCard, Clock, MapPin, Sparkles, Check, ChevronRight, ChevronLeft, Loader2, Ticket, Award } from 'lucide-react';
import { CartItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { validateCoupon, incrementCouponUsage } from '../services/couponService';
import { getAddresses } from '../services/addressService';
import { createOrder } from '../services/orderService';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderPlaced: (customerName: string, phone: string, address: string, deliveryTime: string, paymentMethod: string) => void;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderPlaced }: CheckoutModalProps) {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);

  // Order Settings
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway' | 'dinein'>('delivery');
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gateCode, setGateCode] = useState('');
  
  // Address List (from Firestore)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Delivery timing
  const [deliveryTime, setDeliveryTime] = useState('asap');
  const [customTime, setCustomTime] = useState('');
  
  // Payment setting
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cash'>('razorpay');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Prefill user details if logged in
  useEffect(() => {
    if (userProfile) {
      setCustomerName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  // Load saved addresses
  useEffect(() => {
    if (user && orderType === 'delivery') {
      const unsub = getAddresses(user.uid, (data) => {
        setSavedAddresses(data);
        const defaultAddr = data.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setAddress(defaultAddr.address);
        }
      });
      return () => unsub();
    }
  }, [user, orderType]);

  if (!isOpen) return null;

  // Calculate pricing
  const subtotal = cartItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? 0.00 : 0.00; // Free delivery always as requested
  const tax = subtotal * 0.05; // 5% GST
  
  // Apply coupon discount
  const totalBeforeDiscount = subtotal + deliveryFee + tax;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setValidatingCoupon(true);
      const res = await validateCoupon(couponCode.toUpperCase(), subtotal);
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setDiscountAmount(res.discount);
        toast.success(`Coupon "${couponCode.toUpperCase()}" applied! Saved ₹${res.discount}`);
      } else {
        toast.error(res.message || 'Invalid coupon');
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    } catch {
      toast.error('Failed to validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!customerName.trim()) errors.name = 'Please provide your full name.';
    if (!phone.trim()) errors.phone = 'Mobile phone is required for order coordination.';
    if (orderType === 'delivery' && !address.trim()) errors.address = 'A delivery location is mandatory.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleAddressSelect = (addrId: string) => {
    setSelectedAddressId(addrId);
    const selected = savedAddresses.find((a) => a.id === addrId);
    if (selected) {
      setAddress(selected.address);
    }
  };

  // Helper: Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('You must be logged in to place an order.');
      return;
    }

    try {
      setProcessingOrder(true);

      const timeToDeliver = deliveryTime === 'asap' ? 'As soon as possible (25-35 mins)' : customTime || 'Scheduled Time';
      const orderPayload: any = {
        customerId: user.uid,
        items: cartItems,
        subtotal,
        deliveryFee,
        tax,
        discount: discountAmount,
        total,
        couponCode: appliedCoupon?.code || '',
        orderType,
        customerName,
        customerPhone: phone,
        customerEmail: user.email || '',
        deliveryAddress: orderType === 'delivery' ? address : `Takeaway/Dinein — ${orderType.toUpperCase()}`,
        deliveryTime: timeToDeliver,
        paymentMethod: paymentMethod === 'razorpay' ? 'razorpay' : 'cash',
        paymentStatus: 'pending',
        status: 'received',
        createdAt: new Date().toISOString(),
      };

      // Create local Firestore draft order first
      const orderId = await createOrder(orderPayload);

      // Handle Cash on Delivery (COD) / Cash on Arrival
      if (paymentMethod === 'cash') {
        // Update payment status to cod and save
        orderPayload.id = orderId;
        orderPayload.paymentStatus = 'cod';
        
        if (appliedCoupon) {
          await incrementCouponUsage(appliedCoupon.id);
        }

        onOrderPlaced(customerName, phone, orderPayload.deliveryAddress, timeToDeliver, 'Cash on Delivery');
        onClose();
        return;
      }

      // Handle Razorpay Online Payment Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Check your internet connection.');
        setProcessingOrder(false);
        return;
      }

      // Create Razorpay Order on server side via Cloud Functions
      const createOrderCF = httpsCallable(functions, 'createRazorpayOrder');
      const rzpOrderResponse = await createOrderCF({
        amount: total,
        orderId: orderId,
        customerName: customerName,
      });

      const { razorpayOrderId } = rzpOrderResponse.data as any;

      // Initialize Razorpay Options
      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: Math.round(total * 100),
        currency: 'INR',
        name: 'Moti Mahal Delux',
        description: 'Authentic Indian Fine Dining Order',
        order_id: razorpayOrderId,
        prefill: {
          name: customerName,
          email: user.email || '',
          contact: phone,
        },
        theme: {
          color: '#C9A96E', // Brand Gold
        },
        handler: async function (response: any) {
          try {
            setProcessingOrder(true);
            
            // Verify payment on server side via Cloud Functions
            const verifyPaymentCF = httpsCallable(functions, 'verifyRazorpayPayment');
            const verificationResponse = await verifyPaymentCF({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,
            });

            const verificationResult = verificationResponse.data as any;

            if (verificationResult.success) {
              if (appliedCoupon) {
                await incrementCouponUsage(appliedCoupon.id);
              }
              toast.success('Payment authorized and verified! Order placed.');
              onOrderPlaced(customerName, phone, orderPayload.deliveryAddress, timeToDeliver, 'Razorpay Online');
              onClose();
            } else {
              toast.error('Payment signature verification failed.');
            }
          } catch (err: any) {
            toast.error(err.message || 'Verification failed. Please contact hospitality support.');
          } finally {
            setProcessingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled by user.');
            setProcessingOrder(false);
          },
        },
      };

      const razorpayObj = new (window as any).Razorpay(options);
      razorpayObj.open();

    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize order payment.');
      setProcessingOrder(false);
    }
  };

  return (
    <AnimatePresence>
      <div id="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Backdrop */}
        <motion.div
          id="checkout-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-brand-text-primary/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          id="checkout-modal-window"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-brand-surface shadow-2xl border border-brand-divider flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-brand-divider bg-brand-surface">
            <div className="flex flex-col">
              <span className="font-sans text-[9px] tracking-[0.3em] text-brand-text-secondary uppercase">Private Banquet Checkout</span>
              <h3 className="font-serif text-xl font-normal text-brand-text-primary tracking-wide">
                Moti Mahal Delux Private Order
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-brand-divider text-brand-text-secondary hover:text-brand-text-primary transition-colors duration-300 focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress bar */}
          <div className="flex border-b border-brand-divider bg-brand-bg-primary text-center font-sans text-[10px] tracking-widest uppercase text-brand-text-secondary">
            <div className={`flex-1 py-3 border-r border-brand-divider ${step === 1 ? 'text-brand-gold font-bold bg-brand-surface' : ''}`}>
              1. Coordination Details
            </div>
            <div className={`flex-1 py-3 border-r border-brand-divider ${step === 2 ? 'text-brand-gold font-bold bg-brand-surface' : ''}`}>
              2. Timing & Payment
            </div>
            <div className={`flex-1 py-3 ${step === 3 ? 'text-brand-gold font-bold bg-brand-surface' : ''}`}>
              3. Review & Authorize
            </div>
          </div>

          {/* Body Forms */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            
            {/* STEP 1: Address & Coordination Details */}
            {step === 1 && (
              <div id="checkout-step-1" className="space-y-4">
                
                {/* Order Type Selector */}
                <div>
                  <label className="block font-sans text-[10px] font-bold tracking-wider text-brand-text-primary uppercase mb-2">
                    Service Dining Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['delivery', 'takeaway', 'dinein'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setOrderType(type);
                          if (type !== 'delivery') setAddress('');
                        }}
                        className={`py-3 text-center border text-[10px] uppercase font-semibold tracking-wider transition-all ${
                          orderType === type
                            ? 'border-brand-gold bg-brand-bg-secondary text-brand-gold'
                            : 'border-brand-divider text-brand-text-secondary hover:border-brand-text-primary'
                        }`}
                      >
                        {type === 'delivery' ? 'Home Delivery' : type === 'takeaway' ? 'Self Takeaway' : 'Imperial Dine-in'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block font-sans text-[10px] font-bold tracking-wider text-brand-text-primary uppercase mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Guest / Full Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full bg-brand-surface text-brand-text-primary border ${formErrors.name ? 'border-red-700' : 'border-brand-divider'} p-3 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-secondary/40`}
                    />
                    {formErrors.name && <span className="text-red-700 font-sans text-[10px] mt-1 block">{formErrors.name}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-sans text-[10px] font-bold tracking-wider text-brand-text-primary uppercase mb-1.5">
                      Coordination Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="E.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`w-full bg-brand-surface text-brand-text-primary border ${formErrors.phone ? 'border-red-700' : 'border-brand-divider'} p-3 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-secondary/40`}
                    />
                    {formErrors.phone && <span className="text-red-700 font-sans text-[10px] mt-1 block">{formErrors.phone}</span>}
                  </div>
                </div>

                {/* Delivery details conditional block */}
                {orderType === 'delivery' && (
                  <div className="space-y-4 pt-2 border-t border-brand-divider">
                    
                    {/* Saved Addresses dropdown */}
                    {savedAddresses.length > 0 && (
                      <div>
                        <label className="block font-sans text-[10px] font-bold tracking-wider text-brand-text-primary uppercase mb-1.5">
                          Select Saved Address
                        </label>
                        <select
                          value={selectedAddressId}
                          onChange={(e) => handleAddressSelect(e.target.value)}
                          className="w-full bg-brand-bg-primary text-brand-text-primary border border-brand-divider p-3 font-sans text-xs focus:outline-none focus:border-brand-gold"
                        >
                          <option value="">-- Choose saved address --</option>
                          {savedAddresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.label}: {addr.address.slice(0, 50)}...
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Street Address */}
                    <div>
                      <label className="block font-sans text-[10px] font-bold tracking-wider text-brand-text-primary uppercase mb-1.5">
                        Banquet Delivery Location
                      </label>
                      <input
                        type="text"
                        placeholder="Enter complete street name, building number, suite/apartment"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={`w-full bg-brand-surface text-brand-text-primary border ${formErrors.address ? 'border-red-700' : 'border-brand-divider'} p-3 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-secondary/40`}
                      />
                      {formErrors.address && <span className="text-red-700 font-sans text-[10px] mt-1 block">{formErrors.address}</span>}
                    </div>

                    {/* Access Code / Gate */}
                    <div>
                      <label className="block font-sans text-[10px] font-bold tracking-wider text-brand-text-primary uppercase mb-1.5">
                        Gate Access Code / Concierge Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. Buzz room 4B, leave at reception counter"
                        value={gateCode}
                        onChange={(e) => setGateCode(e.target.value)}
                        className="w-full bg-brand-surface text-brand-text-primary border border-brand-divider p-3 font-sans text-xs focus:outline-none focus:border-brand-gold rounded-none placeholder-brand-text-secondary/40"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Delivery Schedule & Payment Ceremony */}
            {step === 2 && (
              <div id="checkout-step-2" className="space-y-6">
                
                {/* 1. Timing selection */}
                <div>
                  <div className="flex items-center space-x-2 text-brand-gold mb-3">
                    <Clock size={16} />
                    <span className="font-serif italic text-base">When shall we serve your meal?</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryTime('asap')}
                      className={`p-4 border text-left transition-all duration-300 ${
                        deliveryTime === 'asap'
                          ? 'border-brand-gold bg-brand-bg-secondary text-brand-text-primary font-bold'
                          : 'border-brand-divider hover:border-brand-text-secondary text-brand-text-secondary bg-brand-surface'
                      }`}
                    >
                      <span className="font-serif text-sm block">Imperial Rush (ASAP)</span>
                      <span className="font-sans text-[9px] text-brand-text-secondary/50 uppercase tracking-wider block mt-1">25 - 35 minutes delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryTime('scheduled')}
                      className={`p-4 border text-left transition-all duration-300 ${
                        deliveryTime === 'scheduled'
                          ? 'border-brand-gold bg-brand-bg-secondary text-brand-text-primary font-bold'
                          : 'border-brand-divider hover:border-brand-text-secondary text-brand-text-secondary bg-brand-surface'
                      }`}
                    >
                      <span className="font-serif text-sm block">Scheduled Feast</span>
                      <span className="font-sans text-[9px] text-brand-text-secondary/50 uppercase tracking-wider block mt-1">Plan for later today</span>
                    </button>
                  </div>

                  {deliveryTime === 'scheduled' && (
                    <div className="mt-3">
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="bg-brand-surface text-brand-text-primary border border-brand-gold p-2.5 font-sans text-xs focus:outline-none w-full rounded-none"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* 2. Coupon Application Panel */}
                <div>
                  <div className="flex items-center space-x-2 text-brand-gold mb-3">
                    <Ticket size={16} />
                    <span className="font-serif italic text-base">Promotional Vouchers</span>
                  </div>
                  
                  {appliedCoupon ? (
                    <div className="bg-brand-bg-secondary border border-brand-gold/30 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-brand-gold">
                        <Award size={18} />
                        <div>
                          <p className="text-xs font-mono font-bold">{appliedCoupon.code}</p>
                          <p className="text-[10px] text-brand-text-secondary">Saved ₹{discountAmount} on this order</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-400 hover:text-rose-500 font-semibold uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER PROMO CODE (e.g. WELCOME50)"
                        className="flex-1 bg-brand-surface text-brand-text-primary border border-brand-divider p-3 font-sans text-xs focus:outline-none focus:border-brand-gold font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="bg-brand-gold hover:bg-brand-text-primary text-brand-surface font-sans text-xs tracking-widest uppercase py-3 px-6 hover:shadow-md transition-all duration-300 disabled:opacity-50"
                      >
                        {validatingCoupon ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Payment Method */}
                <div>
                  <div className="flex items-center space-x-2 text-brand-gold mb-3">
                    <CreditCard size={16} />
                    <span className="font-serif italic text-base">Select Payment Gateway</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-3 border text-center transition-all duration-300 ${
                        paymentMethod === 'razorpay'
                          ? 'border-brand-gold bg-brand-bg-secondary text-brand-text-primary font-bold'
                          : 'border-brand-divider hover:border-brand-text-secondary text-brand-text-secondary bg-brand-surface'
                      }`}
                    >
                      <span className="font-sans text-[10px] tracking-widest uppercase">Razorpay Secure Online</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 border text-center transition-all duration-300 ${
                        paymentMethod === 'cash'
                          ? 'border-brand-gold bg-brand-bg-secondary text-brand-text-primary font-bold'
                          : 'border-brand-divider hover:border-brand-text-secondary text-brand-text-secondary bg-brand-surface'
                      }`}
                    >
                      <span className="font-sans text-[10px] tracking-widest uppercase">Cash on Arrival</span>
                    </button>
                  </div>

                  {paymentMethod === 'razorpay' && (
                    <div className="p-4 bg-brand-bg-primary border border-brand-divider text-center">
                      <span className="font-sans text-[9px] tracking-widest text-brand-text-secondary/50 uppercase block mb-1">
                        Secure SSL Gateway by Razorpay
                      </span>
                      <p className="text-xs text-brand-text-secondary leading-relaxed">
                        Supports UPI (GPay, PhonePe, Paytm), Cards (Visa, Mastercard, RuPay), Netbanking, and top Wallets.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Complete Review of Bill & Order items */}
            {step === 3 && (
              <div id="checkout-step-3" className="space-y-4">
                <div className="flex items-center space-x-2 text-brand-gold mb-2">
                  <ShieldCheck size={18} />
                  <span className="font-serif italic text-base">Your Culinary Banquet is Authorized</span>
                </div>

                <div className="bg-brand-bg-primary border border-brand-divider p-4 text-xs font-sans text-brand-text-secondary space-y-3">
                  <div className="flex justify-between border-b border-brand-divider pb-2 text-brand-text-primary font-bold">
                    <span>RECIPIENT DETAILS</span>
                    <span className="text-brand-gold uppercase">{orderType} service</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-brand-text-primary">{customerName}</span>
                    {orderType === 'delivery' ? (
                      <span className="block">{address} {gateCode && `(Code: ${gateCode})`}</span>
                    ) : (
                      <span className="block italic text-brand-gold">Outpost Pick-up / Table Service Reservation</span>
                    )}
                    <span className="block mt-1">Tel: {phone}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-divider pt-2 font-semibold">
                    <span>DELIVERY TIMING</span>
                    <span className="text-brand-text-primary">{deliveryTime === 'asap' ? 'Immediate Service (25-35 mins)' : customTime}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>PAYMENT INSTRUMENT</span>
                    <span className="text-brand-text-primary">{paymentMethod === 'razorpay' ? 'Razorpay Secure Payment' : 'Cash on Arrival'}</span>
                  </div>
                </div>

                {/* Simple itemized list */}
                <div className="space-y-2 border-b border-brand-divider pb-3 max-h-40 overflow-y-auto">
                  <span className="font-sans text-[9px] tracking-widest text-brand-text-secondary/50 uppercase block">BANQUET INVENTORY ({cartItems.length} ITEMS)</span>
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-brand-text-secondary font-sans">
                      <span>{item.quantity} x {item.menuItem.name} <span className="text-[9px] font-mono text-brand-gold">({item.customSpice})</span></span>
                      <span className="font-mono">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Final Bill math */}
                <div className="space-y-1 text-right font-sans text-xs text-brand-text-secondary">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {orderType === 'delivery' && (
                    <div className="flex justify-between">
                      <span>Premium Delivery</span>
                      <span className="font-mono">₹{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Luxury GST (5%)</span>
                    <span className="font-mono">₹{tax.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-brand-gold font-semibold">
                      <span>Promo Discount</span>
                      <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-brand-text-primary border-t border-brand-divider pt-2 mt-2">
                    <span className="font-serif">Grand Authoritative Total</span>
                    <span className="font-mono text-brand-gold">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer controls */}
          <div className="border-t border-brand-divider p-6 bg-brand-surface flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={processingOrder}
                className="flex items-center space-x-1.5 border border-brand-divider hover:border-brand-text-primary text-brand-text-secondary hover:text-brand-text-primary py-3 px-5 text-[10px] tracking-widest uppercase font-sans transition-all duration-300 focus:outline-none disabled:opacity-40"
              >
                <ChevronLeft size={12} />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                id="checkout-next-btn"
                onClick={handleNextStep}
                className="bg-brand-gold hover:bg-brand-text-primary text-brand-surface font-sans text-xs tracking-widest uppercase py-4 px-8 hover:shadow-md transition-all duration-300 focus:outline-none flex items-center space-x-2"
              >
                <span>Continue</span>
                <ChevronRight size={12} />
              </button>
            ) : (
              <button
                type="button"
                id="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={processingOrder}
                className="bg-brand-text-primary hover:bg-brand-gold text-brand-surface font-sans text-xs tracking-widest uppercase py-4 px-8 hover:shadow-lg transition-all duration-300 focus:outline-none flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingOrder ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Authorizing Order...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-brand-gold animate-pulse" />
                    <span>Place Heritage Order</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
