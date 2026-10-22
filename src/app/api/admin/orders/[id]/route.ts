import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';
import {
  ORDER_STATUSES,
  checkStatusTransition,
  isOrderStatus,
  isPaymentStatus,
  paymentStatusAfterCancel,
  shouldRestoreStockOnCancel,
} from '@/lib/orders';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingCode: z.string().trim().max(60).nullable().optional(),
  shippingCarrier: z.string().trim().max(50).nullable().optional(),
});

/**
 * "PS-" plus eight characters, e.g. "PS-A3F9C2B1".
 *
 * `randomBytes` rather than `Math.random`: the code is handed to the customer
 * and looks up a real shipment, so it should not be guessable from another
 * order's code. Four bytes of hex is short enough to read over the phone.
 */
function generateTrackingCode(): string {
  return `PS-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getActiveAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ message: 'سفارش یافت نشد' }, { status: 404 });
  }

  const from = isOrderStatus(order.status) ? order.status : 'PENDING';
  const paymentStatus = isPaymentStatus(order.paymentStatus)
    ? order.paymentStatus
    : 'PENDING';
  const to = parsed.data.status;

  const check = checkStatusTransition({ from, to, paymentStatus });
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: 409 });
  }

  const isCancelling = to === 'CANCELED' && from !== 'CANCELED';
  // Guarded on paymentStatus === 'PAID', and the same transaction moves it to
  // REFUNDED, so a replayed cancellation cannot decrement stock twice.
  const restoreStock = isCancelling && shouldRestoreStockOnCancel(paymentStatus);

  // `undefined` means the field was not sent at all, which is not the same as
  // `null`/"" meaning the admin deliberately cleared it. The status form always
  // sends the current value, so only "not sent" may fall back to the stored
  // code; an explicit value (including an explicit clear) always wins.
  const submittedTracking =
    parsed.data.trackingCode === undefined
      ? undefined
      : parsed.data.trackingCode?.trim() || null;

  // A shipped order always ends up carrying a code: an explicit one wins, then
  // the one already stored, and only when neither exists is one generated. That
  // is what keeps a replayed SHIPPED update idempotent — it returns the same
  // code instead of minting a second one for the same parcel.
  const trackingCode =
    to === 'SHIPPED'
      ? submittedTracking || order.trackingCode || generateTrackingCode()
      : submittedTracking === undefined
        ? order.trackingCode
        : submittedTracking;

  const data: Record<string, unknown> = {
    status: to,
    trackingCode,
  };
  if (parsed.data.shippingCarrier !== undefined) {
    data.shippingCarrier = parsed.data.shippingCarrier?.trim() || null;
  }
  if (to === 'SHIPPED' && !order.shippedAt) data.shippedAt = new Date();
  if (to === 'DELIVERED' && !order.deliveredAt) data.deliveredAt = new Date();
  if (isCancelling) {
    data.paymentStatus = paymentStatusAfterCancel(paymentStatus);
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Claim the transition by pinning the state this request read. `restoreStock`
    // was decided from a read taken *before* the transaction, so without this
    // two concurrent cancel requests would both see PAID and both put the stock
    // back. Pinning makes the transition itself the lock: exactly one request
    // matches, and the loser is reported as a conflict instead of double-crediting.
    const claim = await tx.order.updateMany({
      where: { id, status: from, paymentStatus },
      data,
    });

    if (claim.count === 0) return null;

    if (restoreStock) {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.findUnique({ where: { id } });
  });

  if (!updated) {
    return NextResponse.json(
      {
        message:
          'وضعیت این سفارش هم‌زمان توسط درخواست دیگری تغییر کرده است. صفحه را بازخوانی کنید.',
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    order: updated,
    stockRestored: restoreStock,
  });
}
