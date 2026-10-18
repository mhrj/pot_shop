import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getStockShortages } from '@/lib/cart';
import { calcShippingToman, priceCart, type Tier } from '@/lib/pricing';
import { zarinpalRequest, ZARINPAL_ERRORS } from '@/lib/zarinpal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ addressId: z.string().cuid() });

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear() - 621; // Approximate Jalali year
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `PS-${y}-${rand}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'آدرس ارسال را انتخاب کنید' }, { status: 400 });
  }

  const userId = session.sub;

  // 1) The address must belong to the authenticated user. The account email is
  //    sent to the gateway as optional metadata; the session cookie carries no
  //    email, so it is read from the account rather than forwarded as undefined.
  const [address, account] = await Promise.all([
    prisma.address.findFirst({
      where: { id: parsed.data.addressId, userId },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);
  if (!address) {
    return NextResponse.json({ message: 'آدرس یافت نشد' }, { status: 404 });
  }

  // 2) Read cart from the database. Never trust client-side totals.
  const cart = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const activeItems = cart.filter((i) => i.product.isActive);

  if (activeItems.length === 0) {
    return NextResponse.json({ message: 'سبد خرید خالی است' }, { status: 400 });
  }

  // 3) Verify stock before creating a pending order.
  const shortages = getStockShortages(
    activeItems.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      stock: i.product.stock,
    })),
  );

  if (shortages.length > 0) {
    return NextResponse.json(
      {
        message: `موجودی کافی نیست: ${shortages
          .map((s) => `${s.name} (${s.available} عدد)`)
          .join('، ')}`,
        shortages,
      },
      { status: 409 },
    );
  }

  // 4) Server-side pricing from tiered matrix.
  const totals = priceCart(
    activeItems.map((i) => ({
      product: {
        id: i.product.id,
        slug: i.product.slug,
        name: i.product.name,
        basePriceToman: i.product.basePriceToman,
        weightGrams: i.product.weightGrams,
        unitsPerCarton: i.product.unitsPerCarton,
        packSize: i.product.packSize,
        images: i.product.images,
        allowBatchDiscount: i.product.allowBatchDiscount,
      },
      tiers: i.product.tiers.map(
        (t): Tier => ({
          minQuantity: t.minQuantity,
          unitPriceToman: t.unitPriceToman,
          label: t.label,
        }),
      ),
      quantity: i.quantity,
    })),
  );

  const shippingToman = calcShippingToman(totals, address.province);
  const totalToman = totals.payableToman + shippingToman;

  if (totalToman <= 0) {
    return NextResponse.json({ message: 'مبلغ سفارش نامعتبر است' }, { status: 400 });
  }

  // 5) Create the PENDING order.
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      channel: totals.channel,
      subtotalToman: totals.subtotalToman,
      discountToman: totals.discountToman,
      shippingToman,
      totalToman,
      totalWeightGrams: totals.totalWeightGrams,
      totalCartons: totals.totalCartons,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      addressId: address.id,
      shipFullName: address.fullName,
      shipPhone: address.phone,
      shipProvince: address.province,
      shipCity: address.city,
      shipPostalCode: address.postalCode,
      shipLine1: address.line1,
      shipLine2: address.line2,
      items: {
        create: totals.lines.map((l) => ({
          productId: l.productId,
          productName: l.name,
          productSlug: l.slug,
          imageUrl: l.imageUrl ?? null,
          quantity: l.quantity,
          listUnitToman: l.listUnitToman,
          unitToman: l.unitToman,
          lineTotalToman: l.lineTotalToman,
          lineSavingsToman: l.lineSavingsToman,
          tierLabel: l.tierLabel,
        })),
      },
    },
  });

  // 6) Ask Zarinpal for an authority token.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const callbackUrl = `${appUrl}/api/payment/verify?order=${order.id}`;

  const result = await zarinpalRequest({
    amountToman: totalToman,
    description: `سفارش ${order.orderNumber} — پات شاپ`,
    callbackUrl,
    mobile: address.phone,
    email: account?.email ?? undefined,
    orderId: order.id,
  });

  if (!result.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELED',
        failureReason: ZARINPAL_ERRORS[result.code] ?? result.message,
      },
    });
    return NextResponse.json(
      { message: ZARINPAL_ERRORS[result.code] ?? result.message, code: result.code },
      { status: 502 },
    );
  }

  // 7) Persist the authority token.
  await prisma.order.update({
    where: { id: order.id },
    data: { zarinpalAuthority: result.authority },
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountToman: totalToman,
    redirectUrl: result.redirectUrl,
  });
}
