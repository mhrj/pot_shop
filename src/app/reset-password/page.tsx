'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'تغییر رمز ناموفق بود');
        return;
      }
      setMessage(data.message ?? 'رمز عبور با موفقیت تغییر کرد.');
      setPassword('');
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-16 md:px-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
        <h1 className="text-2xl font-black text-soil-900">تنظیم رمز جدید</h1>
        <p className="mt-2 text-sm text-soil-700/70">رمز عبور جدید خود را وارد کنید.</p>

        <label className="mt-6 block">
          <span className="text-xs font-bold text-soil-900">رمز عبور جدید</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</p>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-flora-100 px-4 py-3 text-xs font-bold text-flora-700">{message}</p>
        )}

        <button type="submit" disabled={loading || !token} className="mt-6 w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50">
          {loading ? 'در حال اعمال…' : 'تغییر رمز عبور'}
        </button>

        <p className="mt-5 text-center text-sm text-soil-700/70">
          <Link href="/login" className="font-bold text-flora-700 hover:text-flora-900">بازگشت به ورود</Link>
        </p>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-soil-700">در حال آماده‌سازی…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
