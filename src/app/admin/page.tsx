import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

export default async function AdminPage() {
  await requireAdmin();

  const [revenue, orderCount, pendingCount, lowStock, topProducts, recentOrders] =
    await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalToman: true },
      }),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lt: 20 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: 6,
      }),
      prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
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
    ]);

  const stats = [
    { k: 'درآمد کل', v: formatToman(revenue._sum.totalToman ?? 0) },
    { k: 'سففارش موففق', v: `${toFa(orderCount)} سففارش` },
    { k: 'در انتظار اقدام', v: `${toFa(pendingCount)} سففارش` },
    { k: 'کالای کم‌موجود', v: `${toFa(lowStock.length)} قلم` },
  ];

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-black text-soil-900">پنل مدیریت</h1>
      <p className="mt-2 text-sm text-soil-700/70">
        مدیریت محصولات، سففارش‌ها و تراکنش‌های زرین‌پال
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border border-soil-900/10 bg-white p-5">
            <dt className="text-xs text-soil-700/70">{s.k}</dt>
            <dd className="mt-2 text-xl font-black text-soil-900">{s.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-soil-900/10 bg-white p-6">
          <h2 className="text-base font-black text-soil-900">پرففروش‌ترین محصولات</h2>
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
              <li className="py-4 text-sm text-soil-700/60">داده‌ای موجود نیست</li>
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
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    p.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}
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
          آخرین سففارش‌ها
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dust-50 text-soil-700/70">
              <tr>
                <th className="px-5 py-3 text-start font-medium">شماره</th>
                <th className="px-5 py-3 text-start font-medium">مشتری</th>
                <th className="px-5 py-3 text-start font-medium">مبلغ</th>
                <th className="px-5 py-3 text-start font-medium">وضعیت</th>
                <th className="px-5 py-3 text-start font-medium">کد پیگیری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soil-900/5">
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3.5 font-mono text-xs">{toFa(o.orderNumber)}</td>
                  <td className="px-5 py-3.5">
                    {o.user.fullName ?? toFa(o.user.phone ?? '—')}
                  </td>
                  <td className="px-5 py-3.5 font-bold">{formatToman(o.totalToman)}</td>
                  <td className="px-5 py-3.5 text-xs">
                    {o.paymentStatus === 'PAID' ? (
                      <span className="rounded-full bg-flora-100 px-2.5 py-0.5 font-bold text-flora-700">
                        پرداخت‌شده
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700">
                        {o.status === 'CANCELED' ? 'لغو‌شده' : 'در انتظار'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs" dir="ltr">
                    {o.refId ? toFa(o.refId) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
