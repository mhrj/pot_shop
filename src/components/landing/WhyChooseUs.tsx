import Container from '@/components/ui/Container';

const ADVANTAGES = [
  {
    tag: 'تنفسی و طبیعی',
    title: 'خاک رس معدنی و ساختار تنفسی',
    description:
      'دیواره‌های سفالی خالص به دلیل منافذ ریز طبیعی، دی‌اکسید کربن اضافی را دفع و ریشه گیاه را در خنک‌ترین دمای ممکن حفظ می‌کنند.',
    color: 'from-dust-100 to-dust-200/80',
    border: 'border-dust-300/80',
    iconBg: 'bg-dust-300 text-soil-900',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    tag: 'مقاومت حرارتی',
    title: 'پخت ۱۰۵۰ درجه کوره سفالگری',
    description:
      'هر قطعه ساعت‌ها در دمای کنترل‌شده پخته می‌شود تا در برابر یخبندان زمستان، تابش مستقیم آفتاب و شوک‌های حرارتی کاملاً مقاوم باشد.',
    color: 'from-flora-100/70 to-flora-200/50',
    border: 'border-flora-300/60',
    iconBg: 'bg-flora-200 text-flora-900',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    tag: 'لعاب باکیفیت',
    title: 'لعاب سنگی بدون ترک و تغییر رنگ',
    description:
      'فرمولاسیون لعاب‌های سنگی و نیمه‌مات ما فاقد هرگونه سرب و مواد سمی است، رسوب آب به خود نمی‌گیرد و با دستمال مرطوب مثل روز اول می‌درخشد.',
    color: 'from-white to-dust-100/70',
    border: 'border-soil-900/10',
    iconBg: 'bg-soil-100 text-soil-900',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    tag: 'پایداری فیزیکی',
    title: 'تراز وزنی ضد واژگونی گیاه',
    description:
      'نسبت ضخامت کف به دیواره به‌گونه‌ای ریخته‌گری شده که مرکز ثقل پایینی ایجاد کرده و مانع از افتادن گیاهان سنگین آپارتمانی می‌شود.',
    color: 'from-flora-200/40 to-flora-300/30',
    border: 'border-flora-400/40',
    iconBg: 'bg-flora-300 text-flora-950',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
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

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((adv) => (
            <div
              key={adv.title}
              className={`group flex flex-col justify-between rounded-3xl border ${adv.border} bg-gradient-to-b ${adv.color} p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-soil-900/8`}
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

                <h3 className="mt-6 text-lg font-black text-soil-900">
                  {adv.title}
                </h3>
                <p className="mt-3 text-xs leading-6 text-soil-700/85">
                  {adv.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-[11px] font-bold text-flora-800 opacity-80 group-hover:opacity-100">
                <span>تضمین اصالت متریال</span>
                <span className="transition duration-300 group-hover:translate-x-1">←</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
