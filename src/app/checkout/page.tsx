import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCartTotals } from '@/lib/cart';
import { calculateShippingCost } from '@/lib/postex';
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

  // Pre-calculate shipping rates with Postex helper for all available addresses
  const originCity = process.env.POSTEX_ORIGIN_CITY || 'تهران';
  const initialShippingRates: Record<string, number> = {};

  await Promise.all(
    addresses.map(async (a) => {
      initialShippingRates[a.id] = await calculateShippingCost(
        originCity,
        a.city || a.province,
        totals.totalWeightGrams,
        totals,
      );
    }),
  );

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-black text-soil-900">تکمیل خرید</h1>
      <p className="mt-2 text-sm text-soil-700/70">
        آدرس ارسال را انتخاب یا وارد کنید، سپس به درگاه زرین‌پال منتقل می‌شوید.
      </p>

      <div className="mt-8">
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
          totals={totals}
          initialShippingRates={initialShippingRates}
        />
      </div>
    </Container>
  );
}
