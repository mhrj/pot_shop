import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import PersianChatbot from '@/components/chatbot/PersianChatbot';
import { getContentMap } from '@/lib/content';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazirmatn',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'پات شاپ | گلدان و فلاورباکس سفالی و سرامیکی',
    template: '%s | پات شاپ',
  },
  description:
    'خرید گلدان و فلاورباکس سفالی، سرامیکی و بتنی — خرده و عمده. ارسال به سراسر ایران، پرداخت امن با زرین‌پال.',
  keywords: ['گلدان', 'فلاورباکس', 'سفال', 'سرامیک', 'گلدان عمده', 'خرید گلدان'],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'پات شاپ',
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

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-dvh bg-dust-50 font-sans text-soil-900 selection:bg-flora-300 selection:text-flora-950">
        <Header />
        {children}
        <footer className="border-t border-soil-900/10 bg-white/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-soil-700/80 md:flex-row md:items-center md:justify-between md:px-8">
            <p>{content.footer_text.body}</p>
            <div className="flex items-center gap-4">
              <a href="/products" className="font-bold text-flora-700">محصولات</a>
              <a href="/cart" className="font-bold text-flora-700">سبد خرید</a>
            </div>
          </div>
        </footer>
        <PersianChatbot />
      </body>
    </html>
  );
}
