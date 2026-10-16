'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.phone.trim()) {
      setError('شماره موبایل الزامی است.');
      return;
    }

    if (!/^09\d{9}$/.test(form.phone.trim())) {
      setError('شماره موبایل نامعتبر است.');
      return;
    }

    if (!form.email.trim()) {
      setError('ایمیل الزامی است.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('ایمیل معتبر نیست.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('تأیید رمز عبور با رمز عبور هم‌خوانی ندارد.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email || undefined,
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? 'ثبت‌نام ناموفق بود');
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
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]"
      >
        <h1 className="text-2xl font-black text-soil-900">ثبت‌نام مشتری</h1>
        <p className="mt-2 text-sm text-soil-700/70">
          برای اولین بار در پات شاپ، حساب جدید بسازید.
        </p>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-soil-900">نام کامل</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
              className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-soil-900">
              شماره موبایل <span className="text-red-600">*</span>
            </span>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.trim() }))}
              required
              dir="ltr"
              autoComplete="tel"
              placeholder="09121234567"
              className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-soil-900">
              ایمیل <span className="text-red-600">*</span>
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value.trim() }))}
              required
              autoComplete="email"
              dir="ltr"
              placeholder="example@mail.com"
              className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-soil-900">رمز عبور</span>
            <PasswordInput
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              autoComplete="new-password"
              className="mt-2"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-soil-900">تأیید رمز عبور</span>
            <PasswordInput
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              autoComplete="new-password"
              className="mt-2"
            />
          </label>
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
