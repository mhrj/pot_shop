'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'درخواست ناموفق بود');
        return;
      }
      setMessage(data.message ?? 'درخواست شما ثبت شد.');
      setEmail('');
    } catch {
      setError('خطای شبکه — دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-16 md:px-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
        <h1 className="text-2xl font-black text-soil-900">بازیابی رمز عبور</h1>
        <p className="mt-2 text-sm text-soil-700/70">ایمیل خود را وارد کنید تا لینک تنظیم مجدد ارسال شود.</p>

        <label className="mt-6 block">
          <span className="text-xs font-bold text-soil-900">ایمیل</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-soil-900/15 px-4 py-3 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</p>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-flora-100 px-4 py-3 text-xs font-bold text-flora-700">{message}</p>
        )}

        <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-flora-900 px-6 py-3.5 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50">
          {loading ? 'در حال ارسال…' : 'ارسال لینک بازیابی'}
        </button>

        <p className="mt-5 text-center text-sm text-soil-700/70">
          <Link href="/login" className="font-bold text-flora-700 hover:text-flora-900">بازگشت به ورود</Link>
        </p>
      </form>
    </main>
  );
}
