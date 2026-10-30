'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
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

const updateOrderSchema = z.object({
  orderId: z.string().min(1, 'شناسه سفارش الزامی است'),
  status: z.enum(ORDER_STATUSES),
  trackingCode: z.string().trim().max(60).nullable().optional(),
  shippingCarrier: z.string().trim().max(50).nullable().optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

function generateTrackingCode(): string {
  return `PS-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function updateOrderStatusAction(input: UpdateOrderInput) {
  const session = await getActiveAdmin();
  if (!session) {
    return { success: false as const, error: 'دسترسی غیرمجاز است' };
  }

  const parsed = updateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است',
    };
  }

  const { orderId, status: to, trackingCode: submittedTracking, shippingCarrier } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      trackingCode: true,
      shippingCarrier: true,
      shippedAt: true,
      deliveredAt: true,
      items: {
        select: {
          productId: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    return { success: false as const, error: 'سفارش یافت نشد' };
  }

  const from = isOrderStatus(order.status) ? order.status : 'PENDING';
  const paymentStatus = isPaymentStatus(order.paymentStatus) ? order.paymentStatus : 'PENDING';

  const check = checkStatusTransition({ from, to, paymentStatus });
  if (!check.ok) {
    return { success: false as const, error: check.message };
  }

  const isCancelling = to === 'CANCELED' && from !== 'CANCELED';
  const restoreStock = isCancelling && shouldRestoreStockOnCancel(paymentStatus);

  const cleanSubmittedTracking =
    submittedTracking === undefined ? undefined : submittedTracking?.trim() || null;

  const trackingCode =
    to === 'SHIPPED'
      ? cleanSubmittedTracking || order.trackingCode || generateTrackingCode()
      : cleanSubmittedTracking === undefined
        ? order.trackingCode
        : cleanSubmittedTracking;

  const data: Record<string, unknown> = {
    status: to,
    trackingCode,
  };

  if (shippingCarrier !== undefined) {
    data.shippingCarrier = shippingCarrier?.trim() || null;
  }
  if (to === 'SHIPPED' && !order.shippedAt) data.shippedAt = new Date();
  if (to === 'DELIVERED' && !order.deliveredAt) data.deliveredAt = new Date();
  if (isCancelling) {
    data.paymentStatus = paymentStatusAfterCancel(paymentStatus);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: { id: orderId, status: from, paymentStatus },
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

    return tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        trackingCode: true,
        shippingCarrier: true,
      },
    });
  });

  if (!updated) {
    return {
      success: false as const,
      error: 'وضعیت این سفارش هم‌زمان توسط درخواست دیگری تغییر کرده است. صفحه را بازخوانی کنید.',
    };
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/dashboard/orders/${orderId}`);

  return {
    success: true as const,
    order: updated,
    stockRestored: restoreStock,
  };
}
