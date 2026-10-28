import type { Metadata } from 'next';
import { getContentMap } from '@/lib/content';
import { toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

// Same cadence as the home page: the copy changes rarely, so it does not need
// to be re-read on every request.
export const revalidate = 300;

export const metadata: Metadata = {
  // Rendered through the layout's template as "درباره ما | پات استور".
  title: 'درباره ما',
  description:
    'درباره پات استور —  تأمین‌کننده گلدان‌های سفالی، سرامیکی، خاک تخصصی و ابزار باغبانی با ارسال به سراسر ایران.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'درباره ما | پات استور',
    description:
      'پات استور تامین کننده بهترین گلدان‌ها، خاک و ابزارهای نگهداری گیاهان از برترین کارگاه‌های ایران.',
    type: 'website',
  },
};

export default async function AboutPage() {
  const content = await getContentMap();

  return (
    <Container className="py-12 lg:py-16">
      <p className="text-xs font-bold text-flora-700 dark:text-flora-300">پات استور</p>
      <h1 className="mt-2 text-3xl font-black text-soil-900 dark:text-dust-50 sm:text-4xl">
        {content.about_title.body}
      </h1>

      {/* Split paragraphs so the story has clear spacing, the lead title stands out,
          and the concluding brand tagline is rendered in bold. */}
      <div className="mt-6 max-w-3xl space-y-5 text-sm leading-8 text-soil-700/85 dark:text-dust-200/85">
        {content.about_body.body
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph, index, array) => {
            const isFirst = index === 0 && paragraph.length < 60;
            const isLast = index === array.length - 1;

            if (isFirst) {
              return (
                <p key={index} className="text-base font-bold text-soil-900 dark:text-dust-50 leading-8">
                  {paragraph}
                </p>
              );
            }

            if (isLast) {
              return (
                <p key={index} className="pt-2 font-bold text-soil-900 dark:text-dust-50 leading-8">
                  <strong>{paragraph}</strong>
                </p>
              );
            }

            return (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            );
          })}
      </div>

      <section className="mt-12 w-full max-w-3xl rounded-pot border border-soil-900/10 bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] dark:border-dust-50/10 dark:bg-flora-900 dark:shadow-none">
        <h2 className="text-xl font-black text-soil-900 dark:text-dust-50">راه های تماس</h2>
        <p className="mt-2 text-sm text-soil-700/70 dark:text-dust-200/70">
          برای سفارش عمده، مشاوره انتخاب گلدان یا پیگیری سفارش، از این راه ها در دسترس هستیم.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          
          {/* Address */}
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-soil-700/60 dark:text-dust-200/60 mb-1">نشانی</span>
            <span className="text-sm font-bold text-soil-900 dark:text-dust-50 leading-6">
              {content.address.body}
            </span>
          </div>

          {/* Phone */}
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-soil-700/60 dark:text-dust-200/60 mb-1">تلفن</span>
            <span className="text-sm font-bold text-soil-900 dark:text-dust-50" dir="ltr">
              {toFa(content.phone.body)}
            </span>
          </div>

          {/* Email */}
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-soil-700/60 dark:text-dust-200/60 mb-1">ایمیل</span>
            <span className="text-sm font-bold text-soil-900 dark:text-dust-50" dir="ltr">
              {content.email.body}
            </span>
          </div>

          {/* Hours */}
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-soil-700/60 dark:text-dust-200/60 mb-1">ساعات کاری</span>
            <span className="text-sm font-bold text-soil-900 dark:text-dust-50">
              {toFa(content.hours.body)}
            </span>
          </div>

        </div>
      </section>
    </Container>
  );
}
