import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDailySales,
  channelLabel,
  isPaidOrder,
  paidOrders,
  summarizeChannels,
  summarizeFulfillment,
  toDateKey,
  totalRevenueToman,
  type ReportingOrder,
} from '../src/lib/analytics';
import { resolveChannel, resolveTier, resolveUnitPrice, DEFAULT_TIERS } from '../src/lib/pricing';

const DAY = 24 * 60 * 60 * 1000;

function order(overrides: Partial<ReportingOrder> = {}): ReportingOrder {
  return {
    paymentStatus: 'PAID',
    status: 'PAID',
    channel: 'RETAIL',
    totalToman: 100000,
    createdAt: new Date('2026-10-10T09:00:00'),
    ...overrides,
  };
}

test('revenue counts verified payments only', () => {
  const orders = [
    order({ totalToman: 500000, paymentStatus: 'PAID' }),
    order({ totalToman: 900000, paymentStatus: 'PENDING' }),
    order({ totalToman: 700000, paymentStatus: 'FAILED' }),
    order({ totalToman: 300000, paymentStatus: 'CANCELED' }),
    order({ totalToman: 100000, paymentStatus: 'REFUNDED' }),
  ];

  assert.equal(totalRevenueToman(orders), 500000);
  assert.equal(paidOrders(orders).length, 1);
  assert.equal(isPaidOrder({ paymentStatus: 'PENDING' }), false);
});

test('an empty database reports zero rather than a fabricated figure', () => {
  assert.equal(totalRevenueToman([]), 0);
  assert.deepEqual(paidOrders([]), []);
});

test('daily buckets stay continuous and drop out-of-window orders', () => {
  const now = new Date('2026-10-16T12:00:00');
  const points = buildDailySales(
    [
      order({ totalToman: 200000, createdAt: new Date(now.getTime() - DAY) }),
      order({ totalToman: 300000, createdAt: new Date(now.getTime() - DAY) }),
      order({ totalToman: 400000, createdAt: now }),
      // Outside the 3-day window.
      order({ totalToman: 999999, createdAt: new Date(now.getTime() - 10 * DAY) }),
      // Inside the window but never paid.
      order({ totalToman: 888888, createdAt: now, paymentStatus: 'PENDING' }),
    ],
    3,
    now,
  );

  assert.equal(points.length, 3);
  assert.deepEqual(
    points.map((p) => p.revenueToman),
    [0, 500000, 400000],
  );
  assert.deepEqual(
    points.map((p) => p.orderCount),
    [0, 2, 1],
  );

  // Labels are Persian and the last bucket is today.
  assert.equal(points.at(-1)?.key, toDateKey(now));
  assert.match(points[0].label, /[۰-۹]/);
});

test('channel summary keeps a stable row order for retail, batch and wholesale', () => {
  const summary = summarizeChannels([
    order({ channel: 'WHOLESALE', totalToman: 1000000 }),
    order({ channel: 'RETAIL', totalToman: 200000 }),
    order({ channel: 'BATCH', totalToman: 400000 }),
    order({ channel: 'BATCH', totalToman: 400000 }),
    order({ channel: 'WHOLESALE', totalToman: 5000000, paymentStatus: 'FAILED' }),
  ]);

  assert.deepEqual(
    summary.map((c) => c.channel),
    ['RETAIL', 'BATCH', 'WHOLESALE'],
  );
  assert.deepEqual(
    summary.map((c) => c.orderCount),
    [1, 2, 1],
  );
  assert.deepEqual(
    summary.map((c) => c.revenueToman),
    [200000, 800000, 1000000],
  );
  assert.equal(channelLabel('WHOLESALE'), 'عمده');
});

test('fulfilment summary counts the operational queue, paid or not', () => {
  const summary = summarizeFulfillment([
    { status: 'PENDING' },
    { status: 'PENDING' },
    { status: 'PROCESSING' },
    { status: 'DELIVERED' },
  ]);

  const byStatus = Object.fromEntries(summary.map((s) => [s.status, s.count]));
  assert.equal(byStatus.PENDING, 2);
  assert.equal(byStatus.PROCESSING, 1);
  assert.equal(byStatus.DELIVERED, 1);
  assert.equal(byStatus.SHIPPED, 0);
});

test('daily keys use the local calendar day, not UTC', () => {
  // 00:30 local on the 5th must not fall into the 4th's bucket.
  const localMidnightish = new Date(2026, 9, 5, 0, 30);
  assert.equal(toDateKey(localMidnightish), '2026-10-05');
});

test('tier boundaries resolve to the documented price steps', () => {
  // 1-4 retail, 5-19 batch, 20+ wholesale.
  const expected: Array<[number, string, number]> = [
    [1, 'RETAIL', 150000],
    [4, 'RETAIL', 150000],
    [5, 'BATCH', 127500],
    [19, 'BATCH', 127500],
    [20, 'WHOLESALE', 105000],
    [100, 'WHOLESALE', 105000],
  ];

  for (const [qty, channel, unitPrice] of expected) {
    assert.equal(resolveChannel(qty), channel, `channel for qty ${qty}`);
    assert.equal(resolveUnitPrice(DEFAULT_TIERS, qty), unitPrice, `price for qty ${qty}`);
    assert.equal(resolveTier(DEFAULT_TIERS, qty).minQuantity <= qty, true);
  }
});
