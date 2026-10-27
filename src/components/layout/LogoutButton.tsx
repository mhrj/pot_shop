'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-soil-900/10 bg-white px-4 py-2 text-xs font-bold text-soil-900 transition hover:bg-dust-50 dark:border-dust-100/15 dark:bg-flora-900 dark:text-dust-50 dark:hover:bg-flora-800"
    >
      خروج
    </button>
  );
}
