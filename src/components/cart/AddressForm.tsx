'use client';

import { useState } from 'react';

export type AddressRecord = {
  id: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  fullName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  line1: string;
  line2: string | null;
  isDefault: boolean;
};

const initialForm = {
  label: 'HOME',
  fullName: '',
  phone: '',
  province: 'تهران',
  city: '',
  postalCode: '',
  line1: '',
  line2: '',
  isDefault: false,
};

export default function AddressForm({
  onCreated,
}: {
  onCreated: (address: AddressRecord) => void;
}) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message ?? 'ثبت آدرس ناموفق بود');
        return;
      }

      onCreated(data.address as AddressRecord);
      setForm({ ...initialForm, province: 'تهران' });
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-soil-900/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-soil-900">افزودن آدرس جدید</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-soil-700/80">
          نام و نام خانوادگی
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="مثلاً مریم رضایی"
            required
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          شماره همراه
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            dir="ltr"
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="09121234567"
            required
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          استان
          <input
            name="province"
            value={form.province}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="تهران"
            required
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          شهر
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="تهران"
            required
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          کد پستی
          <input
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            dir="ltr"
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="1234567890"
            required
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          برچسب آدرس
          <select
            name="label"
            value={form.label}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
          >
            <option value="HOME">خانه</option>
            <option value="WORK">محل کار</option>
            <option value="OTHER">سایر</option>
          </select>
        </label>
      </div>

      <label className="block text-xs font-bold text-soil-700/80">
        آدرس دقیق
        <input
          name="line1"
          value={form.line1}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
          placeholder="خیابان ولیعصر، کوچه ..."
          required
        />
      </label>

      <label className="block text-xs font-bold text-soil-700/80">
        واحد / پلاک / توضیحات بیشتر
        <input
          name="line2"
          value={form.line2}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
          placeholder="پلاک ۱۲، طبقه ۳"
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-bold text-soil-700/80">
        <input
          type="checkbox"
          name="isDefault"
          checked={form.isDefault}
          onChange={handleChange}
          className="h-4 w-4 accent-flora-700"
        />
        این آدرس پیش‌فرض باشد
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-flora-900 px-6 py-3 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-60"
      >
        {loading ? 'در حال ثبت آدرس…' : 'ثبت آدرس'}
      </button>
    </form>
  );
}
