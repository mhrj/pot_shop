import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRegistrationInput } from '../src/lib/register';

test('normalizeRegistrationInput accepts valid Persian customer data', () => {
  const result = normalizeRegistrationInput({
    fullName: 'زهرا محمدی',
    phone: '09121234567',
    email: 'zahram@example.com',
    password: 'Str0ngPass!2025',
  });

  assert.equal(result.role, 'CUSTOMER');
  assert.equal(result.phone, '09121234567');
  assert.equal(result.email, 'zahram@example.com');
  assert.equal(result.fullName, 'زهرا محمدی');
});

test('normalizeRegistrationInput rejects weak passwords', () => {
  assert.throws(
    () =>
      normalizeRegistrationInput({
        fullName: 'امیر',
        phone: '09121234567',
        password: '123',
      }),
    /رمز عبور/i,
  );
});
