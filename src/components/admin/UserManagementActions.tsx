'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  userId: string;
  currentRole: 'CUSTOMER' | 'ADMIN';
  currentIsActive: boolean;
};

export default function UserManagementActions({
  userId,
  currentRole,
  currentIsActive,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(payload: { role?: 'ADMIN' | 'CUSTOMER'; isActive?: boolean }) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطایی رخ داد.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد.');
    } finally {
      setLoading(false);
    }
  }

  const handleRoleToggle = () => {
    const nextRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    const message =
      nextRole === 'ADMIN'
        ? 'آیا از ارتقای این کاربر به مدیر اطمینان دارید؟ این کاربر به تمام بخش‌های مدیریت دسترسی خواهد داشت.'
        : 'آیا از لغو دسترسی مدیریت این کاربر اطمینان دارید؟';

    if (window.confirm(message)) {
      updateStatus({ role: nextRole });
    }
  };

  const handleActiveToggle = () => {
    const nextStatus = !currentIsActive;
    const message = nextStatus
      ? 'آیا از فعال‌سازی مجدد حساب کاربری اطمینان دارید؟'
      : 'آیا از غیرفعال‌سازی این حساب کاربری اطمینان دارید؟ کاربر دیگر قادر به ورود نخواهد بود.';

    if (window.confirm(message)) {
      updateStatus({ isActive: nextStatus });
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleRoleToggle}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
            currentRole === 'ADMIN'
              ? 'border border-amber-600/30 bg-amber-50 text-amber-900 hover:bg-amber-100'
              : 'bg-soil-900 text-white hover:bg-soil-800'
          }`}
        >
          {loading ? 'در حال اعمال...' : currentRole === 'ADMIN' ? 'تنزل به مشتری عادی' : 'ارتقا به مدیر سیستم'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleActiveToggle}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
            currentIsActive
              ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border border-flora-300 bg-flora-50 text-flora-800 hover:bg-flora-100'
          }`}
        >
          {loading ? 'در حال اعمال...' : currentIsActive ? 'غیرفعال‌سازی حساب' : 'فعال‌سازی حساب'}
        </button>
      </div>
    </div>
  );
}
