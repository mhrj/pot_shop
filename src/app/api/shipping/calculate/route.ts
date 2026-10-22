import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCartTotals } from '@/lib/cart';
import { calculateShippingCost } from '@/lib/postex';

export const runtime = 'nodejs';

const schema = z.object({
  addressId: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: 'اطلاعات نامعتبر است' }, { status: 400 });
  }

  const { addressId, city, province } = parsed.data;
  let destination = city || province || '';

  if (addressId) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.sub },
      select: { city: true, province: true },
    });
    if (address) {
      destination = address.city || address.province;
    }
  }

  if (!destination) {
    destination = 'تهران';
  }

  const totals = await getCartTotals(session.sub);
  const originCity = process.env.POSTEX_ORIGIN_CITY || 'تهران';

  const shippingToman = await calculateShippingCost(
    originCity,
    destination,
    totals.totalWeightGrams,
    totals,
  );

  const isFree = shippingToman === 0;
  const normalCost = isFree ? 0 : Math.max(25000, Math.round((shippingToman * 0.7) / 1000) * 1000);
  const tipaxCost = isFree ? 0 : Math.max(45000, Math.round((shippingToman * 1.25) / 1000) * 1000);

  const options = [
    {
      carrier: 'پست پیشتاز',
      label: 'پست پیشتاز (۳ روز کاری)',
      costToman: shippingToman,
      deliveryDays: '۳ روز کاری',
    },
    {
      carrier: 'پست عادی',
      label: 'پست عادی (۷ روز کاری)',
      costToman: normalCost,
      deliveryDays: '۷ روز کاری',
    },
    {
      carrier: 'تیپاکس',
      label: 'تیپاکس (۱ الی ۲ روز کاری)',
      costToman: tipaxCost,
      deliveryDays: '۱ الی ۲ روز کاری',
    },
  ];

  return NextResponse.json({
    ok: true,
    shippingToman,
    isFree,
    options,
    destination,
  });
}
