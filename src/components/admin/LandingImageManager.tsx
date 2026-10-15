'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type LandingImageEntry = {
  key: string;
  url: string;
  alt?: string | null;
};

const slots = [
  { key: 'hero', label: 'تصویر اصلی بالای صفحه', description: 'تصویر اصلی hero در بالای وب‌سایت' },
  { key: 'journey', label: 'تصویر بخش داستان', description: 'بخش روایت و سفر گیاه‌داری' },
  { key: 'cta', label: 'تصویر بخش پیشنهاد ویژه', description: 'پیشنهاد ویژه و سفارش عمده' },
] as const;

export default function LandingImageManager({ initial }: { initial: LandingImageEntry[] }) {
  const router = useRouter();
  const map = useMemo(
    () => Object.fromEntries(initial.map((item) => [item.key, item.url])),
    [initial],
  );
  const [state, setState] = useState<Record<string, string>>(map);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(slotKey: string, file: File | null) {
    if (!file) return;

    setError(null);
    setUploading((prev) => ({ ...prev, [slotKey]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'landing');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(uploadData?.message ?? 'آپلود تصویر ناموفق بود');
      }

      const saveRes = await fetch('/api/admin/landing-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: slotKey, url: uploadData.url }),
      });

      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        throw new Error(saveData?.message ?? 'ذخیره تصویر ناموفق بود');
      }

      setState((prev) => ({ ...prev, [slotKey]: uploadData.url }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'عملیات ناموفق بود');
    } finally {
      setUploading((prev) => ({ ...prev, [slotKey]: false }));
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {slots.map((slot) => {
        const currentUrl = state[slot.key] ?? '';
        return (
          <div key={slot.key} className="rounded-2xl border border-soil-900/10 bg-dust-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-soil-900">{slot.label}</h3>
                <p className="mt-1 text-[11px] text-soil-700/70">{slot.description}</p>
              </div>
            </div>

            {currentUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-soil-900/10 bg-white">
                <img src={currentUrl} alt={slot.label} className="h-40 w-full object-cover" />
              </div>
            ) : (
              <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-soil-900/15 bg-white text-[11px] text-soil-700/60">
                هنوز تصویری تنظیم نشده
              </div>
            )}

            <label className="mt-4 block cursor-pointer rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-center text-xs font-bold text-soil-900 transition hover:border-flora-700 hover:text-flora-700">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(slot.key, e.target.files?.[0] ?? null)}
              />
              {uploading[slot.key] ? 'در حال آپلود…' : 'انتخاب فایل'}
            </label>
          </div>
        );
      })}

      {error && (
        <div className="md:col-span-2 xl:col-span-3 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
