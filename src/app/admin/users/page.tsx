import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { formatToman, toFa, formatDateFa } from '@/lib/format';

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const where = query
    ? {
        OR: [
          { fullName: { contains: query } },
          { phone: { contains: query } },
          { email: { contains: query } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        select: {
          totalToman: true,
          paymentStatus: true,
        },
      },
      _count: {
        select: { orders: true },
      },
    },
  });

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;
  const overallSpent = users.reduce((acc, u) => {
    const paidSpent = u.orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalToman, 0);
    return acc + paidSpent;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-soil-900">مدیریت کاربران</h1>
          <p className="mt-1 text-sm text-soil-700/70">
            {toFa(totalUsers)} کاربر ثبت‌نام شده در فروشگاه
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-soil-900/10 bg-white p-4">
          <p className="text-xs font-bold text-soil-700/60">تعداد کاربران</p>
          <p className="mt-2 text-xl font-black text-soil-900">{toFa(totalUsers)} نفر</p>
        </div>
        <div className="rounded-2xl border border-soil-900/10 bg-white p-4">
          <p className="text-xs font-bold text-soil-700/60">مدیران سیستم</p>
          <p className="mt-2 text-xl font-black text-amber-700">{toFa(totalAdmins)} مدیر</p>
        </div>
        <div className="rounded-2xl border border-soil-900/10 bg-white p-4">
          <p className="text-xs font-bold text-soil-700/60">مجموع خرید موفق</p>
          <p className="mt-2 text-xl font-black text-flora-800">{formatToman(overallSpent)}</p>
        </div>
      </div>

      {/* Search Bar */}
      <form
        method="GET"
        className="flex items-center gap-2 rounded-2xl border border-soil-900/10 bg-white p-2"
      >
        <span className="ps-2 text-soil-700/50">🔍</span>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="جستجو با نام، شماره همراه یا ایمیل..."
          className="flex-1 bg-transparent px-2 py-1.5 text-sm text-soil-900 placeholder:text-soil-700/50 outline-none"
        />
        {query && (
          <Link
            href="/admin/users"
            className="rounded-xl px-3 py-1.5 text-xs font-medium text-soil-700/70 hover:bg-dust-100"
          >
            پاک کردن
          </Link>
        )}
        <button
          type="submit"
          className="rounded-xl bg-flora-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-flora-800"
        >
          جستجو
        </button>
      </form>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-soil-900/15 bg-white p-12 text-center text-sm text-soil-700/70">
          <p className="text-3xl mb-2">👤</p>
          <p className="font-bold">کاربری یافت نشد.</p>
          {query && (
            <p className="mt-1 text-xs text-soil-700/50">
              با جستجوی عبارت «{query}» موردی یافت نشد.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-soil-900/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-soil-900/10 bg-dust-50 text-soil-700/70">
                <tr>
                  <th className="px-4 py-3.5 text-start font-medium">کاربر</th>
                  <th className="px-4 py-3.5 text-start font-medium">شماره تماس</th>
                  <th className="px-4 py-3.5 text-start font-medium">ایمیل</th>
                  <th className="px-4 py-3.5 text-start font-medium">نقش</th>
                  <th className="px-4 py-3.5 text-start font-medium">وضعیت</th>
                  <th className="px-4 py-3.5 text-start font-medium">سفارش‌ها</th>
                  <th className="px-4 py-3.5 text-start font-medium">مجموع خرید</th>
                  <th className="px-4 py-3.5 text-start font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soil-900/5">
                {users.map((user) => {
                  const paidSpent = user.orders
                    .filter((o) => o.paymentStatus === 'PAID')
                    .reduce((sum, o) => sum + o.totalToman, 0);

                  return (
                    <tr
                      key={user.id}
                      className="group cursor-pointer transition hover:bg-dust-50/70"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-dust-200 text-xs font-bold text-soil-700">
                            {user.fullName ? user.fullName[0] : '؟'}
                          </div>
                          <div>
                            <p className="font-bold text-soil-900 group-hover:text-flora-800 transition">
                              {user.fullName || 'بدون نام'}
                            </p>
                            <span className="text-[11px] text-soil-700/50">
                              عضویت: {formatDateFa(user.createdAt)}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs" dir="ltr">
                        <Link href={`/admin/users/${user.id}`}>
                          {user.phone ? toFa(user.phone) : '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-soil-700/80" dir="ltr">
                        <Link href={`/admin/users/${user.id}`}>
                          {user.email || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/admin/users/${user.id}`}>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              user.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-dust-100 text-soil-700'
                            }`}
                          >
                            {user.role === 'ADMIN' ? 'مدیر' : 'مشتری'}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/admin/users/${user.id}`}>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              user.isActive
                                ? 'bg-flora-100 text-flora-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-soil-700">
                        <Link href={`/admin/users/${user.id}`}>
                          {toFa(user._count.orders)} سفارش
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-soil-900">
                        <Link href={`/admin/users/${user.id}`}>
                          {paidSpent > 0 ? formatToman(paidSpent) : '۰ تومان'}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-left">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex items-center text-xs font-bold text-flora-700 hover:text-flora-900"
                        >
                          جزئیات ←
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
