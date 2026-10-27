'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const active = saved === 'dark' || (!saved && prefersDark) ? 'dark' : 'light';
    setTheme(active);
    if (active === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isDark = mounted ? theme === 'dark' : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      title={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      className="relative flex size-9 items-center justify-center rounded-full border border-soil-900/15 bg-white text-soil-900 shadow-xs transition hover:border-flora-700 hover:text-flora-700 hover:scale-105 active:scale-95 dark:border-dust-100/20 dark:bg-flora-900 dark:text-dust-50 dark:hover:border-flora-300 dark:hover:text-flora-300"
    >
      {/* Sun Icon (shown in dark mode to switch to light) */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`size-4.5 transition-transform duration-300 ${
          isDark ? 'scale-100 rotate-0 opacity-100 text-amber-300' : 'hidden scale-0 -rotate-90 opacity-0'
        }`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>

      {/* Moon Icon (shown in light mode to switch to dark) */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`size-4.5 transition-transform duration-300 ${
          !isDark ? 'scale-100 rotate-0 opacity-100' : 'hidden scale-0 rotate-90 opacity-0'
        }`}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>
  );
}
