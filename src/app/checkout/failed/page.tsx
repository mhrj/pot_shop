import Link from 'next/link';
import Container from '@/components/ui/Container';

export default async function FailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; order?: string }>;
}) {
  const { reason, order } = await searchParams;

  const reasonMessages: Record<string, string> = {
    canceled:
      'پرداخت توسط شما لغو شد. چنانچه مبلغی از حساب شما کسر شده باشد، طبق ضوابط شبکه شاپرک ظرف حداکثر ۷۲ ساعت به‌صورت خودکار بازگردانده می‌شود.',
    verify_unavailable:
      'ارتباط با درگاه بانکی موقتاً با تأخیر مواجه شد یا درگاه در دسترس نیست. سفارش شما محفوظ مانده و وضعیت آن تغییر داده نشده است.',
    stock_shortage:
      'متأسفانه موجودی برخی از اقلام این سفارش پیش از تسویه حساب به پایان رسید. در صورت کسر وجه، مبلغ کامل به حساب شما بازگردانده خواهد شد.',
    order_not_found:
      'سفارش مورد نظر یافت نشد یا شناسه مرجع پرداخت منقضی شده است.',
    authority_missing:
      'کد پیگیری درگاه پرداخت در این درخواست دریافت نشد.',
  };

  const explanation =
    (reason && reasonMessages[reason]) ||
    'متأسفانه پرداخت تأیید نشد یا خطایی از سمت بانک رخ داده است. می‌توانید مجدداً برای پرداخت سفارش تلاش کنید.';

  return (
    <Container className="flex min-h-dvh items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-pot bg-white p-10 text-center shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-3xl">
          ✕
        </div>
        <h1 className="mt-6 text-2xl font-black text-soil-900">پرداخت انجام نشد</h1>
        <p className="mt-3 text-sm leading-7 text-soil-700/80">
          {explanation}
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
