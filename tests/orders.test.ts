import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allowedTransitions,
  canTransition,
  checkStatusTransition,
  isOrderStatus,
  isPaymentStatus,
  orderStatusLabel,
  paymentStatusAfterCancel,
  paymentStatusLabel,
  shouldRestoreStockOnCancel,
} from '../src/lib/orders';

test('order status transitions follow the fulfilment flow', () => {
  assert.equal(canTransition('PENDING', 'PAID'), true);
  assert.equal(canTransition('PAID', 'PROCESSING'), true);
  assert.equal(canTransition('PROCESSING', 'SHIPPED'), true);
  assert.equal(canTransition('SHIPPED', 'DELIVERED'), true);

  // Skipping ahead or rewinding is not a valid edit.
  assert.equal(canTransition('PENDING', 'DELIVERED'), false);
  assert.equal(canTransition('SHIPPED', 'PROCESSING'), false);
  assert.equal(canTransition('PENDING', 'SHIPPED'), false);
});

test('terminal statuses cannot be changed again', () => {
  // `allowedTransitions` always includes the current status (so a status
  // selector can render it), so terminal states come back with only themselves.
  assert.deepEqual(allowedTransitions('DELIVERED'), ['DELIVERED']);
  assert.deepEqual(allowedTransitions('CANCELED'), ['CANCELED']);
  assert.equal(canTransition('CANCELED', 'PAID'), false);
  assert.equal(canTransition('DELIVERED', 'CANCELED'), false);
});

test('a stuck order can always be cancelled before delivery', () => {
  assert.deepEqual(allowedTransitions('PENDING'), ['PENDING', 'PAID', 'CANCELED']);
  assert.equal(allowedTransitions('PENDING').includes('CANCELED'), true);
  assert.equal(allowedTransitions('DELIVERED').includes('CANCELED'), false);
  assert.equal(canTransition('PAID', 'CANCELED'), true);
  assert.equal(canTransition('PROCESSING', 'CANCELED'), true);
  assert.equal(canTransition('SHIPPED', 'CANCELED'), true);
});

test('an unpaid order can never be marked as paid by an admin status edit', () => {
  const blocked = checkStatusTransition({
    from: 'PENDING',
    to: 'PAID',
    paymentStatus: 'PENDING',
  });
  assert.equal(blocked.ok, false);
  assert.match(blocked.ok === false ? blocked.message : '', /تأیید پرداخت/);

  // The same edit is fine once the gateway actually verified the payment.
  assert.equal(
    checkStatusTransition({ from: 'PENDING', to: 'PAID', paymentStatus: 'PAID' }).ok,
    true,
  );

  for (const paymentStatus of ['FAILED', 'CANCELED', 'REFUNDED'] as const) {
    assert.equal(
      checkStatusTransition({ from: 'PENDING', to: 'PAID', paymentStatus }).ok,
      false,
    );
  }
});

test('re-saving the current status is always allowed', () => {
  assert.equal(
    checkStatusTransition({ from: 'CANCELED', to: 'CANCELED', paymentStatus: 'CANCELED' }).ok,
    true,
  );
});

test('cancelling a canceled order does not restore stock twice', () => {
  // Stock is only ever held by a PAID order, so the guard is the payment state.
  assert.equal(shouldRestoreStockOnCancel('PENDING'), false);
  assert.equal(shouldRestoreStockOnCancel('FAILED'), false);
  assert.equal(shouldRestoreStockOnCancel('CANCELED'), false);
  assert.equal(shouldRestoreStockOnCancel('REFUNDED'), false);
  assert.equal(shouldRestoreStockOnCancel('PAID'), true);

  // The first cancel flips PAID -> REFUNDED, so a replayed request fails the
  // guard above and the products are not credited a second time.
  assert.equal(paymentStatusAfterCancel('PAID'), 'REFUNDED');
  assert.equal(shouldRestoreStockOnCancel(paymentStatusAfterCancel('PAID')), false);

  assert.equal(paymentStatusAfterCancel('PENDING'), 'CANCELED');
  assert.equal(paymentStatusAfterCancel('FAILED'), 'FAILED');
});

test('unknown status values are rejected rather than silently coerced', () => {
  assert.equal(isOrderStatus('PAID'), true);
  assert.equal(isOrderStatus('paid'), false);
  assert.equal(isOrderStatus(''), false);
  assert.equal(isPaymentStatus('REFUNDED'), true);
  assert.equal(isPaymentStatus('DELIVERED'), false);
});

test('every status has a Persian label and no raw enum leaks through', () => {
  for (const status of ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED']) {
    const label = orderStatusLabel(status);
    assert.notEqual(label, status);
    assert.ok(label.length > 0);
  }
  for (const status of ['PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED']) {
    assert.notEqual(paymentStatusLabel(status), status);
  }
});
