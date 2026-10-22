'use client';

import { useEffect, useMemo, useState } from 'react';
import AddressForm from '@/components/cart/AddressForm';
import { calcShippingToman, type CartTotals } from '@/lib/pricing';
import { formatToman, formatWeight, toFa } from '@/lib/format';
import { numberToWordsFa } from '@/lib/number-to-words';
import ItemColorBadge from '@/components/ui/ItemColorBadge';

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  line1: string;
  line2: string | null;
  isDefault: boolean;
};

export type ShippingOption = {
  carrier: string;
  label: string;
  costToman: number;
  deliveryDays: string;
};

function getDefaultShippingOptions(baseCost: number): ShippingOption[] {
  if (baseCost === 0) {
    return [
      {
        carrier: 'پست پیشتاز',
        label: 'پست پیشتاز (۳ روز کاری)',
        costToman: 0,
        deliveryDays: '۳ روز کاری',
      },
      {
        carrier: 'پست عادی',
        label: 'پست عادی (۷ روز کاری)',
        costToman: 0,
        deliveryDays: '۷ روز کاری',
      },
      {
        carrier: 'تیپاکس',
        label: 'تیپاکس (۱ الی ۲ روز کاری)',
        costToman: 0,
        deliveryDays: '۱ الی ۲ روز کاری',
      },
    ];
  }

  const normalCost = Math.max(25000, Math.round((baseCost * 0.7) / 1000) * 1000);
  const tipaxCost = Math.max(45000, Math.round((baseCost * 1.25) / 1000) * 1000);

  return [
    {
      carrier: 'پست پیشتاز',
      label: 'پست پیشتاز (۳ روز کاری)',
      costToman: baseCost,
      deliveryDays: '۳ روز کاری',
    },
    {
      carrier: 'پست عادی',
      label: 'پست عادی (۷ روز کاری)',
      costToman: normalCost,
      deliveryDays: '۷ روز کاری',
    },
    {
      carrier: 'تیپاکس',
      label: 'تیپاکس (۱ الی ۲ روز کاری)',
      costToman: tipaxCost,
      deliveryDays: '۱ الی ۲ روز کاری',
    },
  ];
}

/**
 * Address picker plus shipping carrier selection and the order summary.
 *
 * The summary owns the address and carrier selection because shipping depends on the
 * destination province and selected courier: showing the default freight while the
 * customer has selected another courier or address would display a total the gateway then
 * contradicts. The authority on the amount is still the server, which re-prices
 * from the database in /api/payment/request — this only keeps the screen honest.
 */
export default function CheckoutForm({
  addresses,
  totals,
  initialShippingRates = {},
}: {
  addresses: Address[];
  totals: CartTotals;
  initialShippingRates?: Record<string, number>;
}) {
  const [addressList, setAddressList] = useState<Address[]>(addresses);
  const [selectedId, setSelectedId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '',
  );
  const [selectedCarrier, setSelectedCarrier] = useState<string>('پست پیشتاز');
  const [shippingRates, setShippingRates] = useState<Record<string, number>>(initialShippingRates);
  const [shippingOptionsMap, setShippingOptionsMap] = useState<Record<string, ShippingOption[]>>(() => {
    const map: Record<string, ShippingOption[]> = {};
    for (const [id, cost] of Object.entries(initialShippingRates)) {
      map[id] = getDefaultShippingOptions(cost);
    }
    return map;
  });
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAddressList(addresses);
    // The server list is authoritative; if the selected address is gone (it was
    // deleted in another tab), fall back to the default rather than posting a
    // stale id.
    setSelectedId((current) =>
      addresses.some((a) => a.id === current)
        ? current
        : (addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''),
    );
  }, [addresses]);

  // Dynamically calculate Postex shipping if the selected address rate isn't cached yet
  useEffect(() => {
    if (!selectedId) return;

    if (shippingRates[selectedId] !== undefined && shippingOptionsMap[selectedId] !== undefined) {
      return;
    }

    const addr = addressList.find((a) => a.id === selectedId);
    if (!addr) return;

    let cancelled = false;
    setCalculatingShipping(true);

    fetch('/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: selectedId, city: addr.city, province: addr.province }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.ok) {
          if (typeof data.shippingToman === 'number') {
            setShippingRates((prev) => ({ ...prev, [selectedId]: data.shippingToman }));
          }
          if (Array.isArray(data.options)) {
            setShippingOptionsMap((prev) => ({ ...prev, [selectedId]: data.options }));
          }
        }
      })
      .catch(() => {
        // Fallback already handled
      })
      .finally(() => {
        if (!cancelled) setCalculatingShipping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, addressList, shippingRates, shippingOptionsMap]);

  const selected = addressList.find((a) => a.id === selectedId) ?? null;

  const baseShippingCost = useMemo(() => {
    if (selected && shippingRates[selected.id] !== undefined) {
      return shippingRates[selected.id];
    }
    return calcShippingToman(totals, selected?.province ?? 'تهران');
  }, [selected, shippingRates, totals]);

  const currentOptions = useMemo(() => {
    if (selected && shippingOptionsMap[selected.id]) {
      return shippingOptionsMap[selected.id];
    }
    return getDefaultShippingOptions(baseShippingCost);
  }, [selected, shippingOptionsMap, baseShippingCost]);

  const selectedOption = useMemo(() => {
    return (
      currentOptions.find((opt) => opt.carrier === selectedCarrier) ??
      currentOptions[0]
    );
  }, [currentOptions, selectedCarrier]);

  const effectiveShippingToman = selectedOption ? selectedOption.costToman : baseShippingCost;

  const handleCreated = async (address: Address) => {
    setAddressList((current) => [address, ...current]);
    setSelectedId(address.id);
    setShowForm(false);

    try {
      setCalculatingShipping(true);
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: address.id, city: address.city, province: address.province }),
      });
      const data = await res.json();
      if (data?.ok) {
        if (typeof data.shippingToman === 'number') {
          setShippingRates((prev) => ({ ...prev, [address.id]: data.shippingToman }));
        }
        if (Array.isArray(data.options)) {
          setShippingOptionsMap((prev) => ({ ...prev, [address.id]: data.options }));
        }
      }
    } catch {
      // Fallback is handled automatically
    } finally {
      setCalculatingShipping(false);
    }
  };

  const pay = async () => {
    if (!selectedId) {
      setError('یک آدرس ارسال انتخاب کنید');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedId,
          shippingCarrier: selectedOption?.carrier ?? selectedCarrier,
        }),
        signal: AbortSignal.timeout(18_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.redirectUrl) {
        setError(
          data?.message || 'ارتباط با درگاه پرداخت برقرار نشد. لطفاً مجدداً تلاش کنید.',
        );
        setLoading(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError('ارتباط با درگاه پرداخت برقرار نشد. لطفاً مجدداً تلاش کنید.');
      setLoading(false);
    }
  };

  if (addressList.length === 0) {
    return (
      <div className="space-y-4">
        <AddressForm onSaved={handleCreated} />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        <fieldset className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <legend className="px-2 text-sm font-black text-soil-900">آدرس ارسال</legend>

          <ul className="space-y-3">
            {addressList.map((a) => (
              <li key={a.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    selectedId === a.id
                      ? 'border-flora-500 bg-flora-100/40'
                      : 'border-soil-900/10 hover:border-soil-900/25'
                  }`}
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={a.id}
                    checked={selectedId === a.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="mt-1 accent-flora-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-soil-900">{a.fullName}</span>
                      {a.isDefault && (
                        <span className="rounded-full bg-flora-100 px-2 py-0.5 text-[10px] font-bold text-flora-700">
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-6 text-soil-700/80">
                      {a.province}، {a.city}، {a.line1}
                      {a.line2 ? `، ${a.line2}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-soil-700/60">
                      کد پستی: <span dir="ltr">{a.postalCode}</span> · تلفن:{' '}
                      <span dir="ltr">{a.phone}</span>
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {showForm ? (
          <AddressForm onSaved={handleCreated} onCancel={() => setShowForm(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded-2xl border border-soil-900/10 bg-white px-6 py-3 text-sm font-bold text-soil-900 transition hover:bg-dust-50"
          >
            + افزودن آدرس جدید
          </button>
        )}

        {/* Shipping carrier selection */}
        <fieldset className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <legend className="px-2 text-sm font-black text-soil-900 flex items-center gap-2">
            <span>روش و شرکت حمل و نقل</span>
            {calculatingShipping && (
              <span className="text-[11px] text-flora-700 animate-pulse font-normal">
                (در حال به‌روزرسانی نرخ‌ها…)
              </span>
            )}
          </legend>

          <p className="mb-3 text-xs text-soil-700/70">
            روش ارسال مرسوله خود را انتخاب کنید:
          </p>

          <ul className="space-y-2.5">
            {currentOptions.map((opt) => (
              <li key={opt.carrier}>
                <label
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                    (selectedOption?.carrier ?? selectedCarrier) === opt.carrier
                      ? 'border-flora-500 bg-flora-100/40 shadow-2xs ring-1 ring-flora-500/20'
                      : 'border-soil-900/10 hover:border-soil-900/25 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingCarrier"
                      value={opt.carrier}
                      checked={(selectedOption?.carrier ?? selectedCarrier) === opt.carrier}
                      onChange={(e) => setSelectedCarrier(e.target.value)}
                      className="accent-flora-700"
                    />
                    <span className="text-xs sm:text-sm font-bold text-soil-900">
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-soil-900 shrink-0">
                    {opt.costToman === 0 ? (
                      <span className="text-flora-700">رایگان</span>
                    ) : (
                      formatToman(opt.costToman)
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={pay}
          disabled={loading || !selectedId}
          className="w-full rounded-2xl bg-flora-900 px-6 py-4 text-sm font-black text-white shadow-lg shadow-flora-900/20 transition hover:bg-flora-700 disabled:opacity-50"
        >
          {loading ? 'در حال انتقال به درگاه…' : 'پرداخت با زرینپال'}
        </button>

        <p className="text-center text-[11px] leading-6 text-soil-700/55">
          پس از تأیید، مبلغ از حساب شما کسر و کد پیگیری شاپرک نمایش داده می‌شود.
        </p>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] lg:sticky lg:top-24">
          <h2 className="font-black text-soil-900">خلاصه سفارش</h2>

          <ul className="mt-4 space-y-3 text-xs text-soil-700/80">
            {totals.lines.map((l) => (
              <li key={l.productId} className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-soil-900">{l.name}</span>
                    <ItemColorBadge colorData={l.colorData} />
                  </div>
                  <span className="text-[11px] text-soil-700/70 block mt-0.5">
                    {toFa(l.quantity)} عدد {l.bundleSize > 1 ? `(معادل ${toFa(Math.round(l.quantity / l.bundleSize))} بسته)` : ''}
                  </span>
                </div>
                <span className="shrink-0 font-bold text-soil-900">
                  {formatToman(l.lineTotalToman)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 border-t border-soil-900/10 pt-5 text-sm">
            <div className="flex justify-between">
              <dt>جمع کالاها</dt>
              <dd>{formatToman(totals.subtotalToman)}</dd>
            </div>
            <div className="flex justify-between text-flora-700">
              <dt>تخفیف پله‌ای</dt>
              <dd>−{formatToman(totals.discountToman)}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="flex items-center gap-1.5">
                <span>
                  هزینه ارسال {selectedOption?.carrier ? `(با ${selectedOption.carrier})` : ''}
                </span>
                {calculatingShipping && (
                  <span className="text-[10px] text-flora-700 animate-pulse font-normal">
                    (در حال محاسبه…)
                  </span>
                )}
              </dt>
              <dd>
                {effectiveShippingToman === 0 ? 'رایگان' : formatToman(effectiveShippingToman)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>وزن تقریبی</dt>
              <dd>{formatWeight(totals.totalWeightGrams)}</dd>
            </div>
            <div className="flex justify-between border-t border-soil-900/10 pt-3 text-base font-black">
              <dt>قابل پرداخت</dt>
              <dd className="text-end">
                <div>{formatToman(totals.payableToman + effectiveShippingToman)}</div>
                {totals.payableToman + effectiveShippingToman >= 1000 && (
                  <div className="text-[11px] font-normal text-soil-700/70 mt-0.5">
                    ({numberToWordsFa(totals.payableToman + effectiveShippingToman)} تومان)
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
