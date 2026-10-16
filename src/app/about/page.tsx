import type { Metadata } from 'next';
import { getContentMap } from '@/lib/content';
import { toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

// Same cadence as the home page: the copy changes rarely, so it does not need
// to be re-read on every request.
export const revalidate = 300;

export const metadata: Metadata = {
  // Rendered through the layout's template as "درباره ما | پات شاپ".
  title: 'درباره ما',
  description:
    'درباره پات شاپ — گلدان سفالی، سرامیکی و بتنی دست‌ساز؛ از یک عدد تا سفارش عمده، با ارسال به سراسر ایران.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'درباره ما | پات شاپ',
    description:
      'کار ما با خاک شروع می‌شود — گلدان سفالی، سرامیکی و بتنی دست‌ساز برای خانه، اداره و پروژه‌های بزرگ.',
    type: 'website',
  },
};

export default async function AboutPage() {
  const content = await getContentMap();

  // `toFa` is applied to the fields a shopkeeper types as numbers — a phone
  // number, opening hours, a street address — so ASCII digits an admin enters
  // render as Persian ones. It is deliberately *not* applied to the email: an
  // address like `shop2024@example.com` would come back with mangled digits.
  const contact = [
    { label: 'نشانی', value: toFa(content.address.body) },
    { label: 'تلفن', value: toFa(content.phone.body), ltr: true },
    { label: 'ایمیل', value: content.email.body.trim(), ltr: true },
    { label: 'ساعات کاری', value: toFa(content.hours.body) },
    // A key the admin has cleared should disappear, not leave a labelled blank.
  ].filter((row) => row.value.length > 0);

  return (
    <Container className="py-12 lg:py-16">
      <p className="text-xs font-bold text-flora-700">پات شاپ</p>
      <h1 className="mt-2 text-3xl font-black text-soil-900 sm:text-4xl">
        {content.about_title.body}
      </h1>

      {/* `whitespace-pre-line` keeps the paragraph breaks the admin types into
          the textarea; without it the whole story collapses into one block. */}
      <div className="mt-6 max-w-3xl text-sm leading-8 whitespace-pre-line text-soil-700/85">
        {content.about_body.body}
      </div>

      {contact.length > 0 && (
        <section className="mt-12 max-w-3xl rounded-pot border border-soil-900/10 bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
          <h2 className="text-lg font-black text-soil-900">راه‌های تماس</h2>
          <p className="mt-2 text-xs text-soil-700/70">
            برای سفارش عمده، مشاوره انتخاب گلدان یا پیگیری سفارش، از این راه‌ها در دسترس ما هستید.
          </p>

          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            {contact.map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-bold text-soil-700/60">{row.label}</dt>
                {/* `dir="ltr"` on the value only: a phone number or an email is
                    read left-to-right even in an RTL page, and without it the
                    trailing characters jump to the wrong end. */}
                <dd
                  className="mt-1.5 font-bold text-soil-900"
                  dir={row.ltr ? 'ltr' : undefined}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </Container>
  );
}
