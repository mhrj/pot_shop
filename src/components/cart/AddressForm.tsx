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

const EMPTY_FORM = {
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

type FormState = typeof EMPTY_FORM;

function toFormState(address?: AddressRecord): FormState {
  if (!address) return { ...EMPTY_FORM };
  return {
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    postalCode: address.postalCode,
    line1: address.line1,
    line2: address.line2 ?? '',
    isDefault: address.isDefault,
  };
}

/**
 * Persian (۰-۹) and Arabic-Indic (٠-٩) digits are the ones a Persian keyboard
 * actually produces, so they are translated to ASCII before everything that is
 * not a digit is dropped. Without the translation «۰۹۱۲…» would be stripped to
 * an empty string; without the strip, letters and symbols would survive.
 */
const DIGIT_TRANSLATIONS: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function toDigitsOnly(value: string): string {
  return value
    .replace(/[۰-۹٠-٩]/g, (digit) => DIGIT_TRANSLATIONS[digit] ?? digit)
    .replace(/\D+/g, '');
}

/**
 * Replaces the browser's English constraint-validation messages with Persian.
 *
 * The native `required` / `pattern` behaviour is deliberately kept — the form is
 * *not* marked `noValidate` — so only the wording is overridden, through
 * `setCustomValidity`. The message must be cleared again on every keystroke:
 * a custom error makes a field permanently invalid otherwise, and the user would
 * be unable to submit even after correcting it.
 */
function persianValidity(messages: { required: string; pattern?: string }) {
  return {
    onInvalid: (event: React.FormEvent<HTMLInputElement>) => {
      const field = event.currentTarget;

      if (field.validity.valueMissing) {
        field.setCustomValidity(messages.required);
      } else if (field.validity.patternMismatch && messages.pattern) {
        field.setCustomValidity(messages.pattern);
      } else {
        field.setCustomValidity('مقدار وارد شده صحیح نیست');
      }
    },
    onInput: (event: React.FormEvent<HTMLInputElement>) => {
      event.currentTarget.setCustomValidity('');
    },
  };
}

/**
 * Create/edit form for a shipping address.
 *
 * One component covers both modes so checkout and the customer dashboard share
 * the same fields and validation surface; `address` switches it to editing and
 * the request goes to the per-address endpoint instead of the collection.
 */
export default function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  address?: AddressRecord;
  onSaved: (address: AddressRecord) => void;
  onCancel?: () => void;
}) {
  const editing = Boolean(address);
  const [form, setForm] = useState<FormState>(() => toFormState(address));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = event.target as HTMLInputElement;
    const name = target.name;
    let value: string | boolean =
      target.type === 'checkbox' ? target.checked : target.value;

    // Phone and postal code accept digits only: letters and symbols are dropped
    // as they are typed or pasted, rather than being left in place to fail the
    // pattern check afterwards.
    if (typeof value === 'string' && (name === 'phone' || name === 'postalCode')) {
      value = toDigitsOnly(value);
    }

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
      const res = await fetch(
        editing ? `/api/addresses/${address!.id}` : '/api/addresses',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message ?? 'ثبت آدرس ناموفق بود');
        return;
      }

      onSaved(data.address as AddressRecord);
      if (!editing) setForm({ ...EMPTY_FORM });
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-soil-900/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-soil-900">
          {editing ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-soil-700/80">
          نام و نام خانوادگی
          <span className="text-red-500 ms-0.5">*</span>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="مثلاً مریم رضایی"
            required
            {...persianValidity({ required: 'نام و نام خانوادگی الزامی است' })}
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          شماره همراه
          <span className="text-red-500 ms-0.5">*</span>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            dir="ltr"
            type="tel"
            inputMode="numeric"
            pattern="09[0-9]{9}"
            title="شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود"
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="09121234567"
            required
            {...persianValidity({
              required: 'شماره موبایل الزامی است',
              pattern: 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود',
            })}
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          استان
          <span className="text-red-500 ms-0.5">*</span>
          <input
            name="province"
            value={form.province}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="تهران"
            required
            {...persianValidity({ required: 'استان را انتخاب کنید' })}
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          شهر
          <span className="text-red-500 ms-0.5">*</span>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="تهران"
            required
            {...persianValidity({ required: 'شهر الزامی است' })}
          />
        </label>

        <label className="text-xs font-bold text-soil-700/80">
          کد پستی
          <span className="text-red-500 ms-0.5">*</span>
          <input
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            dir="ltr"
            inputMode="numeric"
            pattern="[0-9]{10}"
            title="کد پستی باید ۱۰ رقم باشد"
            className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
            placeholder="1234567890"
            required
            {...persianValidity({
              required: 'کد پستی الزامی است',
              pattern: 'کد پستی باید ۱۰ رقم باشد',
            })}
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
        <span className="text-red-500 ms-0.5">*</span>
        <input
          name="line1"
          value={form.line1}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-soil-900/10 bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
          placeholder="خیابان ولیعصر، کوچه ..."
          required
          {...persianValidity({ required: 'نشانی الزامی است' })}
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-2xl bg-flora-900 px-6 py-3 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-60"
        >
          {loading ? 'در حال ذخیره…' : editing ? 'ذخیره تغییرات' : 'ثبت آدرس'}
        </button>
        {editing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-soil-900/10 px-6 py-3 text-sm font-bold text-soil-900 transition hover:bg-dust-50"
          >
            انصراف
          </button>
        )}
      </div>
    </form>
  );
}
