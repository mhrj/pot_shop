import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import OrderStatusForm from '@/components/admin/OrderStatusForm';
import StatusBadge from '@/components/ui/StatusBadge';

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true, phone: true, email: true } },
      items: true,
    },
  });
  if (!order) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-soil-900">
            سفارش <span className="font-mono">{toFa(order.orderNumber)}</span>
          </h1>
          <p className="mt-2 text-sm text-soil-700/70">
            {formatDateFa(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="text-sm font-black text-soil-900">اطلاعات مشتری</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">نام</dt>
              <dd className="font-bold text-soil-900">{order.user.fullName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">موبایل</dt>
              <dd className="font-mono text-xs" dir="ltr">{toFa(order.user.phone ?? '—')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">ایمیل</dt>
              <dd className="font-mono text-xs" dir="ltr">{order.user.email ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="text-sm font-black text-soil-900">آدرس ارسال</h2>
          <p className="mt-3 text-sm leading-7 text-soil-700/85">
            {order.shipFullName}<br />
            {order.shipProvince}، {order.shipCity}، {order.shipLine1}
            {order.shipLine2 ? '، ' + order.shipLine2 : ''}<br />
            <span className="text-xs text-soil-700/60" dir="ltr">
              {toFa(order.shipPhone)} · {toFa(order.shipPostalCode)}
            </span>
          </p>
        </section>

        <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="text-sm font-black text-soil-900">پرداخت</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">وضعیت پرداخت</dt>
              <dd><StatusBadge kind="payment" value={order.paymentStatus} /></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">مبلغ کل</dt>
              <dd className="font-bold">{formatToman(order.totalToman)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">کد پیگیری شاپرک</dt>
              <dd className="font-mono text-xs" dir="ltr">
                {order.refId ? toFa(order.refId) : '—'}
              </dd>
            </div>
            {order.paidAt && (
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">زمان پرداخت</dt>
                <dd className="text-xs">{formatDateFa(order.paidAt)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="text-sm font-black text-soil-900">اقلام سفارش</h2>
          <ul className="mt-3 divide-y divide-soil-900/5 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2.5">
                <div>
                  <p className="font-bold text-soil-900">{i.productName}</p>
                  <p className="mt-1 text-xs text-soil-700/60">
                    {toFa(i.quantity)} × {formatToman(i.unitToman)} — {i.tierLabel ?? '—'}
                  </p>
                </div>
                <p className="font-bold text-flora-900">{formatToman(i.lineTotalToman)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6">
        <OrderStatusForm
          orderId={order.id}
          initialStatus={order.status}
          initialTracking={order.trackingCode ?? ''}
        />
      </div>
    </div>
  );
}
