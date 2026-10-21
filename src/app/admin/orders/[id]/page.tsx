import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import OrderStatusForm from '@/components/admin/OrderStatusForm';
import StatusBadge from '@/components/ui/StatusBadge';
import ItemColorBadge from '@/components/ui/ItemColorBadge';

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

        <section className="rounded-2xl border border-soil-900/10 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-black text-soil-900">اقلام سفارش</h2>
          <div className="mt-4 divide-y divide-soil-900/10">
            {order.items.map((i) => (
              <div
                key={i.id}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  {i.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={i.productName}
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-soil-900/10"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-dust-100 border border-soil-900/10 flex items-center justify-center text-soil-700/40 shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/products/${i.productSlug}`}
                        className="font-bold text-soil-900 hover:text-flora-700 transition"
                      >
                        {i.productName}
                      </Link>
                      <ItemColorBadge colorData={i.colorData} />
                    </div>
                    {(i.tierLabel || i.material) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-soil-700/70">
                        {i.tierLabel && (
                          <span className="rounded-md bg-flora-50 px-2 py-0.5 font-medium text-flora-800 border border-flora-200/60">
                            سطح قیمت: {i.tierLabel}
                          </span>
                        )}
                        {i.material && (
                          <span className="rounded-md bg-dust-100 px-2 py-0.5 text-soil-700">
                            جنس: {i.material}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-soil-700/80">
                      {toFa(i.quantity)} عدد × {formatToman(i.unitToman)}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-soil-900/5 pt-2 sm:pt-0 shrink-0">
                  <span className="text-xs text-soil-700/60 sm:hidden">مبلغ کل:</span>
                  <p className="font-bold text-flora-900 text-sm sm:text-base">
                    {formatToman(i.lineTotalToman)}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
