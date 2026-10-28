'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toFa } from '@/lib/format';
import ConfirmModal from '@/components/ui/ConfirmModal';

type Props = {
  tag: {
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
  };
};

export default function TagRow({ tag }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === tag.name) {
      setIsEditing(false);
      setName(tag.name);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tags/${tag.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'ویرایش نام برچسب ناموفق بود');
          return;
        }
        setIsEditing(false);
        router.refresh();
      } catch {
        setError('خطای شبکه رخ داد');
      }
    });
  };

  const handleConfirmRemove = () => {
    setIsConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tags/${tag.id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'حذف برچسب ناموفق بود');
          return;
        }
        router.refresh();
      } catch {
        setError('خطای شبکه رخ داد');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-soil-900/10 dark:border-dust-50/10 bg-white dark:bg-flora-900 p-4 sm:flex-row sm:items-center sm:justify-between">
      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-1 flex-wrap items-center gap-2">
          <input
            id={`tag-name-${tag.id}`}
            name="name"
            aria-label="نام جدید برچسب"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            required
            className="w-full max-w-xs rounded-xl border border-soil-900/15 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50 px-3 py-1.5 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
            placeholder="نام جدید برچسب"
          />
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="rounded-xl bg-flora-900 dark:bg-flora-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-flora-700 dark:hover:bg-flora-700 disabled:opacity-50"
          >
            {pending ? 'در حال ذخیره…' : 'ذخیره'}
          </button>
          <button
            type="button"
            onClick={() => {
              setName(tag.name);
              setIsEditing(false);
              setError(null);
            }}
            disabled={pending}
            className="rounded-xl border border-soil-900/15 dark:border-dust-50/20 px-3 py-2 text-xs font-bold text-soil-700 dark:text-dust-200 transition hover:bg-dust-50 dark:hover:bg-flora-800"
          >
            انصراف
          </button>
        </form>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-soil-900 dark:text-dust-50">{tag.name}</p>
            {tag.slug.toLowerCase() !== tag.name.toLowerCase() && (
              <span className="font-mono text-[11px] text-soil-700/50 dark:text-dust-200/50 dir-ltr">({tag.slug})</span>
            )}
          </div>
          <p className="mt-1 text-xs text-soil-700/60 dark:text-dust-200/60">
            {toFa(tag._count.products)} محصول مرتبط
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={pending}
            className="rounded-xl border border-soil-900/15 dark:border-dust-50/20 bg-white dark:bg-flora-950 px-3 py-2 text-xs font-bold text-soil-900 dark:text-dust-100 transition hover:border-flora-700 dark:hover:border-flora-400 hover:text-flora-700 dark:hover:text-flora-400 disabled:opacity-50"
          >
            ویرایش نام
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={pending}
          className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'در حال حذف…' : 'حذف'}
        </button>
      </div>

      {error && (
        <p role="alert" className="w-full text-xs font-bold text-red-600 dark:text-red-400 sm:order-last">
          {error}
        </p>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="حذف برچسب"
        message={`برچسب «${tag.name}» حذف شود؟ این برچسب از تمام محصولات مرتبط جدا خواهد شد اما خود محصولات حذف نمی‌شوند.`}
        isDestructive={true}
        confirmText="حذف برچسب"
        cancelText="انصراف"
        onConfirm={handleConfirmRemove}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
