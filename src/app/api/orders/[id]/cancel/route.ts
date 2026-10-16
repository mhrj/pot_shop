import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  checkStatusTransition,
  isOrderStatus,
  isPaymentStatus,
  paymentStatusAfterCancel,
} from '@/lib/orders';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/**
 * Customer-initiated cancellation of an unpaid order.
 *
 * Deliberately narrower than the admin transition endpoint: a customer may only
 * withdraw an order that has not been paid for. Once money has moved, unwinding
 * it is a refund decision for the shop, not a self-service action. Because no
 * stock is ever decremented before payment is verified, cancelling here has
 * nothing to restore.
 */
export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.sub },
    select: { id: true, status: true, paymentStatus: true },
  });
  if (!order) {
    return NextResponse.json({ message: 'سفارش یافت نشد' }, { status: 404 });
  }

  if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') {
    return NextResponse.json(
      { message: 'این سفارش پرداخت شده است؛ برای لغو با پشتیبانی تماس بگیرید.' },
      { status: 409 },
    );
  }

  const from = isOrderStatus(order.status) ? order.status : 'PENDING';
  const paymentStatus = isPaymentStatus(order.paymentStatus)
    ? order.paymentStatus
    : 'PENDING';

  const check = checkStatusTransition({ from, to: 'CANCELED', paymentStatus });
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: 409 });
  }

  // `updateMany` with the previous status pinned makes the cancel idempotent:
  // a second request matches nothing and reports the order as already canceled.
  const { count } = await prisma.order.updateMany({
    where: { id, userId: session.sub, status: from },
    data: { status: 'CANCELED', paymentStatus: paymentStatusAfterCancel(paymentStatus) },
  });

  if (count === 0) {
    return NextResponse.json(
      { message: 'وضعیت سفارش تغییر کرده است؛ صفحه را بازخوانی کنید.' },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
