import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute, { FullPageLoader } from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Auth pages
import UserLogin from './pages/auth/UserLogin.jsx';
import UserRegister from './pages/auth/UserRegister.jsx';
import ProviderLogin from './pages/auth/ProviderLogin.jsx';
import ProviderRegister from './pages/auth/ProviderRegister.jsx';

// User pages
import UserDashboard from './pages/user/UserDashboard.jsx';
import SearchPage from './pages/user/SearchPage.jsx';
import UserBookings from './pages/user/UserBookings.jsx';
import UserPayments from './pages/user/UserPayments.jsx';

// Provider pages
import ProviderDashboard from './pages/provider/ProviderDashboard.jsx';
import ProviderListings from './pages/provider/ProviderListings.jsx';
import ProviderBookings from './pages/provider/ProviderBookings.jsx';
import ProviderEarnings from './pages/provider/ProviderEarnings.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminProviders from './pages/admin/AdminProviders.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import AdminPayments from './pages/admin/AdminPayments.jsx';
import AdminKYC from './pages/admin/AdminKYC.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

/** Sends an authenticated visitor to whichever dashboard their real,
 *  backend-confirmed identity corresponds to. Unauthenticated visitors go
 *  to the login screen — there is no default/guest dashboard. */
function RootRedirect() {
  const { isAuthenticated, isAdmin, isProvider, bootstrapping } = useAuth();
  if (bootstrapping) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isProvider) return <Navigate to="/provider/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
}

function ShelledRoutes() {
  const { role, isAdmin, isProvider, isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  // The application shell (sidebar/topbar) is itself gated on a real,
  // backend-confirmed session — it never renders navigation for an
  // unauthenticated visitor while a redirect resolves.
  if (bootstrapping) {
    return <FullPageLoader />;
  }
  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/provider') ? '/provider/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Section shown in the sidebar/topbar reflects the real backend-derived
  // identity (ADMIN role, a real Provider record, or a plain User) — never a
  // locally toggled persona.
  const section = isAdmin ? 'admin' : isProvider ? 'provider' : 'user';

  return (
    <AppShell section={section} role={role}>
      <Routes>
        {/* User Routes */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/bookings"
          element={
            <ProtectedRoute>
              <UserBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/payments"
          element={
            <ProtectedRoute>
              <UserPayments />
            </ProtectedRoute>
          }
        />

        {/* Provider Routes */}
        <Route
          path="/provider/dashboard"
          element={
            <ProtectedRoute requireProvider>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/listings"
          element={
            <ProtectedRoute requireProvider>
              <ProviderListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/bookings"
          element={
            <ProtectedRoute requireProvider>
              <ProviderBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/provider/earnings"
          element={
            <ProtectedRoute requireProvider>
              <ProviderEarnings />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requireAdmin>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/providers"
          element={
            <ProtectedRoute requireAdmin>
              <AdminProviders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kyc"
          element={
            <ProtectedRoute requireAdmin>
              <AdminKYC />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AppShell>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public authentication routes */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/provider/login" element={<ProviderLogin />} />
      <Route path="/provider/register" element={<ProviderRegister />} />

      <Route path="/" element={<RootRedirect />} />

      {/* Everything else is rendered inside the authenticated app shell */}
      <Route path="/*" element={<ShelledRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
