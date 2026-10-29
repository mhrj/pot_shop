import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatToman, toFa } from '@/lib/format';
import { getContentMap } from '@/lib/content';
import DustToFlora from '@/components/landing/DustToFlora';
import TrustBar from '@/components/landing/TrustBar';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import WholesaleInquiryForm from '@/components/landing/WholesaleInquiryForm';
import HeroTitle from '@/components/landing/HeroTitle';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';
import ProductCard from '@/components/catalog/ProductCard';
import { isUnoptimizedImage } from '@/lib/image-validation';
export const dynamic = 'force-dynamic';

// The home page previously inherited the layout's default title, leaving its
// Open Graph card with no title or description of its own. `absolute` keeps the
// brand line intact rather than running it through the layout's "%s | پات استور"
// template, which would print the shop name twice.
export const metadata: Metadata = {
  title: {
    absolute: 'پات استور | گلدان، خاک و ملزومات گیاهان',
  },
  description:
    'تأمین‌کننده برتر گلدان سفالی، پلیمری، پلاستیکی، سرامیکی، بتنی، خاک تخصصی و ابزار گیاهان — خرده و عمده. ارسال به سراسر ایران با درگاه پرداخت امن.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'پات استور | گلدان، خاک و ملزومات گیاهان',
    description:
      'کیوریتور و تأمین‌کننده گلدان، خاک و ابزار نگهداری گیاهان با بهترین کارگاه‌های ایران — خرده و عمده.',
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
    take: 8,
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

async function getWholesaleHighlight() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      allowBatchDiscount: true,
      tiers: { some: {} },
    },
    select: {
      id: true,
      name: true,
      basePriceToman: true,
      tiers: {
        orderBy: { minQuantity: 'asc' },
        select: {
          minQuantity: true,
          unitPriceToman: true,
          label: true,
        },
      },
    },
  });

  let maxDiscount = 0;
  let maxDiscountMinQty = 20;
  let bestProduct: (typeof products)[number] | null = null;
  let bestProductMaxDiscount = 0;

  for (const product of products) {
    if (!product.basePriceToman || product.basePriceToman <= 0) continue;

    let productHighestDiscount = 0;
    for (const tier of product.tiers) {
      if (tier.minQuantity > 1 && tier.unitPriceToman < product.basePriceToman) {
        const discountPercent = Math.round(
          ((product.basePriceToman - tier.unitPriceToman) / product.basePriceToman) * 100,
        );
        if (discountPercent > maxDiscount) {
          maxDiscount = discountPercent;
          maxDiscountMinQty = tier.minQuantity;
        }
        if (discountPercent > productHighestDiscount) {
          productHighestDiscount = discountPercent;
        }
      }
    }

    if (productHighestDiscount > bestProductMaxDiscount && product.tiers.length > 1) {
      bestProductMaxDiscount = productHighestDiscount;
      bestProduct = product;
    }
  }

  // If no product with valid tier discounts exists in the store
  if (!bestProduct || bestProductMaxDiscount <= 0 || !bestProduct.tiers.length) {
    return {
      hasWholesaleTiers: false,
      maxDiscount: 0,
      maxDiscountMinQty: 0,
      sampleProductName: null,
      tableRows: [] as Array<{ q: string; p: number; d: string }>,
    };
  }

  const sampleBasePrice = bestProduct.basePriceToman;
  const sampleTiers = bestProduct.tiers;

  // Build dynamic table rows based on tier data of top discounted product
  const tableRows = sampleTiers.map((tier, idx) => {
    const nextTier = sampleTiers[idx + 1];
    let qtyLabel = '';
    if (!nextTier) {
      qtyLabel = `${toFa(tier.minQuantity)} به بالا`;
    } else if (nextTier.minQuantity - 1 === tier.minQuantity) {
      qtyLabel = `${toFa(tier.minQuantity)} عدد`;
    } else {
      qtyLabel = `${toFa(tier.minQuantity)} تا ${toFa(nextTier.minQuantity - 1)}`;
    }

    const discountPercent =
      sampleBasePrice > 0
        ? Math.round(((sampleBasePrice - tier.unitPriceToman) / sampleBasePrice) * 100)
        : 0;
    const discountText = discountPercent > 0 ? `${toFa(discountPercent)}٪` : '—';

    return {
      q: qtyLabel,
      p: tier.unitPriceToman,
      d: discountText,
    };
  });

  return {
    hasWholesaleTiers: true,
    maxDiscount,
    maxDiscountMinQty,
    sampleProductName: bestProduct.name,
    tableRows,
  };
}

export default async function HomePage() {
  const [products, landing, content, wholesaleHighlight] = await Promise.all([
    getFeatured(),
    getLandingImages(),
    getContentMap(),
    getWholesaleHighlight(),
  ]);
  const heroImage = landing.hero;
  const journeyImage = landing.journey;
  const ctaImage = landing.cta;

  const hero = (
    <section className="relative flex min-h-auto items-center overflow-hidden pt-10 pb-16 md:min-h-[85dvh] lg:pt-24">
      {/* Background Decorative Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-75 h-75 bg-flora-300/20 dark:bg-flora-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-44 right-1/4 w-65 h-65 bg-dust-300/35 dark:bg-flora-900/40 blur-[100px] rounded-full pointer-events-none" />
      </div>

      <Container className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">
        {/* On desktop, this wrapper groups text, buttons, and stats into a single 7-column flex container.
            On mobile, `contents` dissolves the wrapper so its children participate directly in the parent
            flex column with order-1 (text), order-3 (buttons), and order-4 (stats), while the hero image
            sits between them at order-2. */}
        <div className="contents lg:flex lg:flex-col lg:col-span-7 lg:items-start lg:text-right lg:order-2">
          {/* 1. Badge, H1, Subtitle */}
          <div className="order-1 lg:order-1 flex flex-col items-center text-center lg:items-start lg:text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-dust-300/70 bg-dust-100/70 dark:border-dust-100/20 dark:bg-flora-900/70 px-4 py-1.5 text-xs font-medium text-soil-700 dark:text-dust-200 backdrop-blur">
              <span className="size-1.5 rounded-full bg-dust-400 dark:bg-flora-300" />
              از خاک خالی، تا رویش سبز
            </span>

            <HeroTitle
              title={content.home_hero_title?.body || 'به فضاهای خالی، جان بدهیم.'}
              subtitle={content.home_hero_subtitle.body}
            />
          </div>

          {/* 3. Action Buttons */}
          <div className="order-3 lg:order-2 w-full flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="#catalog"
              className="group relative inline-flex w-full lg:w-auto items-center justify-center gap-2 rounded-full bg-flora-900 text-white dark:bg-flora-500 dark:text-flora-950 dark:hover:bg-flora-700 px-7 py-3.5 text-sm font-bold shadow-lg shadow-flora-900/25 transition-all duration-300 hover:scale-105 hover:bg-flora-700 hover:shadow-2xl hover:shadow-flora-900/40 active:scale-[0.98]"
            >
              <span className="inline-block transition duration-300 group-hover:rotate-12 group-hover:scale-125">
                🌱
              </span>
              <span>دیدن محصولات</span>
            </Link>
            <Link
              href="#wholesale-inquiry"
              className="group inline-flex w-full lg:w-auto items-center justify-center gap-2 rounded-full border border-soil-900/15 bg-white/70 dark:border-dust-100/20 dark:bg-flora-900/70 px-7 py-3.5 text-sm font-bold text-soil-900 dark:text-dust-50 backdrop-blur transition-all duration-300 hover:scale-105 hover:bg-white dark:hover:bg-flora-950 hover:border-soil-900/35 dark:hover:border-dust-100/30 hover:shadow-xl hover:shadow-soil-900/10 active:scale-[0.98]"
            >
              <span>خرید عمده و استعلام قیمت</span>
              <span className="text-flora-700 dark:text-flora-300 transition duration-300 group-hover:translate-x-1">←</span>
            </Link>
          </div>

          {/* 4. Stats */}
          <dl className="order-4 lg:order-3 flex justify-center gap-6 sm:gap-10 mt-10 w-full lg:grid lg:grid-cols-3 lg:border-t lg:border-soil-900/10 dark:lg:border-dust-100/10 lg:pt-7 lg:divide-x lg:divide-x-reverse lg:divide-soil-900/10 dark:lg:divide-dust-100/10 lg:max-w-lg lg:mx-0 lg:mt-12">
            {[
              { k: '۴۲+', v: 'مدل گلدان' },
              { k: '۳۱', v: 'استان تحت پوشش' },
              { k: '۱۲٬۰۰۰+', v: 'سفارش موفق' },
            ].map((s) => (
              <div key={s.v} className="px-2 text-center">
                <dt className="text-xl lg:text-2xl font-black text-soil-900 dark:text-dust-50">{s.k}</dt>
                <dd className="mt-1 text-[10px] lg:text-xs text-soil-700/70 dark:text-dust-300/70">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 2. Hero Image */}
        <div className="order-2 lg:order-1 lg:col-span-5 w-full flex justify-center mt-8 mb-8 lg:mt-0 lg:mb-0">
          <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-none mx-auto aspect-square lg:aspect-4/5">
            <Image
              src={heroImage?.url || '/images/hero-fallback.webp'}
              alt={heroImage?.alt ?? 'گلدان سفالی دست‌ساز با گیاه سبز'}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain"
              unoptimized={isUnoptimizedImage(heroImage?.url)}
            />
          </div>
        </div>
      </Container>
    </section>
  );

  const journey = (
    <section className="py-24">
      <Container className="max-w-3xl text-center">
        <h2 className="text-3xl font-black text-soil-900 dark:text-dust-50 sm:text-4xl">
          {content.about_title.body}
        </h2>
        <p className="mt-5 leading-8 text-soil-700/85 dark:text-dust-200/85">
          {content.about_body.body}
        </p>
      </Container>

      {journeyImage && (
        <Container className="mt-16">
          <div className="relative aspect-21/9 overflow-hidden rounded-pot bg-white border border-soil-900/5 dark:border-dust-50/10 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] dark:shadow-none">
            <Image
              src={journeyImage.url}
              alt={journeyImage.alt ?? 'مسیر ساخت گلدان از خاک تا رویش'}
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover"
              unoptimized={isUnoptimizedImage(journeyImage.url)}
            />
          </div>
        </Container>
      )}

      {/* Three equal cards on one baseline. */}
      <Container className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'خاک',
            subtitle: 'بستر مناسب برای هر گیاه',
            description:
              'خاک‌های مختلف، کاربردهای متفاوتی دارند. با توجه به نیاز گیاه به رطوبت، هوادهی و زهکشی، بستر مناسب‌تری برای رشد آن انتخاب کنید.',
            icon: '🏺',
            card: 'bg-dust-200 dark:bg-flora-900',
            accent: 'border-t-dust-400 dark:border-t-flora-300',
          },
          {
            title: 'ریشه',
            subtitle: 'گلدان مناسب، شروعی بهتر',
            description:
              'اندازه گلدان، فضای ریشه و خروج آب اضافی در سلامت گیاه اهمیت دارند. گلدانی انتخاب کنید که با اندازه و نیاز گیاهتان متناسب باشد.',
            icon: '🪴',
            card: 'bg-flora-100 dark:bg-flora-900',
            accent: 'border-t-flora-300 dark:border-t-flora-300',
          },
          {
            title: 'رویش',
            subtitle: 'از کاشت تا مراقبت روزمره',
            description:
              'با انتخاب گلدان، خاک و لوازم مناسب، برای رسیدگی به گیاهانتان آماده‌تر باشید؛ چه در حال شروع باشید و چه بخواهید مجموعه‌تان را گسترش دهید.',
            icon: '🌸',
            card: 'bg-flora-300/50 dark:bg-flora-900',
            accent: 'border-t-flora-500 dark:border-t-flora-300',
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`flex flex-col h-full rounded-pot border-t-4 border border-soil-900/5 dark:border-dust-100/10 ${card.accent} ${card.card} p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-16px_rgba(62,39,35,0.32)] dark:hover:shadow-[0_22px_44px_-16px_rgba(0,0,0,0.7)]`}
          >
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-2xl bg-white/60 dark:bg-white/10 text-2xl"
            >
              {card.icon}
            </span>
            <h3 className="mt-5 text-xl font-black text-soil-900 dark:text-dust-50">{card.title}</h3>
            <p className="mt-2 text-sm font-bold text-flora-700 dark:text-flora-300">{card.subtitle}</p>
            <p className="mt-3 text-xs leading-6 text-soil-700/80 dark:text-dust-200/80">{card.description}</p>
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
            <h2 className="text-3xl font-black text-soil-900 dark:text-dust-50 sm:text-4xl">پرفروش‌ترین‌ها</h2>
            <p className="mt-3 text-soil-700/80 dark:text-dust-200/80">قیمت پله‌ای — هرچه بیشتر، ارزان‌تر.</p>
          </div>
          <Link href="/products" className="text-sm font-bold text-flora-700 hover:text-flora-900 dark:text-flora-300 dark:hover:text-flora-100">
            همه محصولات
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 md:h-96 rounded-2xl md:rounded-3xl" />
            ))}
          </div>
        ) : (
          <ul className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );

  const trust = (
    <section id="wholesale" className="scroll-mt-24 py-24">
      <Container>
        <div className="relative overflow-hidden rounded-pot bg-flora-900 border border-transparent dark:border-dust-100/10 p-10 text-flora-100 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)] sm:p-14">
          {ctaImage && (
            <>
              <Image
                src={ctaImage.url}
                alt=""
                aria-hidden
                fill
                sizes="100vw"
                className="object-cover opacity-25"
                unoptimized={isUnoptimizedImage(ctaImage.url)}
              />
              {/* Scrim keeps body text readable over whatever the admin uploads. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-l from-flora-950/95 via-flora-950/85 to-flora-900/70"
              />
            </>
          )}

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Heading, Subtext & Bullets */}
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-flora-300/30 bg-flora-800/60 px-3.5 py-1 text-xs font-bold text-flora-300 backdrop-blur">
                ✨ بدون نیاز به کد تخفیف
              </span>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl leading-tight">
                تخفیف پله‌ای خودکار برای خریدهای بیشتر
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-8 text-flora-100/90">
                چه برای خانه‌تان چند گلدان بخواهید، چه برای کافه‌تان ۲۰ عدد؛ نیازی به چانه‌زنی نیست. با افزایش تعداد سفارش، قیمت هر واحد به صورت خودکار کاهش می‌یابد.
              </p>
              <ul className="mt-8 space-y-3.5 text-xs sm:text-sm">
                {[
                  'محاسبه آنی و خودکار تخفیف در سبد خرید متناسب با تعداد',
                  'بسته‌بندی استاندارد، ایمن و مقاوم در برابر ضربه برای ارسال',
                  'شفافیت کامل قیمت‌ها برای تمام محصولات گلدان، خاک و لوازم',
                  'امکان خرید از یک عدد تا تیراژ عمده بدون محدودیت حداقل سفارش',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-flora-300" />
                    <span className="text-flora-100/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column: Generic & Clear Table + B2B Escape Hatch */}
            <div className="lg:col-span-6">
              <div className="rounded-pot bg-flora-950/70 border border-flora-700/40 dark:border-dust-100/10 p-6 sm:p-8 backdrop-blur shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <caption className="sr-only">جدول تخفیف پله‌ای خودکار بر اساس تعداد سفارش</caption>
                    <thead>
                      <tr className="border-b border-flora-100/15 text-flora-200/80">
                        <th scope="col" className="pb-3 text-start font-bold">
                          تعداد
                        </th>
                        <th scope="col" className="pb-3 text-start font-bold">
                          میزان تخفیف
                        </th>
                        <th scope="col" className="pb-3 text-start font-bold">
                          توضیحات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-flora-100/10">
                      <tr className="transition-colors hover:bg-white/5">
                        <td className="py-4 font-bold text-white whitespace-nowrap">
                          {toFa('1')} تا {toFa('4')} عدد
                        </td>
                        <td className="py-4 text-flora-100/90 font-medium whitespace-nowrap">
                          قیمت پایه
                        </td>
                        <td className="py-4 text-flora-100/70">
                          بدون تخفیف
                        </td>
                      </tr>
                      <tr className="transition-colors hover:bg-white/5">
                        <td className="py-4 font-bold text-white whitespace-nowrap">
                          {toFa('5')} تا {toFa('19')} عدد
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-300 border border-emerald-400/30">
                            {toFa('15')}٪ تخفیف
                          </span>
                        </td>
                        <td className="py-4 text-flora-100/80 font-medium">
                          مناسب کافه‌ها و شرکت‌های کوچک
                        </td>
                      </tr>
                      <tr className="transition-colors hover:bg-white/5">
                        <td className="py-4 font-bold text-white whitespace-nowrap">
                          {toFa('20')} عدد به بالا
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-lg bg-emerald-500/25 px-2.5 py-1 text-xs font-black text-emerald-200 border border-emerald-400/40">
                            {toFa('30')}٪ تخفیف
                          </span>
                        </td>
                        <td className="py-4 text-flora-100/80 font-medium">
                          مناسب پروژه‌های بزرگ و عمده
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-[11px] sm:text-xs leading-6 text-flora-100/60 font-medium">
                  * تخفیف‌ها به صورت خودکار روی سبد خرید شما اعمال می‌شوند.
                </p>

                {/* B2B Escape Hatch */}
                <div className="mt-6 pt-5 border-t border-flora-100/15">
                  <Link
                    href="#wholesale-inquiry"
                    className="group inline-flex w-full items-center justify-between rounded-xl border border-flora-300/35 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:border-flora-300 dark:border-dust-50/20 dark:hover:border-flora-300"
                  >
                    <span>پروژه بزرگ دارید؟ استعلام قیمت اختصاصی بگیرید</span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:-translate-x-1 text-flora-300 font-bold"
                    >
                      ←
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );

  return (
    <main>
      <DustToFlora
        hero={hero}
        trustBar={
          <TrustBar
            maxDiscount={wholesaleHighlight.maxDiscount}
          />
        }
        whyChooseUs={<WhyChooseUs />}
        catalog={catalog}
        journey={journey}
        wholesaleInquiry={<WholesaleInquiryForm />}
        trust={trust}
      />
    </main>
  );
}
