import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2.5 text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        Verifying your session with the API Gateway...
      </div>
    </div>
  );
}

/**
 * Gates a route behind a real, backend-confirmed session.
 *
 * - `requireAdmin`: only accounts whose JWT role claim is "ADMIN" may pass.
 * - `requireProvider`: only accounts with a real Provider record (confirmed
 *   via GET /api/v1/providers/user/{userId}) may pass. Users without one are
 *   sent to the Provider Registration page instead of being silently allowed
 *   in or shown fabricated provider data.
 */
export default function ProtectedRoute({ children, requireAdmin = false, requireProvider = false }) {
  const { isAuthenticated, isAdmin, isProvider, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/provider') ? '/provider/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireProvider && !isProvider) {
    return <Navigate to="/provider/register" replace />;
  }

  return children;
}
