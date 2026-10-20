'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

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
        setError('خطای شبکه رخ داد');
      }
    });
  };

  const handleRemove = () => {
    if (!confirm(`آیا از حذف رنگ «${color.name}» (${color.hexCode}) اطمینان دارید؟`)) {
      return;
    }

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
        setError('خطای شبکه رخ داد');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-soil-900/10 bg-white p-4 transition hover:border-soil-900/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-1 flex-wrap items-center gap-3">
            <input
              type="color"
              value={hexCode.startsWith('#') && hexCode.length === 7 ? hexCode : color.hexCode}
              onChange={(e) => setHexCode(e.target.value.toUpperCase())}
              className="size-9 cursor-pointer rounded-xl border border-soil-900/15 p-1 bg-white"
              title="انتخاب رنگ"
            />
            <input
              type="text"
              value={hexCode}
              onChange={(e) => setHexCode(e.target.value)}
              placeholder="#FFFFFF"
              dir="ltr"
              className="w-28 rounded-xl border border-soil-900/15 px-3 py-1.5 text-xs font-mono outline-none focus:border-flora-500"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام رنگ"
              className="min-w-44 flex-1 rounded-xl border border-soil-900/15 px-3 py-1.5 text-sm outline-none focus:border-flora-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-flora-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-flora-700 disabled:opacity-50"
              >
                {pending ? 'در حال ذخیره…' : 'ذخیره'}
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
                className="rounded-xl border border-soil-900/15 px-3 py-1.5 text-xs font-medium text-soil-700 hover:bg-dust-50"
              >
                انصراف
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span
                className="size-7 rounded-full border border-soil-900/20 shadow-xs"
                style={{ backgroundColor: color.hexCode }}
              />
              <span className="text-sm font-bold text-soil-900">{color.name}</span>
              <span className="font-mono text-xs text-soil-700/60 dir-ltr bg-dust-50 px-2 py-0.5 rounded-lg border border-soil-900/10">
                {color.hexCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl border border-soil-900/15 px-3 py-1.5 text-xs font-bold text-soil-700 hover:bg-dust-50 transition"
              >
                ویرایش
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={pending}
                className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              >
                حذف
              </button>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
