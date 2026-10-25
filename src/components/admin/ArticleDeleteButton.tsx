'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ArticleDeleteButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`آیا از حذف مقاله «${title}» اطمینان دارید؟`)) {
      return;
    }

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
      alert(err instanceof Error ? err.message : 'خطا در حذف مقاله');
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
      className="rounded-full bg-red-50 px-3.5 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      {isDeleting ? 'در حال حذف...' : 'حذف'}
    </button>
  );
}
