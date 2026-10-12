import React from 'react';
import { Link } from 'react-router-dom';
import EcommerceHeader from './EcommerceHeader.jsx';

export default function EcommerceLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <EcommerceHeader />

      <main className="max-w-screen-2xl mx-auto px-4 py-6 sm:px-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-screen-2xl mx-auto px-4 py-8 sm:px-6">
          <div className="text-sm">
            <h2 className="font-semibold text-gray-900 mb-3">For Partners</h2>
            <ul className="space-y-2">
              <li>
                <Link to="/provider/register" className="text-gray-600 hover:text-blue-700">
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link to="/provider/login" className="text-gray-600 hover:text-blue-700">
                  Partner Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
