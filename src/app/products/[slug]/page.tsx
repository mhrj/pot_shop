import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { toFa, formatToman } from '@/lib/format';
import { parseFeatures, parseBundleItems } from '@/lib/product-features';
import TieredPricing from '@/components/product/TieredPricing';
import ProductGallery from '@/components/product/ProductGallery';
import Container from '@/components/ui/Container';

export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

/**
 * Trims a long description down to roughly what a search result shows. The cut
 * is taken at the last space so a word is not severed in half — Persian words
 * are joined, and slicing mid-word looks like corrupted text.
 */
function excerpt(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;

  const cut = collapsed.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const body = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}…`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      shortDesc: true,
      description: true,
      images: { take: 1, orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!product) return { title: 'محصول یافت نشد' };

  // The curated one-liner wins; the full description is the fallback.
  const description =
    product.shortDesc?.trim() ||
    (product.description ? excerpt(product.description, 160) : undefined);

  return {
    // Rendered through the layout's template as "«نام» | پات استور".
    title: product.name,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: `${product.name} | پات استور`,
      description,
      type: 'website',
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
    take: 200,
  });
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;

  const [product, session] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        tiers: { orderBy: { minQuantity: 'asc' } },
        tags: { include: { tag: true } },
      },
    }),
    getSession(),
  ]);

  if (!product) notFound();

  // `include` above pulls in every scalar, so `features` needs no change to the
  // query. Only the ones the admin left switched on are shown.
  const enabledFeatures = parseFeatures(product.features).filter((f) => f.enabled);
  const bundleItems = parseBundleItems(product.bundleItems);



  const specs = [
    { k: 'متریال', v: product.material },
    { k: 'رنگ', v: product.color ?? '—' },
    { k: 'قطر دهانه', v: `${toFa(product.diameterCm)} سانتی‌متر` },
    { k: 'ارتفاع', v: `${toFa(product.heightCm)} سانتی‌متر` },
    { k: 'وزن خالی', v: `${toFa(product.weightGrams)} گرم` },
    product.bundleSize > 1
      ? {
          k: 'تعداد در هر بسته',
          v: `${toFa(product.bundleSize)} عدد${product.bundleLabel ? ` (${product.bundleLabel})` : ''}`,
        }
      : { k: 'واحد فروش', v: 'تک عددی' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc ?? undefined,
    image: product.images.map((i) => i.url),
    material: product.material,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IRR',
      lowPrice: (product.tiers.at(-1)?.unitPriceToman ?? product.basePriceToman) * 10,
      highPrice: product.basePriceToman * 10,
      offerCount: product.tiers.length || 1,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <Container className="py-10 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="مسیر" className="mb-8 text-xs text-soil-700/60">
        خانه / گلدان‌ها / <span className="text-soil-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ProductGallery
            images={product.images.map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
            }))}
            productName={product.name}
            soldOut={product.stock <= 0}
          />
        </div>

        <div className="lg:col-span-6">
          <h1 className="text-3xl font-black text-soil-900 sm:text-4xl">{product.name}</h1>
          {product.shortDesc && (
            <p className="mt-4 leading-8 text-soil-700/85">{product.shortDesc}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-dust-100 px-3 py-1 text-xs font-bold text-soil-700">
              {product.material}
            </span>
            {product.bundleSize > 1 && (
              <span className="rounded-full bg-flora-900 px-3 py-1 text-xs font-bold text-white">
                {product.bundleLabel || `بسته ${toFa(product.bundleSize)} عددی`}
              </span>
            )}
            {product.tags.map((entry) => (
              <Link
                key={entry.tag.id}
                href={`/products?tag=${encodeURIComponent(entry.tag.slug)}`}
                className="rounded-full bg-flora-100 px-3 py-1 text-xs font-bold text-flora-700 transition hover:bg-flora-200"
              >
                {entry.tag.name}
              </Link>
            ))}
            <span className="rounded-full bg-dust-100 px-3 py-1 text-xs font-bold text-soil-700">
              موجودی: {toFa(product.stock)} عدد
            </span>
          </div>

          <div className="mt-8">
            <TieredPricing
              product={{
                id: product.id,
                name: product.name,
                basePriceToman: product.basePriceToman,
                weightGrams: product.weightGrams,
                unitsPerCarton: product.unitsPerCarton,
                stock: product.stock,
                bundleSize: product.bundleSize,
                bundleLabel: product.bundleLabel,
                minOrderQuantity: product.minOrderQuantity,
                allowBatchDiscount: product.allowBatchDiscount,
              }}
              tiers={product.tiers.map((t) => ({
                minQuantity: t.minQuantity,
                unitPriceToman: t.unitPriceToman,
                label: t.label,
              }))}
              isAuthed={Boolean(session)}
            />

            {bundleItems.length > 0 && (() => {
              const bundleSize = product.bundleSize || 1;
              const sumOfItemPrices = bundleItems.reduce(
                (acc, it) => acc + (it.priceToman ?? it.price ?? 0),
                0,
              );
              const packagePrice = product.basePriceToman * bundleSize;
              const bundleSavings = sumOfItemPrices - packagePrice;

              return (
                <details className="group mt-6 rounded-2xl border border-soil-900/10 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-black text-soil-900 [&::-webkit-details-marker]:hidden">
                    <span>مشاهده محتویات این بسته ({toFa(bundleItems.length)} آیتم)</span>
                    <span className="transition-transform group-open:rotate-180 text-soil-700/60">▼</span>
                  </summary>
                  <div className="border-t border-soil-900/10 p-4">
                    <div className="space-y-2">
                      {bundleItems.map((item, i) => {
                        const itemPrice = item.priceToman ?? item.price;
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-soil-900/10 bg-dust-50/60 p-3.5 transition-colors hover:bg-dust-50"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-soil-900">{item.title}</p>
                              {itemPrice && itemPrice > 0 ? (
                                <span className="text-xs font-bold text-flora-800 shrink-0">
                                  {formatToman(itemPrice)}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-soil-700/70">
                              {item.material && (
                                <span>
                                  جنس: <strong className="text-soil-900">{item.material}</strong>
                                </span>
                              )}
                              {item.diameterCm > 0 && (
                                <span>
                                  قطر: <strong className="text-soil-900">{toFa(item.diameterCm)} سانتی‌متر</strong>
                                </span>
                              )}
                              {item.heightCm > 0 && (
                                <span>
                                  ارتفاع: <strong className="text-soil-900">{toFa(item.heightCm)} سانتی‌متر</strong>
                                </span>
                              )}
                              {item.weightGrams > 0 && (
                                <span>
                                  وزن: <strong className="text-soil-900">{toFa(item.weightGrams)} گرم</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Box */}
                    <div className="mt-4 rounded-xl border border-soil-900/10 bg-dust-100/70 p-4 space-y-2 text-xs">
                      {sumOfItemPrices > 0 && (
                        <div className="flex items-center justify-between text-soil-700/80">
                          <span>مجموع ارزش اقلام:</span>
                          <span className="font-bold text-soil-900">{formatToman(sumOfItemPrices)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-soil-900">
                        <span>قیمت این پکیج:</span>
                        <span className="text-sm font-black text-flora-900">
                          {formatToman(packagePrice)}
                        </span>
                      </div>
                      {bundleSavings > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-flora-100/90 p-2.5 font-bold text-flora-900">
                          <span className="flex items-center gap-1.5">
                            <span>🌱</span>
                            <span>صرفه‌جویی شما:</span>
                          </span>
                          <span>{formatToman(bundleSavings)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              );
            })()}
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-black text-soil-900">مشخصات فنی</h2>
            <dl className="mt-4 divide-y divide-soil-900/5 overflow-hidden rounded-2xl border border-soil-900/10">
              {specs.map((s) => (
                <div key={s.k} className="flex justify-between gap-4 px-5 py-3.5 text-sm">
                  <dt className="text-soil-700/70">{s.k}</dt>
                  <dd className="font-bold text-soil-900">{s.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {enabledFeatures.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-black text-soil-900">ویژگی‌ها</h2>
              <ul className="mt-4 space-y-2">
                {enabledFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-flora-500" />
                    <span className="text-soil-700/85">{f.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-lg font-black text-soil-900">درباره این گلدان</h2>
            <div className="mt-4 text-sm leading-8 whitespace-pre-line text-soil-700/85">
              {product.description}
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}
