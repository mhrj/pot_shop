import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'در حال به‌روزرسانی | پات استور',
  description: 'فروشگاه تخصصی گلدان و خاک پات استور در حال به‌روزرسانی است.',
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-dust-50 flex items-center justify-center py-16 px-4" dir="rtl">
      <Container className="w-full max-w-lg text-center">
        <div className="rounded-pot bg-white p-8 md:p-12 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.18)] border border-soil-900/10">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-flora-50 text-4xl mb-6 shadow-inner">
            🌱
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-soil-900 tracking-tight">
            در حال به‌روزرسانی
          </h1>

          <p className="mt-4 text-sm md:text-base leading-7 text-soil-700/80">
            به منظور ارتقای کیفیت خدمات و بهبود تجربه خرید، سایت پات استور به مدت کوتاهی در دسترس نخواهد بود. به زودی با امکانات جدید در خدمت شما هستیم.
          </p>

          <div className="mt-8 pt-6 border-t border-soil-900/10 flex flex-col items-center gap-3">
            <span className="text-xs text-soil-700/60 font-medium">
              از شکیبایی شما سپاسگزاریم
            </span>
            <Link
              href="/admin"
              className="text-xs text-soil-700/40 hover:text-flora-700 transition underline underline-offset-4"
            >
              ورود به بخش مدیریت
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
