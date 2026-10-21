/**
 * Order lifecycle rules — status transitions and stock reconciliation.
 *
 * Stock is decremented exactly once, when a verified payment turns an order
 * PAID (see /api/payment/verify). Cancelling such an order must therefore put
 * that stock back exactly once. The restore is guarded on `paymentStatus`
 * still being PAID, and the same transaction moves it to REFUNDED, so a
 * retried or replayed cancellation finds REFUNDED and skips the decrement.
 * That keeps cancellation idempotent without a dedicated bookkeeping column.
 */

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Where the order sits in the shop's fulfillment tracker */
export const TIMELINE = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
export type TimelineStatus = (typeof TIMELINE)[number];

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELED'
  | 'REFUNDED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'در انتظار پرداخت',
  PAID: 'پرداخت‌شده',
  PROCESSING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال‌شده',
  DELIVERED: 'تحویل‌شده',
  CANCELED: 'لغو‌شده',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'در انتظار پرداخت',
  PAID: 'پرداخت تأیید‌شده',
  FAILED: 'پرداخت ناموفق',
  CANCELED: 'لغو‌شده',
  REFUNDED: 'بازگشت وجه',
};

/** Forward-only lifecycle. DELIVERED and CANCELED are terminal. */
const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELED'],
  PAID: ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'],
  PROCESSING: ['SHIPPED', 'DELIVERED', 'CANCELED'],
  SHIPPED: ['DELIVERED', 'CANCELED'],
  DELIVERED: [],
  CANCELED: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return Object.prototype.hasOwnProperty.call(PAYMENT_STATUS_LABELS, value);
}

export function orderStatusLabel(status: string): string {
  return isOrderStatus(status) ? ORDER_STATUS_LABELS[status] : status;
}

export function paymentStatusLabel(status: string): string {
  return isPaymentStatus(status) ? PAYMENT_STATUS_LABELS[status] : status;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

/** Statuses an administrator may move this order to right now. */
export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return [from, ...ALLOWED[from]];
}

export type TransitionCheck = { ok: true } | { ok: false; message: string };

/**
 * Decide whether an administrator may move an order between two statuses.
 *
 * The PAID guard is the important one: fulfillment edits are not a payment
 * channel. An order can only become PAID through the verified gateway
 * callback, so a manual edit that would mark an unverified payment as paid
 * is refused.
 */
export function checkStatusTransition(params: {
  from: OrderStatus;
  to: OrderStatus;
  paymentStatus: PaymentStatus;
}): TransitionCheck {
  const { from, to, paymentStatus } = params;

  if (from === to) return { ok: true };

  if (to === 'PAID' && paymentStatus !== 'PAID') {
    return {
      ok: false,
      message:
        'سفارش تنها پس از تأیید پرداخت توسط درگاه می‌تواند «پرداخت‌شده» شود.',
    };
  }

  if (!canTransition(from, to)) {
    return {
      ok: false,
      message:
        from === 'CANCELED' || from === 'DELIVERED'
          ? `وضعیت «${ORDER_STATUS_LABELS[from]}» نهایی است و قابل تغییر نیست.`
          : `تغییر وضعیت از «${ORDER_STATUS_LABELS[from]}» به «${ORDER_STATUS_LABELS[to]}» مجاز نیست.`,
    };
  }

  return { ok: true };
}

/**
 * Whether cancelling this order must return its items to stock.
 * True only for a genuinely paid order — PENDING orders never took stock.
 */
export function shouldRestoreStockOnCancel(paymentStatus: PaymentStatus): boolean {
  return paymentStatus === 'PAID';
}

/** Payment status to persist alongside a cancellation. */
export function paymentStatusAfterCancel(
  paymentStatus: PaymentStatus,
): PaymentStatus {
  if (paymentStatus === 'PAID') return 'REFUNDED';
  if (paymentStatus === 'PENDING') return 'CANCELED';
  return paymentStatus;
}

/**
 * Separates "we could not reach the gateway" (502) and "the gateway is not
 * configured here" (503) from an actual decline.
 *
 * A payment we were unable to *confirm* is not a payment that failed. Such an
 * order must stay unsettled so the callback can be retried; recording it as
 * FAILED would write off money the customer may well have paid. This lives
 * here, rather than beside the gateway client, because it is a rule about how
 * an order's payment status may move — and because this module is pure, so the
 * rule can be tested without a server environment.
 */
export function isRetryableGatewayFailure(code: number): boolean {
  return code === 502 || code === 503;
}
