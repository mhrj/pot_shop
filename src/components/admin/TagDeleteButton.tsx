'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

/**
 * Deleting a tag goes through the authorized DELETE /api/admin/tags/[id]
 * endpoint, which also refuses to remove a tag that still has products.
 */
export default function TagDeleteButton({
  tagId,
  tagName,
}: {
  tagId: string;
  tagName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmRemove = () => {
    setIsConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/admin/tags/' + tagId, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'حذف برچسب ناموفق بود');
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex max-w-72 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={pending}
        className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 cursor-pointer"
      >
        {pending ? 'در حال حذف…' : 'حذف'}
      </button>
      {error && (
        <p role="alert" className="text-end text-[11px] leading-5 font-bold text-red-600">
          {error}
        </p>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="حذف برچسب"
        message={`برچسب «${tagName}» حذف شود؟`}
        isDestructive={true}
        confirmText="حذف برچسب"
        cancelText="انصراف"
        onConfirm={handleConfirmRemove}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
