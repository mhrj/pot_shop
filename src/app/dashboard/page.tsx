import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';
import StatusBadge from '@/components/ui/StatusBadge';
import AddressBook from '@/components/dashboard/AddressBook';

export default async function DashboardPage() {
  const user = await requireUser();

  const [orders, addresses] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { take: 3 } },
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
          <h1 className="text-2xl font-black text-soil-900">
            سلام{user.fullName ? `، ${user.fullName}` : ''} 👋
          </h1>
          <p className="mt-2 text-sm text-soil-700/70">سفارش‌ها و آدرس‌های شما</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="rounded-full border border-soil-900/15 px-5 py-2.5 text-xs font-bold text-soil-900 transition hover:bg-dust-50">
            خروج از حساب
          </button>
        </form>
      </header>

      <section className="mt-10">
        <h2 className="text-lg font-black text-soil-900">سفارش‌های من</h2>

        {orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-soil-900/15 px-6 py-10 text-center text-sm text-soil-700/70">
            هنوز سفارشی ثبت نکرده‌اید.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-soil-900/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-soil-900">
                      {toFa(o.orderNumber)}
                    </span>
                    <StatusBadge kind="order" value={o.status} />
                    <StatusBadge kind="payment" value={o.paymentStatus} />
                  </div>
                  <span className="text-xs text-soil-700/60">
                    {formatDateFa(o.createdAt)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-soil-700/80">
                  <span>
                    مبلغ: <b className="text-soil-900">{formatToman(o.totalToman)}</b>
                  </span>
                  <span>
                    تعداد: <b className="text-soil-900">{toFa(o.totalCartons)}</b>
                  </span>
                  {o.refId && (
                    <span dir="ltr">
                      کد پیگیری: <b className="font-mono text-flora-700">{toFa(o.refId)}</b>
                    </span>
                  )}
                  {o.trackingCode && (
                    <span>
                      مرسوله: <b className="text-soil-900">{toFa(o.trackingCode)}</b>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className="rounded-full bg-dust-100 px-4 py-2 text-[11px] font-bold text-soil-900 transition hover:bg-dust-200"
                  >
                    جزئیات سفارش
                  </Link>
                  <form action="/api/cart/reorder" method="post">
                    <input type="hidden" name="orderId" value={o.id} />
                    <button className="rounded-full bg-flora-900 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-flora-700">
                      سفارش مجدد
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-black text-soil-900">آدرس‌های ذخیره‌شده</h2>
        <p className="mt-2 text-sm text-soil-700/70">
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
