import Link from 'next/link';
import Container from '@/components/ui/Container';

const ADVANTAGES = [
  {
    tag: 'گلدان و دکور',
    title: 'از دکور تا نگهداری گیاه',
    slug: 'pots-decor',
    description:
      'گلدان‌های سفالی، سرامیکی و دکوراتیو در طرح‌ها و اندازه‌های متنوع؛ برای زیباتر کردن فضای خانه و انتخاب بستری مناسب برای گیاهان.',
    color: 'from-dust-100 to-dust-200/80',
    border: 'border-dust-300/80',
    iconBg: 'bg-dust-300 text-soil-900',
    action: 'مشاهده گلدان‌ها',
    href: '/products?category=pots-decor',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 10h12m-1 0l-1.2 8.4a2 2 0 01-1.98 1.6h-3.64a2 2 0 01-1.98-1.6L7 10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10V5m0 0a3.5 3.5 0 013.5 3.5c0 1.5-1.5 2.5-3.5 2.5m0-6a3.5 3.5 0 00-3.5 3.5c0 1.5 1.5 2.5 3.5 2.5" />
      </svg>
    ),
  },
  {
    tag: 'خاک و بستر رشد',
    title: 'هر گیاه، خاک مناسب خودش',
    slug: 'soil-growth',
    description:
      'از خاک‌های عمومی تا ترکیب‌های مخصوص گیاهان مختلف، بستری متناسب با نیاز ریشه، میزان رطوبت و شرایط رشد گیاه انتخاب کنید.',
    color: 'from-flora-100/70 to-flora-200/50',
    border: 'border-flora-300/60',
    iconBg: 'bg-flora-200 text-flora-900',
    action: 'انواع خاک و بستر',
    href: '/products?category=soil-growth',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5L2.5 8.5 12 13.5l9.5-5L12 3.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12.5L12 17.5l9.5-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 16.5L12 21.5l9.5-5" />
      </svg>
    ),
  },
  {
    tag: 'لوازم نگهداری',
    title: 'همه‌چیز برای رسیدگی بهتر',
    slug: 'tools-care',
    description:
      'ابزار و لوازم کاربردی موردنیاز برای کاشت، تعویض گلدان و مراقبت روزمره از گیاهان را یکجا پیدا کنید.',
    color: 'from-white to-dust-100/70',
    border: 'border-soil-900/10',
    iconBg: 'bg-soil-100 text-soil-900',
    action: 'مشاهده ابزارها',
    href: '/products?category=tools-care',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.32l-3.276 3.277a1.5 1.5 0 01-2.122 0l-.707-.707a1.5 1.5 0 010-2.122l3.277-3.276a4.5 4.5 0 00-6.32 4.486c.048.58.024 1.193-.14 1.743" />
      </svg>
    ),
  },
  {
    tag: 'راهنمای جامع',
    title: 'راهنمای انتخاب و نگهداری',
    slug: 'product-guide',
    description:
      'با مطالعه مقالات کارشناسان ما، بهترین گلدان و خاک را برای گیاه خود انتخاب کنید.',
    color: 'from-flora-200/40 to-flora-300/30',
    border: 'border-flora-400/40',
    iconBg: 'bg-flora-300 text-flora-950',
    action: 'مطالعه مقالات',
    href: '/articles',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 relative">
      <Container>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-soil-900 dark:text-dust-50 sm:text-4xl">
            چرا پات استور؟
          </h2>
          <p className="mt-4 text-base leading-8 text-soil-700/85 dark:text-dust-200/85 sm:text-lg">
            هر گلدانی بستر مناسبی برای نگهداری گیاه زنده نیست. پات استور با انتخاب دقیق کارگاه‌های برتر کشور و تأمین خاک و ابزار تخصصی، محصولاتی گردآوری کرده که گیاه شما سال‌ها با طراوت نفس بکشد.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((adv) => {
            const isClickable = Boolean(adv.href);

            const cardBody = (
              <div
                className={`flex h-full flex-col justify-between rounded-3xl border ${adv.border} dark:border-dust-100/10 bg-gradient-to-b ${adv.color} dark:from-flora-900 dark:to-flora-900 dark:bg-flora-900 p-7 shadow-sm text-right ${
                  isClickable
                    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/40'
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`grid size-12 place-items-center rounded-2xl ${adv.iconBg} dark:bg-white/10 dark:text-dust-50 shadow-sm ${
                        isClickable ? 'transition duration-300 group-hover:scale-110' : ''
                      }`}
                    >
                      {adv.icon}
                    </div>
                    <span className="rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-[11px] font-bold text-soil-700 dark:text-dust-200 backdrop-blur">
                      {adv.tag}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-black text-soil-900 dark:text-dust-50 text-right leading-tight">
                    {adv.title}
                  </h3>
                  <p className="mt-3 text-xs leading-6 sm:text-sm sm:leading-7 text-soil-700/85 dark:text-dust-200/85 text-right">
                    {adv.description}
                  </p>
                </div>

                <div
                  className={`mt-6 flex items-center gap-1.5 text-[11px] font-bold text-flora-800 dark:text-flora-300 ${
                    isClickable
                      ? 'opacity-80 transition duration-300 group-hover:opacity-100'
                      : 'opacity-70'
                  }`}
                >
                  <span>{adv.action}</span>
                  <span
                    className={`inline-block ${
                      isClickable
                        ? 'transition-transform duration-300 group-hover:-translate-x-1'
                        : ''
                    }`}
                  >
                    ←
                  </span>
                </div>
              </div>
            );

            if (isClickable && adv.href) {
              return (
                <Link
                  key={adv.title}
                  href={adv.href}
                  className="group block h-full rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-flora-600"
                >
                  {cardBody}
                </Link>
              );
            }

            return (
              <div key={adv.title} className="block h-full rounded-3xl">
                {cardBody}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
