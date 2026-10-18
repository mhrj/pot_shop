import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatToman, toFa } from '@/lib/format';
import { resolveTier } from '@/lib/pricing';
import { getContentMap } from '@/lib/content';
import DustToFlora from '@/components/landing/DustToFlora';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';

export const revalidate = 300; // ISR: 5 minutes

// The home page previously inherited the layout's default title, leaving its
// Open Graph card with no title or description of its own. `absolute` keeps the
// brand line intact rather than running it through the layout's "%s | پات شاپ"
// template, which would print the shop name twice.
export const metadata: Metadata = {
  title: {
    absolute: 'پات شاپ | گلدان و فلاورباکس سفالی و سرامیکی',
  },
  description:
    'خرید گلدان و فلاورباکس سفالی، سرامیکی و بتنی — خرده و عمده. ارسال به سراسر ایران، پرداخت امن با زرین‌پال و قیمت پله‌ای روی هر محصول.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'پات شاپ | گلدان و فلاورباکس سفالی و سرامیکی',
    description:
      'خرید گلدان و فلاورباکس سفالی، سرامیکی و بتنی — خرده و عمده با ارسال به سراسر ایران.',
    type: 'website',
  },
};

async function getFeatured() {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      tiers: { orderBy: { minQuantity: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });
}

async function getLandingImages() {
  const rows = await prisma.landingImage.findMany({
    select: { key: true, url: true, alt: true },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r])) as Record<
    string,
    { key: string; url: string; alt: string | null } | undefined
  >;
}

export default async function HomePage() {
  const [products, landing, content] = await Promise.all([
    getFeatured(),
    getLandingImages(),
    getContentMap(),
  ]);
  const heroImage = landing.hero;
  const journeyImage = landing.journey;
  const ctaImage = landing.cta;

  const hero = (
    <section className="relative flex min-h-[92dvh] items-center overflow-hidden pt-24 pb-16">
      <Container className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-dust-300/70 bg-dust-100/70 px-4 py-1.5 text-xs font-medium text-soil-700 backdrop-blur">
            <span className="size-1.5 rounded-full bg-dust-400" />
            از خاک خالی، تا رویش سبز
          </span>

          <h1 className="mt-6 text-4xl leading-[1.25] font-black text-soil-900 sm:text-5xl lg:text-6xl">
            {content.home_hero_title.body}
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-soil-700/85 sm:text-lg">
            {content.home_hero_subtitle.body}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="#catalog"
              className="rounded-full bg-flora-900 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-flora-900/20 transition hover:bg-flora-700 active:scale-[0.98]"
            >
              دیدن گلدان‌ها
            </Link>
            <Link
              href="#wholesale"
              className="rounded-full border border-soil-900/15 bg-white/60 px-7 py-3.5 text-sm font-bold text-soil-900 backdrop-blur transition hover:bg-white"
            >
              خرید عمده و قیمت‌گیری
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-soil-900/10 pt-7">
            {[
              { k: '۴۲+', v: 'مدل گلدان' },
              { k: '۳۱', v: 'استان تحت پوشش' },
              { k: '۱۲٬۰۰۰+', v: 'سفارش موفق' },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-2xl font-black text-soil-900">{s.k}</dt>
                <dd className="mt-1 text-xs text-soil-700/70">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div className="relative aspect-4/5 overflow-hidden rounded-pot bg-dust-200 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
            <Image
              src={heroImage?.url ?? 'https://placehold.co/800x1000/E8D5C4/3E2723'}
              alt={heroImage?.alt ?? 'گلدان سفالی دست‌ساز با گیاه سبز'}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );

  const journey = (
    <section className="py-24">
      <Container className="max-w-3xl text-center">
        <h2 className="text-3xl font-black text-soil-900 sm:text-4xl">
          {content.about_title.body}
        </h2>
        <p className="mt-5 leading-8 text-soil-700/85">
          {content.about_body.body}
        </p>
      </Container>

      {journeyImage && (
        <Container className="mt-16">
          <div className="relative aspect-21/9 overflow-hidden rounded-pot bg-dust-200 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
            <Image
              src={journeyImage.url}
              alt={journeyImage.alt ?? 'مسیر ساخت گلدان از خاک تا رویش'}
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover"
            />
          </div>
        </Container>
      )}

      {/* Three equal cards on one baseline. The previous version pushed the
          middle card down with an inline `marginTop`, which read as a mistake
          rather than a design choice, and left the three boxes at visibly
          different heights. The grid stretches its items, so the cards match
          without any offset, and `flex-col` keeps each card's content flowing
          from the top so the headings stay aligned across the row. */}
      <Container className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            t: 'خاک',
            d: 'انتخاب متریال درست: سفال نفس‌کش، سرامیک لعاب‌دار، بتن مقاوم.',
            icon: '🏺',
            card: 'bg-dust-200',
            accent: 'border-t-dust-400',
          },
          {
            t: 'ریشه',
            d: 'زهکشی اصولی و حجم کافی خاک، ریشه را از پوسیدگی حفظ می‌کند.',
            icon: '🪴',
            card: 'bg-flora-100',
            accent: 'border-t-flora-300',
          },
          {
            t: 'رویش',
            d: 'بعد از آن، فقط تماشا کن. فضای خالی‌ات زنده شده است.',
            icon: '🌸',
            card: 'bg-flora-300/50',
            accent: 'border-t-flora-500',
          },
        ].map((s, i) => (
          <div
            key={s.t}
            className={`flex flex-col rounded-pot border-t-4 ${s.accent} ${s.card} p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-16px_rgba(62,39,35,0.32)]`}
          >
            <div className="flex items-center justify-between">
              <span
                aria-hidden
                className="grid size-12 place-items-center rounded-2xl bg-white/60 text-2xl"
              >
                {s.icon}
              </span>
              <span className="text-xs font-bold text-soil-700/60">{toFa(i + 1)}</span>
            </div>
            <h3 className="mt-5 text-xl font-black text-soil-900">{s.t}</h3>
            <p className="mt-3 text-sm leading-7 text-soil-700/80">{s.d}</p>
          </div>
        ))}
      </Container>
    </section>
  );

  const catalog = (
    <section id="catalog" className="scroll-mt-24 py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-soil-900 sm:text-4xl">پرفروش‌ترین‌ها</h2>
            <p className="mt-3 text-soil-700/80">قیمت پله‌ای — هرچه بیشتر، ارزان‌تر.</p>
          </div>
          <Link href="/products" className="text-sm font-bold text-flora-700 hover:text-flora-900">
            همه محصولات
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-pot" />
            ))}
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const wholesale =
                p.tiers.find((t) => t.minQuantity >= 20) ?? resolveTier(p.tiers, 20);
              return (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="group block overflow-hidden rounded-pot bg-white shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] transition hover:-translate-y-1"
                  >
                    <div className="relative aspect-square overflow-hidden bg-dust-100">
                      {p.images[0] && (
                        <Image
                          src={p.images[0].url}
                          alt={p.images[0].alt ?? p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                      {wholesale.minQuantity >= 20 && (
                        <span className="absolute end-3 top-3 rounded-full bg-flora-900/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                          عمده از {toFa(20)} عدد
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-soil-900">{p.name}</h3>
                      <p className="mt-2 text-xs text-soil-700/70">
                        {p.material} · قطر {toFa(p.diameterCm)} سانتی‌متر
                      </p>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-lg font-black text-flora-900">
                          {formatToman(p.basePriceToman)}
                        </span>
                        <span className="text-xs text-soil-700/60">/ هر عدد</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-dust-500">
                        از {toFa(20)} عدد: {formatToman(wholesale.unitPriceToman)} هر عدد
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );

  const trust = (
    <section id="wholesale" className="scroll-mt-24 py-24">
      <Container>
        <div className="relative overflow-hidden rounded-pot bg-flora-900 p-10 text-flora-100 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] sm:p-14">
          {ctaImage && (
            <>
              <Image
                src={ctaImage.url}
                alt=""
                aria-hidden
                fill
                sizes="100vw"
                className="object-cover opacity-25"
              />
              {/* Scrim keeps body text readable over whatever the admin uploads. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-l from-flora-950/95 via-flora-950/85 to-flora-900/70"
              />
            </>
          )}

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                {content.promo_title.body}
              </h2>
              <p className="mt-5 leading-8 text-flora-100/85">
                {content.promo_subtitle.body}
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                {[
                  'تخفیف تا ۳۰٪ روی سفارش‌های بالای ۲۰ عدد',
                  'بسته‌بندی استاندارد، ایمن و مقاوم',
                  'فاکتور رسمی و امکان تسویه اعتباری',
                  'پشتیبانی اختصاصی و پیگیری سفارش',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-flora-300" />
                    <span className="text-flora-100/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-pot bg-flora-950/60 p-6 backdrop-blur">
              <table className="w-full text-sm">
                <caption className="sr-only">ماتریس نمونه قیمت پله‌ای</caption>
                <thead>
                  <tr className="text-flora-100/60">
                    <th scope="col" className="pb-3 text-start font-medium">
                      تعداد
                    </th>
                    <th scope="col" className="pb-3 text-start font-medium">
                      قیمت هر عدد
                    </th>
                    <th scope="col" className="pb-3 text-start font-medium">
                      تخفیف
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-flora-100/10">
                  {[
                    { q: '۱ تا ۴', p: 150000, d: '—' },
                    { q: '۵ تا ۱۹', p: 127500, d: '۱۵٪' },
                    { q: '۲۰ به بالا', p: 105000, d: '۳۰٪' },
                  ].map((r) => (
                    <tr key={r.q}>
                      <td className="py-4 text-flora-100/90">{r.q}</td>
                      <td className="py-4 font-bold text-white">{formatToman(r.p)}</td>
                      <td className="py-4 text-flora-300">{r.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5 text-[11px] leading-6 text-flora-100/50">
                * قیمت‌ها نمونه است. ماتریس واقعی هر محصول در صفحه آن قابل مشاهده است.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );

  return (
    <main>
      <DustToFlora hero={hero} journey={journey} catalog={catalog} trust={trust} />
    </main>
  );
}
