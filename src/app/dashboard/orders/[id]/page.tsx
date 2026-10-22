import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';
import StatusBadge from '@/components/ui/StatusBadge';
import { allowedTransitions, ORDER_STATUS_LABELS, isOrderStatus, TIMELINE, formatCarrierName } from '@/lib/orders';
import { channelLabel } from '@/lib/analytics';
import CancelOrderButton from '@/components/dashboard/CancelOrderButton';
import ItemColorBadge from '@/components/ui/ItemColorBadge';
import PrintInvoiceButton from '@/components/orders/PrintInvoiceButton';
import BundleDetailsAccordion from '@/components/orders/BundleDetailsAccordion';

type Props = { params: Promise<{ id: string }> };

function renderItemSpecs(item: {
  material?: string | null;
  diameterCm?: number | null;
  heightCm?: number | null;
}) {
  const parts: string[] = [];
  if (item.material) parts.push(`جنس: ${item.material}`);
  if (item.diameterCm && item.heightCm) {
    parts.push(`ابعاد: قطر ${toFa(item.diameterCm)} × ارتفاع ${toFa(item.heightCm)} سانتی‌متر`);
  } else if (item.diameterCm) {
    parts.push(`قطر ${toFa(item.diameterCm)} سانتی‌متر`);
  } else if (item.heightCm) {
    parts.push(`ارتفاع ${toFa(item.heightCm)} سانتی‌متر`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export default async function CustomerOrderPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    // Scoped by userId so another customer's id simply 404s.
    where: { id, userId: user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              bundleItems: true,
            },
          },
        },
      },
      user: { select: { fullName: true, phone: true, email: true } },
    },
  });
  if (!order) notFound();

  const status = isOrderStatus(order.status) ? order.status : 'PENDING';
  const isCanceled = status === 'CANCELED';
  const currentIndex = (TIMELINE as readonly string[]).indexOf(status);
  const canCancel = allowedTransitions(status).includes('CANCELED');

  return (
    <Container className="py-12 print:max-w-full print:p-0 print:m-0 print:py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <nav className="text-xs text-soil-700/60">
          <Link href="/dashboard" className="hover:text-flora-700">
            حساب من
          </Link>
          <span className="mx-2">/</span>
          <span>سفارش {toFa(order.orderNumber)}</span>
        </nav>
        <PrintInvoiceButton />
      </div>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-soil-900/10 pb-5 print:mt-1 print:pb-2 print:gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-soil-700/70 print:text-[11px]">شماره سفارش:</span>
            <h1 className="font-mono text-2xl font-black text-soil-900 print:text-lg">
              {toFa(order.orderNumber)}
            </h1>
          </div>
          <p className="mt-1 text-xs text-soil-700/70 print:text-[10px]">
            تاریخ ثبت: {formatDateFa(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="order" value={order.status} />
          <StatusBadge kind="payment" value={order.paymentStatus} />
        </div>
      </header>

      {isCanceled ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700 print:mt-2 print:py-2">
          این سفارش لغو شده است.
        </p>
      ) : (
        <div className="mt-8 print:mt-2">
          {status === 'PENDING' && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 print:hidden">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              در انتظار پرداخت — پس از نهایی‌سازی پرداخت، سفارش شما وارد فرآیند آماده‌سازی می‌شود.
            </div>
          )}
          <ol className="grid gap-3 grid-cols-2 sm:grid-cols-4 print:flex print:flex-row print:justify-between print:gap-2 print:p-1.5 print:rounded-lg print:border print:border-soil-900/10 print:bg-dust-50/50 print:text-xs">
            {TIMELINE.map((step, index) => {
              const isCurrent = index === currentIndex;
              const isDone = currentIndex >= 0 && index < currentIndex;

              return (
                <li
                  key={step}
                  className={
                    'rounded-2xl border p-4 text-xs font-bold transition ' +
                    (isCurrent
                      ? 'border-flora-600 bg-flora-50 text-flora-950 shadow-xs ring-2 ring-flora-500/25'
                      : isDone
                        ? 'border-flora-200 bg-flora-100/70 text-flora-800'
                        : 'border-soil-900/10 bg-white text-soil-700/40') +
                    ' print:border-none print:bg-transparent print:p-0 print:shadow-none print:ring-0 print:text-[10px]'
                  }
                >
                  <div className="flex items-center justify-between mb-1.5 print:mb-0 print:inline-flex print:gap-1">
                    <span className="text-[10px] print:text-[9px] opacity-75">
                      {isDone ? '✓ ' : ''}مرحله {toFa(index + 1)}:
                    </span>
                    <span className="text-sm font-black print:text-[10px]">{ORDER_STATUS_LABELS[step]}</span>
                    {isCurrent && (
                      <span className="mt-1 inline-block text-[10px] print:text-[9px] font-medium text-flora-700 print:mt-0">
                        (کنونی)
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {order.trackingCode && (
        <p className="mt-4 text-sm text-soil-700/80">
          کد رهگیری {formatCarrierName(order.shippingCarrier)}:{' '}
          <b className="font-mono text-soil-900" dir="ltr">
            {toFa(order.trackingCode)}
          </b>
        </p>
      )}

      {order.note && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex items-center gap-2 font-black text-amber-900 mb-1">
            <svg className="size-4 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>یادداشت مشتری:</span>
          </div>
          <p className="leading-6 text-amber-900/90 whitespace-pre-wrap">{order.note}</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] print:mt-2 print:grid-cols-1">
        <section className="rounded-2xl border border-soil-900/10 bg-white p-6 print:p-2 print:shadow-none print:border print:border-soil-900/10">
          <h2 className="text-sm font-black text-soil-900 print:text-xs">اقلام سفارش</h2>
          <div className="mt-4 divide-y divide-soil-900/10 print:mt-1">
            {order.items.map((item) => {
              const specs = renderItemSpecs(item);
              const bundleSize = item.bundleSize && item.bundleSize > 1 ? item.bundleSize : 1;
              const isBundle = bundleSize > 1;
              const displayQty = isBundle ? Math.round(item.quantity / bundleSize) : item.quantity;
              const displayUnitPrice = isBundle ? item.unitToman * bundleSize : item.unitToman;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between print:flex-row print:items-center print:justify-between print:py-1 print:gap-2 print:break-inside-avoid"
                >
                  <div className="flex items-start sm:items-center gap-4 print:gap-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 border border-soil-900/10 shadow-2xs print:w-10 print:h-10 print:rounded-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-dust-100 border border-soil-900/10 flex items-center justify-center text-soil-700/40 shrink-0 print:w-10 print:h-10 print:rounded-md">
                        <svg className="w-7 h-7 print:w-5 print:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="space-y-1.5 print:space-y-0.5 print:text-[10px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="font-bold text-soil-900 hover:text-flora-700 transition print:text-xs"
                        >
                          {item.productName}
                        </Link>
                        {isBundle && (
                          <span className="inline-flex items-center rounded-md bg-flora-100 px-2 py-0.5 text-[11px] font-bold text-flora-800 border border-flora-300 print:text-[9px] print:px-1.5 print:py-0">
                            شامل {toFa(bundleSize)} عدد گلدان
                          </span>
                        )}
                      </div>

                      {item.sku && (
                        <p className="text-xs text-soil-700/60 print:text-[9px]">
                          کد کالا:{' '}
                          <span className="font-mono font-medium" dir="ltr">
                            {item.sku}
                          </span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-soil-700/75 print:text-[9px]">
                        {specs && <span>{specs}</span>}
                        {!isBundle && <ItemColorBadge colorData={item.colorData} />}
                      </div>

                      {isBundle && (
                        <BundleDetailsAccordion
                          bundleSize={bundleSize}
                          colorData={item.colorData}
                          productBundleItems={item.product?.bundleItems}
                        />
                      )}

                      <div className="flex items-center gap-2 flex-wrap text-xs text-soil-700/80 print:text-[9px]">
                        <p>
                          {isBundle ? (
                            <>
                              {toFa(displayQty)} بسته × {formatToman(displayUnitPrice)} ={' '}
                              <span className="font-bold text-soil-900">
                                {formatToman(item.lineTotalToman)}
                              </span>
                            </>
                          ) : (
                            <>
                              {toFa(displayQty)} عدد × {formatToman(displayUnitPrice)} ={' '}
                              <span className="font-bold text-soil-900">
                                {formatToman(item.lineTotalToman)}
                              </span>
                            </>
                          )}
                        </p>
                        {item.tierLabel && (
                          <span className="rounded-md bg-flora-50 px-2 py-0.5 text-[11px] font-medium text-flora-800 border border-flora-200/60 print:text-[9px]">
                            سطح: {item.tierLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-soil-900/5 pt-2 sm:pt-0 shrink-0 print:border-0 print:pt-0">
                    <span className="text-xs text-soil-700/60 sm:hidden">مبلغ کل:</span>
                    <p className="font-bold text-flora-900 text-sm sm:text-base print:text-xs">
                      {formatToman(item.lineTotalToman)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <dl className="mt-5 space-y-2 border-t border-soil-900/10 pt-4 text-sm print:mt-2 print:pt-2 print:space-y-1 print:text-[10px]">
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
            <div className="flex justify-between border-t border-soil-900/10 pt-3 text-base print:pt-1.5 print:text-xs">
              <dt className="font-black text-soil-900">مبلغ پرداختی</dt>
              <dd className="font-black text-soil-900">{formatToman(order.totalToman)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6 print:space-y-0 print:grid print:grid-cols-2 print:gap-2 print:mt-2">
          <section className="rounded-2xl border border-soil-900/10 bg-white p-6 space-y-3 print:p-2 print:space-y-1 print:shadow-none print:border print:border-soil-900/10 print:text-[10px]">
            <h2 className="text-sm font-black text-soil-900 border-b border-soil-900/5 pb-2 print:text-xs print:pb-1">
              اطلاعات تحویل و خریدار
            </h2>
            <dl className="space-y-2.5 text-sm print:space-y-1 print:text-[10px]">
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">نام گیرنده:</dt>
                <dd className="font-bold text-soil-900">
                  {order.shipFullName || order.user.fullName || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">شماره موبایل:</dt>
                <dd className="font-mono text-xs text-soil-900 font-bold print:text-[10px]" dir="ltr">
                  {toFa(order.shipPhone || order.user.phone || '—')}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">ایمیل:</dt>
                <dd className="font-mono text-xs text-soil-900 print:text-[10px]" dir="ltr">
                  {order.user.email || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">شرکت حمل و نقل:</dt>
                <dd className="font-bold text-soil-900">
                  {formatCarrierName(order.shippingCarrier)}
                </dd>
              </div>
              <div className="pt-2 border-t border-soil-900/5 print:pt-1">
                <dt className="text-soil-700/70 mb-1 print:mb-0.5">نشانی پستی:</dt>
                <dd className="text-xs leading-6 text-soil-800 font-medium print:text-[10px] print:leading-4">
                  {order.shipProvince}، {order.shipCity}، {order.shipLine1}
                  {order.shipLine2 ? `، ${order.shipLine2}` : ''}
                  <div className="mt-1 font-mono text-soil-700/70 print:mt-0.5 print:text-[10px]" dir="ltr">
                    کد پستی: {toFa(order.shipPostalCode)}
                  </div>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-soil-900/10 bg-white p-6 print:p-2 print:shadow-none print:border print:border-soil-900/10 print:text-[10px]">
            <h2 className="text-sm font-black text-soil-900 border-b border-soil-900/5 pb-2 print:text-xs print:pb-1">
              اطلاعات پرداخت
            </h2>
            <dl className="mt-3 space-y-2 text-sm print:mt-1 print:space-y-1 print:text-[10px]">
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">کانال خرید</dt>
                <dd className="font-bold text-soil-900">{channelLabel(order.channel)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-soil-700/70">کد پیگیری</dt>
                <dd className="font-mono text-xs text-soil-900 print:text-[10px]" dir="ltr">
                  {order.refId ? toFa(order.refId) : '—'}
                </dd>
              </div>
              {order.paidAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-soil-700/70">زمان پرداخت</dt>
                  <dd className="text-xs text-soil-900 print:text-[10px]">{formatDateFa(order.paidAt)}</dd>
                </div>
              )}
            </dl>
          </section>

          <div className="flex flex-wrap gap-3 print:hidden">
            <form action="/api/cart/reorder" method="post">
              <input type="hidden" name="orderId" value={order.id} />
              <button className="rounded-full bg-flora-900 px-5 py-2.5 text-xs font-black text-white transition hover:bg-flora-700 cursor-pointer">
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
