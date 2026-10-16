import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';
import StatusBadge from '@/components/ui/StatusBadge';
import { allowedTransitions, ORDER_STATUS_LABELS, isOrderStatus } from '@/lib/orders';
import { channelLabel } from '@/lib/analytics';
import CancelOrderButton from '@/components/dashboard/CancelOrderButton';

type Props = { params: Promise<{ id: string }> };

/** Where the order sits in the shop's own fulfilment flow, for the tracker. */
const TIMELINE = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

export default async function CustomerOrderPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    // Scoped by userId so another customer's id simply 404s.
    where: { id, userId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  const status = isOrderStatus(order.status) ? order.status : 'PENDING';
  const isCanceled = status === 'CANCELED';
  const reached = TIMELINE.indexOf(status as (typeof TIMELINE)[number]);
  const canCancel = allowedTransitions(status).includes('CANCELED');

  return (
    <Container className="py-12">
      <nav className="text-xs text-soil-700/60">
        <Link href="/dashboard" className="hover:text-flora-700">
          حساب من
        </Link>
        <span className="mx-2">/</span>
        <span>سفارش {toFa(order.orderNumber)}</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-black text-soil-900">
            {toFa(order.orderNumber)}
          </h1>
          <p className="mt-2 text-sm text-soil-700/70">{formatDateFa(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="order" value={order.status} />
          <StatusBadge kind="payment" value={order.paymentStatus} />
        </div>
      </header>

      {isCanceled ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
          این سفارش لغو شده است.
        </p>
      ) : (
        <ol className="mt-8 grid gap-3 sm:grid-cols-4">
          {TIMELINE.map((step, index) => {
            const done = reached >= index;
            return (
              <li
                key={step}
                className={
                  'rounded-2xl border px-4 py-3 text-xs font-bold ' +
                  (done
                    ? 'border-flora-200 bg-flora-100 text-flora-700'
                    : 'border-soil-900/10 bg-white text-soil-700/50')
                }
              >
                <span className="mb-1 block text-[10px] opacity-70">
                  مرحله {toFa(index + 1)}
                </span>
                {ORDER_STATUS_LABELS[step]}
              </li>
            );
          })}
        </ol>
      )}

      {order.trackingCode && (
        <p className="mt-4 text-sm text-soil-700/80">
          کد رهگیری مرسوله:{' '}
          <b className="font-mono text-soil-900" dir="ltr">
            {toFa(order.trackingCode)}
          </b>
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
          <h2 className="text-sm font-black text-soil-900">اقلام سفارش</h2>
          <ul className="mt-4 divide-y divide-soil-900/5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3.5 text-sm">
                <div>
                  <p className="font-bold text-soil-900">{item.productName}</p>
                  <p className="mt-1 text-xs text-soil-700/60">
                    {toFa(item.quantity)} × {formatToman(item.unitToman)}
                    {item.tierLabel ? ` — ${item.tierLabel}` : ''}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-flora-900">
                  {formatToman(item.lineTotalToman)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-soil-900/5 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-soil-700/70">جمع کالاها</dt>
              <dd className="text-soil-900">{formatToman(order.subtotalToman)}</dd>
            </div>
            {order.discountToman > 0 && (
              <div className="flex justify-between">
                <dt className="text-soil-700/70">تخفیف</dt>
                <dd className="text-flora-700">−{formatToman(order.discountToman)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-soil-700/70">هزینه ارسال</dt>
              <dd className="text-soil-900">
                {order.shippingToman === 0 ? 'رایگان' : formatToman(order.shippingToman)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-soil-900/5 pt-3 text-base">
              <dt className="font-black text-soil-900">مبلغ پرداختی</dt>
              <dd className="font-black text-soil-900">{formatToman(order.totalToman)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
            <h2 className="text-sm font-black text-soil-900">آدرس تحویل</h2>
            <p className="mt-3 text-sm leading-7 text-soil-700/85">
              {order.shipFullName}
              <br />
              {order.shipProvince}، {order.shipCity}، {order.shipLine1}
              {order.shipLine2 ? `، ${order.shipLine2}` : ''}
              <br />
              <span className="text-xs text-soil-700/60" dir="ltr">
                {toFa(order.shipPostalCode)} · {toFa(order.shipPhone)}
              </span>
            </p>
          </section>

          <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
            <h2 className="text-sm font-black text-soil-900">اطلاعات پرداخت</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">کانال خرید</dt>
                <dd className="font-bold text-soil-900">{channelLabel(order.channel)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">کد پیگیری</dt>
                <dd className="font-mono text-xs text-soil-900" dir="ltr">
                  {order.refId ? toFa(order.refId) : '—'}
                </dd>
              </div>
              {order.paidAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-soil-700/70">زمان پرداخت</dt>
                  <dd className="text-xs text-soil-900">{formatDateFa(order.paidAt)}</dd>
                </div>
              )}
            </dl>
          </section>

          <div className="flex flex-wrap gap-3">
            <form action="/api/cart/reorder" method="post">
              <input type="hidden" name="orderId" value={order.id} />
              <button className="rounded-full bg-flora-900 px-5 py-2.5 text-xs font-black text-white transition hover:bg-flora-700">
                سفارش مجدد
              </button>
            </form>

            {canCancel && order.status === 'PENDING' && (
              <CancelOrderButton orderId={order.id} />
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
