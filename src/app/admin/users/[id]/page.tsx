import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import UserManagementActions from '@/components/admin/UserManagementActions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: {
        orderBy: { isDefault: 'desc' },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const totalSpent = user.orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalToman, 0);

  const totalOrders = user.orders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-soil-700/60 mb-1">
            <Link href="/admin/users" className="hover:text-soil-900">
              کاربران
            </Link>
            <span>/</span>
            <span>جزئیات کاربر</span>
          </div>
          <h1 className="text-2xl font-black text-soil-900">
            {user.fullName || 'کاربر بدون نام'}
          </h1>
          <p className="mt-1 text-xs text-soil-700/60">
            شناسه کاربر:{' '}
            <span className="font-mono" dir="ltr">
              {user.id}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              user.role === 'ADMIN'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-dust-100 text-soil-700'
            }`}
          >
            {user.role === 'ADMIN' ? 'مدیر سیستم' : 'مشتری'}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              user.isActive
                ? 'bg-flora-100 text-flora-800'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {user.isActive ? 'حساب فعال' : 'حساب غیرفعال'}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border border-soil-900/10 bg-white p-5 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-soil-900/10 pb-3">
            <h2 className="text-sm font-black text-soil-900">مشخصات کاربر</h2>
            <span className="text-xs text-soil-700/50">
              عضویت: {formatDateFa(user.createdAt)}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs text-soil-700/60">نام و نام‌خانوادگی</dt>
              <dd className="mt-1 font-bold text-soil-900">{user.fullName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-soil-700/60">شماره تلفن همراه</dt>
              <dd className="mt-1 font-mono text-xs font-bold text-soil-900" dir="ltr">
                {user.phone ? toFa(user.phone) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-soil-700/60">آدرس ایمیل</dt>
              <dd className="mt-1 font-mono text-xs text-soil-900" dir="ltr">
                {user.email || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-soil-700/60">آخرین ورود به حساب</dt>
              <dd className="mt-1 text-xs text-soil-900">
                {user.lastLoginAt ? formatDateFa(user.lastLoginAt) : 'نامشخص'}
              </dd>
            </div>
          </dl>

          {/* User management actions: Promote / Demote, Deactivate / Activate */}
          <div className="border-t border-soil-900/10 pt-4">
            <p className="mb-2 text-xs font-bold text-soil-700/80">عملیات حساب کاربری</p>
            <UserManagementActions
              userId={user.id}
              currentRole={user.role}
              currentIsActive={user.isActive}
            />
          </div>
        </div>

        {/* Financial / Purchasing Summary */}
        <div className="rounded-2xl border border-soil-900/10 bg-white p-5 space-y-4">
          <h2 className="border-b border-soil-900/10 pb-3 text-sm font-black text-soil-900">
            خلاصه فعالیت خرید
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-soil-700/60">کل سفارش‌ها</p>
              <p className="text-xl font-black text-soil-900">{toFa(totalOrders)} سفارش</p>
            </div>
            <div>
              <p className="text-xs text-soil-700/60">مجموع خرید موفق</p>
              <p className="text-xl font-black text-flora-800">{formatToman(totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Addresses (if any) */}
      {user.addresses.length > 0 && (
        <div className="rounded-2xl border border-soil-900/10 bg-white p-5">
          <h2 className="mb-3 text-sm font-black text-soil-900">
            آدرس‌های ثبت‌شده ({toFa(user.addresses.length)})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {user.addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-xl border border-soil-900/10 bg-dust-50/50 p-3.5 text-xs text-soil-800"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-soil-900">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-flora-100 px-2 py-0.5 text-[10px] font-bold text-flora-800">
                      پیش‌فرض
                    </span>
                  )}
                </div>
                <p className="text-soil-700/80 leading-5">
                  {addr.province}، {addr.city}، {addr.line1}
                  {addr.line2 ? `، ${addr.line2}` : ''}
                </p>
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-soil-700/60" dir="ltr">
                  <span>کدپستی: {toFa(addr.postalCode)}</span>
                  <span>تلفن: {toFa(addr.phone)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-soil-900/10 bg-white">
        <div className="flex items-center justify-between border-b border-soil-900/10 px-5 py-4">
          <h2 className="text-sm font-black text-soil-900">
            سفارش‌های کاربر ({toFa(user.orders.length)})
          </h2>
        </div>

        {user.orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-soil-700/60">
            هنوز سفارشی توسط این کاربر ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dust-50 text-soil-700/70">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">شماره سفارش</th>
                  <th className="px-4 py-3 text-start font-medium">تعداد اقلام</th>
                  <th className="px-4 py-3 text-start font-medium">مبلغ</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت پرداخت</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت سفارش</th>
                  <th className="px-4 py-3 text-start font-medium">تاریخ ثبت</th>
                  <th className="px-4 py-3 text-start font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soil-900/5">
                {user.orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-dust-50/50">
                    <td className="px-4 py-3.5 font-mono text-xs">{toFa(o.orderNumber)}</td>
                    <td className="px-4 py-3.5 text-xs text-soil-700/70">
                      {toFa(o._count.items)} قلم
                    </td>
                    <td className="px-4 py-3.5 font-bold text-soil-900">
                      {formatToman(o.totalToman)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge kind="payment" value={o.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-soil-700/60">
                      {formatDateFa(o.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-left">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs font-bold text-flora-700 hover:text-flora-900"
                      >
                        مشاهده سفارش ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
