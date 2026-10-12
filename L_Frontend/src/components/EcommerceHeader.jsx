import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

/**
 * Amazon-style compact navigation header with prominent search
 */
export default function EcommerceHeader() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowAccountMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white text-gray-900 border-b border-gray-200">
      {/* Main Header */}
      <div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 min-h-16 flex items-center gap-3 sm:gap-6">
          {/* Logo */}
          <Link
            to="/user/search"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          >
            <ShoppingBag className="w-5 h-5 text-blue-700" />
            <span className="font-semibold text-lg hidden sm:block tracking-tight">Luggo</span>
          </Link>

          {/* Search Bar - Prominent */}
          <form onSubmit={handleSearch} className="flex-1 max-w-3xl">
            <div className="flex items-stretch">
              <input
                type="text"
                aria-label="Search storage locations"
                placeholder="Search storage locations by city or area"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-900 bg-gray-50 rounded-l-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle className="text-gray-700 hover:bg-gray-100" />
            {/* Account Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-md text-sm whitespace-nowrap"
              >
                <User className="w-4 h-4" />
                <div className="hidden md:block text-left">
                  <div className="text-xs text-gray-600">
                    {isAuthenticated ? `Hello, ${user?.name?.split(' ')[0] || 'Account'}` : 'Welcome'}
                  </div>
                  <div className="text-xs font-semibold">{isAuthenticated ? 'Account' : 'Sign in'}</div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showAccountMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAccountMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white text-gray-900 rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-200">
                          <div className="text-sm font-semibold">{user?.name}</div>
                          <div className="text-xs text-gray-600">{user?.email}</div>
                        </div>
                        <button
                          onClick={() => {
                            navigate('/user/dashboard');
                            setShowAccountMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Dashboard
                        </button>
                        <button
                          onClick={() => {
                            navigate('/user/bookings');
                            setShowAccountMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          My Bookings
                        </button>
                        <button
                          onClick={() => {
                            navigate('/user/payments');
                            setShowAccountMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Payments
                        </button>
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                          >
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            navigate('/login');
                            setShowAccountMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => {
                            navigate('/register');
                            setShowAccountMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Create Account
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bookings Quick Access */}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/user/bookings')}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-md text-sm whitespace-nowrap"
              >
                <Clock className="w-4 h-4" />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold">My bookings</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
