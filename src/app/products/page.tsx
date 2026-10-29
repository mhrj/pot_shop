import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatToman, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';
import ProductCard from '@/components/catalog/ProductCard';
import TagFilterSelect from '@/components/catalog/TagFilterSelect';
import BotanicalCanvas from '@/components/landing/BotanicalCanvas';

// 12 items per page for balanced 2, 3, 4 column grids across screen sizes.
const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: 'فروشگاه گلدان و فلاورباکس',
  description:
    'خرید گلدان و فلاورباکس سفالی، سرامیکی و بتنی — خرده و عمده. جست‌وجو بر اساس دسته‌بندی، مرتب‌سازی بر اساس قیمت و مشاهده قیمت پله‌ای هر محصول.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'فروشگاه گلدان و محصولات گیاهان | پات استور',
    description:
      'خرید گلدان سفالی، سرامیکی، خاک و ابزار گیاهان — خرده و عمده با ارسال به سراسر ایران.',
    type: 'website',
  },
};

const SORTS = {
  newest: { label: 'جدیدترین', orderBy: { createdAt: 'desc' } },
  'price-asc': { label: 'ارزان‌ترین', orderBy: { basePriceToman: 'asc' } },
  'price-desc': { label: 'گران‌ترین', orderBy: { basePriceToman: 'desc' } },
} satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput }>;

type SortKey = keyof typeof SORTS;

function parseSort(value: string | undefined): SortKey {
  return value && value in SORTS ? (value as SortKey) : 'newest';
}

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Which page numbers to render.
 *
 * Up to seven pages are all shown; beyond that a wall of numbers is useless, so
 * the first page, the last page and a five-wide window around the current page
 * are kept, with `'gap'` marking where pages were skipped.
 */
function pageWindow(current: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);

  const keep = new Set<number>([1, count, current]);
  for (let offset = -2; offset <= 2; offset += 1) {
    const candidate = current + offset;
    if (candidate > 1 && candidate < count) keep.add(candidate);
  }

  const ordered = [...keep].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  let previous = 0;
  for (const page of ordered) {
    if (previous && page - previous > 1) out.push('gap');
    out.push(page);
    previous = page;
  }
  return out;
}

type Props = {
  searchParams: Promise<{ q?: string; tag?: string; category?: string; sort?: string; page?: string }>;
};

/**
 * Catalog listing.
 *
 * Every filter lives in the URL so a filtered view is shareable and the back
 * button behaves; the unfiltered first page is still what ISR caches.
 */
export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
  const tagSlug = (sp.tag ?? '').trim();
  const categorySlug = (sp.category ?? '').trim();
  const sort = parseSort(sp.sort);
  const page = parsePage(sp.page);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { shortDesc: { contains: q, mode: 'insensitive' } },
            { material: { contains: q, mode: 'insensitive' } },
            { color: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };

  const [total, products, tags, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        tiers: { orderBy: { minQuantity: 'asc' } },
        tags: { include: { tag: true } },
        category: true,
      },
      orderBy: SORTS[sort].orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tag.findMany({ orderBy: { name: 'asc' }, select: { name: true, slug: true } }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Preserve the active filters when building links.
  const buildHref = (next: Partial<{ q: string; tag: string; category: string; sort: SortKey; page: number }>) => {
    const params = new URLSearchParams();
    const merged = { q, tag: tagSlug, category: categorySlug, sort, page, ...next };
    if (merged.q) params.set('q', merged.q);
    if (merged.tag) params.set('tag', merged.tag);
    if (merged.category) params.set('category', merged.category);
    if (merged.sort !== 'newest') params.set('sort', merged.sort);
    if (merged.page > 1) params.set('page', String(merged.page));
    const qs = params.toString();
    return qs ? `/products?${qs}` : '/products';
  };

  // A page outside the range is a stale link or a filter change that shrank the
  // result set. Bouncing to the first page keeps the filters and avoids showing
  // an empty grid on a page whose own heading says products exist. This is
  // checked against the *raw* parameter: `parsePage` has already clamped it, so
  // `?page=0` would otherwise pass unnoticed as page 1.
  const requestedPage = Number.parseInt(sp.page ?? '', 10);
  const pageOutOfRange =
    sp.page !== undefined &&
    (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > pageCount);

  if (pageOutOfRange) redirect(buildHref({ page: 1 }));

  const filtered = Boolean(q || tagSlug || categorySlug || sort !== 'newest');
  const activeTag = tags.find((t) => t.slug === tagSlug);
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const firstShown = (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F2F7F4]/90 via-[#E2F0E6]/85 to-flora-100/90 dark:from-flora-950/90 dark:via-flora-950/85 dark:to-flora-900/90">
      <BotanicalCanvas active={true} variant="flora" />
      <Container className="relative z-10 py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* Was the English word "CATALOG". The wide letter-spacing went with
                it: tracking inserts gaps inside a connected Perso-Arabic word and
                makes it read as broken type. */}
            <p className="text-xs font-bold text-flora-700 dark:text-flora-300">کاتالوگ</p>
            <h1 className="mt-2 text-3xl font-black text-soil-900 dark:text-dust-50">گلدان‌ها و فلاورباکس‌ها</h1>
          </div>
          <p className="text-sm text-soil-700/70 dark:text-dust-200/70">{toFa(total)} محصول در دسترس</p>
        </header>

        {/* Categories and Tags Pill Filters */}
        <div className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-soil-700/80 dark:text-dust-200/80">دسته‌بندی:</span>
            <Link
              href={buildHref({ category: '', page: 1 })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                !categorySlug
                  ? 'bg-flora-900 text-white shadow-sm dark:bg-flora-700'
                  : 'border border-soil-900/10 bg-white text-soil-700 hover:bg-dust-100 dark:border-dust-50/10 dark:bg-flora-900 dark:text-dust-200 dark:hover:bg-flora-950'
              }`}
            >
              همه
            </Link>
            {categories.map((c) => {
              const active = categorySlug === c.slug;
              return (
                <Link
                  key={c.slug}
                  href={buildHref({ category: active ? '' : c.slug, page: 1 })}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-flora-900 text-white shadow-sm dark:bg-flora-700'
                      : 'border border-soil-900/10 bg-white text-soil-700 hover:bg-dust-100 dark:border-dust-50/10 dark:bg-flora-900 dark:text-dust-200 dark:hover:bg-flora-950'
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-soil-700/80 dark:text-dust-200/80">برچسب‌ها:</span>
              <Link
                href={buildHref({ tag: '', page: 1 })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  !tagSlug
                    ? 'bg-flora-900 text-white shadow-sm dark:bg-flora-700'
                    : 'border border-soil-900/10 bg-white text-soil-700 hover:bg-dust-100 dark:border-dust-50/10 dark:bg-flora-900 dark:text-dust-200 dark:hover:bg-flora-950'
                }`}
              >
                همه
              </Link>
              {tags.map((t) => {
                const active = tagSlug === t.slug;
                return (
                  <Link
                    key={t.slug}
                    href={buildHref({ tag: active ? '' : t.slug, page: 1 })}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'bg-flora-900 text-white shadow-sm dark:bg-flora-700'
                        : 'border border-soil-900/10 bg-white text-soil-700 hover:bg-dust-100 dark:border-dust-50/10 dark:bg-flora-900 dark:text-dust-200 dark:hover:bg-flora-950'
                    }`}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <search className="mt-6 block">
          {/* Filters and sort are two separate groups. On narrow screens they
              stack into two rows divided by a rule; from `lg` they share one row,
              with the sort cluster pushed to the far side and marked off by a
              start-side divider so it reads as its own control instead of a
              stray field crowded against the filters. `ms-auto` is a logical
              property, so in this RTL layout "start" is the right edge and the
              cluster lands on the left. */}
          <form
            method="get"
            action="/products"
            className="flex flex-col gap-4 lg:flex-row lg:items-end"
          >
            {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
            <div className="flex flex-wrap items-end gap-4">
              <label className="min-w-56 flex-1 text-xs font-bold text-soil-700/80 dark:text-dust-200/80">
                جست‌وجو
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="نام، جنس یا رنگ محصول…"
                  className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50 dark:placeholder:text-dust-400 focus:dark:border-flora-500"
                />
              </label>

              <label className="text-xs font-bold text-soil-700/80 dark:text-dust-200/80">
                برچسب
                <TagFilterSelect tags={tags} tagSlug={tagSlug} />
              </label>

              <button
                type="submit"
                className="rounded-xl bg-flora-900 text-white dark:bg-flora-500 dark:text-flora-950 dark:hover:bg-flora-700 transition-colors px-6 py-2.5 text-xs font-black hover:bg-flora-700 cursor-pointer shadow-sm"
              >
                اعمال
              </button>

              {filtered && (
                <Link
                  href="/products"
                  className="rounded-xl border border-soil-900/15 bg-white px-5 py-2.5 text-xs font-bold text-soil-900 transition-colors hover:bg-dust-100 dark:border-dust-50/20 dark:bg-flora-900 dark:text-dust-50 dark:hover:bg-flora-950"
                >
                  حذف فیلترها
                </Link>
              )}
            </div>

            <div className="flex items-end border-t border-soil-900/10 pt-4 lg:ms-auto lg:border-s lg:border-t-0 lg:border-soil-900/10 lg:ps-4 lg:pt-0 dark:border-dust-50/10 dark:lg:border-dust-50/10">
              <label className="text-xs font-bold text-soil-700/80 dark:text-dust-200/80">
                ترتیب
                <select
                  name="sort"
                  defaultValue={sort}
                  className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500 dark:border-dust-50/20 dark:bg-flora-950 dark:text-dust-50"
                >
                  {(Object.keys(SORTS) as SortKey[]).map((key) => (
                    <option key={key} value={key}>
                      {SORTS[key].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </form>
        </search>

        {products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-soil-900/15 bg-white/60 px-6 py-12 text-center text-sm text-soil-700/70 dark:border-dust-50/20 dark:bg-flora-900/60 dark:text-dust-200/70">
            {filtered ? (
              <>
                محصولی با این فیلترها پیدا نشد
                {q ? ` برای «${q}»` : ''}
                {activeCategory ? ` در دسته «${activeCategory.name}»` : ''}
                {activeTag ? ` با برچسب «${activeTag.name}»` : ''}.
                <div className="mt-4">
                  <Link href="/products" className="font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-300">
                    نمایش همه محصولات
                  </Link>
                </div>
              </>
            ) : (
              'هنوز محصولی ثبت نشده است.'
            )}
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}

        {total > 0 && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-xs font-bold text-soil-700/70 dark:text-dust-200/70">
              نمایش {toFa(firstShown)} تا {toFa(lastShown)} از {toFa(total)} محصول
            </p>

            {pageCount > 1 && (
              <nav aria-label="صفحه‌بندی" className="flex flex-wrap items-center justify-center gap-2">
                {/* Boundaries render an inert span rather than a link: a link that
                    only bounces back off the same page is worse than a control the
                    user can see is unavailable. */}
                {page > 1 ? (
                  <Link
                    href={buildHref({ page: page - 1 })}
                    rel="prev"
                    className="rounded-full border border-soil-900/15 bg-white px-5 py-2.5 text-xs font-bold text-soil-900 transition-colors hover:bg-dust-100 dark:border-dust-50/20 dark:bg-flora-900 dark:text-dust-50 dark:hover:bg-flora-950"
                  >
                    قبلی
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="rounded-full border border-soil-900/10 px-5 py-2.5 text-xs font-bold text-soil-700/35 dark:border-dust-50/10 dark:text-dust-200/35"
                  >
                    قبلی
                  </span>
                )}

                {pageWindow(page, pageCount).map((entry, index) =>
                  entry === 'gap' ? (
                    <span key={`gap-${index}`} className="px-1 text-xs text-soil-700/50 dark:text-dust-200/50">
                      …
                    </span>
                  ) : entry === page ? (
                    <span
                      key={entry}
                      aria-current="page"
                      className="min-w-10 rounded-full bg-flora-900 px-3 py-2.5 text-center text-xs font-black text-white dark:bg-flora-700"
                    >
                      {toFa(entry)}
                    </span>
                  ) : (
                    <Link
                      key={entry}
                      href={buildHref({ page: entry })}
                      className="min-w-10 rounded-full border border-soil-900/15 bg-white px-3 py-2.5 text-center text-xs font-bold text-soil-900 transition-colors hover:bg-dust-100 dark:border-dust-50/20 dark:bg-flora-900 dark:text-dust-50 dark:hover:bg-flora-950"
                    >
                      {toFa(entry)}
                    </Link>
                  ),
                )}

                {page < pageCount ? (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    rel="next"
                    className="rounded-full border border-soil-900/15 bg-white px-5 py-2.5 text-xs font-bold text-soil-900 transition-colors hover:bg-dust-100 dark:border-dust-50/20 dark:bg-flora-900 dark:text-dust-50 dark:hover:bg-flora-950"
                  >
                    بعدی
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="rounded-full border border-soil-900/10 px-5 py-2.5 text-xs font-bold text-soil-700/35 dark:border-dust-50/10 dark:text-dust-200/35"
                  >
                    بعدی
                  </span>
                )}
              </nav>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
