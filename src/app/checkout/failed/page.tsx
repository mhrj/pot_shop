import Link from 'next/link';
import { toFa } from '@/lib/format';
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
    'پرداخت شما انجام نشد. اگر مبلغی کسر شده باشد، تا ۷۲ ساعت آینده بازگردانده می‌شود.';

  return (
    <Container className="flex min-h-dvh items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-pot border border-transparent bg-white p-10 text-center shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] dark:border-dust-50/10 dark:bg-flora-900 dark:shadow-none">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-3xl dark:bg-red-950/50 dark:text-red-400">
          ✕
        </div>
        <h1 className="mt-6 text-2xl font-black text-soil-900 dark:text-dust-50">پرداخت ناموفق</h1>
        <p className="mt-3 text-sm leading-7 text-soil-700/80 dark:text-dust-200/80">
          {explanation}
        </p>
        {order && (
          <p className="mt-4 text-xs text-soil-700/60 dark:text-dust-200/60">
            شماره سفارش: <span className="font-mono font-bold dark:text-dust-50">{toFa(order)}</span>
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/cart"
            className="rounded-full bg-flora-900 text-white dark:bg-flora-500 dark:text-flora-950 dark:hover:bg-flora-700 px-6 py-3 text-sm font-bold transition-colors hover:bg-flora-700 cursor-pointer shadow-sm"
          >
            بازگشت به سبد خرید
          </Link>
          <Link
            href="/"
            className="rounded-full border border-soil-900/15 px-6 py-3 text-sm font-bold text-soil-900 transition-colors hover:bg-dust-50 dark:border-dust-50/20 dark:text-dust-50 dark:hover:bg-flora-950"
          >
            صفحه اصلی
          </Link>
        </div>
      </div>
    </Container>
  );
}
