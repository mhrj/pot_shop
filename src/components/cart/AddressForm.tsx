import '@/lib/react19-compat';
import { useState } from 'react';
import { ProvinceCitySelect, type ProvinceCity } from 'iran-regions';
import 'iran-regions/styles';
import IRAN_REGIONS from '@/lib/iran-regions-data.json';
import { FormError } from '@/components/ui/FormError';

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
  city: 'تهران',
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
 * not a digit is dropped.
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
 * Create/edit form for a shipping address.
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = event.target as HTMLInputElement;
    const name = target.name;
    let value: string | boolean =
      target.type === 'checkbox' ? target.checked : target.value;

    if (typeof value === 'string' && (name === 'phone' || name === 'postalCode')) {
      value = toDigitsOnly(value);
      if (name === 'phone') value = value.slice(0, 11);
      if (name === 'postalCode') value = value.slice(0, 10);
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'نام و نام خانوادگی الزامی است';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'شماره همراه الزامی است';
    } else if (!/^09\d{9}$/.test(form.phone.trim())) {
      newErrors.phone = 'شماره موبایل وارد شده معتبر نیست';
    }

    if (!form.province.trim()) {
      newErrors.province = 'نام استان الزامی است';
    }

    if (!form.city.trim()) {
      newErrors.city = 'نام شهر الزامی است';
    }

    if (!form.postalCode.trim()) {
      newErrors.postalCode = 'کد پستی الزامی است';
    } else if (!/^\d{10}$/.test(form.postalCode.trim())) {
      newErrors.postalCode = 'کد پستی باید دقیقاً ۱۰ رقم باشد';
    }

    if (!form.line1.trim()) {
      newErrors.line1 = 'آدرس دقیق الزامی است';
    } else if (form.line1.trim().length < 3) {
      newErrors.line1 = 'آدرس دقیق باید حداقل ۳ کاراکتر باشد';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

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
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-soil-900/10 bg-white p-5"
    >
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
            className={`mt-1 w-full rounded-xl border bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition ${
              errors.fullName
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-soil-900/10 focus:border-flora-500'
            }`}
            placeholder="مثلاً مریم رضایی"
          />
          <FormError message={errors.fullName} />
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
            maxLength={11}
            inputMode="numeric"
            className={`mt-1 w-full rounded-xl border bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition ${
              errors.phone
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-soil-900/10 focus:border-flora-500'
            }`}
            placeholder="09121234567"
          />
          <FormError message={errors.phone} />
        </label>

        <div className="sm:col-span-2">
          <ProvinceCitySelect
            value={{ province: form.province, city: form.city }}
            onChange={(val: ProvinceCity) => {
              setForm((current) => ({
                ...current,
                province: val.province || '',
                city: val.city || '',
              }));
              if (errors.province && val.province) {
                setErrors((prev) => ({ ...prev, province: '' }));
              }
              if (errors.city && val.city) {
                setErrors((prev) => ({ ...prev, city: '' }));
              }
            }}
            isRequired
            placeholders={{ province: 'انتخاب استان', city: 'انتخاب شهر' }}
            labels={{ province: 'استان', city: 'شهر' }}
            provinces={IRAN_REGIONS}
            theme="light"
            size="sm"
            containerClassName="address-form-regions !grid sm:!grid-cols-2 !gap-4 !w-full"
            customTheme={{
              'color-primary': '#1b4332',
              'color-primaryHover': '#2d6a4f',
              'color-border': 'rgba(62, 39, 35, 0.1)',
              'color-borderHover': 'rgba(62, 39, 35, 0.25)',
              'color-borderFocus': '#2d6a4f',
              'color-focusRing': 'rgba(45, 106, 79, 0.15)',
              'color-background': '#fdfbf7',
              'color-surface': '#fdfbf7',
              'color-text': '#3e2723',
              'color-textSecondary': 'rgba(62, 39, 35, 0.6)',
              'color-error': '#ef4444',
              'radius-md': '0.75rem',
              'font-sm': '0.75rem',
            }}
          />
          {(errors.province || errors.city) && (
            <div className="grid sm:grid-cols-2 gap-4 mt-1">
              <div>{errors.province && <FormError message={errors.province} />}</div>
              <div>{errors.city && <FormError message={errors.city} />}</div>
            </div>
          )}
        </div>

        <label className="text-xs font-bold text-soil-700/80">
          کد پستی
          <span className="text-red-500 ms-0.5">*</span>
          <input
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            dir="ltr"
            maxLength={10}
            inputMode="numeric"
            className={`mt-1 w-full rounded-xl border bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition ${
              errors.postalCode
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-soil-900/10 focus:border-flora-500'
            }`}
            placeholder="1234567890"
          />
          <FormError message={errors.postalCode} />
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
          className={`mt-1 w-full rounded-xl border bg-dust-50 px-3 py-2.5 text-sm text-soil-900 outline-none transition ${
            errors.line1
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-soil-900/10 focus:border-flora-500'
          }`}
          placeholder="خیابان ولیعصر، کوچه ..."
        />
        <FormError message={errors.line1} />
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .address-form-regions .flexible-input__label {
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          color: rgba(62, 39, 35, 0.8) !important;
        }
        .address-form-regions .flexible-input__input {
          margin-top: 0.25rem !important;
          background-color: #fdfbf7 !important;
          border: 1px solid rgba(62, 39, 35, 0.1) !important;
          border-radius: 0.75rem !important;
          padding: 0.625rem 0.75rem !important;
          padding-inline-end: 2rem !important;
          font-size: 0.875rem !important;
          color: #3e2723 !important;
          min-height: 42px !important;
          outline: none !important;
          transition: all 0.15s ease !important;
        }
        .address-form-regions .flexible-input__input:focus {
          border-color: #2d6a4f !important;
          box-shadow: 0 0 0 2px rgba(45, 106, 79, 0.2) !important;
        }
        .address-form-regions .flexible-input.error .flexible-input__input {
          border-color: #ef4444 !important;
        }
        .address-form-regions .flexible-input__options {
          z-index: 50 !important;
          border-radius: 0.75rem !important;
          border: 1px solid rgba(62, 39, 35, 0.1) !important;
          box-shadow: 0 10px 25px -5px rgba(62, 39, 35, 0.15) !important;
        }
        .address-form-regions .flexible-input__option.selected {
          background-color: rgba(45, 106, 79, 0.1) !important;
          color: #1b4332 !important;
          font-weight: 700 !important;
        }
        .address-form-regions .required-mark {
          color: #ef4444 !important;
          margin-inline-start: 0.125rem !important;
        }
      `,
        }}
      />
    </form>
  );
}
