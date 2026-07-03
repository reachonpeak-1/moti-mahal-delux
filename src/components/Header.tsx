/**
 * Header.tsx
 * Sticky website header supporting:
 * 1. User authentication state (displays profile avatar or initials)
 * 2. Dropdown menu with navigation to Customer Profile, Admin Panel (if authorized), and Sign Out
 * 3. Shopping cart bag count indicator
 * 4. Inline search bar
 */

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Calendar, Phone, Menu, X, Clock, Compass, User, LogOut, ShieldAlert, Award } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/gk_regency_logo.png';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Header({
  cartCount,
  onOpenCart,
  searchQuery,
  setSearchQuery,
}: HeaderProps) {
  const { user, userProfile, logout } = useAuth();
  const { settings } = useSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isLightHeader = isScrolled || location.pathname !== '/';

  const getLinkClass = (path: string) => {
    const isActiveLink = isActive(path);
    if (isActiveLink) {
      return 'font-sans text-[11px] tracking-[0.2em] uppercase font-bold text-brand-gold transition-colors duration-300';
    }
    
    return `font-sans text-[11px] tracking-[0.2em] uppercase font-semibold transition-colors duration-300 ${
      isLightHeader
        ? 'text-brand-text-secondary hover:text-brand-gold'
        : 'text-brand-surface hover:text-brand-gold'
    }`;
  };

  const iconColorClass = isLightHeader
    ? 'text-brand-text-primary hover:text-brand-gold'
    : 'text-brand-surface hover:text-brand-gold';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const isAdminOrStaff = userProfile && ['superadmin', 'admin', 'staff'].includes(userProfile.role);

  return (
    <>
      <header
        id="app-header"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 border-b ${
          isLightHeader
            ? 'bg-brand-surface border-brand-divider py-2.5 shadow-md'
            : 'bg-brand-text-primary/25 backdrop-blur-sm border-white/5 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative flex items-center justify-between">
          
          {/* Left Navigation Links & Mobile Menu Toggle */}
          <div className="flex items-center flex-1 justify-start">
            <nav id="desktop-navigation-left" className="hidden lg:flex items-center space-x-10">
              <Link to="/menu" className={getLinkClass('/menu')}>
                Moti Mahal Menu
              </Link>
              <Link to="/story" className={getLinkClass('/story')}>
                Our Story
              </Link>
            </nav>

            {/* Mobile Menu Toggle (Left aligned) */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-1.5 transition-colors duration-300 focus:outline-none -ml-2 ${iconColorClass}`}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Centered Brand Logo */}
          <div className="flex items-center justify-center flex-shrink-0">
            <Link
              id="header-brand-logo"
              to="/"
              className="flex items-center justify-center group cursor-pointer focus:outline-none"
            >
              <img
                src={logo}
                alt="Moti Mahal Delux"
                className={`w-auto object-contain transition-all duration-500 ${
                  isLightHeader
                    ? 'h-[36px] md:h-[46px]'
                    : 'h-[48px] md:h-[64px]'
                }`}
                style={{
                  filter: isLightHeader
                    ? 'drop-shadow(0 1px 3px rgba(182, 138, 68, 0.15)) brightness(0.95) contrast(1.05)'
                    : 'drop-shadow(0 2px 10px rgba(182, 138, 68, 0.45)) brightness(1.35) contrast(1.15) saturate(1.2)',
                }}
              />
            </Link>
          </div>

          {/* Right Navigation Links & Action Icons */}
          <div className="flex items-center flex-1 justify-end space-x-4 md:space-x-6">
            <div className="flex items-center space-x-3.5 md:space-x-4">
              {/* Search Input Button */}
              <div className="relative flex items-center">
                {isSearchOpen && (
                  <input
                    id="header-search-input"
                    type="text"
                    placeholder="Search heritage menu..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (location.pathname !== '/menu') {
                        navigate('/menu');
                      }
                    }}
                    className={`w-36 sm:w-48 md:w-56 font-sans text-xs px-3 py-1.5 rounded-none border focus:outline-none focus:border-brand-gold mr-2 transition-all duration-300 ${
                      isLightHeader
                        ? 'bg-brand-bg-secondary text-brand-text-primary border-brand-divider'
                        : 'bg-brand-text-primary/90 backdrop-blur-md text-brand-bg-primary border-brand-gold/30'
                    }`}
                    autoFocus
                  />
                )}
                <button
                  id="toggle-search-btn"
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    if (isSearchOpen) {
                      setSearchQuery('');
                    } else {
                      if (location.pathname !== '/menu') {
                        navigate('/menu');
                      }
                    }
                  }}
                  className={`p-1 transition-colors duration-300 focus:outline-none ${iconColorClass}`}
                  aria-label="Search"
                >
                  {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>
              </div>

              {/* Book Table Button */}
              <Link
                id="header-book-table-btn"
                to="/reservation"
                className={`hidden sm:flex items-center space-x-2 border px-4 py-2 text-[9px] tracking-[0.18em] uppercase font-sans font-bold transition-all duration-300 ${
                  isLightHeader
                    ? 'border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-surface'
                    : 'border-brand-gold/80 text-brand-gold hover:bg-brand-gold hover:text-brand-surface bg-brand-text-primary/20 backdrop-blur-sm'
                }`}
              >
                <Calendar size={11} />
                <span>Banquets & Tables</span>
              </Link>

              {/* Premium Interactive Cart Bag */}
              <button
                id="header-cart-btn"
                onClick={onOpenCart}
                className={`relative p-1.5 transition-colors duration-300 focus:outline-none flex items-center ${iconColorClass}`}
                aria-label="View Cart"
              >
                <ShoppingBag size={21} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span
                    id="cart-count-badge"
                    className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-gold text-[8px] font-mono font-bold text-brand-surface animate-pulse"
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User authentication account menu */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-8 h-8 rounded-full bg-brand-gold/10 hover:bg-brand-gold/25 border border-brand-gold/20 flex items-center justify-center text-brand-gold font-bold uppercase overflow-hidden transition-all focus:outline-none cursor-pointer"
                  >
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      userProfile?.displayName.slice(0, 2) || 'Me'
                    )}
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-52 bg-brand-surface border border-brand-divider shadow-2xl p-2 flex flex-col gap-1 z-55"
                      >
                        <div className="px-3 py-2 border-b border-brand-divider text-left">
                          <p className="text-xs font-semibold text-brand-text-primary truncate">{userProfile?.displayName || 'Moti Mahal Guest'}</p>
                          <p className="text-[10px] text-brand-text-secondary truncate mt-0.5">{user.email}</p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 text-xs text-brand-text-secondary hover:text-brand-gold hover:bg-brand-bg-primary transition-all text-left"
                        >
                          <User size={13} />
                          <span>My Profile / History</span>
                        </Link>

                        {isAdminOrStaff && (
                          <Link
                            to="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs text-brand-gold hover:bg-brand-bg-primary transition-all text-left"
                          >
                            <Award size={13} />
                            <span className="font-semibold">Admin Panel</span>
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-2 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                        >
                          <LogOut size={13} />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`text-[9px] tracking-[0.18em] uppercase font-sans font-bold px-3 py-2 border transition-all ${
                    isLightHeader
                      ? 'border-brand-divider text-brand-text-secondary hover:border-brand-gold hover:text-brand-gold'
                      : 'border-white/10 text-brand-surface hover:border-brand-gold hover:text-brand-gold'
                  }`}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu-backdrop"
          className="fixed inset-0 z-30 bg-brand-text-primary/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      <div
        id="mobile-navigation-drawer"
        className={`fixed top-0 right-0 bottom-0 z-40 w-72 bg-brand-surface p-8 border-l border-brand-divider transition-transform duration-500 transform lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-12">
          <span className="font-serif text-sm tracking-widest text-brand-text-secondary">NAVIGATION</span>
          <button
            id="close-mobile-nav-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-brand-text-secondary hover:text-brand-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <nav id="mobile-drawer-links" className="flex flex-col space-y-6">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-left font-serif text-2xl tracking-wide text-brand-text-primary hover:text-brand-gold transition-colors duration-300"
          >
            Sanctuary Home
          </Link>
          <Link
            to="/menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-left font-serif text-2xl tracking-wide text-brand-text-primary hover:text-brand-gold transition-colors duration-300"
          >
            Order Online
          </Link>
          <Link
            to="/story"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-left font-serif text-2xl tracking-wide text-brand-text-primary hover:text-brand-gold transition-colors duration-300"
          >
            Our Story
          </Link>
          <Link
            to="/reservation"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-left font-serif text-2xl tracking-wide text-brand-text-primary hover:text-brand-gold transition-colors duration-300"
          >
            Reserve Table
          </Link>
          <Link
            to="/track"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-left font-serif text-2xl tracking-wide text-brand-text-primary hover:text-brand-gold transition-colors duration-300"
          >
            Track Order
          </Link>
          
          {user && (
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-left font-serif text-2xl tracking-wide text-brand-gold transition-colors duration-300 border-t border-brand-divider pt-4"
            >
              My Profile
            </Link>
          )}

          {isAdminOrStaff && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-left font-serif text-2xl tracking-wide text-brand-gold transition-colors duration-300"
            >
              Admin Dashboard
            </Link>
          )}
        </nav>

        <div className="absolute bottom-12 left-8 right-8 border-t border-brand-divider pt-6 text-center">
          <p className="font-sans text-[10px] tracking-widest text-brand-text-secondary/45 uppercase">MOTI MAHAL DELUX</p>
          <p className="font-serif text-xs italic text-brand-text-secondary mt-2">Delivering Pure Legacy Since 1920</p>
          <div className="flex items-center justify-center space-x-2 text-brand-gold mt-4 font-mono text-xs">
            <Phone size={12} />
            <span>{settings?.phone || '+91 98765 43210'}</span>
          </div>
        </div>
      </div>
    </>
  );
}
