/**
 * AdminLayout.tsx
 * Main admin shell with collapsible sidebar navigation, top bar with user info,
 * breadcrumbs, and responsive mobile hamburger toggle.
 */

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Grid3X3,
  CalendarDays,
  Ticket,
  Star,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Crown,
  Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { label: 'Menu Items', path: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Categories', path: '/admin/categories', icon: Grid3X3 },
  { label: 'Reservations', path: '/admin/reservations', icon: CalendarDays },
  { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
  { label: 'Reviews', path: '/admin/reviews', icon: Star },
  { label: 'Users', path: '/admin/users', icon: Users, superAdminOnly: true },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const BREADCRUMB_MAP: Record<string, string> = {
  admin: 'Dashboard',
  orders: 'Orders',
  menu: 'Menu Items',
  categories: 'Categories',
  reservations: 'Reservations',
  coupons: 'Coupons',
  reviews: 'Reviews',
  users: 'Users',
  settings: 'Settings',
};

export default function AdminLayout() {
  const { user, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Build breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] || seg,
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
    isLast: i === pathSegments.length - 1,
  }));

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const roleBadgeColor: Record<string, string> = {
    superadmin: 'bg-rose-500/5 text-rose-500 border-rose-500/20 rounded-[2px]',
    admin: 'bg-brand-gold/10 text-brand-gold border-brand-gold/25 rounded-[2px]',
    staff: 'bg-brand-bg-secondary text-brand-text-secondary border-brand-divider rounded-[2px]',
    delivery: 'bg-brand-bg-secondary text-brand-text-secondary border-brand-divider rounded-[2px]',
    customer: 'bg-brand-bg-secondary text-brand-text-secondary border-brand-divider rounded-[2px]',
  };

  const filteredNavItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || userProfile?.role === 'superadmin'
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="px-4 py-6 border-b border-brand-divider flex justify-center">
        {sidebarOpen || mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <img src={logo} alt="Moti Mahal Delux" className="h-12 w-auto object-contain" />
            <span className="text-[8px] text-brand-gold font-sans font-bold tracking-[0.3em] uppercase mt-2">
              DELUX ADMIN
            </span>
          </motion.div>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center">
            <img src={logo} alt="MMD" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'nav-active-link bg-brand-bg-secondary/40 text-brand-gold border border-brand-gold/10'
                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover border border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-brand-gold' : 'text-brand-text-muted group-hover:text-brand-text-secondary'
                }`}
              />
              {(sidebarOpen || mobileMenuOpen) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && (sidebarOpen || mobileMenuOpen) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-gold" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Card */}
      {(sidebarOpen || mobileMenuOpen) && (
        <div className="p-4 border-t border-brand-divider">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg-secondary/35">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold to-brand-bronze flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text-primary truncate">
                {user?.displayName || 'Admin User'}
              </p>
              <p className="text-xs text-brand-text-secondary truncate">{user?.email || 'admin@motimahal.com'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-theme flex h-screen bg-brand-bg-primary overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col bg-brand-surface border-r border-brand-divider flex-shrink-0 overflow-hidden"
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-72 bg-brand-surface border-r border-brand-divider z-50 lg:hidden overflow-hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-brand-bg-secondary text-brand-text-secondary hover:text-brand-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-brand-surface/90 backdrop-blur-xl border-b border-brand-divider flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.path}>
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-brand-text-muted" />}
                  <span
                    className={
                      crumb.isLast
                        ? 'text-brand-text-primary font-medium'
                        : 'text-brand-text-secondary hover:text-brand-text-primary cursor-pointer'
                    }
                    onClick={() => !crumb.isLast && navigate(crumb.path)}
                  >
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-5">
            {/* Notification Bell */}
            <button className="relative p-2 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover rounded transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-gold rounded-full" />
            </button>

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3 pl-4 lg:pl-5 border-l border-brand-divider">
              <div className="text-right">
                <p className="text-xs font-semibold text-brand-text-primary uppercase tracking-wider">
                  {user?.displayName || 'Admin User'}
                </p>
                <span
                  className={`inline-block text-[8px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 mt-0.5 border ${
                    roleBadgeColor[userProfile?.role || 'admin']
                  }`}
                >
                  {userProfile?.role || 'admin'}
                </span>
              </div>
              <div className="w-8 h-8 rounded bg-brand-bg-secondary border border-brand-divider flex items-center justify-center text-brand-gold font-bold text-xs flex-shrink-0">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 pl-4 border-l border-brand-divider text-brand-text-secondary hover:text-brand-gold hover:bg-brand-hover rounded transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-brand-bg-primary p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
