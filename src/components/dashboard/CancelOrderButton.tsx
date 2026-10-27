'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

/** Cancels an unpaid order through the customer-scoped endpoint. */
export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmCancel = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'لغو سفارش ناموفق بود');
        return;
      }
      router.refresh();
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={loading}
        className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60 cursor-pointer"
      >
        {loading ? 'در حال لغو…' : 'لغو سفارش'}
      </button>
      {error && (
        <p role="alert" className="text-[11px] leading-5 font-bold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="لغو سفارش"
        message="آیا از لغو این سفارش مطمئن هستید؟ این عمل قابل بازگشت نیست."
        isDestructive={true}
        confirmText="لغو سفارش"
        cancelText="انصراف"
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
