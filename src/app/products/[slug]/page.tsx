import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { toFa } from '@/lib/format';
import TieredPricing from '@/components/product/TieredPricing';
import Container from '@/components/ui/Container';

export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      shortDesc: true,
      images: { take: 1, orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!product) return { title: 'محصول یافت نشد' };
  return {
    title: product.name,
    description: product.shortDesc ?? undefined,
    openGraph: { images: product.images[0]?.url ? [product.images[0].url] : [] },
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

  const specs = [
    { k: 'متریال', v: product.material },
    { k: 'رنگ', v: product.color ?? '—' },
    { k: 'قطر دهانه', v: `${toFa(product.diameterCm)} سانتی‌متر` },
    { k: 'ارتفاع', v: `${toFa(product.heightCm)} سانتی‌متر` },
    { k: 'وزن خالی', v: `${toFa(product.weightGrams)} گرم` },
    { k: 'سوراخ زهکشی', v: product.drainageHole ? 'دارد' : 'ندارد' },
    { k: 'مقاوم به سرما', v: product.frostProof ? 'بله' : 'خیر' },
    { k: 'تعداد در کارتن', v: `${toFa(product.unitsPerCarton)} عدد` },
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
          <div className="relative aspect-square overflow-hidden rounded-pot bg-dust-100 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
            {product.images[0] && (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((img) => (
                <li
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-xl bg-dust-100"
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? product.name}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
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
            {product.tags.map((entry) => (
              <span key={entry.tag.id} className="rounded-full bg-flora-100 px-3 py-1 text-xs font-bold text-flora-700">
                {entry.tag.name}
              </span>
            ))}
            {product.drainageHole && (
              <span className="rounded-full bg-flora-100 px-3 py-1 text-xs font-bold text-flora-700">
                سوراخ زهکشی
              </span>
            )}
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
              }}
              tiers={product.tiers.map((t) => ({
                minQuantity: t.minQuantity,
                unitPriceToman: t.unitPriceToman,
                label: t.label,
              }))}
              isAuthed={Boolean(session)}
            />
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
