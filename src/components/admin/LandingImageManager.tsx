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
  const altMap = useMemo(
    () => Object.fromEntries(initial.map((item) => [item.key, item.alt ?? ''])),
    [initial],
  );
  const [state, setState] = useState<Record<string, string>>(map);
  const [alts, setAlts] = useState<Record<string, string>>(altMap);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [savingAlt, setSavingAlt] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const persist = async (slotKey: string, url: string, alt?: string) => {
    const res = await fetch('/api/admin/landing-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alt ? { key: slotKey, url, alt } : { key: slotKey, url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? 'ذخیره تصویر ناموفق بود');
    setState((prev) => ({ ...prev, [slotKey]: url }));
    router.refresh();
  };

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

      await persist(slotKey, uploadData.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'عملیات ناموفق بود');
    } finally {
      setUploading((prev) => ({ ...prev, [slotKey]: false }));
    }
  }

  async function saveAlt(slotKey: string) {
    const url = state[slotKey];
    if (!url) return;
    setError(null);
    setSavingAlt((prev) => ({ ...prev, [slotKey]: true }));
    try {
      await persist(slotKey, url, alts[slotKey] ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره توضیح ناموفق بود');
    } finally {
      setSavingAlt((prev) => ({ ...prev, [slotKey]: false }));
    }
  }

  async function clearSlot(slotKey: string) {
    if (!confirm('این تصویر حذف شود؟ بخش مربوطه به حالت پیش‌فرض برمی‌گردد.')) return;
    setError(null);
    setUploading((prev) => ({ ...prev, [slotKey]: true }));
    try {
      const res = await fetch('/api/admin/landing-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: slotKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? 'حذف تصویر ناموفق بود');
      setState((prev) => ({ ...prev, [slotKey]: '' }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حذف تصویر ناموفق بود');
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
                <img src={currentUrl} alt={alts[slot.key] || slot.label} className="h-40 w-full object-cover" />
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

            {currentUrl && (
              <>
                {/* Alt text is what a screen reader announces and what shows if
                    the image fails to load, so it is editable rather than
                    derived from the slot key. */}
                <label className="mt-3 block text-[11px] font-bold text-soil-700/80">
                  توضیح تصویر (alt)
                  <input
                    value={alts[slot.key] ?? ''}
                    onChange={(e) =>
                      setAlts((prev) => ({ ...prev, [slot.key]: e.target.value }))
                    }
                    onBlur={() => saveAlt(slot.key)}
                    disabled={savingAlt[slot.key]}
                    placeholder="مثلاً: گلدان سفالی با گیاه آپارتمانی"
                    className="mt-1.5 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-xs font-normal text-soil-900 outline-none transition focus:border-flora-500"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => clearSlot(slot.key)}
                  disabled={uploading[slot.key]}
                  className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {uploading[slot.key] ? 'در حال حذف…' : 'حذف تصویر'}
                </button>
              </>
            )}
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
