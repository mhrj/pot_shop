import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCartTotals } from '@/lib/cart';
import { calcShippingToman } from '@/lib/pricing';
import { formatToman, formatWeight, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';
import CheckoutForm from '@/components/cart/CheckoutForm';
import { redirect } from 'next/navigation';

export default async function CheckoutPage() {
  const user = await requireUser();

  const [addresses, totals] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }),
    getCartTotals(user.id),
  ]);

  if (totals.lines.length === 0) {
    redirect('/cart');
  }

  const defaultProvince = addresses[0]?.province ?? 'تهران';
  const shippingToman = calcShippingToman(totals, defaultProvince);
  const grandTotalToman = totals.payableToman + shippingToman;

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-black text-soil-900">تکمیل خرید</h1>
      <p className="mt-2 text-sm text-soil-700/70">
        آدرس ارسال را انتخاب یا وارد کنید، سپس به درگاه زرین‌پال منتقل می‌شوید.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CheckoutForm
            addresses={addresses.map((a) => ({
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

        <aside className="lg:col-span-5">
          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
            <h2 className="font-black text-soil-900">خلاصه سفارش</h2>

            <ul className="mt-4 space-y-3 text-xs text-soil-700/80">
              {totals.lines.map((l) => (
                <li key={l.productId} className="flex justify-between gap-4">
                  <span className="truncate">
                    {l.name} × {toFa(l.quantity)}
                  </span>
                  <span className="shrink-0 font-bold text-soil-900">
                    {formatToman(l.lineTotalToman)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-3 border-t border-soil-900/10 pt-5 text-sm">
              <div className="flex justify-between">
                <dt>جمع کالاها</dt>
                <dd>{formatToman(totals.subtotalToman)}</dd>
              </div>
              <div className="flex justify-between text-flora-700">
                <dt>تخفیف پله‌ای</dt>
                <dd>−{formatToman(totals.discountToman)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>هزینه ارسال</dt>
                <dd>{shippingToman === 0 ? 'رایگان' : formatToman(shippingToman)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>وزن تقریبی</dt>
                <dd>{formatWeight(totals.totalWeightGrams)}</dd>
              </div>
              <div className="flex justify-between border-t border-soil-900/10 pt-3 text-base font-black">
                <dt>قابل پرداخت</dt>
                <dd>{formatToman(grandTotalToman)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </Container>
  );
}
