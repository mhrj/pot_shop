'use client';

import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors so redirect still happens
    } finally {
      // Full page navigation to public root clears client router cache and forces
      // layout re-render in unauthenticated state
      window.location.href = '/';
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="cursor-pointer rounded-full border border-soil-900/10 bg-white px-4 py-2 text-xs font-bold text-soil-900 hover:bg-dust-50 dark:border-dust-50/10 dark:bg-flora-900 dark:text-dust-100 dark:hover:bg-flora-950 transition-colors disabled:opacity-50"
    >
      {loading ? 'در حال خروج…' : 'خروج'}
    </button>
  );
}

