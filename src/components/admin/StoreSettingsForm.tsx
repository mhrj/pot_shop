'use client';

import { useState } from 'react';
import ProvinceCitySelect from '@/components/ui/ProvinceCitySelect';
import { resolveCityCode } from '@/lib/postex';
import { toFa } from '@/lib/format';

type SettingsRecord = {
  id?: string;
  originProvince: string;
  originCity: string;
};

export default function StoreSettingsForm({
  initialSettings,
}: {
  initialSettings: SettingsRecord;
}) {
  const [province, setProvince] = useState(initialSettings.originProvince || 'تهران');
  const [city, setCity] = useState(initialSettings.originCity || 'تهران');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cityCode = resolveCityCode(city);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!province.trim()) {
      setError('لطفاً استان مبدا را انتخاب کنید');
      return;
    }
    if (!city.trim()) {
      setError('لطفاً شهر مبدا را انتخاب کنید');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originProvince: province,
          originCity: city,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || 'خطا در ذخیره تنظیمات');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError('خطای شبکه — مجدداً تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-2xl border border-soil-900/10 bg-white p-6 shadow-sm space-y-6"
    >
      <div>
        <h2 className="text-base font-black text-soil-900">مبدا ارسال سفارشات (انبار مرکزی)</h2>
        <p className="mt-1 text-xs leading-6 text-soil-700/70">
          استان و شهر کارگاه یا انبار مرکزی فروشگاه را مشخص کنید. محاسبات نرخ حمل و نقل شرکت ملی پست
          و تیپاکس در سامانه پستکس بر اساس فاصله این مبدا تا آدرس مشتری انجام می‌شود.
        </p>
      </div>

      <div className="space-y-4">
        <div className="w-full">
          <ProvinceCitySelect
            value={{ province, city }}
            onChange={(val) => {
              setProvince(val.province);
              setCity(val.city);
              setSuccess(false);
            }}
            required
            provinceLabel="استان مبدا ارسال"
            cityLabel="شهر مبدا ارسال"
            provincePlaceholder="انتخاب استان مبدا"
            cityPlaceholder="انتخاب شهر مبدا"
            idPrefix="origin"
          />
        </div>

        {city && (
          <div className="flex items-center gap-2 rounded-xl bg-dust-50 border border-soil-900/10 px-4 py-3 text-xs text-soil-800">
            <span className="font-bold">شناسه مبدا در وب‌سرویس پستکس:</span>
            <span className="font-black text-flora-700 dir-ltr">{toFa(cityCode)}</span>
            <span className="text-soil-700/60 font-normal">
              ({province} — {city})
            </span>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-bold text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl bg-flora-50 border border-flora-200 px-4 py-3 text-xs font-bold text-flora-800 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-flora-700 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>تنظیمات مبدا ارسال با موفقیت ذخیره شد.</span>
        </div>
      )}

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-flora-900 px-6 py-3 text-sm font-black text-white shadow-md shadow-flora-900/20 transition hover:bg-flora-700 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}
        </button>
      </div>
    </form>
  );
}
