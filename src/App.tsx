/**
 * App.tsx
 * Main coordinator component for Moti Mahal Delux.
 * Sets up routing, real-time Firestore synchronization for menu items, categories,
 * and user favorites, and handles shopping cart operations.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  UtensilsCrossed,
  Clock,
  Instagram,
  MapPin,
  Compass,
  ArrowRight,
  Flame,
  Star,
  BookOpen,
  Phone,
  Home,
  Menu as MenuIcon,
  ShoppingBag,
  CalendarDays
} from 'lucide-react';

import { MenuItem, CartItem, Order, Category, Favorite } from './types';
import { HERO_SLIDES, GALLERY_PHOTOS } from './data';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Core Components
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import ProductDrawer from './components/ProductDrawer';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTracker from './components/OrderTracker';

// Views
import HomeView from './views/HomeView';
import MenuView from './views/MenuView';
import StoryView from './views/StoryView';
import ReservationView from './views/ReservationView';
import TrackOrderView from './views/TrackOrderView';

// Auth & Admin Components
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import AdminLoginPage from './components/auth/AdminLoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfilePage from './components/customer/ProfilePage';

// Admin Pages
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import OrdersManager from './admin/OrdersManager';
import MenuManager from './admin/MenuManager';
import CategoryManager from './admin/CategoryManager';
import ReservationsManager from './admin/ReservationsManager';
import CouponsManager from './admin/CouponsManager';
import ReviewsManager from './admin/ReviewsManager';
import UsersManager from './admin/UsersManager';
import SettingsManager from './admin/SettingsManager';

// Services & Auth Context
import { useAuth } from './contexts/AuthContext';
import { getMenuItems } from './services/menuService';
import { getCategories } from './services/categoryService';
import { getFavorites, toggleFavorite } from './services/favoriteService';
import { isFirebaseConfigured } from './firebase';
import { MENU_ITEMS as STATIC_MENU_ITEMS, CATEGORIES as STATIC_CATEGORIES } from './data';
import toast from 'react-hot-toast';
import { useSettings } from './contexts/SettingsContext';

export default function App() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  // Firestore Synchronized States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Interactive Cart, Drawer, and checkout States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Ref to hold Lenis instance for smooth transitions
  const lenisRef = React.useRef<Lenis | null>(null);

  // 1. Fetch Categories and Menu Items dynamically from Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setMenuItems(STATIC_MENU_ITEMS);
      setCategories(STATIC_CATEGORIES);
      return;
    }

    const unsubMenu = getMenuItems((items) => {
      setMenuItems(items);
    });

    const unsubCategories = getCategories((cats) => {
      // Prepend the static 'all' category for the customer facing view
      const allCategory: Category = {
        id: 'all',
        name: 'Complete Menu',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=300',
        sortOrder: -1,
        isActive: true,
      };
      setCategories([allCategory, ...cats.filter((c) => c.isActive)]);
    });

    return () => {
      unsubMenu();
      unsubCategories();
    };
  }, []);

  // Warn developer if running in offline mode
  useEffect(() => {
    if (!isFirebaseConfigured) {
      toast.error(
        "Moti Mahal is running in Offline Mode. Configure VITE_FIREBASE_API_KEY in .env.local to enable live database.",
        { duration: 10000, id: 'firebase-offline-toast' }
      );
    }
  }, []);

  // 2. Fetch User Favorites in real-time
  useEffect(() => {
    if (user) {
      const unsubFavorites = getFavorites(user.uid, (data) => {
        setFavorites(data);
      });
      return () => unsubFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  // Handle Favorite Toggling
  const handleToggleFavorite = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save favorites');
      navigate('/login');
      return;
    }
    try {
      const res = await toggleFavorite(user.uid, itemId);
      toast.success(res ? 'Added to favorites!' : 'Removed from favorites');
    } catch {
      toast.error('Failed to toggle favorite');
    }
  };

  // Sync cart with local storage on change
  useEffect(() => {
    const storedCart = localStorage.getItem('moti_mahal_cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (err) {
        console.error('Error loading cart state:', err);
      }
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart);
    localStorage.setItem('moti_mahal_cart', JSON.stringify(updatedCart));
  };

  // Lenis & scroll sync loop
  useEffect(() => {
    if (isLoading) return;

    // Disable smooth scroll on admin routes for better performance
    if (location.pathname.startsWith('/admin')) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    lenis.on('scroll', ScrollTrigger.update);
    
    const gsapTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(gsapTicker);
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', (e: any) => {
      const progress = (e.scroll / (e.limit || 1)) * 100;
      setScrollProgress(progress);
    });

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      gsap.ticker.remove(gsapTicker);
      lenisRef.current = null;
    };
  }, [isLoading, location.pathname]);

  // Handle route change animations and scroll resets
  useEffect(() => {
    if (isLoading) return;

    // Reset scroll positions
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }

    // Refresh ScrollTrigger properties
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    // Apply view specific GSAP entrance transitions
    if (location.pathname === '/') {
      gsap.fromTo(
        '#hero-slider .hero-slide-content h1, #hero-slider .hero-slide-content p, #hero-slider .hero-slide-content button',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.1,
        }
      );
    }
  }, [location.pathname, isLoading]);

  // Cart operations
  const triggerCartPulseAndSlide = () => {
    gsap.fromTo(
      ['#header-cart-btn', '#mobile-cart-btn'],
      { scale: 1 },
      {
        scale: 1.25,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: 'back.out(1.7)',
        clearProps: 'scale',
      }
    );

    gsap.fromTo(
      '#cart-count-badge',
      { scale: 1, rotation: 0 },
      {
        scale: 1.4,
        rotation: 12,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        clearProps: 'scale,rotation',
      }
    );

    setIsCartOpen(true);

    setTimeout(() => {
      const panel = document.getElementById('cart-drawer-panel');
      if (panel) {
        gsap.fromTo(
          panel,
          { x: '100%', opacity: 0.8 },
          {
            x: '0%',
            opacity: 1,
            duration: 0.7,
            ease: 'power4.out',
            clearProps: 'transform,opacity',
          }
        );
      }
      const backdrop = document.getElementById('cart-drawer-backdrop');
      if (backdrop) {
        gsap.fromTo(
          backdrop,
          { opacity: 0 },
          {
            opacity: 0.6,
            duration: 0.4,
            ease: 'power2.out',
          }
        );
      }
    }, 40);
  };

  const handleAddToCart = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const existingIndex = cartItems.findIndex(
      (c) => c.menuItem.id === item.id && c.customSpice === 'medium' && c.specialInstructions === ''
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      saveCartToStorage(updated);
    } else {
      const newItem: CartItem = {
        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menuItem: item,
        quantity: 1,
        customSpice: 'medium',
        specialInstructions: '',
      };
      saveCartToStorage([...cartItems, newItem]);
    }

    triggerCartPulseAndSlide();
  };

  const handleAddToCartWithCustom = (
    item: MenuItem,
    quantity: number,
    spice: 'mild' | 'medium' | 'spicy' | 'heritage',
    instructions: string
  ) => {
    const existingIndex = cartItems.findIndex(
      (c) => c.menuItem.id === item.id && c.customSpice === spice && c.specialInstructions === instructions
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      saveCartToStorage(updated);
    } else {
      const newItem: CartItem = {
        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menuItem: item,
        quantity,
        customSpice: spice,
        specialInstructions: instructions,
      };
      saveCartToStorage([...cartItems, newItem]);
    }
    triggerCartPulseAndSlide();
  };

  const handleUpdateCartQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    const updated = cartItems.map((item) => (item.id === id ? { ...item, quantity: newQty } : item));
    saveCartToStorage(updated);
  };

  const handleRemoveCartItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    saveCartToStorage(updated);
  };

  const handleClearCart = () => {
    saveCartToStorage([]);
  };

  const handleOrderPlaced = (
    customerName: string,
    phone: string,
    address: string,
    deliveryTime: string,
    paymentMethod: string
  ) => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
    const tax = subtotal * 0.05;
    const finalOrder: Order = {
      id: `moti-order-${Math.random().toString(36).substr(2, 9)}`,
      customerId: user?.uid || '',
      items: [...cartItems],
      subtotal,
      deliveryFee: 0.00,
      tax,
      discount: 0.00,
      total: subtotal + tax,
      orderType: 'delivery',
      customerName,
      customerPhone: phone,
      customerEmail: user?.email || '',
      deliveryAddress: address,
      deliveryTime,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    setActiveOrder(finalOrder);
    handleClearCart();
    setIsCheckoutOpen(false);
    navigate('/track');
  };

  // Filter and Search Algorithm using dynamic state
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const bestSellers = menuItems.filter((item) => item.isBestSeller);
  const chefSpecials = menuItems.filter((item) => item.isChefSpecial);

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div id="moti-mahal-app-root" className="min-h-screen bg-brand-bg-primary text-brand-text-primary selection:bg-brand-gold selection:text-brand-surface font-sans antialiased">
      
      {/* Cinematic Loading Screen */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

      {!isLoading && (
        <div id="luxury-dining-stage" className="relative pb-16 md:pb-0">
          
          {/* Scroll progress bar top overlay */}
          {!isAdminRoute && (
            <div
              id="scroll-progress-indicator"
              className="fixed top-0 left-0 h-[3px] bg-brand-gold z-50 transition-all duration-300"
              style={{ width: `${scrollProgress}%` }}
            />
          )}

          {/* Premium Sticky Header — Hidden on Admin routes */}
          {!isAdminRoute && (
            <Header
              cartCount={cartTotalCount}
              onOpenCart={triggerCartPulseAndSlide}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {/* Main Content Router Stage */}
          <div className={isAdminRoute ? '' : 'min-h-[70vh]'}>
            <AnimatePresence mode="wait">
              <Routes location={location}>
                {/* Public Customer Routes */}
                <Route
                  path="/"
                  element={
                    <HomeView
                      bestSellers={bestSellers}
                      onSelectItem={setSelectedItem}
                      onAddToCart={handleAddToCart}
                    />
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <MenuView
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      filteredMenuItems={filteredMenuItems}
                      chefSpecials={chefSpecials}
                      onSelectItem={setSelectedItem}
                      onAddToCart={handleAddToCart}
                      categories={categories}
                    />
                  }
                />
                <Route path="/story" element={<StoryView />} />
                <Route path="/reservation" element={<ReservationView />} />
                <Route
                  path="/track"
                  element={<TrackOrderView activeOrder={activeOrder} />}
                />

                {/* Authentication Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Customer Protected Profiles */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'superadmin', 'admin', 'staff', 'delivery']}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Control Panel Shell & Nested Management Layouts */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'admin', 'staff']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<OrdersManager />} />
                  <Route path="menu" element={<MenuManager />} />
                  <Route path="categories" element={<CategoryManager />} />
                  <Route path="reservations" element={<ReservationsManager />} />
                  <Route path="coupons" element={<CouponsManager />} />
                  <Route path="reviews" element={<ReviewsManager />} />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={['superadmin']}>
                        <UsersManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="settings" element={<SettingsManager />} />
                </Route>
              </Routes>
            </AnimatePresence>
          </div>

          {/* Luxury Minimalist Footer — Hidden on Admin Panel */}
          {!isAdminRoute && (
            <footer id="brand-footer" className="bg-brand-text-primary text-brand-bg-primary pt-20 pb-12 border-t border-brand-gold/10">
              <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-brand-bg-secondary/10">
                
                {/* Col 1: Brand & Legacy */}
                <div className="space-y-4">
                  <span className="font-serif text-xl font-bold tracking-[0.2em] text-brand-surface block">G.K. REGENCY</span>
                  <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-brand-gold block mt-1">HOTEL • BANQUETS • DINING</span>
                  <p className="font-sans text-xs text-brand-bg-secondary/70 leading-relaxed pt-2">
                    Bathinda's premium luxury hospitality complex. Proudly home to the legendary Moti Mahal Delux fine dining restaurant, our grand Regency Banquet Hall, and boutique luxury rooms.
                  </p>
                </div>

                {/* Col 2: Navigation Map */}
                <div className="space-y-4">
                  <h5 className="font-serif text-sm tracking-widest text-brand-gold font-medium">Navigations</h5>
                  <ul className="space-y-2.5 font-sans text-xs text-brand-bg-secondary/70">
                    <li>
                      <button onClick={() => navigate('/')} className="hover:text-brand-gold transition-colors duration-300">
                        Sanctuary Home
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigate('/menu')} className="hover:text-brand-gold transition-colors duration-300">
                        Order Moti Mahal Menu
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigate('/story')} className="hover:text-brand-gold transition-colors duration-300">
                        Our Centenary Story
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigate('/reservation')} className="hover:text-brand-gold transition-colors duration-300">
                        Banquets & Table Booking
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Col 3: Sanctuary Locations & Contact */}
                <div className="space-y-4">
                  <h5 className="font-serif text-sm tracking-widest text-brand-gold font-medium">Inquiries</h5>
                  <ul className="space-y-3 font-sans text-xs text-brand-bg-secondary/70">
                    <li className="flex items-start space-x-2">
                      <MapPin size={14} className="text-brand-gold flex-shrink-0 mt-0.5" />
                      <span>{settings?.address || 'Dabwali Road, Bathinda, Punjab 151001, India'} {settings?.deliveryZone ? `(Delivery: ${settings.deliveryZone})` : '(Delivery: Dabwali Gurumukhi Chowk to AIIMS)'}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Phone size={14} className="text-brand-gold flex-shrink-0" />
                      <span>{settings?.phone || '+91 98765 43210'}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Instagram size={14} className="text-brand-gold flex-shrink-0" />
                      {settings?.instagramUsername ? (
                        <a
                          href={`https://instagram.com/${settings.instagramUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-brand-gold transition-colors duration-300"
                        >
                          @{settings.instagramUsername}
                        </a>
                      ) : (
                        <span className="hover:text-brand-gold transition-colors duration-300 cursor-pointer">@gkregency_bathinda</span>
                      )}
                    </li>
                  </ul>
                </div>

                {/* Col 4: Ceremonial Hours */}
                <div className="space-y-4">
                  <h5 className="font-serif text-sm tracking-widest text-brand-gold font-medium">Ceremonial Hours</h5>
                  <ul className="space-y-2.5 font-sans text-xs text-brand-bg-secondary/70">
                    <li className="flex justify-between">
                      <span>Lunch Service:</span>
                      <span className="text-brand-surface font-semibold">12:00 PM – 3:30 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Dinner Service:</span>
                      <span className="text-brand-surface font-semibold">6:00 PM – 11:30 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Hearth Operations:</span>
                      <span className="text-brand-gold font-semibold">Open Seven Days</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Copyright & Sign-off */}
              <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-[10px] text-brand-bg-secondary/40 uppercase tracking-widest">
                <span>© {new Date().getFullYear()} Moti Mahal Delux Ltd. All Rights Reserved.</span>
                <span className="font-serif italic capitalize text-brand-gold text-xs">Pioneering Punjabi Fine Dining since 1920</span>
              </div>
            </footer>
          )}

          {/* MOBILE-FRIENDLY BOTTOM STICKY NAVIGATION BAR — Hidden on Admin routes */}
          {!isAdminRoute && (
            <div
              id="mobile-bottom-navigation"
              className="fixed bottom-0 left-0 right-0 z-35 bg-brand-surface border-t border-brand-divider flex justify-around items-center py-2.5 shadow-xl md:hidden"
            >
              <button
                onClick={() => navigate('/')}
                className="flex flex-col items-center justify-center p-1 text-brand-text-secondary hover:text-brand-gold focus:outline-none"
              >
                <Home size={18} />
                <span className="font-sans text-[8px] tracking-widest uppercase mt-1">Home</span>
              </button>

              <button
                onClick={() => navigate('/menu')}
                className="flex flex-col items-center justify-center p-1 text-brand-text-secondary hover:text-brand-gold focus:outline-none"
              >
                <MenuIcon size={18} />
                <span className="font-sans text-[8px] tracking-widest uppercase mt-1">Menu</span>
              </button>

              {/* Floating primary checkout trigger */}
              <button
                id="mobile-cart-btn"
                onClick={triggerCartPulseAndSlide}
                className="relative flex flex-col items-center justify-center p-1 text-brand-text-secondary hover:text-brand-gold focus:outline-none"
              >
                <ShoppingBag size={18} />
                {cartTotalCount > 0 && (
                  <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[8px] font-mono font-bold text-brand-surface">
                    {cartTotalCount}
                  </span>
                )}
                <span className="font-sans text-[8px] tracking-widest uppercase mt-1">Cart</span>
              </button>

              <button
                onClick={() => navigate('/reservation')}
                className="flex flex-col items-center justify-center p-1 text-brand-text-secondary hover:text-brand-gold focus:outline-none"
              >
                <CalendarDays size={18} />
                <span className="font-sans text-[8px] tracking-widest uppercase mt-1">Reserve</span>
              </button>
            </div>
          )}

          {/* DETAILED PRODUCT PROFILE DRAWER */}
          <ProductDrawer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToCartWithCustom={handleAddToCartWithCustom}
          />

          {/* PRESTIGIOUS ITEM LISTING CART DRAWER */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
            onQuickAdd={(item) => handleAddToCart(item)}
          />

          {/* RAZORPAY & STRIPE-READY CHECKOUT GATEWAY MODAL */}
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cartItems={cartItems}
            onOrderPlaced={handleOrderPlaced}
          />

          {/* ACTIVE IMPERIAL ORDER TRACKER (Interactive dispatch notifier) */}
          <OrderTracker
            activeOrder={activeOrder}
            onClose={() => setActiveOrder(null)}
          />

          {/* Floating WhatsApp Widget */}
          {!isAdminRoute && (
            <a
              href={`https://wa.me/${(settings?.whatsappPhone || '+919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings?.whatsappMessage || 'Hello! I would like to make an inquiry.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center justify-center bg-brand-surface border border-brand-gold/30 hover:border-brand-gold text-brand-gold p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer"
              aria-label="Connect on WhatsApp"
            >
              {/* Subtle heartbeat glow */}
              <span className="absolute inset-0 rounded-full bg-brand-gold/15 animate-ping group-hover:animate-none opacity-75"></span>
              
              <svg
                className="w-5 h-5 fill-current relative z-10"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.455h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
              </svg>
              
              {/* Tooltip on hover */}
              <span className="absolute right-14 bg-brand-text-primary text-brand-surface font-sans text-[10px] tracking-wider uppercase py-1.5 px-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded shadow-md border border-brand-gold/20">
                Chat with Local Desk
              </span>
            </a>
          )}

        </div>
      )}

    </div>
  );
}
