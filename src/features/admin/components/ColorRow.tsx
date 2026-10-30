'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

type Props = {
  color: {
    id: string;
    name: string;
    hexCode: string;
  };
};

function normalizeHex(input: string): string | null {
  let val = input.trim().toUpperCase();
  if (!val) return null;
  if (!val.startsWith('#')) val = `#${val}`;
  if (/^#([0-9A-F]{3})$/i.test(val)) {
    val = `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
  }
  if (!/^#[0-9A-F]{6}$/i.test(val)) return null;
  return val;
}

export default function ColorRow({ color }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(color.name);
  const [hexCode, setHexCode] = useState(color.hexCode);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const normalized = normalizeHex(hexCode);

    if (!trimmedName) {
      setError('نام رنگ نمی‌تواند خالی باشد');
      return;
    }
    if (!normalized) {
      setError('کد هگز رنگ نامعتبر است');
      return;
    }

    if (trimmedName === color.name && normalized === color.hexCode) {
      setIsEditing(false);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/colors/${color.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, hexCode: normalized }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'ویرایش رنگ ناموفق بود');
          return;
        }
        setIsEditing(false);
        router.refresh();
      } catch {
        setError('ارتباط با سرور برقرار نشد. لطفاً اینترنت خود را بررسی کرده و دوباره تلاش کنید.');
      }
    });
  };

  const handleConfirmRemove = () => {
    setIsConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/colors/${color.id}`, {
          method: 'DELETE',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'حذف رنگ ناموفق بود');
          return;
        }
        router.refresh();
      } catch {
        setError('ارتباط با سرور برقرار نشد. لطفاً اینترنت خود را بررسی کرده و دوباره تلاش کنید.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-soil-900/10 dark:border-dust-50/10 bg-white dark:bg-flora-900 p-4 transition hover:border-soil-900/20 dark:hover:border-dust-50/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-1 flex-wrap items-center gap-3">
            <input
              type="color"
              value={hexCode.startsWith('#') && hexCode.length === 7 ? hexCode : color.hexCode}
              onChange={(e) => setHexCode(e.target.value.toUpperCase())}
              className="size-9 cursor-pointer rounded-xl border border-soil-900/15 dark:border-dust-50/20 p-1 bg-white dark:bg-flora-950"
              title="انتخاب رنگ"
            />
            <input
              type="text"
              value={hexCode}
              onChange={(e) => setHexCode(e.target.value)}
              placeholder="#FFFFFF"
              dir="ltr"
              className="w-28 rounded-xl border border-soil-900/15 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50 px-3 py-1.5 text-xs font-mono outline-none focus:border-flora-500"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام رنگ"
              className="min-w-44 flex-1 rounded-xl border border-soil-900/15 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50 px-3 py-1.5 text-sm outline-none focus:border-flora-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-flora-900 dark:bg-flora-700 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-flora-700 dark:hover:bg-flora-900 disabled:opacity-50"
              >
                {pending ? 'در حال ثبت…' : 'ثبت تغییرات'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(color.name);
                  setHexCode(color.hexCode);
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={pending}
                className="rounded-xl border border-soil-900/15 dark:border-dust-50/20 px-3 py-1.5 text-xs font-medium text-soil-700 dark:text-dust-200 hover:bg-dust-50 dark:hover:bg-flora-950"
              >
                انصراف
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span
                className="size-7 rounded-full border border-soil-900/20 dark:border-dust-50/20 shadow-xs dark:shadow-none"
                style={{ backgroundColor: color.hexCode }}
              />
              <span className="text-sm font-bold text-soil-900 dark:text-dust-50">{color.name}</span>
              <span className="font-mono text-xs text-soil-700/60 dark:text-dust-200/60 dir-ltr bg-dust-50 dark:bg-flora-950 px-2 py-0.5 rounded-lg border border-soil-900/10 dark:border-dust-50/10">
                {color.hexCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl border border-soil-900/15 dark:border-dust-50/20 px-3 py-1.5 text-xs font-bold text-soil-700 dark:text-dust-200 hover:bg-dust-50 dark:hover:bg-flora-950 transition"
              >
                ویرایش
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={pending}
                className="rounded-xl border border-red-200 dark:border-red-900/50 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50 cursor-pointer"
              >
                حذف
              </button>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="حذف رنگ"
        message={`آیا از حذف رنگ «${color.name}» (${color.hexCode}) اطمینان دارید؟`}
        isDestructive={true}
        confirmText="حذف رنگ"
        cancelText="انصراف"
        onConfirm={handleConfirmRemove}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
