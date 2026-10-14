import Link from 'next/link';
import Container from '@/components/ui/Container';

export default async function FailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; order?: string }>;
}) {
  const { reason, order } = await searchParams;

  return (
    <Container className="flex min-h-dvh items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-pot bg-white p-10 text-center shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-3xl">
          ✕
        </div>
        <h1 className="mt-6 text-2xl font-black text-soil-900">پرداخت انجام نشد</h1>
        <p className="mt-3 text-sm leading-7 text-soil-700/80">
          {reason === 'canceled'
            ? 'پرداخت را لغو کردید. اگر مبلغی از حساب شما کسر شده، طی ۷۲ ساعت به‌صورت خودکار باز می‌گردد.'
            : 'متأسفانه تأیید پرداخت ناموفق بود. می‌توانید دوباره تلاش کنید.'}
        </p>
        {order && (
          <p className="mt-4 text-xs text-soil-700/60">
            شماره سفارش: <span className="font-mono font-bold">{order}</span>
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/cart"
            className="rounded-full bg-flora-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-flora-700"
          >
            بازگشت به سبد
          </Link>
          <Link
            href="/"
            className="rounded-full border border-soil-900/15 px-6 py-3 text-sm font-bold text-soil-900 transition hover:bg-dust-50"
          >
            صفحه اصلی
          </Link>
        </div>
      </div>
    </Container>
  );
}
