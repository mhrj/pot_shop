import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeIranianPhoneNumber, isValidIranianMobile } from '../src/lib/sms';
import {
  generateOtpCode,
  hashOtpCode,
  isVerificationCodeValid,
  OTP_MAX_ATTEMPTS,
} from '../src/lib/verification';

test('normalizeIranianPhoneNumber normalizes varied phone formats to 09xxxxxxxxx', () => {
  assert.equal(normalizeIranianPhoneNumber('09121234567'), '09121234567');
  assert.equal(normalizeIranianPhoneNumber('+989121234567'), '09121234567');
  assert.equal(normalizeIranianPhoneNumber('00989121234567'), '09121234567');
  assert.equal(normalizeIranianPhoneNumber('989121234567'), '09121234567');
  assert.equal(normalizeIranianPhoneNumber('9121234567'), '09121234567');
  assert.equal(normalizeIranianPhoneNumber(' 0912 123 4567 '), '09121234567');
  assert.equal(normalizeIranianPhoneNumber('۰۹۱۲۱۲۳۴۵۶۷'), '09121234567');
  assert.equal(normalizeIranianPhoneNumber('٠٩١٢١٢٣٤٥٦٧'), '09121234567');
});

test('isValidIranianMobile strictly validates 11 digits starting with 09', () => {
  assert.equal(isValidIranianMobile('09121234567'), true);
  assert.equal(isValidIranianMobile('09351234567'), true);
  assert.equal(isValidIranianMobile('09011234567'), true);

  assert.equal(isValidIranianMobile('08121234567'), false);
  assert.equal(isValidIranianMobile('0912123456'), false); // 10 digits
  assert.equal(isValidIranianMobile('091212345678'), false); // 12 digits
  assert.equal(isValidIranianMobile('0912abc4567'), false);
});

test('generateOtpCode returns a 5-digit string between 10000 and 99999', () => {
  for (let i = 0; i < 50; i++) {
    const code = generateOtpCode();
    assert.equal(code.length, 5);
    const num = parseInt(code, 10);
    assert.equal(num >= 10000 && num <= 99999, true);
  }
});

test('hashOtpCode creates deterministic sha256 hex string', () => {
  const hash1 = hashOtpCode('12345');
  const hash2 = hashOtpCode('12345 ');
  const hash3 = hashOtpCode('54321');

  assert.equal(hash1.length, 64);
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hash3);
});

test('isVerificationCodeValid validates expiration, attempts, and usedAt', () => {
  const now = Date.now();
  const valid = {
    usedAt: null,
    expiresAt: new Date(now + 60_000),
    attempts: 0,
  };
  const expired = {
    usedAt: null,
    expiresAt: new Date(now - 1_000),
    attempts: 0,
  };
  const used = {
    usedAt: new Date(),
    expiresAt: new Date(now + 60_000),
    attempts: 0,
  };
  const maxAttempts = {
    usedAt: null,
    expiresAt: new Date(now + 60_000),
    attempts: OTP_MAX_ATTEMPTS,
  };

  assert.equal(isVerificationCodeValid(valid), true);
  assert.equal(isVerificationCodeValid(expired), false);
  assert.equal(isVerificationCodeValid(used), false);
  assert.equal(isVerificationCodeValid(maxAttempts), false);
  assert.equal(isVerificationCodeValid(null), false);
});
