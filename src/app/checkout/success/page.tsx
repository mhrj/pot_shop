import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatToman, toFa, formatDateFa } from '@/lib/format';
import Container from '@/components/ui/Container';

type Props = {
  searchParams: Promise<{ ref_id?: string; order?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const [{ ref_id, order: orderNumber }, session] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
    : null;

  const isPaid =
    order?.paymentStatus === 'PAID' && !!order.refId && (!ref_id || order.refId === ref_id);

  // The gateway return is a top-level navigation, so the customer's own session
  // cookie is normally present. Without it the order still confirms, but its
  // figures are withheld: the order number alone should not disclose what
  // someone else paid.
  const isOwner =
    !!session && !!order && (session.sub === order.userId || session.role === 'ADMIN');

  if (!isPaid) {
    return (
      <Container className="flex min-h-dvh items-center justify-center py-16">
        <div className="w-full max-w-xl rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] sm:p-12">
          <div className="grid size-16 place-items-center rounded-full bg-amber-100 text-3xl">
            ⏳
          </div>

          <h1 className="mt-6 text-2xl font-black text-soil-900 sm:text-3xl">
            پرداخت هنوز تکمیل نشده است
          </h1>
          <p className="mt-3 text-sm leading-7 text-soil-700/80">
            وضعیت سفارش در سیستم ثبت شده و در صورت موفقیت‌آمیز بودن پرداخت، اطلاعات آن در این صفحه به‌روزرسانی می‌شود.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-flora-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-flora-700"
            >
              پیگیری سفارش
            </Link>
            <Link
              href="/cart"
              className="rounded-full border border-soil-900/15 px-6 py-3 text-sm font-bold text-soil-900 transition hover:bg-dust-50"
            >
              بازگشت به سبد
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-dvh items-center justify-center py-16">
      <div className="w-full max-w-2xl rounded-pot bg-white p-8 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)] sm:p-12">
        <div className="grid size-16 place-items-center rounded-full bg-flora-100 text-3xl">
          ✓
        </div>

        <h1 className="mt-6 text-2xl font-black text-soil-900 sm:text-3xl">
          پرداخت با موفقیت انجام شد
        </h1>
        <p className="mt-3 text-sm leading-7 text-soil-700/80">
          از خرید شما سپاسگزاریم. سفارش شما ثبت شد و پس از آماده‌سازی ارسال خواهد شد.
        </p>

        <dl className="mt-8 divide-y divide-soil-900/5 overflow-hidden rounded-2xl border border-soil-900/10 text-sm">
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-soil-700/70">شماره سفارش</dt>
            <dd className="font-bold text-soil-900">{toFa(orderNumber ?? '—')}</dd>
          </div>
          {isOwner && order && (
            <>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="text-soil-700/70">کد پیگیری پرداخت (شاپرک)</dt>
                <dd className="font-mono font-bold text-flora-900" dir="ltr">
                  {toFa(order.refId ?? ref_id ?? '—')}
                </dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="text-soil-700/70">مبلغ پرداخت‌شده</dt>
                <dd className="font-bold text-soil-900">{formatToman(order.totalToman)}</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="text-soil-700/70">تاریخ</dt>
                <dd className="font-bold text-soil-900">
                  {formatDateFa(order.paidAt ?? order.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="text-soil-700/70">تعداد اقلام</dt>
                <dd className="font-bold text-soil-900">{toFa(order.items.length)} قلم</dd>
              </div>
            </>
          )}
        </dl>

        {!isOwner && (
          <p className="mt-4 text-[11px] leading-6 text-soil-700/60">
            جزئیات این سفارش فقط برای صاحب حساب نمایش داده می‌شود.{' '}
            <Link href="/login" className="font-bold text-flora-700 underline">
              ورود به حساب
            </Link>
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-flora-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-flora-700"
          >
            پیگیری سفارش
          </Link>
          <Link
            href="/"
            className="rounded-full border border-soil-900/15 px-6 py-3 text-sm font-bold text-soil-900 transition hover:bg-dust-50"
          >
            بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    </Container>
  );
}
