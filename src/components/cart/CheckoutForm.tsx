'use client';

import { useEffect, useState } from 'react';
import AddressForm from '@/components/cart/AddressForm';

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

export default function CheckoutForm({ addresses }: { addresses: Address[] }) {
  const [addressList, setAddressList] = useState<Address[]>(addresses);
  const [selectedId, setSelectedId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '',
  );
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAddressList(addresses);
    if (!addresses.some((a) => a.id === selectedId)) {
      setSelectedId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '');
    }
  }, [addresses, selectedId]);

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
        <AddressForm onCreated={handleCreated} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                  <p className="mt-1 text-xs text-soil-700/60" dir="ltr">
                    {a.phone}
                  </p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {showForm ? (
        <AddressForm onCreated={handleCreated} />
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
  );
}
