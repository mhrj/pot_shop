'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { formatToman, formatWeight, toFa } from '@/lib/format';
import { numberToWordsFa } from '@/lib/number-to-words';
import { nextTierHint, resolveTier, type Tier } from '@/lib/pricing';
import type { BundleItem } from '@/lib/product-features';
import { useProductColor } from './ProductColorContext';

type Props = {
  product: {
    id: string;
    name: string;
    basePriceToman: number;
    weightGrams: number;
    unitsPerCarton?: number;
    stock: number;
    bundleSize?: number;
    bundleItems?: BundleItem[] | null;
    colorOptions?: string[] | null;
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
  const bundleSize = Math.max(1, product.bundleSize ?? 1);
  const isBundle = bundleSize > 1;

  const minCount = isBundle
    ? Math.max(1, Math.ceil((product.minOrderQuantity || 1) / bundleSize))
    : Math.max(1, product.minOrderQuantity || 1);
  const maxCount = isBundle
    ? Math.max(0, Math.floor(product.stock / bundleSize))
    : Math.max(0, product.stock);

  const [count, setCount] = useState<number>(minCount);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const sorted = useMemo(
    () => [...tiers].sort((a, b) => a.minQuantity - b.minQuantity),
    [tiers],
  );

  const { packagePrice, unitEquivalent, total, savings, percent, tierLabel, hint } =
    useMemo(() => {
      const basePackagePrice = product.basePriceToman;
      if (!allowBatch) {
        const pkgPrice = basePackagePrice;
        const tot = pkgPrice * count;
        return {
          packagePrice: pkgPrice,
          unitEquivalent: Math.round(pkgPrice / bundleSize),
          total: tot,
          savings: 0,
          percent: 0,
          tierLabel: 'خرده',
          hint: null,
        };
      }

      const t = resolveTier(sorted, count);
      const pkgPrice = t.unitPriceToman || basePackagePrice;
      const tot = pkgPrice * count;
      const save = Math.max(0, (basePackagePrice - pkgPrice) * count);
      const pct =
        basePackagePrice > 0
          ? Math.round(((basePackagePrice - pkgPrice) / basePackagePrice) * 100)
          : 0;

      return {
        packagePrice: pkgPrice,
        unitEquivalent: Math.round(pkgPrice / bundleSize),
        total: tot,
        savings: save,
        percent: pct,
        tierLabel: t.label ?? 'خرده',
        hint: nextTierHint(sorted, count),
      };
    }, [allowBatch, count, sorted, product.basePriceToman, bundleSize]);

  const totalUnits = isBundle ? count * bundleSize : count;

  const clamp = (n: number) => {
    const val = Math.floor(n) || minCount;
    return Math.max(minCount, Math.min(maxCount, val));
  };

  const colorCtx = useProductColor();

  const handleAdd = () => {
    setError(null);
    setAdded(false);

    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const singleColors = product.colorOptions ?? [];
    let color: string | undefined = undefined;
    let bundleColors: Record<number, string> | undefined = undefined;

    if (isBundle) {
      const items = product.bundleItems ?? [];
      const itemsNeedingColor = items
        .map((it, idx) => ({ it, idx }))
        .filter(({ it }) => it.colorOptions && it.colorOptions.length > 0);

      if (itemsNeedingColor.length > 0) {
        for (const { it, idx } of itemsNeedingColor) {
          if (!colorCtx?.selectedBundleColors[idx]) {
            setError(
              `لطفاً رنگ ${it.title ? `«${it.title}» (گلدان ${toFa(idx + 1)})` : `گلدان ${toFa(idx + 1)}`} را انتخاب کنید.`,
            );
            return;
          }
        }
        bundleColors = colorCtx?.selectedBundleColors;
      }
    } else {
      if (singleColors.length > 0) {
        if (!colorCtx?.selectedColor) {
          setError('لطفاً رنگ مورد نظر خود را انتخاب کنید.');
          return;
        }
        color = colorCtx.selectedColor;
      }
    }

    startTransition(async () => {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: totalUnits,
          color,
          bundleColors,
        }),
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

  const outOfStock = product.stock <= 0 || maxCount < minCount;

  return (
    <div className="space-y-6">
      {allowBatch && sorted.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-soil-900/10 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">ماتریس قیمت بر اساس تعداد</caption>
            <thead className="bg-dust-50">
              <tr className="text-soil-700/70">
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {isBundle ? 'تعداد بسته' : 'تعداد'}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {isBundle ? 'قیمت هر بسته' : 'قیمت هر عدد'}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">تخفیف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soil-900/5">
              {sorted.map((t, i) => {
                const isActive =
                  count >= t.minQuantity &&
                  (i === sorted.length - 1 || count < sorted[i + 1].minQuantity);
                const off =
                  product.basePriceToman > 0
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
                        ? `${toFa(t.minQuantity)} تا ${toFa(rangeEnd)} ${isBundle ? 'بسته' : 'عدد'}`
                        : `${toFa(t.minQuantity)} ${isBundle ? 'بسته' : 'عدد'} به بالا`}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-flora-900">
                      <div>
                        <span>{formatToman(t.unitPriceToman)}</span>
                        {t.unitPriceToman >= 1000 && (
                          <span className="block text-[11px] font-normal text-soil-700/70">
                            ({numberToWordsFa(t.unitPriceToman)} تومان)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {off > 0 ? (
                        <span className="font-bold text-emerald-600">{toFa(off)}٪</span>
                      ) : (
                        <span className="text-dust-400">—</span>
                      )}
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
          <div className="text-sm font-bold text-soil-900">
            {isBundle ? (
              <span>
                تعداد بسته: {toFa(count)} بسته{' '}
                <span className="font-normal text-xs text-soil-700/70">
                  (شامل {toFa(totalUnits)} عدد گلدان)
                </span>
              </span>
            ) : (
              <span>
                تعداد: {toFa(count)} عدد
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-soil-900/10 p-1">
            <button
              type="button"
              onClick={() => setCount((c) => clamp(c - 1))}
              disabled={count <= minCount}
              aria-label={isBundle ? 'کاهش تعداد بسته' : 'کاهش تعداد'}
              className="grid size-9 place-items-center rounded-full text-lg font-bold text-soil-900 transition hover:bg-dust-100 disabled:opacity-35"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              step={1}
              min={minCount}
              max={maxCount}
              value={count}
              onChange={(e) => setCount(clamp(Number(e.target.value)))}
              aria-label={isBundle ? 'تعداد بسته سفارش' : 'تعداد سفارش'}
              className="w-16 border-0 bg-transparent text-center text-base font-black text-soil-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setCount((c) => clamp(c + 1))}
              disabled={count >= maxCount}
              aria-label={isBundle ? 'افزایش تعداد بسته' : 'افزایش تعداد'}
              className="grid size-9 place-items-center rounded-full text-lg font-bold text-soil-900 transition hover:bg-dust-100 disabled:opacity-35"
            >
              +
            </button>
          </div>
        </div>

        {allowBatch && sorted.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sorted.map((t) => (
              <button
                key={t.minQuantity}
                type="button"
                onClick={() => setCount(clamp(t.minQuantity))}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  count >= t.minQuantity &&
                  resolveTier(sorted, count).minQuantity === t.minQuantity
                    ? 'bg-flora-900 text-white'
                    : 'bg-dust-100 text-soil-700 hover:bg-dust-200'
                }`}
              >
                {t.label ?? 'پله'} · {toFa(t.minQuantity)}+ {isBundle ? 'بسته' : ''}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {allowBatch && hint && (
            <motion.button
              type="button"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => setCount(clamp(hint.minQuantity))}
              className="mt-4 block w-full rounded-xl bg-dust-100 px-4 py-3 text-start text-xs leading-6 text-soil-700 transition hover:bg-dust-200"
            >
              <span className="font-bold text-dust-500">
                {toFa(hint.minQuantity - count)} {isBundle ? 'بسته' : 'عدد'} دیگر
              </span>{' '}
              اضافه کن و هر {isBundle ? 'بسته' : 'عدد'} را{' '}
              <span className="font-bold">
                {formatToman(hint.unitPriceToman - packagePrice)}
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
            <dt className="text-soil-700/70">
              {isBundle ? 'قیمت پکیج (در این پله)' : 'قیمت هر عدد'}
            </dt>
            <dd className="mt-1">
              <span className="text-xl font-black text-soil-900">
                {formatToman(packagePrice)}
              </span>
              {packagePrice > 0 && (
                <span className="block text-xs font-semibold text-soil-700/80 mt-0.5">
                  ({numberToWordsFa(packagePrice)} تومان)
                </span>
              )}
              {isBundle && (
                <span className="block text-xs font-normal text-soil-700/70 mt-1">
                  (معادل {formatToman(unitEquivalent)} تومان برای هر عدد)
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-soil-700/70">مبلغ کل</dt>
            <dd className="mt-1">
              <span className="text-xl font-black text-flora-900">
                {formatToman(total)}
              </span>
              {total > 0 && (
                <span className="block text-xs font-semibold text-flora-800/80 mt-0.5">
                  ({numberToWordsFa(total)} تومان)
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-soil-700/70">وزن تقریبی</dt>
            <dd className="mt-1 font-bold text-soil-900">
              {formatWeight(product.weightGrams * totalUnits)}
            </dd>
          </div>
          <div>
            <dt className="text-soil-700/70">تعداد کل</dt>
            <dd className="mt-1 font-bold text-soil-900">
              {isBundle ? (
                <>
                  {toFa(count)} بسته
                  <span className="block text-xs text-soil-700/60 mt-1">
                    (شامل {toFa(totalUnits)} عدد گلدان)
                  </span>
                </>
              ) : (
                <>
                  {toFa(count)} عدد
                  {product.minOrderQuantity && product.minOrderQuantity > 1 ? (
                    <span className="block text-xs text-soil-700/60 mt-1">
                      (حداقل سفارش: {toFa(product.minOrderQuantity)} عدد)
                    </span>
                  ) : null}
                </>
              )}
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

      {/* Dynamic Accordion directly below green summary box */}
      {product.bundleItems && product.bundleItems.length > 0 && (() => {
        const items = product.bundleItems;
        const itemSum = items.reduce(
          (sum, item) => sum + (item.price ?? item.priceToman ?? 0),
          0,
        );
        const totalValue = itemSum * count;
        const activePkgPrice = packagePrice || product.basePriceToman;
        const totalPackagePrice = activePkgPrice * count;
        const totalSavings = totalValue - totalPackagePrice;

        return (
          <details className="group rounded-2xl border border-soil-900/10 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-black text-soil-900 [&::-webkit-details-marker]:hidden">
              <span>مشاهده محتویات این بسته ({toFa(items.length)} آیتم)</span>
              <span className="transition-transform group-open:rotate-180 text-soil-700/60">▼</span>
            </summary>
            <div className="border-t border-soil-900/10 p-4">
              <div className="space-y-2">
                {items.map((item, i) => {
                  const itemPrice = item.price ?? item.priceToman;
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-soil-900/10 bg-dust-50/60 p-3.5 transition-colors hover:bg-dust-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-soil-900">{item.title}</p>
                        {itemPrice && itemPrice > 0 ? (
                          <span className="text-xs font-bold text-flora-800 shrink-0">
                            {formatToman(itemPrice)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-soil-700/70">
                        {item.material && (
                          <span>
                            جنس: <strong className="text-soil-900">{item.material}</strong>
                          </span>
                        )}
                        {item.diameterCm > 0 && (
                          <span>
                            قطر: <strong className="text-soil-900">{toFa(item.diameterCm)} سانتی‌متر</strong>
                          </span>
                        )}
                        {item.heightCm > 0 && (
                          <span>
                            ارتفاع: <strong className="text-soil-900">{toFa(item.heightCm)} سانتی‌متر</strong>
                          </span>
                        )}
                        {item.weightGrams > 0 && (
                          <span>
                            وزن: <strong className="text-soil-900">{toFa(item.weightGrams)} گرم</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Box with totalValue and totalPackagePrice */}
              <div className="mt-4 rounded-xl border border-soil-900/10 bg-dust-100/70 p-4 space-y-2 text-xs">
                {totalValue > 0 && (
                  <div className="flex items-center justify-between text-soil-700/70">
                    <span>ارزش تک‌فروشی {toFa(count)} بسته:</span>
                    <span className={totalSavings > 0 ? 'line-through text-soil-700/50' : 'font-bold text-soil-900'}>
                      {formatToman(totalValue)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-soil-900">
                  <span className="font-bold">قیمت فروش {toFa(count)} بسته:</span>
                  <div className="text-end">
                    <span className="text-sm font-black text-soil-900">
                      {formatToman(totalPackagePrice)}
                    </span>
                    {totalPackagePrice >= 1000 && (
                      <span className="block text-[11px] font-medium text-soil-700/70">
                        ({numberToWordsFa(totalPackagePrice)} تومان)
                      </span>
                    )}
                  </div>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-100/90 p-2.5 font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <span>🌱</span>
                      <span>شما {formatToman(totalSavings)} صرفه‌جویی می‌کنید!</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </details>
        );
      })()}

      <div className="space-y-4">
        {/* For bundles: Swatches for each bundle item before adding to cart */}
        {isBundle &&
          product.bundleItems &&
          product.bundleItems.some((it) => (it.colorOptions ?? []).length > 0) && (
            <div className="rounded-2xl border border-soil-900/10 bg-white p-5 space-y-4">
              <div>
                <h3 className="text-sm font-black text-soil-900">
                  انتخاب رنگ برای اقلام بسته
                </h3>
                <p className="mt-0.5 text-xs text-soil-700/60">
                  برای هر گلدان موجود در این پکیج، رنگ مورد نظر خود را مشخص کنید:
                </p>
              </div>

              <div className="space-y-4 divide-y divide-soil-900/5">
                {product.bundleItems.map((item, idx) => {
                  const itemColors = item.colorOptions ?? [];
                  if (itemColors.length === 0) return null;

                  const selectedHex = colorCtx?.selectedBundleColors[idx] ?? null;

                  return (
                    <div key={idx} className={idx > 0 ? 'pt-3.5 space-y-2' : 'space-y-2'}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-soil-900">
                          رنگ {item.title || `گلدان ${toFa(idx + 1)}`}
                        </span>
                        {selectedHex ? (
                          <div className="flex items-center gap-1.5 text-soil-700/80 font-mono text-[11px] dir-ltr">
                            <span
                              className="size-3.5 rounded-full border border-soil-900/20 shadow-2xs"
                              style={{ backgroundColor: selectedHex }}
                            />
                            <span>{selectedHex}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                            انتخاب الزامی
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 py-1 px-0.5">
                        {itemColors.map((hex) => {
                          const isSelected = selectedHex?.toUpperCase() === hex.toUpperCase();
                          const isLight = (() => {
                            const clean = hex.replace('#', '');
                            const r = parseInt(clean.substring(0, 2), 16) || 0;
                            const g = parseInt(clean.substring(2, 4), 16) || 0;
                            const b = parseInt(clean.substring(4, 6), 16) || 0;
                            return (r * 299 + g * 587 + b * 114) / 1000 > 180;
                          })();

                          return (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => colorCtx?.setSelectedBundleColor(idx, hex)}
                              title={hex}
                              className={`group relative w-6 h-6 shrink-0 rounded-full transition-all focus:outline-none cursor-pointer border border-soil-900/20 ${
                                isSelected
                                  ? 'ring-2 ring-flora-700 ring-offset-1 scale-105 shadow-xs'
                                  : 'hover:scale-105 shadow-2xs'
                              }`}
                              style={{ backgroundColor: hex }}
                            >
                              {isLight && !isSelected && (
                                <span className="absolute inset-0 rounded-full border border-soil-900/25 pointer-events-none" />
                              )}
                              {isSelected && (
                                <span
                                  className={`absolute inset-0 flex items-center justify-center ${
                                    isLight ? 'text-soil-900' : 'text-white'
                                  }`}
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        {/* Selected color summary preview */}
        {!isBundle && colorCtx?.selectedColor && (
          <div className="flex items-center gap-2 rounded-xl bg-dust-50 px-3.5 py-2 text-xs border border-soil-900/10">
            <span className="text-soil-700/70">رنگ انتخابی:</span>
            <span
              className="size-4 rounded-full border border-soil-900/20 shadow-2xs"
              style={{ backgroundColor: colorCtx.selectedColor }}
            />
            <span className="font-mono text-soil-900 font-bold dir-ltr">
              {colorCtx.selectedColor}
            </span>
          </div>
        )}
        {isBundle && Object.keys(colorCtx?.selectedBundleColors ?? {}).length > 0 && (
          <div className="rounded-xl bg-dust-50 p-3 text-xs border border-soil-900/10 space-y-1.5">
            <span className="font-bold text-soil-900 block">رنگ‌های انتخابی اقلام بسته:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(colorCtx?.selectedBundleColors ?? {}).map(([idxStr, hex]) => {
                const i = Number(idxStr);
                const itName = product.bundleItems?.[i]?.title || `گلدان ${toFa(i + 1)}`;
                return (
                  <span
                    key={idxStr}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-soil-900/10 px-2 py-1 text-[11px]"
                  >
                    <span className="text-soil-700">{itName}:</span>
                    <span
                      className="size-3.5 rounded-full border border-soil-900/20 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        )}

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
                : isBundle
                  ? `افزودن ${toFa(count)} بسته به سبد — ${formatToman(total)}`
                  : `افزودن ${toFa(count)} عدد به سبد — ${formatToman(total)}`}
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
