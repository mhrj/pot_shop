import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import StatusBadge from '@/components/ui/StatusBadge';

const FILTERS = [
  { key: 'all', label: 'همه' },
  { key: 'PENDING', label: 'در انتظار' },
  { key: 'PAID', label: 'پرداخت‌شده' },
  { key: 'PROCESSING', label: 'در حال آماده‌سازی' },
  { key: 'SHIPPED', label: 'ارسال‌شده' },
  { key: 'DELIVERED', label: 'تحویل‌شده' },
  { key: 'CANCELED', label: 'لغو‌شده' },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = status ?? 'all';

  const where =
    active === 'all'
      ? {}
      : active === 'PENDING'
        ? { OR: [{ status: 'PENDING' as const }, { paymentStatus: 'PENDING' as const }] }
        : { status: active as 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED' };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { fullName: true, phone: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-soil-900">سفارش‌ها</h1>
      <p className="mt-2 text-sm text-soil-700/70">
        {toFa(orders.length)} سفارش در این نمایش
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/admin/orders' : '/admin/orders?status=' + f.key}
            className={
              'rounded-full px-3.5 py-1.5 text-xs font-bold transition ' +
              (active === f.key
                ? 'bg-flora-900 text-white'
                : 'bg-dust-100 text-soil-700 hover:bg-dust-200')
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-soil-900/15 px-6 py-12 text-center text-sm text-soil-700/70">
          سفارشی در این دسته یافت نشد.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-soil-900/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dust-50 text-soil-700/70">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">شماره</th>
                  <th className="px-4 py-3 text-start font-medium">مشتری</th>
                  <th className="px-4 py-3 text-start font-medium">اقلام</th>
                  <th className="px-4 py-3 text-start font-medium">مبلغ</th>
                  <th className="px-4 py-3 text-start font-medium">پرداخت</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-start font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-start font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soil-900/5">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3.5 font-mono text-xs">{toFa(o.orderNumber)}</td>
                    <td className="px-4 py-3.5">
                      {o.user.fullName ?? toFa(o.user.phone ?? '—')}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-soil-700/70">
                      {toFa(o._count.items)} قلم
                    </td>
                    <td className="px-4 py-3.5 font-bold">{formatToman(o.totalToman)}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge kind="payment" value={o.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-soil-700/60">
                      {formatDateFa(o.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={'/admin/orders/' + o.id}
                        className="text-xs font-bold text-flora-700 hover:text-flora-900"
                      >
                        مدیریت ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
