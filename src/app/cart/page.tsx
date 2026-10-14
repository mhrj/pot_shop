import Link from 'next/link';
import Image from 'next/image';
import { requireUser } from '@/lib/auth';
import { getCartTotals } from '@/lib/cart';
import { formatToman, formatWeight, toFa } from '@/lib/format';
import Container from '@/components/ui/Container';

export default async function CartPage() {
  const user = await requireUser();
  const totals = await getCartTotals(user.id);

  if (totals.lines.length === 0) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-black text-soil-900">سبد خرید خالی است</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-flora-900 px-6 py-3 text-sm font-bold text-white"
        >
          مشاهده محصولات
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-black text-soil-900">سبد خرید</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <ul className="space-y-4 lg:col-span-8">
          {totals.lines.map((l) => (
            <li
              key={l.productId}
              className="flex gap-4 rounded-2xl border border-soil-900/10 bg-white p-4"
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-dust-100">
                {l.imageUrl && (
                  <Image
                    src={l.imageUrl}
                    alt={l.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-soil-900">{l.name}</h2>
                <p className="mt-1 text-xs text-soil-700/70">
                  {toFa(l.quantity)} عدد × {formatToman(l.unitToman)} — {l.tierLabel}
                </p>
                <p className="mt-2 text-sm font-black text-flora-900">
                  {formatToman(l.lineTotalToman)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:col-span-4">
          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_32px_-12px_rgba(62,39,35,0.22)]">
            <h2 className="font-black text-soil-900">خلاصه سففارش</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>جمع کالاها</dt>
                <dd>{formatToman(totals.subtotalToman)}</dd>
              </div>
              <div className="flex justify-between text-flora-700">
                <dt>تخففیفف پله‌ای</dt>
                <dd>−{formatToman(totals.discountToman)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>وزن کل</dt>
                <dd>{formatWeight(totals.totalWeightGrams)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-black">
                <dt>قابل پرداخت</dt>
                <dd>{formatToman(totals.payableToman)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-6 block rounded-xl bg-flora-900 px-6 py-3.5 text-center text-sm font-black text-white"
            >
              ادامه به پرداخت
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}
