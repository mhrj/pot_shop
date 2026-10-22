'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';
import { toEn, toFa } from '@/lib/format';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

  // Tab: 'password' | 'otp'
  const [tab, setTab] = useState<'password' | 'otp'>('password');

  // Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // OTP Login State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [countdown, setCountdown] = useState(120);

  // General Status
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    if (tab !== 'otp' || otpStep !== 'code' || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [tab, otpStep, countdown]);

  function switchTab(newTab: 'password' | 'otp') {
    setTab(newTab);
    setError(null);
    setFieldError(null);
  }

  // --- Password Login Submit ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setFieldError('لطفاً شماره موبایل یا ایمیل خود را وارد کنید.');
      return;
    }

    if (!password) {
      setFieldError('لطفاً رمز عبور خود را وارد کنید.');
      return;
    }

    // Phone format check if not an email
    if (!trimmedIdentifier.includes('@')) {
      const normalizedPhone = toEn(trimmedIdentifier).replace(/\s+/g, '');
      if (!/^09\d{9}$/.test(normalizedPhone)) {
        setFieldError('شماره موبایل نامعتبر است (باید ۱۱ رقم و با ۰۹ شروع شود).');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedIdentifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? 'ورود ناموفق بود. لطفاً اطلاعات را بررسی کنید.');
        return;
      }
      router.replace(next || data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      setError('خطای شبکه — لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP Request Code ---
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setFieldError(null);

    const trimmedPhone = otpPhone.trim();
    if (!trimmedPhone) {
      setFieldError('لطفاً شماره موبایل خود را وارد کنید.');
      return;
    }

    if (trimmedPhone.includes('@')) {
      setFieldError('برای ورود با پیامک، فقط شماره موبایل را وارد کنید.');
      return;
    }

    const normalizedPhone = toEn(trimmedPhone).replace(/\s+/g, '');
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setFieldError('شماره موبایل نامعتبر است (باید ۱۱ رقم و با ۰۹ شروع شود).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? 'ارسال پیامک ناموفق بود.');
        return;
      }

      setOtpStep('code');
      setCountdown(data.expiresInSeconds ?? 120);
      setOtpCode('');
    } catch {
      setError('خطای شبکه در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP Verify Code ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    const trimmedCode = toEn(otpCode.trim());
    if (!trimmedCode) {
      setFieldError('لطفاً کد تایید ۵ رقمی را وارد کنید.');
      return;
    }

    if (!/^\d{5}$/.test(trimmedCode)) {
      setFieldError('کد تایید باید دقیقاً ۵ رقم باشد.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: toEn(otpPhone.trim()).replace(/\s+/g, ''),
          code: trimmedCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? 'کد وارد شده نامعتبر است.');
        return;
      }

      router.replace(next || data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      setError('خطای شبکه در تایید کد.');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedCountdown = `${toFa(minutes)}:${toFa(seconds.toString().padStart(2, '0'))}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-16 md:px-8">
      <div className="w-full max-w-md rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
        <h1 className="text-2xl font-black text-soil-900">ورود به حساب</h1>
        <p className="mt-2 text-sm text-soil-700/70">
          روش ورود مورد نظر خود را انتخاب کنید.
        </p>

        {/* Tab Toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-dust-100 p-1.5 text-xs sm:text-sm font-bold text-soil-700">
          <button
            type="button"
            onClick={() => switchTab('password')}
            className={`rounded-xl py-2.5 transition cursor-pointer ${
              tab === 'password'
                ? 'bg-white text-soil-900 shadow-sm font-black'
                : 'hover:text-soil-900 text-soil-600'
            }`}
          >
            ورود با رمز عبور
          </button>
          <button
            type="button"
            onClick={() => switchTab('otp')}
            className={`rounded-xl py-2.5 transition cursor-pointer ${
              tab === 'otp'
                ? 'bg-white text-soil-900 shadow-sm font-black'
                : 'hover:text-soil-900 text-soil-600'
            }`}
          >
            ورود با پیامک (OTP)
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm"
          >
            <span className="text-sm">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Password Login */}
        {tab === 'password' && (
          <form noValidate onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-soil-900">شماره موبایل یا ایمیل</span>
              <input
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                  if (fieldError) setFieldError(null);
                }}
                autoComplete="username"
                dir="ltr"
                placeholder="09121234567 یا email@example.com"
                className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-sm outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-soil-900">رمز عبور</span>
              <PasswordInput
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                  if (fieldError) setFieldError(null);
                }}
                error={Boolean(error || fieldError)}
                autoComplete="current-password"
                className="mt-2"
              />
            </label>

            {fieldError && (
              <p role="alert" className="text-xs font-bold text-red-600">
                {fieldError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading ? 'در حال ورود…' : 'ورود'}
            </button>

            <div className="mt-5 flex items-center justify-between gap-3 text-xs sm:text-sm text-soil-700/70 pt-2">
              <Link href="/forgot-password" className="font-bold text-flora-700 hover:text-flora-900">
                فراموشی رمز عبور
              </Link>
              <span>
                حساب ندارید؟{' '}
                <Link href="/register" className="font-bold text-flora-700 hover:text-flora-900">
                  ثبت‌نام کنید
                </Link>
              </span>
            </div>
          </form>
        )}

        {/* Tab 2: OTP Login */}
        {tab === 'otp' && (
          <div className="mt-6">
            {otpStep === 'phone' ? (
              <form noValidate onSubmit={handleRequestOtp} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-soil-900">شماره موبایل</span>
                  <input
                    type="tel"
                    value={otpPhone}
                    onChange={(e) => {
                      setOtpPhone(e.target.value);
                      if (error) setError(null);
                      if (fieldError) setFieldError(null);
                    }}
                    autoComplete="tel"
                    dir="ltr"
                    placeholder="09121234567"
                    className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-sm outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                  />
                  <span className="mt-1.5 block text-[11px] text-soil-700/60">
                    کد یکبار مصرف ۵ رقمی به این شماره ارسال خواهد شد.
                  </span>
                </label>

                {fieldError && (
                  <p role="alert" className="text-xs font-bold text-red-600">
                    {fieldError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? 'در حال ارسال کد…' : 'ارسال کد تایید'}
                </button>

                <p className="text-center text-xs text-soil-700/70 pt-2">
                  حساب ندارید؟{' '}
                  <Link href="/register" className="font-bold text-flora-700 hover:text-flora-900">
                    ثبت‌نام کنید
                  </Link>
                </p>
              </form>
            ) : (
              <form noValidate onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="rounded-xl bg-flora-50 border border-flora-200/60 p-3.5 text-xs text-soil-800 flex items-center justify-between">
                  <div>
                    <span className="text-soil-700/70 block text-[11px]">ارسال شده به شماره:</span>
                    <span className="font-bold text-sm text-soil-900 dir-ltr">{toFa(otpPhone)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('phone');
                      setError(null);
                      setFieldError(null);
                    }}
                    className="text-xs font-bold text-flora-700 hover:text-flora-900 underline cursor-pointer"
                  >
                    ویرایش شماره
                  </button>
                </div>

                <label className="block">
                  <span className="text-xs font-bold text-soil-900">کد تایید ۵ رقمی</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      if (error) setError(null);
                      if (fieldError) setFieldError(null);
                    }}
                    dir="ltr"
                    placeholder="— — — — —"
                    autoFocus
                    className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                  />
                </label>

                {fieldError && (
                  <p role="alert" className="text-xs font-bold text-red-600">
                    {fieldError}
                  </p>
                )}

                {/* Countdown and Resend */}
                <div className="flex items-center justify-between text-xs text-soil-700/70">
                  {countdown > 0 ? (
                    <span>
                      ارسال مجدد کد تا{' '}
                      <span className="font-bold text-flora-700 font-mono">
                        {formattedCountdown}
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      disabled={loading}
                      className="font-bold text-flora-700 hover:text-flora-900 underline cursor-pointer"
                    >
                      ارسال مجدد کد پیامکی
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? 'در حال بررسی…' : 'تایید و ورود'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-soil-700">
          در حال آماده‌سازی…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
