import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import TestBanner from '@/components/layout/TestBanner';
import PersianChatbot from '@/components/chatbot/PersianChatbot';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import { getContentMap } from '@/lib/content';
import { toFa } from '@/lib/format';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazirmatn',
  preload: true,
});

export const metadata: Metadata = {
  // Required for the relative canonical URLs and Open Graph image paths set by
  // the pages below to resolve into absolute ones.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'پات استور | گلدان، خاک و ملزومات گیاهان',
    template: '%s | پات استور',
  },
  description:
    'خرید و تأمین گلدان سفالی، سرامیکی، بتنی، خاک و ابزار گیاهان — خرده و عمده با ارسال به سراسر ایران و پرداخت امن.',
  keywords: ['گلدان', 'خاک گیاه', 'ابزار باغبانی', 'سفال', 'سرامیک', 'گلدان عمده', 'پات استور'],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'پات استور',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#1B4332',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContentMap();

  // `toFa` for the fields a shopkeeper types as numbers, so ASCII digits render
  // as Persian ones. Not applied to the email — `shop2024@example.com` would
  // come back with mangled digits. A key the admin has cleared drops its row
  // instead of leaving a label with nothing after it.
  const contact = [
    { label: 'نشانی', value: toFa(content.address.body) },
    { label: 'تلفن', value: toFa(content.phone.body), ltr: true },
    { label: 'ایمیل', value: content.email.body.trim(), ltr: true },
    { label: 'ساعات کاری', value: toFa(content.hours.body) },
  ].filter((row) => row.value.length > 0);

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      {/* `min-h-dvh` + `flex-col` and a `flex-1` wrapper around the page content
          keep the footer pinned to the bottom of the viewport. Without the
          growing wrapper, a short page (`/checkout/success`, an empty `/cart`,
          `/login`) leaves the footer floating mid-screen with dead space below
          it, because the body is only as tall as its content. */}
      <body className="flex min-h-dvh flex-col bg-dust-50 font-sans text-soil-900 selection:bg-flora-300 selection:text-flora-950">
        <PageViewTracker />
        <TestBanner />
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-soil-900/10 bg-white/80 print:hidden no-print">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
            {/* Three columns on desktop, stacked on mobile. The contact column is
                skipped entirely when every key is empty, rather than rendering a
                heading over blank space. */}
            <div className="grid gap-10 md:grid-cols-3">
              <div>
                <p className="text-lg font-black text-soil-900">پات استور</p>
                <p className="mt-3 text-sm leading-7 text-soil-700/80">
                  {content.footer_text.body}
                </p>
              </div>

              {contact.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-soil-900">تماس با ما</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    {contact.map((row) => (
                      <div key={row.label} className="flex flex-wrap gap-x-2">
                        <dt className="text-soil-700/60">{row.label}:</dt>
                        <dd
                          className="font-bold text-soil-700/90"
                          dir={row.ltr ? 'ltr' : undefined}
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-soil-900">دسترسی سریع</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link href="/products" className="font-bold text-flora-700 hover:text-flora-900">
                      محصولات
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="font-bold text-flora-700 hover:text-flora-900">
                      درباره ما
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" className="font-bold text-flora-700 hover:text-flora-900">
                      سبد خرید
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 border-t border-soil-900/10 pt-6 text-center text-xs text-soil-700/60">
              © ۱۴۰۵ پات استور — تمامی حقوق محفوظ است.
            </div>
          </div>
        </footer>
        <PersianChatbot />
      </body>
    </html>
  );
}
