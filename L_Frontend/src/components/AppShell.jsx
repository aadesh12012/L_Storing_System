import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  CreditCard,
  Store,
  Users,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
  BarChart3,
  Luggage,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

/* ---- Navigation config per section ---- */
const NAV = {
  user: [
    {
      section: 'Main Navigation',
      items: [
        { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/user/search', label: 'Find Storage', icon: Map },
        { to: '/user/bookings', label: 'My Bookings', icon: CalendarDays },
        { to: '/user/payments', label: 'Payments', icon: CreditCard },
      ],
    },
  ],
  provider: [
    {
      section: 'Operations',
      items: [
        { to: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/provider/listings', label: 'My Locations', icon: Store },
        { to: '/provider/bookings', label: 'Bookings', icon: CalendarDays },
        { to: '/provider/earnings', label: 'Earnings & Payouts', icon: CreditCard },
      ],
    },
  ],
  admin: [
    {
      section: 'Overview',
      items: [
        { to: '/admin/dashboard', label: 'Platform Overview', icon: LayoutDashboard },
        { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      section: 'Management',
      items: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/providers', label: 'Providers', icon: Store },
        { to: '/admin/bookings', label: 'All Bookings', icon: CalendarDays },
        { to: '/admin/payments', label: 'Payments & Refunds', icon: CreditCard },
      ],
    },
    {
      section: 'System',
      items: [
        { to: '/admin/kyc', label: 'Provider Approval', icon: ShieldCheck },
        { to: '/admin/settings', label: 'Platform Settings', icon: Settings },
      ],
    },
  ],
};

const SECTION_TITLE = {
  user: 'Traveller & Customer',
  provider: 'Storage Partner',
  admin: 'Platform Administrator',
};

function initialsOf(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Authenticated application shell. Displays the real signed-in user's name,
 * email, and role (fetched from the User Service via AuthContext) — there is
 * no locally-toggled "persona" switcher here; the active section is derived
 * entirely from the account's real backend-confirmed role / Provider record.
 */
export default function AppShell({ section, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, providerProfile, logout } = useAuth();

  const nav = NAV[section] || NAV.user;
  const displayName = user?.name || 'Account';
  const displayEmail = user?.email || '';
  const displayTitle =
    section === 'provider' && providerProfile?.businessName
      ? providerProfile.businessName
      : SECTION_TITLE[section] || SECTION_TITLE.user;

  // Breadcrumb derivation
  const parts = location.pathname.split('/').filter(Boolean);
  const sectionLabel = parts[0]?.toUpperCase() || 'LUGGO';
  const pageLabel =
    parts[parts.length - 1]
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Dashboard';

  function handleLogout() {
    logout();
    navigate(section === 'provider' ? '/provider/login' : '/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Luggage className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg text-slate-900">Luggo</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6" aria-label="Sidebar Navigation">
          {nav.map((group) => (
            <div key={group.section} className="space-y-2">
              <p className="px-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-medium text-sm flex items-center justify-center shrink-0">
                {initialsOf(displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
              </div>
            </div>
            <button
              title="Sign out"
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title */}
            <h1 className="text-base sm:text-lg font-semibold text-slate-900">{pageLabel}</h1>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-slate-600 hover:bg-slate-100" />
            <button
              onClick={handleLogout}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
