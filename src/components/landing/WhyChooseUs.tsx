import Container from '@/components/ui/Container';

const ADVANTAGES = [
  {
    tag: 'گلدان و دکور',
    title: 'از دکور تا نگهداری گیاه',
    description:
      'گلدانهای سفالی، سرامیکی و دکوراتیو در طرحها و اندازههای متنوع؛ برای زیباتر کردن فضای خانه و انتخاب بستری مناسب برای گیاهان.',
    color: 'from-dust-100 to-dust-200/80',
    border: 'border-dust-300/80',
    iconBg: 'bg-dust-300 text-soil-900',
    action: 'مشاهده گلدان‌ها',
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
    description:
      'از خاکهای عمومی تا ترکیبهای مخصوص گیاهان مختلف، بستری متناسب با نیاز ریشه، میزان رطوبت و شرایط رشد گیاه انتخاب کنید.',
    color: 'from-flora-100/70 to-flora-200/50',
    border: 'border-flora-300/60',
    iconBg: 'bg-flora-200 text-flora-900',
    action: 'انواع خاک و بستر',
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
    title: 'همهچیز برای رسیدگی بهتر',
    description:
      'ابزار و لوازم کاربردی موردنیاز برای کاشت، تعویض گلدان و مراقبت روزمره از گیاهان را یکجا پیدا کنید.',
    color: 'from-white to-dust-100/70',
    border: 'border-soil-900/10',
    iconBg: 'bg-soil-100 text-soil-900',
    action: 'مشاهده ابزارها',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.32l-3.276 3.277a1.5 1.5 0 01-2.122 0l-.707-.707a1.5 1.5 0 010-2.122l3.277-3.276a4.5 4.5 0 00-6.32 4.486c.048.58.024 1.193-.14 1.743" />
      </svg>
    ),
  },
  {
    tag: 'انتخاب محصول',
    title: 'انتخابی متناسب با نیاز شما',
    description:
      'برای انتخاب گلدان و خاک، به نوع گیاه، اندازه ریشه، زهکشی و شرایط نگهداری توجه کنید تا خریدی متناسب با نیازتان داشته باشید.',
    color: 'from-flora-200/40 to-flora-300/30',
    border: 'border-flora-400/40',
    iconBg: 'bg-flora-300 text-flora-950',
    action: 'راهنمای انتخاب',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 relative">
      <Container>
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-flora-300/60 bg-flora-100/70 px-4 py-1.5 text-xs font-bold text-flora-900 backdrop-blur">
            🌱 مهندسی پیوند خاک و گیاه
          </span>
          <h2 className="mt-4 text-3xl font-black text-soil-900 sm:text-4xl">
            چرا پات استور؟
          </h2>
          <p className="mt-4 text-base leading-8 text-soil-700/85 sm:text-lg">
            هر گلدانی بستر مناسبی برای نگهداری گیاه زنده نیست. پات استور با انتخاب دقیق کارگاه‌های برتر کشور و تأمین خاک و ابزار تخصصی، محصولاتی گردآوری کرده که گیاه شما سال‌ها با طراوت نفس بکشد.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((adv) => (
            <div
              key={adv.title}
              className={`group flex flex-col justify-between rounded-3xl border ${adv.border} bg-gradient-to-b ${adv.color} p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-soil-900/8 text-right`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`grid size-12 place-items-center rounded-2xl ${adv.iconBg} shadow-sm transition duration-300 group-hover:scale-110`}>
                    {adv.icon}
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-soil-700 backdrop-blur">
                    {adv.tag}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-black text-soil-900 text-right leading-tight">
                  {adv.title}
                </h3>
                <p className="mt-3 text-xs leading-6 sm:text-sm sm:leading-7 text-soil-700/85 text-right">
                  {adv.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-[11px] font-bold text-flora-800 opacity-80 transition duration-300 group-hover:opacity-100">
                <span>{adv.action}</span>
                <span className="transition duration-300 group-hover:-translate-x-1">←</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
