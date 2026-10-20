'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductFeature, BundleItem } from '@/lib/product-features';
import { formatToman, toFa } from '@/lib/format';
import { numberToWordsFa } from '@/lib/number-to-words';
import { FormError } from '@/components/ui/FormError';

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
  unitsPerCarton?: number;
  bundleSize: number;
  minOrderQuantity?: number;
  bundleItems: BundleItem[] | null;
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

function fieldCls(errorMsg?: string) {
  return `mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
    errorMsg
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : 'border-soil-900/15 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20'
  }`;
}

export type CatalogProductOption = {
  id: string;
  name: string;
  material: string;
  diameterCm: number;
  heightCm: number;
  weightGrams: number;
  basePriceToman: number;
};

export default function ProductForm({
  initial,
  knownLabels,
  catalogProducts = [],
}: {
  initial: ProductFormData;
  knownLabels: string[];
  catalogProducts?: CatalogProductOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [form, setForm] = useState<ProductFormData>({
    ...initial,
    categoryId: initial.categoryId ?? '',
    unitsPerCarton: 1,
    bundleSize: initial.bundleSize ?? 1,
    bundleItems: initial.bundleItems ?? [],
    allowBatchDiscount: initial.allowBatchDiscount ?? true,
  });

  const initialIsBundle = Boolean(
    (initial.bundleSize && initial.bundleSize > 1) ||
    (initial.bundleItems && initial.bundleItems.length > 0)
  );
  const [isBundleActive, setIsBundleActive] = useState<boolean>(initialIsBundle);

  function handleToggleBundle(active: boolean) {
    setIsBundleActive(active);
    if (!active) {
      setForm((prev) => ({
        ...prev,
        bundleSize: 1,
        bundleItems: [],
      }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.bundleItems;
        return next;
      });
    } else {
      setForm((prev) => {
        const items = prev.bundleItems ?? [];
        return {
          ...prev,
          bundleSize: Math.max(1, items.length),
        };
      });
    }
  }

  function handleAddBundleItem() {
    const current = form.bundleItems ?? [];
    const next: BundleItem[] = [
      ...current,
      {
        title: '',
        description: '',
        material: '',
        diameterCm: 0,
        heightCm: 0,
        weightGrams: 0,
        price: 0,
        priceToman: 0,
      },
    ];
    setForm((prev) => ({
      ...prev,
      bundleItems: next,
      bundleSize: Math.max(1, next.length),
    }));
    if (fieldErrors.bundleItems) {
      setFieldErrors((prev) => ({ ...prev, bundleItems: '' }));
    }
  }

  function handleRemoveBundleItem(idx: number) {
    const current = form.bundleItems ?? [];
    const next = current.filter((_, i) => i !== idx);
    setForm((prev) => ({
      ...prev,
      bundleItems: next,
      bundleSize: Math.max(1, next.length),
    }));
  }

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
    if (fieldErrors[key as string]) {
      setFieldErrors((prev) => ({ ...prev, [key as string]: '' }));
    }
  }

  function updateTier(i: number, patch: Partial<Tier>) {
    setForm((f) => {
      const next = [...f.tiers];
      next[i] = { ...next[i], ...patch };
      return { ...f, tiers: next };
    });
    if (fieldErrors.tiers) {
      setFieldErrors((prev) => ({ ...prev, tiers: '' }));
    }
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

    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'نام محصول الزامی است';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'نام محصول باید حداقل ۲ حرف باشد';
    }

    if (!form.slug.trim()) {
      newErrors.slug = 'اسلاگ الزامی است';
    } else if (form.slug.trim().length < 2) {
      newErrors.slug = 'اسلاگ باید حداقل ۲ کاراکتر باشد';
    } else if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
      newErrors.slug = 'اسلاگ فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد';
    }

    if (!form.material.trim()) {
      newErrors.material = 'متریال/جنس الزامی است';
    }

    if (!form.description.trim()) {
      newErrors.description = 'توضیحات کامل الزامی است';
    }

    if (!form.basePriceToman || form.basePriceToman < 1000) {
      newErrors.basePriceToman = 'قیمت پایه باید حداقل ۱,۰۰۰ تومان باشد';
    }

    if (form.stock < 0) {
      newErrors.stock = 'موجودی نمی‌تواند منفی باشد';
    }

    const validImages = form.images.filter((u) => u.trim().length > 0);
    if (validImages.length === 0) {
      newErrors.images = 'حداقل یک تصویر برای محصول الزامی است';
    }

    if (!form.tiers.some((t) => t.minQuantity === 1)) {
      newErrors.tiers = 'یکی از پله‌های قیمت باید از تعداد ۱ شروع شود';
    } else if (
      (form.allowBatchDiscount ?? true) &&
      form.tiers.some((t) => t.minQuantity > 1 && t.unitPriceToman > form.basePriceToman)
    ) {
      newErrors.tiers = 'خطا: قیمت پله‌های بعدی باید کمتر از قیمت پایه باشد';
    }

    if (isBundleActive) {
      if ((form.bundleItems ?? []).length < 2) {
        newErrors.bundleItems = 'یک بسته باید حداقل شامل ۲ آیتم باشد';
      } else if (form.bundleItems?.some((it) => !it.title.trim())) {
        newErrors.bundleItems = 'نام تمام اقلام موجود در بسته الزامی است';
      }
      const totalValue = (form.bundleItems ?? []).reduce(
        (acc, it) => acc + (it.price ?? it.priceToman ?? 0),
        0,
      );
      if (totalValue > 0 && form.basePriceToman > totalValue) {
        newErrors.basePriceToman = 'قیمت فروش پکیج نمی‌تواند بیشتر از مجموع ارزش اقلام باشد';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('لطفاً خطاهای مشخص‌شده در فرم را بررسی کنید.');
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const isNew = !initial.id;
      const url = isNew ? '/api/admin/products' : '/api/admin/products/' + initial.id;
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        unitsPerCarton: 1,
        bundleSize: isBundleActive ? Math.max(1, (form.bundleItems ?? []).length) : 1,
        minOrderQuantity: form.minOrderQuantity ?? 1,
        bundleItems:
          isBundleActive && (form.bundleItems ?? []).length > 0
            ? (form.bundleItems?.filter((it) => it.title.trim()).map((it) => ({
                ...it,
                description: it.description?.trim() || '',
                price: it.price ?? it.priceToman ?? 0,
                priceToman: it.price ?? it.priceToman ?? 0,
              })) ?? [])
            : null,
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
        if (data?.message?.includes('اسلاگ')) {
          setFieldErrors({ slug: data.message });
        }
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
    <form noValidate onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
        <h2 className="mb-4 text-sm font-black text-soil-900">اطلاعات پایه</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelCls}>نام محصول *</span>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={fieldCls(fieldErrors.name)}
            />
            <FormError message={fieldErrors.name} />
          </label>

          <label className="block">
            <span className={labelCls}>اسلاگ (انگلیسی) *</span>
            <input
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              dir="ltr"
              placeholder="clay-pot-terracotta-medium"
              className={fieldCls(fieldErrors.slug)}
            />
            <FormError message={fieldErrors.slug} />
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
              className={fieldCls(fieldErrors.material)}
            />
            <FormError message={fieldErrors.material} />
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
            <span className={labelCls}>توضیحات کامل *</span>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={5}
              className={fieldCls(fieldErrors.description)}
            />
            <FormError message={fieldErrors.description} />
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
              className={fieldCls(fieldErrors.stock)}
            />
            <FormError message={fieldErrors.stock} />
          </label>
          <label className="block">
            <span className={labelCls}>حداقل تعداد سفارش (MOQ)</span>
            <input
              type="number"
              min={1}
              value={form.minOrderQuantity ?? 1}
              onChange={(e) => update('minOrderQuantity', Number(e.target.value) || 1)}
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

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-soil-900/10 pb-4">
          <div>
            <h2 className="text-sm font-black text-soil-900">تنظیمات بسته (Bundle)</h2>
            <p className="mt-1 text-xs text-soil-700/60">
              اگر این محصول شامل چند گلدان یا آیتم است و به عنوان یک پکیج فروخته می‌شود، این گزینه را فعال کنید.
            </p>
          </div>
          <label className="flex items-center gap-2.5 rounded-xl border border-soil-900/10 bg-dust-50 px-4 py-2.5 text-xs font-bold text-soil-900 cursor-pointer transition hover:bg-dust-100">
            <input
              type="checkbox"
              checked={isBundleActive}
              onChange={(e) => handleToggleBundle(e.target.checked)}
              className="accent-flora-700 size-4"
            />
            این محصول یک بسته (Bundle) است
          </label>
        </div>

        {isBundleActive && (
          <div className="space-y-5">
            <div className="max-w-xs">
              <label className="block">
                <span className={labelCls}>تعداد اقلام در بسته</span>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    readOnly
                    value={(form.bundleItems ?? []).length}
                    className="w-full rounded-xl border border-soil-900/10 bg-dust-100/70 px-3 py-2.5 text-sm font-bold text-soil-900 cursor-not-allowed outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] text-soil-700/60 select-none">
                    محاسبه خودکار بر اساس اقلام
                  </span>
                </div>
              </label>
            </div>

            {(form.bundleItems ?? []).length < 2 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
                <span>⚠️ توجه: برای اینکه این محصول یک بسته معتبر باشد، باید حداقل ۲ آیتم به لیست زیر اضافه کنید.</span>
              </div>
            )}

            {/* Live Summary Box */}
            {(() => {
              const bundleItems = form.bundleItems ?? [];
              const totalValue = bundleItems.reduce(
                (acc, it) => acc + (it.price ?? it.priceToman ?? 0),
                0,
              );
              const finalPrice = form.basePriceToman || 0;
              const discount = totalValue - finalPrice;
              const discountPercent =
                totalValue > 0 && discount > 0 ? Math.round((discount / totalValue) * 100) : 0;
              const isOverpriced = totalValue > 0 && finalPrice > totalValue;

              return (
                <div className="rounded-2xl border border-soil-900/10 bg-dust-50/80 p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white p-3.5 border border-soil-900/5 shadow-xs">
                      <span className="text-soil-700/70 block text-xs mb-1">مجموع ارزش اقلام:</span>
                      <strong className="text-sm sm:text-base font-black text-soil-900">
                        {formatToman(totalValue)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-soil-900/5 shadow-xs">
                      <span className="text-soil-700/70 block text-xs mb-1">قیمت فروش نهایی:</span>
                      <strong className="text-sm sm:text-base font-black text-flora-900">
                        {formatToman(finalPrice)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-soil-900/5 shadow-xs">
                      <span className="text-soil-700/70 block text-xs mb-1">تخفیف پکیج:</span>
                      <strong
                        className={`text-sm sm:text-base font-black ${
                          discount >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatToman(Math.max(0, discount))}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-soil-900/5 shadow-xs">
                      <span className="text-soil-700/70 block text-xs mb-1">درصد تخفیف:</span>
                      <strong className="text-sm sm:text-base font-black text-emerald-700">
                        {toFa(discountPercent)}٪
                      </strong>
                    </div>
                  </div>

                  {isOverpriced && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-100/90 px-4 py-2.5 text-xs font-bold text-red-800 border border-red-200">
                      <span>⚠️</span>
                      <span>قیمت فروش پکیج نمی‌تواند بیشتر از مجموع ارزش اقلام باشد.</span>
                    </div>
                  )}

                  {form.tiers.some((t) => t.minQuantity > 1 && t.unitPriceToman > form.basePriceToman) && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-100/90 px-4 py-2.5 text-xs font-bold text-red-800 border border-red-200">
                      <span>⚠️</span>
                      <span>خطا: قیمت پله‌های بعدی باید کمتر از قیمت پایه باشد.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Repeater Header */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h3 className="text-xs font-bold text-soil-900">
                  محتویات بسته ({toFa((form.bundleItems ?? []).length)} آیتم)
                </h3>
                <p className="mt-0.5 text-[11px] text-soil-700/60">
                  مشخصات هر گلدان یا آیتم موجود در این پکیج را وارد کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBundleItem}
                className="rounded-xl bg-flora-900 px-4 py-2 text-xs font-black text-white transition hover:bg-flora-700"
              >
                + افزودن آیتم
              </button>
            </div>
            <FormError message={fieldErrors.bundleItems} />

            {/* Repeater List */}
            <div className="space-y-4">
              {(form.bundleItems ?? []).map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-soil-900/10 bg-dust-50/70 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-soil-900">آیتم شماره {toFa(idx + 1)}</span>
                      {catalogProducts.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-soil-700/70">تکمیل از محصولات:</label>
                          <select
                            value={item.productId ?? ''}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const prod = catalogProducts.find((p) => p.id === selectedId);
                              const next = [...(form.bundleItems ?? [])];
                              if (prod) {
                                next[idx] = {
                                  ...next[idx],
                                  productId: prod.id,
                                  title: prod.name,
                                  material: prod.material,
                                  diameterCm: prod.diameterCm,
                                  heightCm: prod.heightCm,
                                  weightGrams: prod.weightGrams,
                                  price: prod.basePriceToman,
                                  priceToman: prod.basePriceToman,
                                };
                              } else {
                                next[idx] = {
                                  ...next[idx],
                                  productId: undefined,
                                };
                              }
                              update('bundleItems', next);
                            }}
                            className="rounded-lg border border-soil-900/15 bg-white px-2 py-1 text-xs text-soil-900 outline-none focus:border-flora-500"
                          >
                            <option value="">-- انتخاب گلدان از فروشگاه --</option>
                            {catalogProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({formatToman(p.basePriceToman)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBundleItem(idx)}
                      className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                    >
                      حذف آیتم
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-medium text-soil-700/80">نام آیتم / گلدان *</span>
                      <input
                        type="text"
                        placeholder="مثلاً گلدان استوانه‌ای سایز ۱"
                        value={item.title}
                        onChange={(e) => {
                          const next = [...(form.bundleItems ?? [])];
                          next[idx] = { ...next[idx], title: e.target.value };
                          update('bundleItems', next);
                        }}
                        className="mt-1 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-xs font-medium text-soil-700/80">توضیحات کوتاه آیتم</span>
                      <input
                        type="text"
                        placeholder="مثلاً لعاب براق دست‌ساز"
                        value={item.description ?? ''}
                        onChange={(e) => {
                          const next = [...(form.bundleItems ?? [])];
                          next[idx] = { ...next[idx], description: e.target.value };
                          update('bundleItems', next);
                        }}
                        className="mt-1 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-xs font-medium text-soil-700/80">قیمت تک‌فروشی این آیتم (تومان)</span>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        placeholder="مثلاً ۱۲۰۰۰۰"
                        value={item.price || item.priceToman || ''}
                        onChange={(e) => {
                          const next = [...(form.bundleItems ?? [])];
                          const p = Math.max(0, Math.floor(Number(e.target.value) || 0));
                          next[idx] = {
                            ...next[idx],
                            price: p,
                            priceToman: p,
                          };
                          update('bundleItems', next);
                        }}
                        className="mt-1 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-soil-700/80">متریال</span>
                      <input
                        type="text"
                        placeholder="مثلاً سفال"
                        value={item.material ?? ''}
                        onChange={(e) => {
                          const next = [...(form.bundleItems ?? [])];
                          next[idx] = { ...next[idx], material: e.target.value };
                          update('bundleItems', next);
                        }}
                        className="mt-1 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-soil-700/80">قطر (cm)</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="قطر"
                        value={item.diameterCm || ''}
                        onChange={(e) => {
                          const next = [...(form.bundleItems ?? [])];
                          next[idx] = {
                            ...next[idx],
                            diameterCm: Math.max(0, Number(e.target.value) || 0),
                          };
                          update('bundleItems', next);
                        }}
                        className="mt-1 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-soil-700/80">ارتفاع (cm)</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="ارتفاع"
                        value={item.heightCm || ''}
                        onChange={(e) => {
                          const next = [...(form.bundleItems ?? [])];
                          next[idx] = {
                            ...next[idx],
                            heightCm: Math.max(0, Number(e.target.value) || 0),
                          };
                          update('bundleItems', next);
                        }}
                        className="mt-1 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-soil-700/80">وزن (گرم)</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="وزن"
                        value={item.weightGrams || ''}
                        onChange={(e) => {
                          const next = [...(form.bundleItems ?? [])];
                          next[idx] = {
                            ...next[idx],
                            weightGrams: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          };
                          update('bundleItems', next);
                        }}
                        className="mt-1 w-full rounded-xl border border-soil-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                      />
                    </label>
                  </div>
                </div>
              ))}

              {(form.bundleItems ?? []).length === 0 && (
                <p className="text-xs text-soil-700/50">
                  هنوز آیتمی به محتویات بسته اضافه نشده است. برای تعریف اقلام دکمه «+ افزودن آیتم» را بزنید.
                </p>
              )}
            </div>
          </div>
        )}
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
        <FormError message={fieldErrors.images} />

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

      <section className="rounded-2xl border border-soil-900/10 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-soil-900/10 pb-4">
          <div>
            <h2 className="text-sm font-black text-soil-900">
              قیمت‌گذاری محصول
            </h2>
            <p className="mt-1 text-xs text-soil-700/60">
              تعیین قیمت پایه و در صورت نیاز، فعال‌سازی تخفیف‌های پله‌ای برای خریدهای تعداد بالا
            </p>
          </div>
          <label className="flex items-center gap-2.5 rounded-xl border border-soil-900/10 bg-dust-50 px-4 py-2 text-xs font-bold text-soil-900 cursor-pointer transition hover:bg-dust-100">
            <input
              type="checkbox"
              checked={form.allowBatchDiscount ?? true}
              onChange={(e) => update('allowBatchDiscount', e.target.checked)}
              className="accent-flora-700 size-4"
            />
            فعالسازی تخفیف پلهای (عمده)
          </label>
        </div>

        <label className="block max-w-sm">
          <span className={labelCls}>
            {isBundleActive ? 'قیمت فروش نهایی این پکیج (تومان) *' : 'قیمت هر عدد (تومان) *'}
          </span>
          <input
            type="number"
            value={form.basePriceToman}
            onChange={(e) => update('basePriceToman', Number(e.target.value))}
            min={1000}
            className={fieldCls(fieldErrors.basePriceToman)}
          />
          {form.basePriceToman >= 1000 && (
            <span className="block mt-1.5 text-xs text-soil-700/80 font-medium">
              {formatToman(form.basePriceToman)} ({numberToWordsFa(form.basePriceToman)} تومان)
            </span>
          )}
          <FormError message={fieldErrors.basePriceToman} />
        </label>

        {(form.allowBatchDiscount ?? true) && (
          <div className="pt-2">
            <div className="mb-3 space-y-1">
              <h3 className="text-xs font-bold text-soil-900">
                پله‌های قیمت عمده و بسته‌ای (تومان)
              </h3>
              <p className="text-[11px] text-soil-700/60">
                تعیین حداقل تعداد و قیمت واحد برای هر سطح خرید
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60 inline-block">
                💡 قیمت‌ها باید با افزایش تعداد، کاهش پیدا کنند (تخفیف عمده).
              </p>
            </div>

            {form.tiers.some((t) => t.minQuantity > 1 && t.unitPriceToman > form.basePriceToman) && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-300 bg-red-100/90 px-4 py-2.5 text-xs font-bold text-red-800">
                <span>⚠️</span>
                <span>خطا: قیمت پله‌های بعدی باید کمتر از قیمت پایه باشد.</span>
              </div>
            )}

            <div className="space-y-3">
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
                    <span className={labelCls}>
                      {isBundleActive ? 'قیمت هر بسته در این پله' : 'قیمت هر عدد'}
                    </span>
                    <input
                      type="number"
                      value={t.unitPriceToman}
                      onChange={(e) => updateTier(i, { unitPriceToman: Number(e.target.value) })}
                      className={inputCls}
                    />
                    {t.unitPriceToman >= 1000 && (
                      <span className="block mt-1 text-[11px] text-soil-700/60 font-medium">
                        ({numberToWordsFa(t.unitPriceToman)} تومان)
                      </span>
                    )}
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
            <FormError message={fieldErrors.tiers} />
          </div>
        )}
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
