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
      className="cursor-pointer rounded-full border border-soil-900/10 bg-white px-4 py-2 text-xs font-bold text-soil-900 hover:bg-dust-50 dark:border-dust-50/10 dark:bg-flora-900 dark:text-dust-100 dark:hover:bg-flora-950 transition-colors"
    >
      خروج
    </button>
  );
}
