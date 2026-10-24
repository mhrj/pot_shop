import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getCartTotals } from '@/lib/cart';
import { prisma } from '@/lib/prisma';
import { formatToman, formatWeight } from '@/lib/format';
import { numberToWordsFa } from '@/lib/number-to-words';
import Container from '@/components/ui/Container';
import CartItemRow from '@/components/cart/CartItemRow';

export default async function CartPage() {
  const user = await requireUser();
  const totals = await getCartTotals(user.id);

  if (totals.lines.length === 0) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-black text-soil-900">سبد خرید خالی است</h1>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-flora-900 px-6 py-3 text-sm font-bold text-white"
        >
          مشاهده محصولات
        </Link>
      </Container>
    );
  }

  const stocks = await prisma.product.findMany({
    where: { id: { in: totals.lines.map((l) => l.productId) } },
    select: { id: true, stock: true },
  });
  const stockMap = new Map(stocks.map((s) => [s.id, s.stock]));

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-black text-soil-900">سبد خرید</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <ul className="space-y-4 lg:col-span-8">
          {totals.lines.map((l) => (
            <CartItemRow key={l.productId} line={l} stock={stockMap.get(l.productId) ?? 0} />
          ))}
        </ul>

        <aside className="lg:col-span-4">
          <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
            <h2 className="font-black text-soil-900">خلاصه سفارش</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>جمع کالاها</dt>
                <dd>{formatToman(totals.subtotalToman)}</dd>
              </div>
              <div className="flex justify-between text-flora-700">
                <dt>تخفیف پله‌ای</dt>
                <dd>−{formatToman(totals.discountToman)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>وزن کل</dt>
                <dd>{formatWeight(totals.totalWeightGrams)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-black">
                <dt>قابل پرداخت</dt>
                <dd className="text-end">
                  <div>{formatToman(totals.payableToman)}</div>
                  {totals.payableToman >= 1000 && (
                    <div className="text-[11px] font-normal text-soil-700/70 mt-0.5">
                      ({numberToWordsFa(totals.payableToman)} تومان)
                    </div>
                  )}
                </dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-6 block rounded-xl bg-flora-900 px-6 py-3.5 text-center text-sm font-black text-white transition hover:bg-flora-700"
            >
              ادامه فرآیند خرید
            </Link>
            <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
              📦 توجه: مرسولات فقط در روزهای <strong>یکشنبه</strong> و <strong>چهارشنبه</strong> ارسال می‌شوند.
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}