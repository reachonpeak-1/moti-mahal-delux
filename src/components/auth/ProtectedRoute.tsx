/**
 * Protected Route Component
 * Wraps routes that require authentication and specific user roles.
 * Redirects to login or shows access denied based on auth state.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being resolved
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm tracking-widest uppercase font-sans">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    const loginPath = redirectTo || (location.pathname.startsWith('/admin') ? '/admin/login' : '/login');
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="max-w-md w-full mx-4 bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="font-serif text-2xl text-white mb-3">Access Denied</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You do not have the required permissions to access this area.
            Your current role is <span className="text-amber-400 font-semibold capitalize">{userRole}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              Go Back
            </button>
            <a
              href="/"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-semibold rounded-lg transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
