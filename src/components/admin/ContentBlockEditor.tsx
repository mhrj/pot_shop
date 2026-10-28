'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  blockKey: string;
  fieldLabel: string;
  initialValue: string;
  defaultValue: string;
  multiline?: boolean;
  rows?: number;
};

export default function ContentBlockEditor({
  blockKey,
  fieldLabel,
  initialValue,
  defaultValue,
  multiline = false,
  rows = 3,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue || defaultValue);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('key', blockKey);
    formData.append('body', value.trim());

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: blockKey, body: value.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus('error');
          setErrorMsg(data?.message ?? 'خطا در ذخیره اطلاعات');
          return;
        }
        setStatus('success');
        router.refresh();
        setTimeout(() => setStatus('idle'), 3000);
      } catch {
        setStatus('error');
        setErrorMsg('خطای شبکه رخ داد');
      }
    });
  };

  const handleResetToDefault = () => {
    setValue(defaultValue);
    setStatus('idle');
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-soil-900/10 dark:border-dust-50/10 bg-white dark:bg-flora-900 p-5">
      <div className="flex items-center justify-between">
        <label className="block flex-1">
          <span className="text-xs font-bold text-soil-900 dark:text-dust-200">{fieldLabel}</span>
          <span className="ms-2 font-mono text-[10px] text-soil-700/40 dark:text-dust-200/40 dir-ltr">({blockKey})</span>
        </label>
        {value !== defaultValue && (
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={pending}
            className="text-[11px] font-bold text-soil-700/60 dark:text-dust-200/60 transition hover:text-soil-900 dark:hover:text-dust-50"
          >
            بازگردانی به پیش‌فرض
          </button>
        )}
      </div>

      <div className="mt-3">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={pending}
            rows={rows}
            className="w-full rounded-xl border border-soil-900/15 dark:border-dust-50/20 bg-white dark:bg-flora-950 text-soil-900 dark:text-dust-50 px-3 py-2.5 text-sm leading-7 outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={pending}
            className="w-full rounded-xl border border-soil-900/15 dark:border-dust-50/20 bg-white dark:bg-flora-950 text-soil-900 dark:text-dust-50 px-3 py-2.5 text-sm outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="rounded-xl bg-flora-900 dark:bg-flora-800 px-5 py-2 text-xs font-black text-white transition hover:bg-flora-700 dark:hover:bg-flora-900 disabled:opacity-50"
        >
          {pending ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
        </button>

        {status === 'success' && (
          <span className="text-xs font-bold text-flora-700 dark:text-flora-400">✓ با موفقیت ذخیره و منتشر شد</span>
        )}
        {status === 'error' && (
          <span className="text-xs font-bold text-red-600 dark:text-red-400">{errorMsg}</span>
        )}
      </div>
    </form>
  );
}
