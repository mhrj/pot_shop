'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { formatToman, toFa } from '@/lib/format';
import { numberToWordsFa } from '@/lib/number-to-words';
import type { PricedLine } from '@/lib/pricing';

export default function CartItemRow({ line, stock }: { line: PricedLine; stock: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(line.quantity);
  const [error, setError] = useState<string | null>(null);

  const clamp = (n: number) => {
    const step = line.bundleSize > 1 ? line.bundleSize : 1;
    const raw = Math.floor(n) || step;
    const units = Math.max(1, Math.round(raw / step));
    const multiple = units * step;
    const maxUnits = Math.max(1, Math.floor(stock / step));
    const maxQty = maxUnits * step;
    return Math.max(step, Math.min(maxQty, multiple));
  };

  const update = (next: number) => {
    const clamped = clamp(next);
    if (clamped === qty) return;
    setQty(clamped);
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/cart/' + line.productId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: clamped }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'به‌روزرسانی ناموفق بود');
        setQty(line.quantity);
        return;
      }
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm('این کالا از سبد حذف شود؟')) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/cart/' + line.productId, { method: 'DELETE' });
      if (!res.ok) {
        setError('حذف ناموفق بود');
        return;
      }
      router.refresh();
    });
  };

  return (
    <li className="flex gap-4 rounded-2xl border border-soil-900/10 bg-white p-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-dust-100">
        {line.imageUrl && (
          <Image src={line.imageUrl} alt={line.name} fill className="object-cover" sizes="96px" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-soil-900">{line.name}</h2>
            <p className="mt-1 text-xs text-soil-700/70">
              {formatToman(line.unitToman)} × {toFa(qty)} عدد {line.bundleSize > 1 && `(معادل ${toFa(qty / line.bundleSize)} بسته)`} — {line.tierLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="حذف از سبد"
            className="rounded-full p-1.5 text-soil-700/60 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-soil-900/10 p-0.5">
              <button
                type="button"
                onClick={() => update(qty - line.bundleSize)}
                disabled={pending || qty <= line.bundleSize}
                aria-label="کاهش تعداد"
                className="grid size-8 place-items-center rounded-full text-base font-bold text-soil-900 transition hover:bg-dust-100 disabled:opacity-35"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-black text-soil-900">{toFa(qty)}</span>
              <button
                type="button"
                onClick={() => update(qty + line.bundleSize)}
                disabled={pending || qty + line.bundleSize > stock}
                aria-label="افزایش تعداد"
                className="grid size-8 place-items-center rounded-full text-base font-bold text-soil-900 transition hover:bg-dust-100 disabled:opacity-35"
              >
                +
              </button>
            </div>
            <span className="text-xs text-soil-700/80">
              {toFa(qty)} عدد {line.bundleSize > 1 && `(معادل ${toFa(qty / line.bundleSize)} بسته)`}
            </span>
          </div>

          <div className="text-end">
            <p className="text-sm font-black text-flora-900">
              {formatToman(line.lineTotalToman)}
            </p>
            {line.lineTotalToman >= 1000 && (
              <p className="text-[11px] font-normal text-soil-700/70">
                ({numberToWordsFa(line.lineTotalToman)} تومان)
              </p>
            )}
          </div>
        </div>

        {line.nextTier && (
          <p className="text-[11px] text-dust-500">
            {line.bundleSize > 1 ? (
              <>
                {toFa(Math.max(1, line.nextTier.minQuantity - Math.round(qty / line.bundleSize)))} بسته دیگر → هر بسته{' '}
                {formatToman(line.nextTier.unitPriceToman)}
              </>
            ) : (
              <>
                {toFa(Math.max(1, line.nextTier.minQuantity - qty))} عدد دیگر → هر عدد{' '}
                {formatToman(line.nextTier.unitPriceToman)}
              </>
            )}
          </p>
        )}

        {error && (
          <p role="alert" className="text-[11px] font-bold text-red-600">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
