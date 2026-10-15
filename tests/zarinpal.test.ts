import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getZarinpalConfig } from '../src/lib/zarinpal-config';

describe('Zarinpal config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns a disabled config when the merchant ID is missing', () => {
    delete process.env.ZARINPAL_MERCHANT_ID;

    const config = getZarinpalConfig();

    assert.equal(config.enabled, false);
    assert.equal(config.merchantId, null);
    assert.equal(config.host, 'https://payment.zarinpal.com');
  });
});
