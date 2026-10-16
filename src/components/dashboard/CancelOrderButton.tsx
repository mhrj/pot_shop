'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Cancels an unpaid order through the customer-scoped endpoint. */
export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    if (!confirm('سفارش لغو شود؟ این کار قابل بازگشت نیست.')) return;
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
        onClick={cancel}
        disabled={loading}
        className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? 'در حال لغو…' : 'لغو سفارش'}
      </button>
      {error && (
        <p role="alert" className="text-[11px] leading-5 font-bold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
