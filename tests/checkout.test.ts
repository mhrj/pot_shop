import assert from 'node:assert/strict';
import test from 'node:test';

import { calcShippingToman, priceCart } from '../src/lib/pricing';
import { getStockShortages, isPaymentAlreadyProcessed } from '../src/lib/cart';

test('checkout pricing uses tiered prices and shipping rules', () => {
  const totals = priceCart([
    {
      product: {
        id: 'p1',
        slug: 'harvest-pot',
        name: 'گلدان برداشت',
        basePriceToman: 150000,
        weightGrams: 1200,
        unitsPerCarton: 6,
      },
      tiers: [
        { minQuantity: 1, unitPriceToman: 150000, label: 'خرده' },
        { minQuantity: 5, unitPriceToman: 127500, label: 'بسته‌ای' },
      ],
      quantity: 5,
    },
  ]);

  assert.equal(totals.subtotalToman, 750000);
  assert.equal(totals.discountToman, 112500);
  assert.equal(totals.payableToman, 637500);
  assert.equal(totals.channel, 'BATCH');
  assert.equal(calcShippingToman(totals, 'تهران'), 180000);
});

test('checkout validation rejects items that exceed available stock', () => {
  const shortages = getStockShortages([
    { name: 'گلدان آبی', quantity: 2, stock: 1 },
    { name: 'گلدان سبز', quantity: 1, stock: 3 },
  ]);

  assert.deepEqual(shortages, [{ name: 'گلدان آبی', available: 1 }]);
});

test('payment success is resolved only from the stored paid state', () => {
  assert.equal(isPaymentAlreadyProcessed({ paymentStatus: 'PAID', refId: 'ABC123' }), true);
  assert.equal(isPaymentAlreadyProcessed({ paymentStatus: 'PENDING', refId: 'ABC123' }), false);
  assert.equal(isPaymentAlreadyProcessed({ paymentStatus: 'PAID', refId: null }), false);
});
