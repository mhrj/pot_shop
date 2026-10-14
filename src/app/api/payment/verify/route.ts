import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { zarinpalVerify, ZARINPAL_ERRORS } from '@/lib/zarinpal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Zarinpal redirects the user back here with ?Authority=...&Status=OK|NOK.
 * This route must be idempotent — Zarinpal may call it more than once.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const authority = url.searchParams.get('Authority');
  const status = url.searchParams.get('Status');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  const fail = (reason: string, orderNumber?: string) => {
    const target = new URL('/checkout/failed', appUrl);
    target.searchParams.set('reason', reason);
    if (orderNumber) target.searchParams.set('order', orderNumber);
    return NextResponse.redirect(target, { status: 303 });
  };

  if (!authority) return fail('authority_missing');

  // 1) Look up the order by authority. The database is the source of truth.
  const order = await prisma.order.findUnique({
    where: { zarinpalAuthority: authority },
    include: { items: true },
  });

  if (!order) return fail('order_not_found');

  // 2) Already paid — skip verification and go straight to success.
  if (order.paymentStatus === 'PAID' && order.refId) {
    return NextResponse.redirect(
      `${appUrl}/checkout/success?ref_id=${order.refId}&order=${order.orderNumber}`,
      { status: 303 },
    );
  }

  // 3) User canceled or the gateway reported a failure.
  if (status !== 'OK') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'CANCELED',
        status: 'CANCELED',
        failureReason: 'پرداخت توسط کاربر لغو شد یا درگاه خطا داد',
      },
    });
    return fail('canceled', order.orderNumber);
  }

  // 4) Verify authenticity with Zarinpal. Amount comes from the DB, never from the query string.
  const verification = await zarinpalVerify({
    amountToman: order.totalToman,
    authority,
  });

  if (!verification.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELED',
        failureReason: ZARINPAL_ERRORS[verification.code] ?? verification.message,
      },
    });
    return fail('verify_failed', order.orderNumber);
  }

  // 5) Atomic update: mark paid, decrement stock, clear cart.
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'PAID',
        refId: verification.refId,
        cardPan: verification.cardPan,
        paidAt: new Date(),
        failureReason: null,
      },
    });

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { userId: order.userId } });
  });

  // 6) Send the user to the success page with the Shaparak reference.
  const success = new URL('/checkout/success', appUrl);
  success.searchParams.set('ref_id', verification.refId);
  success.searchParams.set('order', order.orderNumber);
  return NextResponse.redirect(success.toString(), { status: 303 });
}
