import test from 'node:test';
import assert from 'node:assert/strict';

import { getRegistrationConflict, normalizeRegistrationInput } from '../src/lib/register';
import { hashToken, isPasswordResetTokenValid } from '../src/lib/password-reset';

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

test('registration validation rejects missing phone and missing email', () => {
  assert.throws(
    () =>
      normalizeRegistrationInput({
        fullName: 'امیر',
        phone: '',
        email: 'amir@example.com',
        password: 'Str0ngPass!2025',
      }),
    /شماره موبایل/i,
  );

  assert.throws(
    () =>
      normalizeRegistrationInput({
        fullName: 'امیر',
        phone: '09121234567',
        email: '',
        password: 'Str0ngPass!2025',
      }),
    /ایمیل/i,
  );
});

test('duplicate email is detected for registration conflicts', () => {
  assert.equal(
    getRegistrationConflict('09121234567', 'amir@example.com', { phone: '09121234567', email: 'other@example.com' }),
    'phone',
  );
  assert.equal(
    getRegistrationConflict('09110000000', 'amir@example.com', { phone: '09121234567', email: 'amir@example.com' }),
    'email',
  );
  assert.equal(getRegistrationConflict('09110000000', 'new@example.com', { phone: '09121234567', email: 'other@example.com' }), null);
});

test('normalizeRegistrationInput requires a valid email for new registrations', () => {
  assert.throws(
    () =>
      normalizeRegistrationInput({
        fullName: 'امیر',
        phone: '09121234567',
        email: '',
        password: 'Str0ngPass!2025',
      }),
    /ایمیل/i,
  );

  const result = normalizeRegistrationInput({
    fullName: 'امیر',
    phone: '09121234567',
    email: 'AMIR@Example.com',
    password: 'Str0ngPass!2025',
  });

  assert.equal(result.email, 'amir@example.com');
});

test('normalizeRegistrationInput rejects weak passwords', () => {
  assert.throws(
    () =>
      normalizeRegistrationInput({
        fullName: 'امیر',
        phone: '09121234567',
        email: 'amir@example.com',
        password: '123',
      }),
    /رمز عبور/i,
  );
});

test('password reset tokens are single-use and expire correctly', () => {
  const valid = { usedAt: null, expiresAt: new Date(Date.now() + 60_000) };
  const expired = { usedAt: null, expiresAt: new Date(Date.now() - 60_000) };
  const used = { usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) };

  assert.equal(isPasswordResetTokenValid(valid), true);
  assert.equal(isPasswordResetTokenValid(expired), false);
  assert.equal(isPasswordResetTokenValid(used), false);
  assert.equal(hashToken('abc123').length > 0, true);
});
