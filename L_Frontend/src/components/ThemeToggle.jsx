import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, effectiveTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded transition-all hover:opacity-80 ${className}`}
      style={{
        backgroundColor: 'transparent',
        color: 'var(--color-header-text)',
      }}
      aria-label="Toggle theme"
      title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {effectiveTheme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
