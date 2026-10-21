import assert from 'node:assert/strict';
import test from 'node:test';

import { calcShippingToman, priceCart } from '../src/lib/pricing';
import { getStockShortages, isPaymentAlreadyProcessed } from '../src/lib/cart';
import { parseColorOptions } from '../src/lib/product-features';

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

test('priceCart enforces allowBatchDiscount=false so bulk orders do not get discounts', () => {
  const totals = priceCart([
    {
      product: {
        id: 'p2',
        slug: 'no-discount-pot',
        name: 'گلدان بدون تخفیف',
        basePriceToman: 100000,
        weightGrams: 500,
        unitsPerCarton: 1,
        allowBatchDiscount: false,
      },
      tiers: [
        { minQuantity: 1, unitPriceToman: 100000, label: 'خرده' },
        { minQuantity: 5, unitPriceToman: 80000, label: 'بسته‌ای' },
      ],
      quantity: 10,
    },
  ]);

  // Even with 10 units, unit price stays 100,000 and discount is 0
  assert.equal(totals.lines[0].unitToman, 100000);
  assert.equal(totals.lines[0].lineSavingsToman, 0);
  assert.equal(totals.lines[0].lineTotalToman, 1000000);
  assert.equal(totals.payableToman, 1000000);
  assert.equal(totals.discountToman, 0);
});

test('parseColorOptions converts legacy string arrays to objects with defaultStock fallback', () => {
  const legacyStrings = ['#ff0000', '00ff00', '#123'];
  const parsed = parseColorOptions(legacyStrings, 7);
  assert.deepEqual(parsed, [
    { hexCode: '#FF0000', stock: 7 },
    { hexCode: '#00FF00', stock: 7 },
    { hexCode: '#123', stock: 7 },
  ]);
});

test('parseColorOptions preserves stock when raw contains objects', () => {
  const objects = [
    { hexCode: '#FF0000', stock: 2 },
    { hex: '#00FF00', stock: 0 },
    { hexCode: '#AABBCC' },
  ];
  const parsed = parseColorOptions(objects, 10);
  assert.deepEqual(parsed, [
    { hexCode: '#FF0000', stock: 2 },
    { hexCode: '#00FF00', stock: 0 },
    { hexCode: '#AABBCC', stock: 10 },
  ]);
});
