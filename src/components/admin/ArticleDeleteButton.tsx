'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function ArticleDeleteButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConfirmDelete = async () => {
    setIsConfirmOpen(false);
    setError(null);
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'خطا در حذف مقاله');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف مقاله');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => setIsConfirmOpen(true)}
        className="rounded-full bg-red-50 px-3.5 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 cursor-pointer dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
      >
        {isDeleting ? 'در حال حذف...' : 'حذف'}
      </button>

      {error && (
        <span className="text-[10px] text-red-600 dark:text-red-400 block mt-1">
          {error}
        </span>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="حذف مقاله"
        message={`آیا از حذف مقاله «${title}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
        confirmText={isDeleting ? 'در حال حذف...' : 'حذف مقاله'}
        cancelText="انصراف"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
