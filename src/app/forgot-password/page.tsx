'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toFa } from '@/lib/format';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setError(null);
    setMessage(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError('لطفاً شماره موبایل خود را وارد کنید');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 && data?.remainingSeconds) {
          setCooldown(data.remainingSeconds);
        }
        setError(data?.message ?? 'ارسال پیامک با خطا مواجه شد');
        return;
      }

      setMessage(data.message ?? 'کد تایید ارسال شد.');
      setCooldown(120);

      const targetPhone = data.phone || trimmedPhone;
      setTimeout(() => {
        router.push(`/reset-password?phone=${encodeURIComponent(targetPhone)}`);
      }, 1200);
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-16 md:px-8">
      <form noValidate onSubmit={submit} className="w-full max-w-md rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
        <h1 className="text-2xl font-black text-soil-900">بازیابی رمز عبور با پیامک</h1>
        <p className="mt-2 text-sm text-soil-700/70">
          شماره موبایل ثبت‌شده در حساب خود را وارد کنید تا کد تایید ۵ رقمی برایتان پیامک شود.
        </p>

        <label className="mt-6 block">
          <span className="text-xs font-bold text-soil-900">شماره موبایل</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            type="tel"
            dir="ltr"
            placeholder="09123456789"
            autoComplete="tel"
            className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-right text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</p>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-flora-100 px-4 py-3 text-xs font-bold text-flora-700">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading || cooldown > 0}
          className="mt-6 w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50"
        >
          {loading ? 'در حال ارسال کد…' : cooldown > 0 ? `امکان ارسال مجدد تا (${toFa(cooldown)}) ثانیه` : 'ارسال کد تایید پیامکی'}
        </button>

        <p className="mt-5 text-center text-sm text-soil-700/70">
          <Link href="/login" className="font-bold text-flora-700 hover:text-flora-900">بازگشت به ورود</Link>
        </p>
      </form>
    </main>
  );
}
