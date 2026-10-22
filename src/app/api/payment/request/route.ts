import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getStockShortages } from '@/lib/cart';
import { calcShippingToman, priceCart, type Tier } from '@/lib/pricing';
import { calculateShippingCost, resolveCityCode } from '@/lib/postex';
import { parseBundleItems, parseColorOptions } from '@/lib/product-features';
import { zarinpalRequest, ZARINPAL_ERRORS } from '@/lib/zarinpal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  addressId: z.string().cuid(),
  shippingCarrier: z.string().trim().max(50).optional(),
});

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

  // 3) Verify stock (overall product stock & specific color stock) before creating a pending order.
  const shortages: Array<{ name: string; available: number }> = [];

  for (const i of activeItems) {
    if (i.quantity > i.product.stock) {
      shortages.push({ name: i.product.name, available: i.product.stock });
      continue;
    }

    const isBundle = (i.product.bundleSize ?? 1) > 1;
    const colorData = (i.colorData as Record<string, any>) ?? {};

    if (!isBundle) {
      const singleColors = parseColorOptions(i.product.colorOptions, i.product.stock);
      const chosenHex =
        colorData.selectedColor?.hexCode ??
        (typeof colorData.color === 'string' ? colorData.color : null);

      if (chosenHex && singleColors.length > 0) {
        const opt = singleColors.find(
          (c) => c.hexCode.toUpperCase() === chosenHex.toUpperCase(),
        );
        if (opt && i.quantity > opt.stock) {
          shortages.push({
            name: `${i.product.name} (رنگ ${opt.hexCode})`,
            available: opt.stock,
          });
        }
      }
    } else {
      const bundleItems = parseBundleItems(i.product.bundleItems, i.product.stock);
      const bundleColors = colorData.bundleColors ?? {};
      const bundleCount = Math.max(1, Math.floor(i.quantity / (i.product.bundleSize || 1)));

      for (let idx = 0; idx < bundleItems.length; idx++) {
        const it = bundleItems[idx];
        const itColors = it.colorOptions ?? [];
        const chosen = bundleColors[idx] ?? bundleColors[String(idx)];
        const chosenHex = typeof chosen === 'string' ? chosen : chosen?.hexCode;

        if (chosenHex && itColors.length > 0) {
          const opt = itColors.find(
            (c) => c.hexCode.toUpperCase() === chosenHex.toUpperCase(),
          );
          if (opt && bundleCount > opt.stock) {
            shortages.push({
              name: `${i.product.name} — ${it.title} (رنگ ${opt.hexCode})`,
              available: opt.stock,
            });
          }
        }
      }
    }
  }

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
        sku: i.product.sku,
        name: i.product.name,
        basePriceToman: i.product.basePriceToman,
        weightGrams: i.product.weightGrams,
        unitsPerCarton: i.product.unitsPerCarton,
        bundleSize: i.product.bundleSize,
        bundleItems: parseBundleItems(i.product.bundleItems, i.product.stock),
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
      colorData: i.colorData,
    })),
  );

  let originCity = 'تهران';
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (settings?.originCity) {
      originCity = settings.originCity;
    }
  } catch {
    // fallback
  }
  const fromCityCode = resolveCityCode(originCity);
  const pishtazShippingToman = await calculateShippingCost({
    originCity,
    from_city_code: fromCityCode,
    destinationCity: address.city || address.province,
    weightGrams: totals.totalWeightGrams,
    fallbackTotals: totals,
  });

  const shippingCarrier = parsed.data.shippingCarrier?.trim() || 'پست پیشتاز';
  let shippingToman = pishtazShippingToman;

  if (pishtazShippingToman > 0) {
    if (shippingCarrier === 'پست عادی') {
      shippingToman = Math.max(25000, Math.round((pishtazShippingToman * 0.7) / 1000) * 1000);
    } else if (shippingCarrier === 'تیپاکس') {
      shippingToman = Math.max(45000, Math.round((pishtazShippingToman * 1.25) / 1000) * 1000);
    } else if (shippingCarrier === 'پیک موتوری') {
      shippingToman = Math.max(40000, Math.round((pishtazShippingToman * 1.2) / 1000) * 1000);
    }
  }

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
      shippingCarrier,
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
        create: totals.lines.map((l, idx) => {
          const cartItem = activeItems[idx] ?? activeItems.find((ai) => ai.product.id === l.productId);
          const isBundle = (l.bundleSize ?? 1) > 1;
          const rawColorData = (l.colorData ?? cartItem?.colorData ?? null) as Record<string, any> | null;

          let itemColorData: any = rawColorData;
          if (isBundle && cartItem?.product) {
            const bItems = parseBundleItems(cartItem.product.bundleItems, cartItem.product.stock);
            itemColorData = {
              ...(rawColorData || {}),
              bundleItems: bItems.map((bi) => ({
                title: bi.title,
                material: bi.material,
                weightGrams: bi.weightGrams,
                diameterCm: bi.diameterCm,
                heightCm: bi.heightCm,
              })),
            };
          }

          return {
            productId: l.productId,
            productName: l.name,
            productSlug: l.slug,
            sku: l.sku ?? cartItem?.product.sku ?? null,
            imageUrl: l.imageUrl ?? null,
            material: cartItem?.product.material ?? null,
            diameterCm: cartItem?.product.diameterCm ?? null,
            heightCm: cartItem?.product.heightCm ?? null,
            quantity: l.quantity,
            listUnitToman: l.listUnitToman,
            unitToman: l.unitToman,
            lineTotalToman: l.lineTotalToman,
            lineSavingsToman: l.lineSavingsToman,
            tierLabel: l.tierLabel,
            colorData: itemColorData ?? null,
            isBundle,
            bundleSize: l.bundleSize ?? 1,
          };
        }),
      },
    },
  });

  // 6) Ask Zarinpal for an authority token.
  const origin = req.headers.get('origin') || new URL(req.url).origin;
  const appUrl = process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_APP_URL! : origin;
  const callbackUrl = `${appUrl}/api/payment/verify?order=${order.id}`;

  const result = await zarinpalRequest({
    amountToman: totalToman,
    description: `سفارش ${order.orderNumber} — پات استور`,
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
