'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { formatToman, formatWeight, toFa } from '@/lib/format';
import { nextTierHint, resolveTier, type Tier } from '@/lib/pricing';
import type { BundleItem } from '@/lib/product-features';

type Props = {
  product: {
    id: string;
    name: string;
    basePriceToman: number;
    weightGrams: number;
    unitsPerCarton?: number;
    stock: number;
    bundleSize?: number;
    bundleLabel?: string | null;
    bundleItems?: BundleItem[] | null;
    minOrderQuantity?: number;
    allowBatchDiscount?: boolean;
  };
  tiers: Tier[];
  isAuthed: boolean;
  allowBatchDiscount?: boolean;
};

export default function TieredPricing({
  product,
  tiers,
  isAuthed,
  allowBatchDiscount,
}: Props) {
  const allowBatch = allowBatchDiscount ?? product.allowBatchDiscount ?? true;
  const bundleSize = product.bundleSize || 1;
  const isBundle = Boolean(product.bundleLabel) && bundleSize > 1;
  const step = isBundle ? bundleSize : 1;
  const baseMin = product.minOrderQuantity || 1;
  const minQty = isBundle ? Math.max(baseMin, step) : baseMin;

  const [qty, setQty] = useState(minQty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const sorted = useMemo(
    () => [...tiers].sort((a, b) => a.minQuantity - b.minQuantity),
    [tiers],
  );

  const { unit, total, savings, percent, tierLabel, hint } = useMemo(() => {
    if (!allowBatch) {
      return {
        unit: product.basePriceToman,
        total: product.basePriceToman * qty,
        savings: 0,
        percent: 0,
        tierLabel: 'خرده',
        hint: null,
      };
    }

    const t = resolveTier(sorted, qty);
    const unitPrice = t.unitPriceToman;
    const totalPrice = unitPrice * qty;
    const save = (product.basePriceToman - unitPrice) * qty;
    return {
      unit: unitPrice,
      total: totalPrice,
      savings: Math.max(0, save),
      percent: product.basePriceToman
        ? Math.round(((product.basePriceToman - unitPrice) / product.basePriceToman) * 100)
        : 0,
      tierLabel: t.label ?? 'خرده',
      hint: nextTierHint(sorted, qty),
    };
  }, [allowBatch, qty, sorted, product.basePriceToman]);

  const clamp = (n: number) => {
    let val = Math.max(minQty, Math.floor(n));
    if (step > 1) {
      val = Math.round(val / step) * step;
      if (val < minQty) val = Math.ceil(minQty / step) * step;
    }
    return Math.max(minQty, Math.min(product.stock, val));
  };

  const handleAdd = () => {
    setError(null);
    setAdded(false);

    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'افزودن به سبد ناموفق بود');
        return;
      }
      setAdded(true);
      router.refresh();
    });
  };

  const outOfStock = product.stock <= 0 || product.stock < minQty;

  return (
    <div className="space-y-6">
      {allowBatch && (
        <div className="overflow-hidden rounded-2xl border border-soil-900/10 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">ماتریس قیمت بر اساس تعداد</caption>
            <thead className="bg-dust-50">
              <tr className="text-soil-700/70">
                <th scope="col" className="px-4 py-3 text-start font-medium">تعداد</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">قیمت هر عدد</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">تخفیف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soil-900/5">
              {sorted.map((t, i) => {
                const isActive =
                  qty >= t.minQuantity &&
                  (i === sorted.length - 1 || qty < sorted[i + 1].minQuantity);
                const off = product.basePriceToman
                  ? Math.round(
                      ((product.basePriceToman - t.unitPriceToman) /
                        product.basePriceToman) *
                        100,
                    )
                  : 0;
                const rangeEnd = sorted[i + 1] ? sorted[i + 1].minQuantity - 1 : null;
                return (
                  <tr
                    key={t.minQuantity}
                    className={isActive ? 'bg-flora-100/60' : undefined}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <td className="px-4 py-3.5 font-medium text-soil-900">
                      {rangeEnd
                        ? `${toFa(t.minQuantity)} تا ${toFa(rangeEnd)}`
                        : `${toFa(t.minQuantity)} به بالا`}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-flora-900">
                      {formatToman(t.unitPriceToman)}
                    </td>
                    <td className="px-4 py-3.5 text-dust-500">
                      {off > 0 ? `${toFa(off)}٪` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-soil-900">تعداد</span>
            {isBundle && (
              <span className="text-xs text-soil-700/70">
                ({toFa(Math.round(qty / (product.bundleSize || 1)))} {product.bundleLabel || 'بسته'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-soil-900/10 p-1">
            <button
              type="button"
              onClick={() => setQty((q) => clamp(q - step))}
              disabled={qty <= minQty}
              aria-label="کاهش تعداد"
              className="grid size-9 place-items-center rounded-full text-lg font-bold text-soil-900 transition hover:bg-dust-100 disabled:opacity-35"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              step={step}
              min={minQty}
              max={product.stock}
              value={qty}
              onChange={(e) => setQty(clamp(Number(e.target.value)))}
              aria-label="تعداد سفارش"
              className="w-16 border-0 bg-transparent text-center text-base font-black text-soil-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQty((q) => clamp(q + step))}
              disabled={qty + step > product.stock}
              aria-label="افزایش تعداد"
              className="grid size-9 place-items-center rounded-full text-lg font-bold text-soil-900 transition hover:bg-dust-100 disabled:opacity-35"
            >
              +
            </button>
          </div>
        </div>

        {allowBatch && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sorted.map((t) => {
              const validQty = isBundle
                ? Math.ceil(t.minQuantity / bundleSize) * bundleSize
                : t.minQuantity;

              return (
                <button
                  key={t.minQuantity}
                  type="button"
                  onClick={() => setQty(clamp(validQty))}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    qty >= validQty &&
                    resolveTier(sorted, qty).minQuantity === t.minQuantity
                      ? 'bg-flora-900 text-white'
                      : 'bg-dust-100 text-soil-700 hover:bg-dust-200'
                  }`}
                >
                  {t.label ?? 'پله'} · {toFa(validQty)}+
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {allowBatch && hint && (
            <motion.button
              type="button"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => setQty(clamp(hint.minQuantity))}
              className="mt-4 block w-full rounded-xl bg-dust-100 px-4 py-3 text-start text-xs leading-6 text-soil-700 transition hover:bg-dust-200"
            >
              <span className="font-bold text-dust-500">
                {toFa(hint.minQuantity - qty)} عدد دیگر
              </span>{' '}
              اضافه کن و هر عدد را{' '}
              <span className="font-bold">
                {formatToman(hint.unitPriceToman - unit)}
              </span>{' '}
              ارزان‌تر بخر — مجموعاً{' '}
              <span className="font-bold text-flora-700">
                {formatToman(hint.saveMoreToman)}
              </span>{' '}
              بیشتر صرفه‌جویی کن.
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        layout
        className="rounded-2xl border border-flora-500/20 bg-flora-100/40 p-5"
      >
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-soil-700/70">قیمت هر عدد</dt>
            <dd className="mt-1 text-lg font-black text-soil-900">{formatToman(unit)}</dd>
          </div>
          <div>
            <dt className="text-soil-700/70">مبلغ کل</dt>
            <dd className="mt-1 text-lg font-black text-flora-900">{formatToman(total)}</dd>
          </div>
          <div>
            <dt className="text-soil-700/70">وزن تقریبی</dt>
            <dd className="mt-1 font-bold text-soil-900">{formatWeight(product.weightGrams * qty)}</dd>
          </div>
          <div>
            <dt className="text-soil-700/70">تعداد کل</dt>
            <dd className="mt-1 font-bold text-soil-900">
              {toFa(qty)} عدد
              {isBundle ? (
                <span className="block text-xs text-soil-700/60 mt-1">
                  (معادل {toFa(qty / (product.bundleSize || 1))} {product.bundleLabel})
                </span>
              ) : (product.minOrderQuantity && product.minOrderQuantity > 1) ? (
                <span className="block text-xs text-soil-700/60 mt-1">
                  (حداقل سفارش: {toFa(product.minOrderQuantity)} عدد)
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        {allowBatch && savings > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-flora-500/15 px-4 py-2.5 text-xs font-bold text-flora-700"
          >
            <span className="grid size-5 place-items-center rounded-full bg-flora-500 text-[11px] text-white">
              ✓
            </span>
            {tierLabel} — {toFa(percent)}٪ تخفیف، {formatToman(savings)} صرفه‌جویی
          </motion.p>
        )}
      </motion.div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || outOfStock}
          className="w-full rounded-2xl bg-flora-900 px-6 py-4 text-sm font-black text-white shadow-lg shadow-flora-900/20 transition hover:bg-flora-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock
            ? 'ناموجود'
            : pending
              ? 'در حال افزودن…'
              : added
                ? 'به سبد اضافه شد ✓'
                : `افزودن ${toFa(qty)} عدد به سبد — ${formatToman(total)}`}
        </button>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
