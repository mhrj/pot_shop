import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import OrderStatusForm from '@/components/admin/OrderStatusForm';
import StatusBadge from '@/components/ui/StatusBadge';
import ItemColorBadge from '@/components/ui/ItemColorBadge';
import PrintInvoiceButton from '@/components/orders/PrintInvoiceButton';
import { isOrderStatus, ORDER_STATUS_LABELS, TIMELINE } from '@/lib/orders';

type Props = { params: Promise<{ id: string }> };

function renderItemSpecs(item: {
  material?: string | null;
  diameterCm?: number | null;
  heightCm?: number | null;
}) {
  const parts: string[] = [];
  if (item.material) parts.push(`جنس: ${item.material}`);
  if (item.diameterCm && item.heightCm) {
    parts.push(`ابعاد: قطر ${toFa(item.diameterCm)} × ارتفاع ${toFa(item.heightCm)} سانتیمتر`);
  } else if (item.diameterCm) {
    parts.push(`قطر ${toFa(item.diameterCm)} سانتیمتر`);
  } else if (item.heightCm) {
    parts.push(`ارتفاع ${toFa(item.heightCm)} سانتیمتر`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

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

  const status = isOrderStatus(order.status) ? order.status : 'PENDING';
  const isCanceled = status === 'CANCELED';
  const currentIndex = (TIMELINE as readonly string[]).indexOf(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soil-900/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-soil-700/70">سفارش شماره:</span>
            <h1 className="font-mono text-2xl font-black text-soil-900">
              {toFa(order.orderNumber)}
            </h1>
          </div>
          <p className="mt-1 text-xs text-soil-700/70">
            تاریخ ثبت: {formatDateFa(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrintInvoiceButton />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {isCanceled ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          این سفارش لغو شده است.
        </p>
      ) : (
        <ol className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {TIMELINE.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isDone = currentIndex >= 0 && index < currentIndex;

            return (
              <li
                key={step}
                className={
                  'rounded-2xl border p-3.5 text-xs font-bold transition ' +
                  (isCurrent
                    ? 'border-flora-600 bg-flora-50 text-flora-950 ring-2 ring-flora-500/20'
                    : isDone
                      ? 'border-flora-200 bg-flora-100/70 text-flora-800'
                      : 'border-soil-900/10 bg-white text-soil-700/40')
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] opacity-75">مرحله {toFa(index + 1)}</span>
                  {isDone && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-flora-700 text-[10px] text-white">
                      ✓
                    </span>
                  )}
                  {isCurrent && (
                    <span className="size-2 rounded-full bg-flora-600 animate-ping" />
                  )}
                </div>
                <p className="text-xs font-black">{ORDER_STATUS_LABELS[step]}</p>
                {isCurrent && (
                  <span className="mt-0.5 inline-block text-[10px] font-medium text-flora-700">
                    وضعیت کنونی
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {order.note && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex items-center gap-2 font-black text-amber-900 mb-1">
            <svg className="size-4 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>یادداشت مشتری:</span>
          </div>
          <p className="leading-6 text-amber-900/90 whitespace-pre-wrap">{order.note}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="text-sm font-black text-soil-900 border-b border-soil-900/5 pb-2">
            اطلاعات مشتری
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">نام</dt>
              <dd className="font-bold text-soil-900">{order.user.fullName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">موبایل</dt>
              <dd className="font-mono text-xs text-soil-900 font-bold" dir="ltr">
                {toFa(order.user.phone ?? order.shipPhone ?? '—')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">ایمیل</dt>
              <dd className="font-mono text-xs text-soil-900" dir="ltr">
                {order.user.email ?? '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="text-sm font-black text-soil-900 border-b border-soil-900/5 pb-2">
            آدرس ارسال
          </h2>
          <p className="mt-3 text-sm leading-7 text-soil-700/85">
            {order.shipFullName}<br />
            {order.shipProvince}، {order.shipCity}، {order.shipLine1}
            {order.shipLine2 ? '، ' + order.shipLine2 : ''}<br />
            <span className="text-xs text-soil-700/60" dir="ltr">
              {toFa(order.shipPhone)} · کد پستی: {toFa(order.shipPostalCode)}
            </span>
          </p>
        </section>

        <section className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="text-sm font-black text-soil-900 border-b border-soil-900/5 pb-2">
            اطلاعات پرداخت
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">وضعیت پرداخت</dt>
              <dd><StatusBadge kind="payment" value={order.paymentStatus} /></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-soil-700/70">مبلغ کل</dt>
              <dd className="font-bold text-soil-900">{formatToman(order.totalToman)}</dd>
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
          <h2 className="text-sm font-black text-soil-900 border-b border-soil-900/5 pb-2">
            اقلام سفارش
          </h2>
          <div className="mt-4 divide-y divide-soil-900/10">
            {order.items.map((i) => {
              const specs = renderItemSpecs(i);
              const isBundle = Boolean(
                i.isBundle ||
                (i.bundleSize && i.bundleSize > 1) ||
                (i.tierLabel && i.tierLabel.includes('ست')) ||
                (typeof i.colorData === 'object' &&
                  i.colorData &&
                  'bundleColors' in (i.colorData as Record<string, unknown>))
              );
              const bundleCount = i.bundleSize && i.bundleSize > 1 ? i.bundleSize : 2;

              return (
                <div
                  key={i.id}
                  className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {i.imageUrl ? (
                      <img
                        src={i.imageUrl}
                        alt={i.productName}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 border border-soil-900/10 shadow-2xs"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-dust-100 border border-soil-900/10 flex items-center justify-center text-soil-700/40 shrink-0">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/products/${i.productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-soil-900 hover:text-flora-700 transition"
                        >
                          {i.productName}
                        </Link>
                        {isBundle && (
                          <span className="inline-flex items-center rounded-md bg-flora-100 px-2 py-0.5 text-[11px] font-bold text-flora-800 border border-flora-300">
                            شامل {toFa(bundleCount)} عدد گلدان
                          </span>
                        )}
                        {i.tierLabel && (
                          <span className="rounded-md bg-flora-50 px-2 py-0.5 text-xs font-medium text-flora-800 border border-flora-200/60">
                            سطح: {i.tierLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-soil-700/75">
                        {specs && <span>{specs}</span>}
                        <ItemColorBadge colorData={i.colorData} />
                      </div>

                      <p className="text-xs text-soil-700/80">
                        {toFa(i.quantity)} عدد × {formatToman(i.unitToman)} ={' '}
                        <span className="font-bold text-soil-900">
                          {formatToman(i.lineTotalToman)}
                        </span>
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
              );
            })}
          </div>
        </section>
      </div>

      <div className="print:hidden">
        <OrderStatusForm
          orderId={order.id}
          initialStatus={order.status}
          initialTracking={order.trackingCode ?? ''}
        />
      </div>
    </div>
  );
}
