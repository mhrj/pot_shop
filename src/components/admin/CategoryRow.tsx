'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toFa } from '@/lib/format';
import ConfirmModal from '@/components/ui/ConfirmModal';

type Props = {
  category: {
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
  };
};

export default function CategoryRow({ category }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setIsEditing(false);
      setName(category.name);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/categories/${category.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'ویرایش نام دسته‌بندی ناموفق بود');
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
        const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'حذف دسته‌بندی ناموفق بود');
          return;
        }
        router.refresh();
      } catch {
        setError('خطای شبکه رخ داد');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-soil-900/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            required
            className="w-full max-w-xs rounded-xl border border-soil-900/15 px-3 py-1.5 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
            placeholder="نام جدید دسته‌بندی"
          />
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="rounded-xl bg-flora-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-flora-700 disabled:opacity-50"
          >
            {pending ? 'در حال ذخیره…' : 'ذخیره'}
          </button>
          <button
            type="button"
            onClick={() => {
              setName(category.name);
              setIsEditing(false);
              setError(null);
            }}
            disabled={pending}
            className="rounded-xl border border-soil-900/15 px-3 py-2 text-xs font-bold text-soil-700 transition hover:bg-dust-50"
          >
            انصراف
          </button>
        </form>
      ) : (
        <div>
          <p className="font-bold text-soil-900">{category.name}</p>
          <p className="mt-1 text-xs text-soil-700/60">
            {toFa(category._count.products)} محصول
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={pending}
            className="rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-xs font-bold text-soil-900 transition hover:border-flora-700 hover:text-flora-700 disabled:opacity-50"
          >
            ویرایش نام
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={pending}
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'در حال حذف…' : 'حذف'}
        </button>
      </div>

      {error && (
        <p role="alert" className="w-full text-xs font-bold text-red-600 sm:order-last">
          {error}
        </p>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="حذف دسته‌بندی"
        message={`آیا از حذف دسته‌بندی «${category.name}» اطمینان دارید؟`}
        isDestructive={true}
        confirmText="حذف دسته‌بندی"
        cancelText="انصراف"
        onConfirm={handleConfirmRemove}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
