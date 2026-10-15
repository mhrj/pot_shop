import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeAddressInput } from '../src/lib/address';

describe('Address normalization', () => {
  it('normalizes a valid address payload and preserves the default flag', () => {
    const input = {
      label: 'HOME',
      fullName: '  علی رضایی  ',
      phone: '09121234567',
      province: 'تهران',
      city: 'تهران',
      postalCode: ' 1234567890 ',
      line1: 'خیابان ولیعصر',
      line2: ' پلاک ۱۲ ',
      isDefault: true,
    };

    const result = normalizeAddressInput(input);

    assert.equal(result.label, 'HOME');
    assert.equal(result.fullName, 'علی رضایی');
    assert.equal(result.phone, '09121234567');
    assert.equal(result.province, 'تهران');
    assert.equal(result.city, 'تهران');
    assert.equal(result.postalCode, '1234567890');
    assert.equal(result.line1, 'خیابان ولیعصر');
    assert.equal(result.line2, 'پلاک ۱۲');
    assert.equal(result.isDefault, true);
  });

  it('rejects invalid phone numbers and blank required fields', () => {
    const input = {
      label: 'HOME',
      fullName: '',
      phone: '123',
      province: 'تهران',
      city: '',
      postalCode: '123',
      line1: '',
      line2: '',
      isDefault: false,
    };

    assert.throws(() => normalizeAddressInput(input), /fullName|phone|city|line1/);
  });
});
