import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveCityCode } from '../src/lib/postex';

describe('Store Shipping Origin & Postex mapping', () => {
  it('maps known Iranian cities to their respective Postex city codes', () => {
    assert.equal(resolveCityCode('تهران'), 1);
    assert.equal(resolveCityCode('اصفهان'), 175);
    assert.equal(resolveCityCode('شیراز'), 409);
    assert.equal(resolveCityCode('مشهد'), 264);
    assert.equal(resolveCityCode('تبریز'), 619);
    assert.equal(resolveCityCode('اهواز'), 200);
    assert.equal(resolveCityCode('رشت'), 324);
    assert.equal(resolveCityCode('یزد'), 585);
  });

  it('handles province names and city names with surrounding whitespace', () => {
    assert.equal(resolveCityCode('  تهران  '), 1);
    assert.equal(resolveCityCode('فارس'), 409);
    assert.equal(resolveCityCode('خراسان رضوی'), 264);
  });

  it('falls back to code 1 (Tehran) for unknown or empty cities', () => {
    assert.equal(resolveCityCode(''), 1);
    assert.equal(resolveCityCode(undefined), 1);
    assert.equal(resolveCityCode('شهر ناشناخته فرضی'), 1);
  });
});
