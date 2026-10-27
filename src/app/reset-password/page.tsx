'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toFa } from '@/lib/format';

function ResetPasswordForm() {
  const params = useSearchParams();
  const initialPhone = params.get('phone') ?? '';

  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(120);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialPhone) {
      setPhone(initialPhone);
    }
  }, [initialPhone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendCode = async () => {
    if (cooldown > 0 || resending) return;
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError('لطفاً ابتدا شماره موبایل را وارد کنید');
      return;
    }

    setResending(true);
    setError(null);

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
        setError(data?.message ?? 'ارسال مجدد پیامک با خطا مواجه شد');
        return;
      }

      setMessage(data.message ?? 'کد تایید جدید پیامک شد.');
      setCooldown(120);
    } catch {
      setError('خطای شبکه در ارسال مجدد کد');
    } finally {
      setResending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();

    if (!trimmedPhone) {
      setError('لطفاً شماره موبایل خود را وارد کنید');
      return;
    }

    if (!trimmedCode || trimmedCode.length !== 5) {
      setError('کد تایید ۵ رقمی را وارد کنید');
      return;
    }

    if (!password) {
      setError('لطفاً رمز عبور جدید را وارد کنید');
      return;
    }

    if (password.length < 8) {
      setError('رمز عبور باید حداقل ۸ نویسه باشد');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('تکرار رمز عبور با رمز عبور وارد شده همخوانی ندارد');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: trimmedPhone,
          code: trimmedCode,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message ?? 'تغییر رمز عبور با شکست مواجه شد');
        return;
      }

      setMessage(data.message ?? 'رمز عبور شما با موفقیت تغییر یافت.');
      setIsSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setCode('');
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-16 md:px-8">
      <div className="w-full max-w-md rounded-pot border border-transparent bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] dark:border-dust-50/10 dark:bg-flora-900 dark:shadow-none">
        <h1 className="text-2xl font-black text-soil-900 dark:text-dust-50">تنظیم رمز جدید با پیامک</h1>
        <p className="mt-2 text-sm text-soil-700/70 dark:text-dust-200/70">
          کد ۵ رقمی ارسال‌شده به شماره همراه خود را وارد کنید.
        </p>

        {isSuccess ? (
          <div className="mt-6 text-center">
            <div className="rounded-xl border border-transparent bg-flora-100 p-4 text-sm font-bold text-flora-800 dark:border-flora-800 dark:bg-flora-950/60 dark:text-flora-200">
              {message}
            </div>
            <p className="mt-3 text-xs text-soil-700/80 dark:text-dust-200/80">
              اکنون می‌توانید با رمز عبور جدید خود وارد شوید.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-flora-900 px-6 py-3.5 text-center text-sm font-black text-white transition hover:bg-flora-700 cursor-pointer shadow-sm dark:bg-flora-800 dark:hover:bg-flora-700"
            >
              ورود به حساب کاربری
            </Link>
          </div>
        ) : (
          <form noValidate onSubmit={submit} className="mt-6">
            <label className="block">
              <span className="text-xs font-bold text-soil-900 dark:text-dust-200">شماره موبایل</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                autoComplete="tel"
                className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-3 text-right text-sm text-soil-900 outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50"
              />
            </label>

            <label className="mt-4 block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-soil-900 dark:text-dust-200">کد تایید ۵ رقمی</span>
                {cooldown > 0 ? (
                  <span className="text-xs text-soil-700/70 dark:text-dust-200/70">
                    ارسال مجدد تا ({toFa(cooldown)}) ثانیه
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resending}
                    className="text-xs font-bold text-flora-700 hover:text-flora-900 disabled:opacity-50 cursor-pointer dark:text-flora-400 dark:hover:text-flora-300"
                  >
                    {resending ? 'در حال ارسال…' : 'ارسال مجدد کد'}
                  </button>
                )}
              </div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={5}
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder="12345"
                autoComplete="one-time-code"
                className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-3 text-center text-lg font-bold tracking-widest text-soil-900 outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-bold text-soil-900 dark:text-dust-200">رمز عبور جدید</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-3 text-sm text-soil-900 outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-bold text-soil-900 dark:text-dust-200">تکرار رمز عبور جدید</span>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-3 text-sm text-soil-900 outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50"
              />
            </label>

            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-transparent bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            {message && !isSuccess && (
              <p className="mt-4 rounded-xl border border-transparent bg-flora-100 px-4 py-3 text-xs font-bold text-flora-700 dark:border-flora-800 dark:bg-flora-950 dark:text-flora-300">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50 cursor-pointer shadow-sm dark:bg-flora-800 dark:hover:bg-flora-700"
            >
              {loading ? 'در حال تغییر رمز…' : 'تغییر رمز عبور'}
            </button>

            <p className="mt-5 text-center text-sm text-soil-700/70 dark:text-dust-200/70">
              <Link href="/login" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-400 dark:hover:text-flora-300">
                بازگشت به ورود
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-soil-700 dark:text-dust-200">در حال آماده‌سازی…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
