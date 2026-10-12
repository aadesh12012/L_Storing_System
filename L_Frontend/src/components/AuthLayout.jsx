import React from 'react';
import { Luggage } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

/**
 * Shared visual shell for the four real authentication pages
 * (User Login/Register, Provider Login/Register).
 */
export default function AuthLayout({ title, subtitle, badge, children, footer }) {
  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <ThemeToggle className="absolute right-4 top-4 text-slate-600 hover:bg-slate-100 sm:right-6 sm:top-6" />
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Luggage className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Luggo</span>
          {badge && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase tracking-wider rounded border border-blue-200/60">
              {badge}
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-xs text-slate-500">{footer}</div>}
      </div>
    </div>
  );
}
