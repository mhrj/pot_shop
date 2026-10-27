import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';
import StatusBadge from '@/components/ui/StatusBadge';
import AddressBook from '@/components/dashboard/AddressBook';
import ReorderButton from '@/components/dashboard/ReorderButton';
import { formatCarrierName } from '@/lib/orders';
import ShippingScheduleNotice from '@/components/ui/ShippingScheduleNotice';

export default async function DashboardPage() {
  const user = await requireUser();

  const [orders, addresses] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: { take: 4 },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' },
    }),
  ]);

  return (
    <Container className="py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-soil-900 dark:text-dust-50">
            سلام{user.fullName ? `، ${user.fullName}` : ''} 👋
          </h1>
          <p className="mt-2 text-sm text-soil-700/70 dark:text-dust-200/70">سفارش‌ها و آدرس‌های شما</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="rounded-full border border-soil-900/15 dark:border-dust-50/20 px-5 py-2.5 text-xs font-bold text-soil-900 dark:text-dust-50 transition hover:bg-dust-50 dark:hover:bg-flora-900">
            خروج از حساب
          </button>
        </form>
      </header>

      <div className="mt-6">
        <ShippingScheduleNotice />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-black text-soil-900 dark:text-dust-50">سفارش‌های من</h2>

        {orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-soil-900/15 dark:border-dust-50/20 px-6 py-10 text-center text-sm text-soil-700/70 dark:text-dust-200/70">
            هنوز سفارشی ثبت نکرده‌اید.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={"/dashboard/orders/" + order.id}
                  className="group block rounded-2xl border border-soil-900/10 dark:border-dust-50/10 bg-white dark:bg-flora-900 p-5 transition hover:border-soil-900/25 dark:hover:border-dust-50/25 hover:shadow-md dark:hover:shadow-none"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soil-900/5 dark:border-dust-50/10 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-soil-900 dark:text-dust-50">
                        {toFa(order.orderNumber)}
                      </span>
                      <StatusBadge kind="order" value={order.status} />
                      <StatusBadge kind="payment" value={order.paymentStatus} />
                    </div>
                    <span className="text-xs text-soil-700/60 dark:text-dust-200/60">
                      {formatDateFa(order.createdAt)}
                    </span>
                  </div>

                  {/* Item Thumbnails and Names Summary */}
                  <div className="flex flex-wrap items-center gap-4 py-4">
                    {order.items.length > 0 && (
                      <div className="flex -space-x-3 rtl:space-x-reverse shrink-0">
                        {order.items.slice(0, 3).map((item, idx) =>
                          item.imageUrl ? (
                            <img
                              key={item.id || idx}
                              src={item.imageUrl}
                              alt={item.productName}
                              className="relative z-10 w-12 h-12 rounded-full border-2 border-white dark:border-flora-900 object-cover"
                            />
                          ) : (
                            <div
                              key={item.id || idx}
                              className="relative z-10 flex w-12 h-12 items-center justify-center rounded-full border-2 border-white dark:border-flora-900 bg-dust-100 dark:bg-flora-800 text-soil-700/50 dark:text-dust-200/50 text-xs"
                            >
                              🏺
                            </div>
                          )
                        )}
                        {order._count.items > 3 && (
                          <div className="relative z-10 flex w-12 h-12 items-center justify-center rounded-full border-2 border-white dark:border-flora-900 bg-dust-200 dark:bg-flora-800 text-xs font-bold text-soil-800 dark:text-dust-100">
                            +{toFa(order._count.items - 3)}
                          </div>
                        )}
                      </div>
                    )}

                    {order.items.length > 0 && (
                      <div className="text-xs text-soil-800 dark:text-dust-100">
                        <span className="font-bold">{order.items[0]?.productName}</span>
                        {order._count.items > 1 && (
                          <span className="text-soil-700/70 dark:text-dust-200/70">
                            {' '}و {toFa(order._count.items - 1)} محصول دیگر
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-soil-900/5 dark:border-dust-50/10 pt-4 text-xs text-soil-700/80 dark:text-dust-200/80">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <span>
                        مبلغ: <b className="text-soil-900 dark:text-dust-50">{formatToman(order.totalToman)}</b>
                      </span>
                      <span>
                        تعداد اقلام: <b className="text-soil-900 dark:text-dust-50">{toFa(order._count.items)}</b>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-dust-100 dark:bg-flora-800/80 px-2.5 py-1 text-xs text-soil-700 dark:text-dust-200">
                        <span>🚚</span>
                        <span>ارسال با {formatCarrierName(order.shippingCarrier)}</span>
                      </span>
                      {order.refId && (
                        <span dir="ltr">
                          کد پیگیری: <b className="font-mono text-flora-700 dark:text-flora-300">{toFa(order.refId)}</b>
                        </span>
                      )}
                      {order.trackingCode && (
                        <span>
                          مرسوله: <b className="text-soil-900 dark:text-dust-50">{toFa(order.trackingCode)}</b>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-dust-100 dark:bg-flora-800 px-4 py-2 text-[11px] font-bold text-soil-900 dark:text-dust-50 transition group-hover:bg-dust-200 dark:group-hover:bg-flora-700">
                        جزئیات سفارش
                      </span>
                      <ReorderButton orderId={order.id} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-black text-soil-900 dark:text-dust-50">آدرس‌های ذخیره‌شده</h2>
        <p className="mt-2 text-sm text-soil-700/70 dark:text-dust-200/70">
          آدرس پیش‌فرض هنگام تسویه‌حساب به‌صورت خودکار انتخاب می‌شود.
        </p>
        <div className="mt-5">
          <AddressBook
            initial={addresses.map((a) => ({
              id: a.id,
              label: a.label,
              fullName: a.fullName,
              phone: a.phone,
              province: a.province,
              city: a.city,
              postalCode: a.postalCode,
              line1: a.line1,
              line2: a.line2,
              isDefault: a.isDefault,
            }))}
          />
        </div>
      </section>
    </Container>
  );
}
