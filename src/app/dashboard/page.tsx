import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatToman, formatDateFa, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'در انتظار پرداخت', cls: 'bg-amber-50 text-amber-700' },
  PAID: { text: 'پرداخت‌شده', cls: 'bg-flora-100 text-flora-700' },
  PROCESSING: { text: 'در حال آماده‌سازی', cls: 'bg-sky-50 text-sky-700' },
  SHIPPED: { text: 'ارسال‌شده', cls: 'bg-indigo-50 text-indigo-700' },
  DELIVERED: { text: 'تحویل‌شده', cls: 'bg-flora-100 text-flora-700' },
  CANCELED: { text: 'لغو‌شده', cls: 'bg-red-50 text-red-700' },
};

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
          <p className="mt-2 text-sm text-soil-700/70">سففارش‌ها و آدرس‌های شما</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="rounded-full border border-soil-900/15 px-5 py-2.5 text-xs font-bold text-soil-900 transition hover:bg-dust-50">
            خروج از حساب
          </button>
        </form>
      </header>

      <section className="mt-10">
        <h2 className="text-lg font-black text-soil-900">سففارش‌های من</h2>

        {orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-soil-900/15 px-6 py-10 text-center text-sm text-soil-700/70">
            هنوز سففارشی ثبت نکرده‌اید.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {orders.map((o) => {
              const st = STATUS_LABEL[o.status] ?? STATUS_LABEL.PENDING;
              return (
                <li key={o.id} className="rounded-2xl border border-soil-900/10 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-soil-900">
                        {toFa(o.orderNumber)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${st.cls}`}>
                        {st.text}
                      </span>
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
                      href={`/checkout/success?order=${o.orderNumber}&ref_id=${o.refId ?? ''}`}
                      className="rounded-full bg-dust-100 px-4 py-2 text-[11px] font-bold text-soil-900 transition hover:bg-dust-200"
                    >
                      جزئیات سففارش
                    </Link>
                    <form action="/api/cart/reorder" method="post">
                      <input type="hidden" name="orderId" value={o.id} />
                      <button className="rounded-full bg-flora-900 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-flora-700">
                        سففارش مجدد
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-black text-soil-900">آدرس‌های ذخیره‌شده</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-soil-900/10 bg-white p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-soil-900">{a.fullName}</span>
                {a.isDefault && (
                  <span className="rounded-full bg-flora-100 px-2.5 py-0.5 text-[10px] font-bold text-flora-700">
                    پیش‌ففرض
                  </span>
                )}
              </div>
              <p className="mt-2 leading-7 text-soil-700/80">
                {a.province}، {a.city}، {a.line1}
                {a.line2 ? `، ${a.line2}` : ''}
              </p>
              <p className="mt-2 text-xs text-soil-700/60" dir="ltr">
                {toFa(a.phone)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
