'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Tier = { minQuantity: number; unitPriceToman: number; label: string };

export type ProductFormData = {
  id?: string;
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  material: string;
  color: string;
  diameterCm: number;
  heightCm: number;
  weightGrams: number;
  drainageHole: boolean;
  frostProof: boolean;
  stock: number;
  unitsPerCarton: number;
  basePriceToman: number;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  tiers: Tier[];
};

const inputCls =
  'mt-1.5 w-full rounded-xl border border-soil-900/15 px-3 py-2.5 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20';
const labelCls = 'text-xs font-bold text-soil-900';

export default function ProductForm({ initial }: { initial: ProductFormData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(initial);

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateTier(i: number, patch: Partial<Tier>) {
    setForm((f) => {
      const next = [...f.tiers];
      next[i] = { ...next[i], ...patch };
      return { ...f, tiers: next };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const isNew = !initial.id;
      const url = isNew ? '/api/admin/products' : '/api/admin/products/' + initial.id;
      const payload = {
        ...form,
        images: form.images.filter((u) => u.trim().length > 0),
      };
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'ذخیره ناموفق بود');
        return;
      }
      router.push('/admin/products');
      router.refresh();
    });
  }

  function remove() {
    if (!initial.id) return;
    if (!confirm('این محصول حذف شود؟ سفارش‌های قبلی حفظ می‌شوند.')) return;
    startTransition(async () => {
      const res = await fetch('/api/admin/products/' + initial.id, { method: 'DELETE' });
      if (!res.ok) {
        setError('حذف ناموفق بود');
        return;
      }
      router.push('/admin/products');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <h2 className="mb-4 text-sm font-black text-soil-900">اطلاعات پایه</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelCls}>نام محصول *</span>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className={labelCls}>اسلاگ (انگلیسی) *</span>
            <input
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              required
              dir="ltr"
              placeholder="clay-pot-terracotta-medium"
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className={labelCls}>متریال *</span>
            <input
              value={form.material}
              onChange={(e) => update('material', e.target.value)}
              required
              className={inputCls}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelCls}>توضیح کوتاه</span>
            <input
              value={form.shortDesc}
              onChange={(e) => update('shortDesc', e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelCls}>توضیحات کامل</span>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={5}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <h2 className="mb-4 text-sm font-black text-soil-900">مشخصات فنی</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={labelCls}>رنگ</span>
            <input
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>قطر (cm)</span>
            <input
              type="number"
              step="0.5"
              value={form.diameterCm}
              onChange={(e) => update('diameterCm', Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>ارتفاع (cm)</span>
            <input
              type="number"
              step="0.5"
              value={form.heightCm}
              onChange={(e) => update('heightCm', Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>وزن (گرم)</span>
            <input
              type="number"
              value={form.weightGrams}
              onChange={(e) => update('weightGrams', Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>موجودی</span>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => update('stock', Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>تعداد در کارتن</span>
            <input
              type="number"
              value={form.unitsPerCarton}
              onChange={(e) => update('unitsPerCarton', Number(e.target.value))}
              className={inputCls}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.drainageHole}
              onChange={(e) => update('drainageHole', e.target.checked)}
              className="accent-flora-700"
            />
            سوراخ زهکشی دارد
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.frostProof}
              onChange={(e) => update('frostProof', e.target.checked)}
              className="accent-flora-700"
            />
            مقاوم به سرما
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              className="accent-flora-700"
            />
            فعال
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => update('isFeatured', e.target.checked)}
              className="accent-flora-700"
            />
            نمایش در صفحه اصلی
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-soil-900">تصاویر (URL)</h2>
          <button
            type="button"
            onClick={() => update('images', [...form.images, ''])}
            className="text-xs font-bold text-flora-700 hover:text-flora-900"
          >
            + افزودن تصویر
          </button>
        </div>
        <div className="space-y-2">
          {form.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={url}
                onChange={(e) => {
                  const next = [...form.images];
                  next[i] = e.target.value;
                  update('images', next);
                }}
                dir="ltr"
                placeholder="https://..."
                className={inputCls}
              />
              {form.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => update('images', form.images.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-xl border border-soil-900/15 px-3 text-xs text-soil-700 transition hover:bg-dust-50"
                >
                  حذف
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <h2 className="mb-4 text-sm font-black text-soil-900">
          قیمت‌گذاری پله‌ای (تومان)
        </h2>
        <label className="block max-w-xs">
          <span className={labelCls}>قیمت پایه (خرده) *</span>
          <input
            type="number"
            value={form.basePriceToman}
            onChange={(e) => update('basePriceToman', Number(e.target.value))}
            required
            min={1000}
            className={inputCls}
          />
        </label>

        <div className="mt-4 space-y-3">
          {form.tiers.map((t, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={labelCls}>حداقل تعداد</span>
                <input
                  type="number"
                  value={t.minQuantity}
                  onChange={(e) => updateTier(i, { minQuantity: Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>قیمت هر عدد</span>
                <input
                  type="number"
                  value={t.unitPriceToman}
                  onChange={(e) => updateTier(i, { unitPriceToman: Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>برچسب</span>
                <input
                  value={t.label}
                  onChange={(e) => updateTier(i, { label: e.target.value })}
                  className={inputCls}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-flora-900 px-6 py-3 text-sm font-black text-white transition hover:bg-flora-700 disabled:opacity-50"
        >
          {pending ? 'در حال ذخیره…' : initial.id ? 'ذخیره تغییرات' : 'ایجاد محصول'}
        </button>
        {initial.id && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            حذف محصول
          </button>
        )}
      </div>
    </form>
  );
}
