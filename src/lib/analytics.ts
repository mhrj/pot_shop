/**
 * Admin reporting helpers.
 *
 * Revenue and sales share one definition, applied everywhere: an order counts
 * only when `paymentStatus === 'PAID'`, i.e. Zarinpal's server-side verify
 * returned code 100/101 and the RefID was persisted. Pending, failed, canceled
 * and refunded orders are excluded from every figure here.
 *
 * These are pure functions over already-fetched rows so they can be unit
 * tested without a database.
 */

export type ReportingOrder = {
  paymentStatus: string;
  status: string;
  channel: string;
  totalToman: number;
  createdAt: Date | string;
};

export function isPaidOrder(order: { paymentStatus: string }): boolean {
  return order.paymentStatus === 'PAID';
}

export function paidOrders<T extends { paymentStatus: string }>(orders: T[]): T[] {
  return orders.filter(isPaidOrder);
}

/** Verified revenue in Toman. Excludes everything that was never confirmed. */
export function totalRevenueToman(
  orders: Array<{ paymentStatus: string; totalToman: number }>,
): number {
  return orders
    .filter(isPaidOrder)
    .reduce((sum, order) => sum + order.totalToman, 0);
}

/** Local calendar-day key, so buckets line up with the shop's own day. */
export function toDateKey(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export type SalesPoint = {
  key: string;
  label: string;
  revenueToman: number;
  orderCount: number;
};

const faDayMonth = new Intl.DateTimeFormat('fa-IR', {
  month: '2-digit',
  day: '2-digit',
});

/**
 * Daily verified revenue for the trailing `days` window, oldest first.
 * Days with no sales are present with zero so the axis stays continuous.
 */
export function buildDailySales(
  orders: ReportingOrder[],
  days = 14,
  now: Date = new Date(),
): SalesPoint[] {
  const buckets = new Map<string, SalesPoint>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = toDateKey(d);
    buckets.set(key, {
      key,
      label: faDayMonth.format(d),
      revenueToman: 0,
      orderCount: 0,
    });
  }

  for (const order of paidOrders(orders)) {
    const bucket = buckets.get(toDateKey(order.createdAt));
    if (!bucket) continue;
    bucket.revenueToman += order.totalToman;
    bucket.orderCount += 1;
  }

  return [...buckets.values()];
}

export type ChannelSummary = {
  channel: 'RETAIL' | 'BATCH' | 'WHOLESALE';
  label: string;
  orderCount: number;
  revenueToman: number;
};

const CHANNEL_LABELS: Record<ChannelSummary['channel'], string> = {
  RETAIL: 'خرده‌فروشی',
  BATCH: 'بسته‌ای',
  WHOLESALE: 'عمده',
};

/** Persian name for an order's pricing channel. */
export function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel as ChannelSummary['channel']] ?? channel;
}

export const CHANNEL_ORDER: ChannelSummary['channel'][] = [
  'RETAIL',
  'BATCH',
  'WHOLESALE',
];

/** Retail vs batch vs wholesale, for verified orders only. */
export function summarizeChannels(orders: ReportingOrder[]): ChannelSummary[] {
  const paid = paidOrders(orders);
  return CHANNEL_ORDER.map((channel) => {
    const rows = paid.filter((o) => o.channel === channel);
    return {
      channel,
      label: CHANNEL_LABELS[channel],
      orderCount: rows.length,
      revenueToman: rows.reduce((sum, o) => sum + o.totalToman, 0),
    };
  });
}

export type FulfillmentSummary = {
  status: string;
  label: string;
  count: number;
};

const FULFILLMENT_LABELS: Record<string, string> = {
  PENDING: 'در انتظار پرداخت',
  PAID: 'در انتظار آماده‌سازی',
  PROCESSING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال‌شده',
  DELIVERED: 'تحویل‌شده',
  CANCELED: 'لغو‌شده',
};

const FULFILLMENT_ORDER = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
];

/**
 * Order counts by fulfillment status, across every order (this is an
 * operational queue, not a revenue figure, so unpaid orders belong here).
 */
export function summarizeFulfillment(
  orders: Array<{ status: string }>,
): FulfillmentSummary[] {
  return FULFILLMENT_ORDER.map((status) => ({
    status,
    label: FULFILLMENT_LABELS[status] ?? status,
    count: orders.filter((o) => o.status === status).length,
  }));
}
