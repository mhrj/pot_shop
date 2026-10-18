'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('لطفاً شماره موبایل یا ایمیل خود را وارد کنید');
      return;
    }

    if (!password) {
      setError('لطفاً رمز عبور خود را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? 'شماره موبایل، ایمیل یا رمز عبور اشتباه است');
        return;
      }
      router.replace(next || data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-16 md:px-8">
      <form
        noValidate
        onSubmit={submit}
        className="w-full max-w-md rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]"
      >
        <h1 className="text-2xl font-black text-soil-900">ورود به حساب</h1>
        <p className="mt-2 text-sm text-soil-700/70">
          با شماره موبایل یا ایمیل خود وارد شوید.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm"
          >
            <span className="text-sm">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-soil-900">شماره موبایل یا ایمیل</span>
            <input
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError(null);
              }}
              autoComplete="username"
              dir="ltr"
              placeholder="0912... یا email@example.com"
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-soil-900/15 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20'
              }`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-soil-900">رمز عبور</span>
            <PasswordInput
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              error={Boolean(error)}
              autoComplete="current-password"
              className="mt-2"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50"
        >
          {loading ? 'در حال ورود…' : 'ورود'}
        </button>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-soil-700/70">
          <a href="/forgot-password" className="font-bold text-flora-700 hover:text-flora-900">
            فراموشی رمز عبور
          </a>
          <span>
            حساب ندارید؟{' '}
            <a href="/register" className="font-bold text-flora-700 hover:text-flora-900">
              ثبت‌نام کنید
            </a>
          </span>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-soil-700">در حال آماده‌سازی…</div>}>
      <LoginForm />
    </Suspense>
  );
}
