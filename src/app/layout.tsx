import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import PersianChatbot from '@/components/chatbot/PersianChatbot';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-dvh bg-dust-50 font-sans text-soil-900 selection:bg-flora-300 selection:text-flora-950">
        {children}
        <PersianChatbot />
      </body>
    </html>
  );
}
