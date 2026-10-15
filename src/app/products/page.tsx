import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatToman, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

export const revalidate = 300;

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      tiers: { orderBy: { minQuantity: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <Container className="py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-flora-700">CATALOG</p>
          <h1 className="mt-2 text-3xl font-black text-soil-900">گلدان‌ها و فلاورباکس‌ها</h1>
        </div>
        <p className="text-sm text-soil-700/70">{toFa(products.length)} محصول در دسترس</p>
      </header>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-soil-900/15 px-6 py-12 text-center text-sm text-soil-700/70">
          هنوز محصولی ثبت نشده است.
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const bestTier = product.tiers[0] ?? { minQuantity: 1, unitPriceToman: product.basePriceToman, label: 'خرده' };
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
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-black text-soil-900">{product.name}</h2>
                    <p className="mt-2 text-xs leading-6 text-soil-700/70">{product.material}</p>
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
    </Container>
  );
}
