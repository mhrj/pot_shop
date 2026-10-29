'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';

type Props = {
  userId: string;
  currentRole: 'CUSTOMER' | 'ADMIN';
  currentIsActive: boolean;
};

type ConfirmState = {
  title: string;
  message: string;
  isDestructive: boolean;
  confirmText: string;
  action: () => void;
};

export default function UserManagementActions({
  userId,
  currentRole,
  currentIsActive,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);

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
    setConfirmModal({
      title: nextRole === 'ADMIN' ? 'ارتقا به مدیر سیستم' : 'لغو دسترسی مدیریت',
      message:
        nextRole === 'ADMIN'
          ? 'آیا از ارتقای این کاربر به مدیر اطمینان دارید؟ این کاربر به تمام بخش‌های مدیریت دسترسی خواهد داشت.'
          : 'آیا از لغو دسترسی مدیریت این کاربر اطمینان دارید؟',
      isDestructive: nextRole !== 'ADMIN',
      confirmText: nextRole === 'ADMIN' ? 'ارتقا به مدیر' : 'لغو دسترسی',
      action: () => updateStatus({ role: nextRole }),
    });
  };

  const handleActiveToggle = () => {
    const nextStatus = !currentIsActive;
    setConfirmModal({
      title: nextStatus ? 'فعال‌سازی حساب کاربری' : 'غیرفعال‌سازی حساب کاربری',
      message: nextStatus
        ? 'آیا از فعال‌سازی مجدد حساب کاربری اطمینان دارید؟'
        : 'آیا از غیرفعال‌سازی این حساب کاربری اطمینان دارید؟ کاربر دیگر قادر به ورود به حساب نخواهد بود.',
      isDestructive: !nextStatus,
      confirmText: nextStatus ? 'فعال‌سازی' : 'غیرفعال‌سازی',
      action: () => updateStatus({ isActive: nextStatus }),
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-500/20 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-400">
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
              ? 'border border-amber-600/30 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
              : 'bg-soil-900 dark:bg-flora-700 text-white hover:bg-soil-800 dark:hover:bg-flora-900'
          }`}
        >
          {loading ? 'در حال اعمال...' : currentRole === 'ADMIN' ? 'تنزل به مشتری عادی' : 'ارتقا به مدیر سیستم'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleActiveToggle}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer ${
            currentIsActive
              ? 'border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
              : 'border border-flora-300 dark:border-flora-700 bg-flora-50 dark:bg-flora-950/40 text-flora-700 dark:text-flora-300 hover:bg-flora-100 dark:hover:bg-flora-900/50'
          }`}
        >
          {loading ? 'در حال اعمال...' : currentIsActive ? 'غیرفعال‌سازی حساب' : 'فعال‌سازی حساب'}
        </button>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmModal)}
        title={confirmModal?.title ?? ''}
        message={confirmModal?.message ?? ''}
        isDestructive={confirmModal?.isDestructive ?? false}
        confirmText={confirmModal?.confirmText ?? 'تایید'}
        cancelText="انصراف"
        onConfirm={() => {
          if (confirmModal) {
            confirmModal.action();
            setConfirmModal(null);
          }
        }}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}
