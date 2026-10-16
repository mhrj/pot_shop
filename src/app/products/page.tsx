import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatToman, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

// A 3x3 grid on desktop.
const PAGE_SIZE = 9;

export const metadata: Metadata = {
  title: 'فروشگاه گلدان و فلاورباکس',
  description:
    'خرید گلدان و فلاورباکس سفالی، سرامیکی و بتنی — خرده و عمده. جست‌وجو بر اساس دسته‌بندی، مرتب‌سازی بر اساس قیمت و مشاهده قیمت پله‌ای هر محصول.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'فروشگاه گلدان و فلاورباکس | پات شاپ',
    description:
      'خرید گلدان و فلاورباکس سفالی، سرامیکی و بتنی — خرده و عمده با ارسال به سراسر ایران.',
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
  searchParams: Promise<{ q?: string; tag?: string; sort?: string; page?: string }>;
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
  };

  const [total, products, tags] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        tiers: { orderBy: { minQuantity: 'asc' } },
        tags: { include: { tag: true } },
      },
      orderBy: SORTS[sort].orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tag.findMany({ orderBy: { name: 'asc' }, select: { name: true, slug: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Preserve the active filters when building links.
  const buildHref = (next: Partial<{ q: string; tag: string; sort: SortKey; page: number }>) => {
    const params = new URLSearchParams();
    const merged = { q, tag: tagSlug, sort, page, ...next };
    if (merged.q) params.set('q', merged.q);
    if (merged.tag) params.set('tag', merged.tag);
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

  const filtered = Boolean(q || tagSlug || sort !== 'newest');
  const activeTag = tags.find((t) => t.slug === tagSlug);
  const firstShown = (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);

  return (
    // Pure CSS, no motion library: the page gets greener as it goes down, which
    // is the same "dust to flora" idea the landing page animates.
    <div className="min-h-screen bg-gradient-to-b from-dust-50 via-dust-100 to-flora-100">
      <Container className="py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* Was the English word "CATALOG". The wide letter-spacing went with
                it: tracking inserts gaps inside a connected Perso-Arabic word and
                makes it read as broken type. */}
            <p className="text-xs font-bold text-flora-700">کاتالوگ</p>
            <h1 className="mt-2 text-3xl font-black text-soil-900">گلدان‌ها و فلاورباکس‌ها</h1>
          </div>
          <p className="text-sm text-soil-700/70">{toFa(total)} محصول در دسترس</p>
        </header>

        <search className="mt-8 block">
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
            <div className="flex flex-wrap items-end gap-4">
              <label className="min-w-[14rem] flex-1 text-xs font-bold text-soil-700/80">
                جست‌وجو
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="نام، جنس یا رنگ محصول…"
                  className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20"
                />
              </label>

              <label className="text-xs font-bold text-soil-700/80">
                دسته‌بندی
                <select
                  name="tag"
                  defaultValue={tagSlug}
                  className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
                >
                  <option value="">همه</option>
                  {tags.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-flora-900 px-6 py-2.5 text-xs font-black text-white transition hover:bg-flora-700"
              >
                اعمال
              </button>

              {filtered && (
                <Link
                  href="/products"
                  className="rounded-xl border border-soil-900/15 px-5 py-2.5 text-xs font-bold text-soil-900 transition hover:bg-dust-100"
                >
                  حذف فیلترها
                </Link>
              )}
            </div>

            <div className="flex items-end border-t border-soil-900/10 pt-4 lg:ms-auto lg:border-s lg:border-t-0 lg:ps-4 lg:pt-0">
              <label className="text-xs font-bold text-soil-700/80">
                ترتیب
                <select
                  name="sort"
                  defaultValue={sort}
                  className="mt-2 w-full rounded-xl border border-soil-900/15 bg-white px-4 py-2.5 text-sm text-soil-900 outline-none transition focus:border-flora-500"
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
          <div className="mt-8 rounded-2xl border border-dashed border-soil-900/15 bg-white/60 px-6 py-12 text-center text-sm text-soil-700/70">
            {filtered ? (
              <>
                محصولی با این فیلترها پیدا نشد
                {q ? ` برای «${q}»` : ''}
                {activeTag ? ` در دسته «${activeTag.name}»` : ''}.
                <div className="mt-4">
                  <Link href="/products" className="font-bold text-flora-700 hover:text-flora-900">
                    نمایش همه محصولات
                  </Link>
                </div>
              </>
            ) : (
              'هنوز محصولی ثبت نشده است.'
            )}
          </div>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const bestTier = product.tiers[0] ?? { minQuantity: 1, unitPriceToman: product.basePriceToman, label: 'خرده' };
              const soldOut = product.stock <= 0;
              return (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="group block overflow-hidden rounded-pot bg-white shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] transition hover:-translate-y-1"
                  >
                    <div className="relative aspect-square overflow-hidden bg-dust-100">
                      {product.images[0] && (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                      {soldOut && (
                        <span className="absolute top-3 start-3 rounded-full bg-soil-900/85 px-3 py-1 text-[10px] font-bold text-white">
                          ناموجود
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="text-lg font-black text-soil-900">{product.name}</h2>
                      <p className="mt-2 text-xs leading-6 text-soil-700/70">{product.material}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {product.tags.slice(0, 2).map((entry) => (
                          <span key={entry.tag.id} className="rounded-full bg-dust-100 px-2 py-1 text-[10px] font-bold text-soil-700">
                            {entry.tag.name}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-xl font-black text-flora-900">
                            {formatToman(bestTier.unitPriceToman)}
                          </div>
                          <div className="text-[11px] text-soil-700/60">از {toFa(bestTier.minQuantity)} عدد</div>
                        </div>
                        <span className="rounded-full bg-dust-100 px-3 py-1 text-[10px] font-bold text-soil-700">
                          {bestTier.label ?? 'خرده'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {total > 0 && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-xs font-bold text-soil-700/70">
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
                    className="rounded-full border border-soil-900/15 bg-white px-5 py-2.5 text-xs font-bold text-soil-900 transition hover:bg-dust-100"
                  >
                    قبلی
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="rounded-full border border-soil-900/10 px-5 py-2.5 text-xs font-bold text-soil-700/35"
                  >
                    قبلی
                  </span>
                )}

                {pageWindow(page, pageCount).map((entry, index) =>
                  entry === 'gap' ? (
                    <span key={`gap-${index}`} className="px-1 text-xs text-soil-700/50">
                      …
                    </span>
                  ) : entry === page ? (
                    <span
                      key={entry}
                      aria-current="page"
                      className="min-w-10 rounded-full bg-flora-900 px-3 py-2.5 text-center text-xs font-black text-white"
                    >
                      {toFa(entry)}
                    </span>
                  ) : (
                    <Link
                      key={entry}
                      href={buildHref({ page: entry })}
                      className="min-w-10 rounded-full border border-soil-900/15 bg-white px-3 py-2.5 text-center text-xs font-bold text-soil-900 transition hover:bg-dust-100"
                    >
                      {toFa(entry)}
                    </Link>
                  ),
                )}

                {page < pageCount ? (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    rel="next"
                    className="rounded-full border border-soil-900/15 bg-white px-5 py-2.5 text-xs font-bold text-soil-900 transition hover:bg-dust-100"
                  >
                    بعدی
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="rounded-full border border-soil-900/10 px-5 py-2.5 text-xs font-bold text-soil-700/35"
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
