'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductFeature } from '@/lib/product-features';

type Tier = { minQuantity: number; unitPriceToman: number; label: string };

export type ProductFormData = {
  id?: string;
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  categoryId?: string | null;
  material: string;
  color: string;
  diameterCm: number;
  heightCm: number;
  weightGrams: number;
  stock: number;
  unitsPerCarton: number;
  basePriceToman: number;
  isActive: boolean;
  isFeatured: boolean;
  allowBatchDiscount?: boolean;
  features: ProductFeature[];
  images: string[];
  tagIds: string[];
  tiers: Tier[];
};

const inputCls =
  'mt-1.5 w-full rounded-xl border border-soil-900/15 px-3 py-2.5 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20';
const labelCls = 'text-xs font-bold text-soil-900';

export default function ProductForm({
  initial,
  knownLabels,
}: {
  initial: ProductFormData;
  knownLabels: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [form, setForm] = useState<ProductFormData>({
    ...initial,
    categoryId: initial.categoryId ?? '',
    allowBatchDiscount: initial.allowBatchDiscount ?? true,
  });

  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch('/api/admin/tags');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({ tags: [] }));
        setAllTags(data.tags ?? []);
      } catch {
        setAllTags([]);
      }
    }
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({ categories: [] }));
        setAllCategories(data.categories ?? []);
      } catch {
        setAllCategories([]);
      }
    }
    loadTags();
    loadCategories();
  }, []);

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

  // One-click add: every feature arrives already enabled. There is no per-row
  // toggle any more, so a duplicate label is silently ignored rather than
  // flipping an existing chip's state.
  function addFeatureFromInput() {
    const label = featureInput.trim();
    if (!label) return;
    if (form.features.some((f) => f.label === label)) {
      setFeatureInput('');
      return;
    }
    update('features', [...form.features, { label, enabled: true }]);
    setFeatureInput('');
  }

  function removeFeature(i: number) {
    update('features', form.features.filter((_, j) => j !== i));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const isNew = !initial.id;
      const url = isNew ? '/api/admin/products' : '/api/admin/products/' + initial.id;
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        allowBatchDiscount: form.allowBatchDiscount ?? true,
        tagIds: [...new Set(form.tagIds)],
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

  async function uploadImage(index: number, file: File | null) {
    if (!file) return;
    setError(null);
    setUploading((prev) => ({ ...prev, [index]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'product');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? 'آپلود عکس ناموفق بود');
      }

      const next = [...form.images];
      next[index] = data.url;
      update('images', next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'آپلود عکس ناموفق بود');
    } finally {
      setUploading((prev) => ({ ...prev, [index]: false }));
    }
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
            <span className={labelCls}>دسته‌بندی</span>
            <select
              value={form.categoryId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                update('categoryId', val);
                const matched = allCategories.find((c) => c.id === val);
                if (matched && !form.material) {
                  update('material', matched.name);
                }
              }}
              className={inputCls}
            >
              <option value="">انتخاب دسته‌بندی…</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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
        <h2 className="mb-2 text-sm font-black text-soil-900">ویژگی‌های نمایشی</h2>
        <p className="mb-4 text-xs text-soil-700/60">
          این ویژگی‌ها فقط برای نمایش در صفحه محصول هستند و روی عملکرد سیستم اثر ندارند.
        </p>

        <div className="flex gap-2">
          <input
            list="known-feature-labels"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter would otherwise submit the whole product form — adding a
              // feature is the intent, not saving the product.
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeatureFromInput();
              }
            }}
            placeholder="نام ویژگی جدید یا انتخاب از فهرست..."
            className={inputCls}
          />
          {/* Native autocomplete over the labels every other product already
              uses, so the shopkeeper does not invent a near-duplicate wording. */}
          <datalist id="known-feature-labels">
            {knownLabels.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={addFeatureFromInput}
            disabled={!featureInput.trim()}
            className="mt-1.5 shrink-0 rounded-xl bg-flora-900 px-4 text-xs font-black text-white transition hover:bg-flora-700 disabled:opacity-40"
          >
            افزودن
          </button>
        </div>

        {form.features.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {form.features.map((f, i) => (
              <li
                key={`${f.label}-${i}`}
                className="flex items-center gap-2 rounded-full border border-flora-500/30 bg-flora-100/50 px-3 py-1.5 text-xs font-bold text-soil-900"
              >
                <span className="size-1.5 rounded-full bg-flora-500" />
                <span>{f.label}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  aria-label={`حذف ${f.label}`}
                  className="ms-1 rounded-full text-soil-700/50 transition hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {form.features.length === 0 && (
          <p className="mt-3 text-xs text-soil-700/50">
            هنوز ویژگی‌ای اضافه نشده است.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-soil-900">تصاویر محصول</h2>
            <p className="mt-1 text-xs text-soil-700/60">
              تصاویر در فضای محلی سرور ذخیره می‌شوند (<code className="font-mono text-soil-900">/public/uploads</code>). نسبت ابعاد با بزرگنمایی مناسب حفظ می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update('images', [...form.images, ''])}
            className="text-xs font-bold text-flora-700 hover:text-flora-900"
          >
            + افزودن تصویر
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {form.images.map((url, i) => {
            const hasError = imageErrors[i];
            const isUploading = uploading[i];

            return (
              <div key={i} className="rounded-xl border border-soil-900/10 bg-dust-50 p-4">
                {/* Image preview area with comfortable height and aspect ratio preservation */}
                <div className="relative mb-3 flex min-h-60 h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-soil-900/10 bg-white p-2">
                  {url && !hasError && (
                    <img
                      src={url}
                      alt={`پیش‌نمایش تصویر ${i + 1}`}
                      className="h-full w-full object-contain"
                      onError={() => setImageErrors((prev) => ({ ...prev, [i]: true }))}
                      onLoad={() => setImageErrors((prev) => ({ ...prev, [i]: false }))}
                    />
                  )}

                  {url && hasError && (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-red-600">
                      <span className="text-3xl mb-2">⚠️</span>
                      <p className="font-bold">تصویر در این مسیر یافت نشد یا قابل نمایش نیست</p>
                      <p className="mt-1 text-[11px] text-soil-700/60 dir-ltr font-mono">{url}</p>
                    </div>
                  )}

                  {!url && !isUploading && (
                    <div className="flex flex-col items-center justify-center text-xs text-soil-700/50">
                      <span className="text-3xl mb-2">🖼️</span>
                      <span>هنوز تصویری انتخاب یا آپلود نشده است</span>
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm text-xs font-bold text-soil-900">
                      <div className="mb-2 size-8 animate-spin rounded-full border-3 border-flora-700 border-t-transparent" />
                      <span>در حال اعتبارسنجی و آپلود تصویر…</span>
                    </div>
                  )}

                  {url && !isUploading && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...form.images];
                        next[i] = '';
                        update('images', next);
                        setImageErrors((prev) => ({ ...prev, [i]: false }));
                      }}
                      className="absolute top-3 end-3 rounded-lg bg-soil-900/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur transition hover:bg-red-700"
                    >
                      پاک کردن تصویر
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...form.images];
                      next[i] = e.target.value;
                      update('images', next);
                      setImageErrors((prev) => ({ ...prev, [i]: false }));
                    }}
                    dir="ltr"
                    placeholder="/uploads/product/example.jpg"
                    className={`${inputCls} flex-1`}
                  />
                  <label className="cursor-pointer rounded-xl border border-soil-900/15 bg-white px-4 py-2.5 text-center text-xs font-bold text-soil-900 transition hover:border-flora-700 hover:text-flora-700">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        setImageErrors((prev) => ({ ...prev, [i]: false }));
                        uploadImage(i, e.target.files?.[0] ?? null);
                      }}
                    />
                    {isUploading ? 'در حال آپلود…' : 'آپلود فایل جدید'}
                  </label>
                  {form.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => update('images', form.images.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                    >
                      حذف ردیف
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <h2 className="mb-4 text-sm font-black text-soil-900">برچسب‌ها</h2>
        {allTags.length === 0 ? (
          <p className="text-xs text-soil-700/70">هنوز برچسبی ثبت نشده است.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = form.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    update('tagIds', active
                      ? form.tagIds.filter((id) => id !== tag.id)
                      : [...form.tagIds, tag.id]);
                  }}
                  className={
                    'rounded-full px-3 py-1.5 text-xs font-bold transition ' +
                    (active ? 'bg-flora-900 text-white' : 'bg-dust-100 text-soil-700 hover:bg-dust-200')
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-black text-soil-900">
            قیمت‌گذاری پله‌ای (تومان)
          </h2>
          <label className="flex items-center gap-2 text-xs font-bold text-soil-900 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowBatchDiscount ?? true}
              onChange={(e) => update('allowBatchDiscount', e.target.checked)}
              className="accent-flora-700"
            />
            فعالسازی تخفیف پلهای (عمده)
          </label>
        </div>
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
