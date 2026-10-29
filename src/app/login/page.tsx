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
    <main className="mx-auto flex flex-1 min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-8 sm:py-12 md:px-8">
      <div className="flex h-[520px] w-full max-w-md flex-col rounded-pot border border-transparent bg-white p-6 sm:p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] dark:border-dust-50/10 dark:bg-flora-900 dark:shadow-none">
        <div>
          <h1 className="text-2xl font-black text-soil-900 dark:text-dust-50">ورود به حساب</h1>
          <p className="mt-2 text-sm text-soil-700/70 dark:text-dust-200/70">
            روش ورود مورد نظر خود را انتخاب کنید.
          </p>

          {/* Tab Toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-dust-100 p-1.5 text-xs sm:text-sm font-bold text-soil-700 dark:bg-flora-950 dark:text-dust-200">
            <button
              type="button"
              onClick={() => switchTab('password')}
              className={`rounded-xl py-2.5 transition cursor-pointer ${
                tab === 'password'
                  ? 'bg-white text-soil-900 shadow-sm font-black dark:bg-flora-500 dark:text-flora-950'
                  : 'hover:text-soil-900 text-soil-600 dark:bg-flora-950 dark:text-dust-300 dark:hover:text-dust-50'
              }`}
            >
              ورود با رمز عبور
            </button>
            <button
              type="button"
              onClick={() => switchTab('otp')}
              className={`rounded-xl py-2.5 transition cursor-pointer ${
                tab === 'otp'
                  ? 'bg-white text-soil-900 shadow-sm font-black dark:bg-flora-500 dark:text-flora-950'
                  : 'hover:text-soil-900 text-soil-600 dark:bg-flora-950 dark:text-dust-300 dark:hover:text-dust-50'
              }`}
            >
              ورود با پیامک (OTP)
            </button>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
            >
              <span className="text-sm">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tab 1: Password Login */}
        {tab === 'password' && (
          <form noValidate onSubmit={handlePasswordSubmit} className="flex flex-1 flex-col mt-6">
            <div className="flex flex-col gap-4">
              <div className="block">
                <label htmlFor="login-identifier" className="block text-xs font-bold text-soil-900 dark:text-dust-200">
                  شماره موبایل یا ایمیل
                </label>
                <input
                  id="login-identifier"
                  name="identifier"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                    if (fieldError) setFieldError(null);
                  }}
                  autoComplete="username"
                  dir="ltr"
                  placeholder="09121234567 یا email@example.com"
                  className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-3 text-sm text-soil-900 outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50 dark:placeholder:text-dust-400 focus:dark:border-flora-500"
                />
              </div>

              <div className="block">
                <label htmlFor="login-password" className="block text-xs font-bold text-soil-900 dark:text-dust-200">
                  رمز عبور
                </label>
                <PasswordInput
                  id="login-password"
                  name="password"
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
              </div>

              {fieldError && (
                <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
                  {fieldError}
                </p>
              )}
            </div>

            <div className="mt-auto pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-flora-900 text-white dark:bg-flora-500 dark:text-flora-950 dark:hover:bg-flora-700 px-6 py-3.5 text-sm font-black transition-colors hover:bg-flora-700 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'در حال ورود…' : 'ورود'}
              </button>

              <p className="mt-3 text-center text-xs sm:text-sm text-soil-700/70 dark:text-dust-200/70">
                حساب ندارید؟{' '}
                <Link href="/register" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-300">
                  ثبت‌نام کنید
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* Tab 2: OTP Login */}
        {tab === 'otp' && (
          <div className="flex flex-1 flex-col mt-6">
            {otpStep === 'phone' ? (
              <form noValidate onSubmit={handleRequestOtp} className="flex flex-1 flex-col">
                <div className="flex flex-col gap-4">
                  <div className="block">
                    <label htmlFor="login-otp-phone" className="block text-xs font-bold text-soil-900 dark:text-dust-200">
                      شماره موبایل
                    </label>
                    <input
                      id="login-otp-phone"
                      name="otpPhone"
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
                      className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-3 text-sm text-soil-900 outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50 dark:placeholder:text-dust-400 focus:dark:border-flora-500"
                    />
                    <span className="mt-1.5 block text-[11px] text-soil-700/60 dark:text-dust-200/60">
                      کد یکبار مصرف ۵ رقمی به این شماره ارسال خواهد شد.
                    </span>
                  </div>

                  {fieldError && (
                    <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
                      {fieldError}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-flora-900 text-white dark:bg-flora-500 dark:text-flora-950 dark:hover:bg-flora-700 px-6 py-3.5 text-sm font-black transition-colors hover:bg-flora-700 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {loading ? 'در حال ارسال کد…' : 'ارسال کد تایید'}
                  </button>

                  <p className="mt-3 text-center text-xs sm:text-sm text-soil-700/70 dark:text-dust-200/70">
                    حساب ندارید؟{' '}
                    <Link href="/register" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-300">
                      ثبت‌نام کنید
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form noValidate onSubmit={handleVerifyOtp} className="flex flex-1 flex-col">
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-flora-300/60 bg-flora-50 p-3 text-xs text-soil-800 flex items-center justify-between dark:border-flora-700 dark:bg-flora-950/60 dark:text-dust-200">
                    <div>
                      <span className="text-soil-700/70 block text-[11px] dark:text-dust-200/70">ارسال شده به شماره:</span>
                      <span className="font-bold text-sm text-soil-900 dir-ltr dark:text-dust-50">{toFa(otpPhone)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('phone');
                        setError(null);
                        setFieldError(null);
                      }}
                      className="text-xs font-bold text-flora-700 hover:text-flora-900 underline cursor-pointer dark:text-flora-300 dark:hover:text-flora-300"
                    >
                      ویرایش شماره
                    </button>
                  </div>

                  <div className="block">
                    <label htmlFor="login-otp-code" className="block text-xs font-bold text-soil-900 dark:text-dust-200">
                      کد تایید ۵ رقمی
                    </label>
                    <input
                      id="login-otp-code"
                      name="otpCode"
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
                      className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-soil-900 outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50 dark:placeholder:text-dust-400 focus:dark:border-flora-500"
                    />
                  </div>

                  {fieldError && (
                    <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
                      {fieldError}
                    </p>
                  )}

                  {/* Countdown and Resend */}
                  <div className="flex items-center justify-between text-xs text-soil-700/70 dark:text-dust-200/70">
                    {countdown > 0 ? (
                      <span>
                        ارسال مجدد کد تا{' '}
                        <span className="font-bold text-flora-700 font-mono dark:text-flora-300">
                          {formattedCountdown}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestOtp()}
                        disabled={loading}
                        className="font-bold text-flora-700 hover:text-flora-900 underline cursor-pointer dark:text-flora-300 dark:hover:text-flora-300"
                      >
                        ارسال مجدد کد پیامکی
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-flora-900 text-white dark:bg-flora-500 dark:text-flora-950 dark:hover:bg-flora-700 px-6 py-3.5 text-sm font-black transition-colors hover:bg-flora-700 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {loading ? 'در حال بررسی…' : 'تایید و ورود'}
                  </button>
                </div>
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
