import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, toFa } from '@/lib/format';
import {
  summarizeChannels,
  summarizeFulfillment,
  type ReportingOrder,
} from '@/lib/analytics';
import StatusBadge from '@/components/ui/StatusBadge';
import LandingImageManager from '@/components/admin/LandingImageManager';
import SalesChart from '@/components/admin/SalesChart';

const WINDOW_DAYS = 90;

export default async function AdminPage() {
  await requireAdmin();

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);

  const [
    revenue,
    totalOrderCount,
    paidOrderCount,
    awaitingCount,
    windowOrders,
    lowStock,
    topProducts,
    recentOrders,
    landingImages,
  ] = await Promise.all([
    // Revenue counts verified payments only.
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalToman: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: 'PAID' } }),
    prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: windowStart } },
      select: {
        paymentStatus: true,
        status: true,
        channel: true,
        totalToman: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lt: 20 } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: 'asc' },
      take: 6,
    }),
    // Best sellers are measured on verified orders only, so a failed or
    // abandoned checkout never inflates the ranking.
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: { order: { paymentStatus: 'PAID' } },
      _sum: { quantity: true, lineTotalToman: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        totalToman: true,
        status: true,
        paymentStatus: true,
        refId: true,
        createdAt: true,
        user: { select: { fullName: true, phone: true } },
      },
    }),
    prisma.landingImage.findMany({
      orderBy: { key: 'asc' },
      select: { key: true, url: true, alt: true },
    }),
  ]);

  const orders = windowOrders as ReportingOrder[];
  const channels = summarizeChannels(orders);
  const fulfillment = summarizeFulfillment(windowOrders);
  const maxFulfillment = Math.max(...fulfillment.map((f) => f.count), 1);
  const hasAnyOrder = totalOrderCount > 0;

  const stats = [
    {
      k: 'درآمد تأییدشده',
      v: formatToman(revenue._sum.totalToman ?? 0),
      hint: 'فقط سفارش‌های پرداخت‌شده',
    },
    {
      k: 'کل سفارش‌ها',
      v: toFa(totalOrderCount) + ' سفارش',
      hint: 'شامل سفارش‌های ناتمام',
    },
    {
      k: 'پرداخت‌شده',
      v: toFa(paidOrderCount) + ' سفارش',
      hint: 'تأییدشده توسط درگاه',
    },
    {
      k: 'در انتظار اقدام',
      v: toFa(awaitingCount) + ' سفارش',
      hint: 'آماده‌سازی یا ارسال',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-soil-900">پنل مدیریت</h1>
      <p className="mt-2 text-sm text-soil-700/70">
        مدیریت محصولات، سفارش‌ها و تراکنش‌های زرین‌پال
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border border-soil-900/10 bg-white p-5">
            <dt className="text-xs text-soil-700/70">{s.k}</dt>
            <dd className="mt-2 text-xl font-black text-soil-900">{s.v}</dd>
            <p className="mt-1 text-[11px] text-soil-700/50">{s.hint}</p>
          </div>
        ))}
      </dl>

      {!hasAnyOrder && (
        <p className="mt-6 rounded-2xl border border-dashed border-soil-900/15 px-6 py-8 text-center text-sm text-soil-700/70">
          هنوز سفارشی ثبت نشده است. آمار با ثبت اولین سفارش نمایش داده می‌شود.
        </p>
      )}

      <div className="mt-8">
        <SalesChart orders={orders} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
          <h2 className="text-base font-black text-soil-900">فروش بر پایه کانال</h2>
          <p className="mt-1.5 text-xs text-soil-700/60">
            سفارش‌های پرداخت‌شده در {toFa(WINDOW_DAYS)} روز گذشته
          </p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-soil-700/60">
              <tr>
                <th scope="col" className="py-2 text-start font-medium">کانال</th>
                <th scope="col" className="py-2 text-start font-medium">سفارش</th>
                <th scope="col" className="py-2 text-start font-medium">درآمد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soil-900/5">
              {channels.map((c) => (
                <tr key={c.channel}>
                  <td className="py-3 font-bold text-soil-900">{c.label}</td>
                  <td className="py-3 text-soil-700/80">{toFa(c.orderCount)}</td>
                  <td className="py-3 font-bold text-flora-900">
                    {formatToman(c.revenueToman)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
          <h2 className="text-base font-black text-soil-900">وضعیت انجام سفارش‌ها</h2>
          <p className="mt-1.5 text-xs text-soil-700/60">
            همه سفارش‌های {toFa(WINDOW_DAYS)} روز گذشته
          </p>
          <ul className="mt-4 space-y-3">
            {fulfillment.map((f) => (
              <li key={f.status}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-soil-900">{f.label}</span>
                  <span className="text-soil-700/70">{toFa(f.count)} سفارش</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-[4px] bg-dust-100">
                  <div
                    style={{ width: `${(f.count / maxFulfillment) * 100}%` }}
                    className="h-full rounded-[4px] bg-flora-500"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10 rounded-2xl border border-soil-900/10 bg-white p-6">
        <h2 className="text-base font-black text-soil-900">تصاویر صفحه اصلی</h2>
        <p className="mt-2 text-sm text-soil-700/70">
          تصویر را از دستگاه خود انتخاب کنید؛ فایل روی سرور ذخیره و در صفحه اصلی
          نمایش داده می‌شود.
        </p>
        <div className="mt-5">
          <LandingImageManager initial={landingImages} />
        </div>
      </section>

      <div className="mt-10 grid gap-6">
        <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
          <h2 className="text-base font-black text-soil-900">پرفروش‌ترین محصولات</h2>
          <p className="mt-1.5 text-xs text-soil-700/60">
            بر پایه سفارش‌های پرداخت‌شده
          </p>
          <ul className="mt-4 divide-y divide-soil-900/5">
            {topProducts.map((p) => (
              <li
                key={p.productId ?? p.productName}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-soil-900">{p.productName}</span>
                <span className="text-xs text-soil-700/70">
                  {toFa(p._sum.quantity ?? 0)} عدد · {formatToman(p._sum.lineTotalToman ?? 0)}
                </span>
              </li>
            ))}
            {topProducts.length === 0 && (
              <li className="py-4 text-sm text-soil-700/60">
                هنوز خریدی ثبت نشده است.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
          <h2 className="text-base font-black text-soil-900">هشدار موجودی</h2>
          <ul className="mt-4 divide-y divide-soil-900/5">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-soil-900">{p.name}</span>
                <span
                  className={
                    'rounded-full px-2.5 py-0.5 text-[11px] font-bold ' +
                    (p.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')
                  }
                >
                  {toFa(p.stock)} عدد
                </span>
              </li>
            ))}
            {lowStock.length === 0 && (
              <li className="py-4 text-sm text-soil-700/60">موجودی همه اقلام مناسب است</li>
            )}
          </ul>
        </section>
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border border-soil-900/10 bg-white">
        <h2 className="border-b border-soil-900/5 px-6 py-4 text-base font-black text-soil-900">
          آخرین سفارش‌ها
        </h2>
        {recentOrders.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-soil-700/70">
            هنوز سفارشی ثبت نشده است.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dust-50 text-soil-700/70">
                <tr>
                  <th className="px-5 py-3 text-start font-medium">شماره</th>
                  <th className="px-5 py-3 text-start font-medium">مشتری</th>
                  <th className="px-5 py-3 text-start font-medium">مبلغ</th>
                  <th className="px-5 py-3 text-start font-medium">وضعیت پرداخت</th>
                  <th className="px-5 py-3 text-start font-medium">وضعیت سفارش</th>
                  <th className="px-5 py-3 text-start font-medium">کد پیگیری</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soil-900/5">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3.5 font-mono text-xs">
                      <Link
                        href={'/admin/orders/' + o.id}
                        className="font-bold text-flora-700 hover:text-flora-900"
                      >
                        {toFa(o.orderNumber)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      {o.user.fullName ?? toFa(o.user.phone ?? '—')}
                    </td>
                    <td className="px-5 py-3.5 font-bold">{formatToman(o.totalToman)}</td>
                    <td className="px-5 py-3.5 text-xs">
                      <StatusBadge kind="payment" value={o.paymentStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <StatusBadge kind="order" value={o.status} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" dir="ltr">
                      {o.refId ? toFa(o.refId) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
