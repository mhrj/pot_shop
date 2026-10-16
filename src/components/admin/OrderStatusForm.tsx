'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = [
  { key: 'PENDING', label: 'در انتظار پرداخت' },
  { key: 'PAID', label: 'پرداخت‌شده' },
  { key: 'PROCESSING', label: 'در حال آماده‌سازی' },
  { key: 'SHIPPED', label: 'ارسال‌شده' },
  { key: 'DELIVERED', label: 'تحویل‌شده' },
  { key: 'CANCELED', label: 'لغو‌شده' },
];

export default function OrderStatusForm({
  orderId,
  initialStatus,
  initialTracking,
}: {
  orderId: string;
  initialStatus: string;
  initialTracking: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [tracking, setTracking] = useState(initialTracking);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch('/api/admin/orders/' + orderId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingCode: tracking || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'ذخیره ناموفق بود');
        return;
      }
      // The server mints a tracking code when an order first moves to SHIPPED,
      // so the input has to take whatever it actually stored. `useState` reads
      // its initialiser only on mount, so `router.refresh()` alone can never
      // bring a generated code into this field.
      setTracking(data?.order?.trackingCode ?? tracking);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-soil-900/10 bg-white p-5">
      <h2 className="text-sm font-black text-soil-900">به‌روزرسانی وضعیت</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold text-soil-900">وضعیت سفارش</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-flora-500"
          >
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-soil-900">کد رهگیری مرسوله</span>
          {/* `readOnly`, not `disabled`: the code is minted by the server the
              first time an order moves to SHIPPED. `disabled` would drop the
              value out of the form's own reading of the field, and a greyed-out
              field that still submits its value is clearer than one that looks
              present but is not sent. */}
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            readOnly
            dir="ltr"
            placeholder="خودکار پر می‌شود"
            aria-describedby="tracking-hint"
            className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-soil-900/15 bg-dust-50 px-3 py-2.5 text-sm text-soil-700 outline-none"
          />
          {/* A `<span>`, not a `<p>` — `<label>` only accepts phrasing content. */}
          <span id="tracking-hint" className="mt-1.5 block text-[11px] text-soil-700/60">
            به صورت خودکار هنگام ثبت ارسال ایجاد می‌شود
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-3 rounded-xl bg-flora-100 px-3 py-2 text-xs font-bold text-flora-700">
          ذخیره شد ✓
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-flora-900 px-6 py-2.5 text-xs font-black text-white transition hover:bg-flora-700 disabled:opacity-50"
      >
        {pending ? 'در حال ذخیره…' : 'ذخیره'}
      </button>
    </form>
  );
}
