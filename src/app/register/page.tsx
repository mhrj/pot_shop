'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';
import { FormError } from '@/components/ui/FormError';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'نام کامل الزامی است.';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'نام کامل باید حداقل ۲ کاراکتر باشد.';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'شماره موبایل الزامی است.';
    } else if (!/^09\d{9}$/.test(form.phone.trim())) {
      newErrors.phone = 'شماره موبایل نامعتبر است (باید ۱۱ رقم و با ۰۹ شروع شود).';
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'ایمیل معتبر نیست.';
    }

    if (!form.password) {
      newErrors.password = 'رمز عبور الزامی است.';
    } else if (form.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ نویسه باشد.';
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(form.password)
    ) {
      newErrors.password = 'رمز عبور باید شامل حرف بزرگ، حرف کوچک، عدد و نماد باشد.';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'تأیید رمز عبور الزامی است.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'تأیید رمز عبور با رمز عبور هم‌خوانی ندارد.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message ?? 'ثبت‌نام ناموفق بود';
        if (msg.includes('ایمیل')) {
          setErrors({ email: msg });
        } else if (msg.includes('موبایل') || msg.includes('تلفن')) {
          setErrors({ phone: msg });
        } else {
          setError(msg);
        }
        return;
      }

      router.replace(data.redirectTo || '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت‌نام ناموفق بود');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-16 md:px-8">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]"
      >
        <h1 className="text-2xl font-black text-soil-900">ثبت‌نام مشتری</h1>
        <p className="mt-2 text-sm text-soil-700/70">
          برای اولین بار در پات استور، حساب جدید بسازید.
        </p>

        <div className="mt-7 space-y-4">
          <div className="block">
            <label htmlFor="register-fullName" className="block text-xs font-bold text-soil-900">
              نام کامل <span className="text-red-600">*</span>
            </label>
            <input
              id="register-fullName"
              name="fullName"
              value={form.fullName}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, fullName: e.target.value }));
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                errors.fullName
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-soil-900/15 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20'
              }`}
            />
            <FormError message={errors.fullName} />
          </div>

          <div className="block">
            <label htmlFor="register-phone" className="block text-xs font-bold text-soil-900">
              شماره موبایل <span className="text-red-600">*</span>
            </label>
            <input
              id="register-phone"
              name="phone"
              value={form.phone}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, phone: e.target.value.trim() }));
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              dir="ltr"
              type="tel"
              autoComplete="tel"
              placeholder="09121234567"
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                errors.phone
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-soil-900/15 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20'
              }`}
            />
            <FormError message={errors.phone} />
          </div>

          <div className="block">
            <label htmlFor="register-email" className="block text-xs font-bold text-soil-900">
              ایمیل <span className="text-xs font-normal text-soil-700/60">(اختیاری)</span>
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value.trim() }));
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              autoComplete="email"
              dir="ltr"
              placeholder="example@mail.com"
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-soil-900/15 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20'
              }`}
            />
            <FormError message={errors.email} />
          </div>

          <div className="block">
            <label htmlFor="register-password" className="block text-xs font-bold text-soil-900">
              رمز عبور <span className="text-red-600">*</span>
            </label>
            <PasswordInput
              id="register-password"
              name="password"
              value={form.password}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, password: e.target.value }));
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={Boolean(errors.password)}
              autoComplete="new-password"
              className="mt-2"
            />
            <FormError message={errors.password} />
            <span className="mt-1.5 block text-[11px] text-soil-700/60">
              حداقل ۸ نویسه، شامل حرف بزرگ، حرف کوچک، عدد و نماد
            </span>
          </div>

          <div className="block">
            <label htmlFor="register-confirmPassword" className="block text-xs font-bold text-soil-900">
              تأیید رمز عبور <span className="text-red-600">*</span>
            </label>
            <PasswordInput
              id="register-confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              error={Boolean(errors.confirmPassword)}
              autoComplete="new-password"
              className="mt-2"
            />
            <FormError message={errors.confirmPassword} />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50"
        >
          {loading ? 'در حال ثبت‌نام…' : 'ثبت‌نام'}
        </button>

        <p className="mt-5 text-center text-sm text-soil-700/70">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <a href="/login" className="font-bold text-flora-700 hover:text-flora-900">
            وارد شوید
          </a>
        </p>
      </form>
    </main>
  );
}
