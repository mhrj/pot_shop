'use client';

import { useEffect, useMemo, useState } from 'react';
import AddressForm from '@/components/cart/AddressForm';
import { calcShippingToman, type CartTotals } from '@/lib/pricing';
import { formatToman, formatWeight, toFa } from '@/lib/format';

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

/**
 * Address picker plus the order summary.
 *
 * The summary owns the address selection because shipping depends on the
 * destination province: showing the default address's freight while the
 * customer has selected another one would display a total the gateway then
 * contradicts. The authority on the amount is still the server, which re-prices
 * from the database in /api/payment/request — this only keeps the screen honest.
 */
export default function CheckoutForm({
  addresses,
  totals,
}: {
  addresses: Address[];
  totals: CartTotals;
}) {
  const [addressList, setAddressList] = useState<Address[]>(addresses);
  const [selectedId, setSelectedId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '',
  );
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

  const selected = addressList.find((a) => a.id === selectedId) ?? null;

  const shippingToman = useMemo(
    () => calcShippingToman(totals, selected?.province ?? 'تهران'),
    [totals, selected?.province],
  );

  const handleCreated = (address: Address) => {
    setAddressList((current) => [address, ...current]);
    setSelectedId(address.id);
    setShowForm(false);
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
        body: JSON.stringify({ addressId: selectedId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.redirectUrl) {
        setError(data?.message ?? 'اتصال به درگاه پرداخت ناموفق بود');
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
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
          {loading ? 'در حال انتقال به درگاه…' : 'پرداخت با زرین‌پال'}
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
              <li key={l.productId} className="flex justify-between gap-4">
                <span className="truncate">
                  {l.name} × {toFa(l.quantity)}
                </span>
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
            <div className="flex justify-between">
              <dt>هزینه ارسال{selected ? ` به ${selected.province}` : ''}</dt>
              <dd>{shippingToman === 0 ? 'رایگان' : formatToman(shippingToman)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>وزن تقریبی</dt>
              <dd>{formatWeight(totals.totalWeightGrams)}</dd>
            </div>
            <div className="flex justify-between border-t border-soil-900/10 pt-3 text-base font-black">
              <dt>قابل پرداخت</dt>
              <dd>{formatToman(totals.payableToman + shippingToman)}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
