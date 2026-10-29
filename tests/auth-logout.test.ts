import test from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import {
  SESSION_COOKIE,
  verifySessionToken,
  getExpiredSessionCookieOptions,
} from '../src/lib/auth-edge';
import { POST } from '../src/app/api/auth/logout/route';

const TEST_SECRET = '01234567890123456789012345678901'; // 32 characters
const encodedSecret = new TextEncoder().encode(TEST_SECRET);

test.beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

test('verifySessionToken succeeds for valid, non-expired tokens', async () => {
  const token = await new SignJWT({
    role: 'CUSTOMER',
    name: 'علی حسینی',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('user-123')
    .setIssuedAt()
    .setIssuer('pot-shop')
    .setExpirationTime('1d')
    .sign(encodedSecret);

  const payload = await verifySessionToken(token);
  assert.ok(payload);
  assert.equal(payload.sub, 'user-123');
  assert.equal(payload.role, 'CUSTOMER');
  assert.equal(payload.name, 'علی حسینی');
});

test('verifySessionToken returns null for expired tokens', async () => {
  const expiredToken = await new SignJWT({
    role: 'ADMIN',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin-456')
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(encodedSecret);

  const payload = await verifySessionToken(expiredToken);
  assert.equal(payload, null);
});

test('verifySessionToken returns null for tampered or invalid signatures', async () => {
  const wrongSecret = new TextEncoder().encode('different-secret-key-32-chars-ok!');
  const foreignToken = await new SignJWT({ role: 'ADMIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('hacker-999')
    .sign(wrongSecret);

  const payload = await verifySessionToken(foreignToken);
  assert.equal(payload, null);
});

test('verifySessionToken returns null for malformed or empty token strings', async () => {
  assert.equal(await verifySessionToken(''), null);
  assert.equal(await verifySessionToken('not-a-valid-jwt'), null);
  assert.equal(await verifySessionToken('a.b.c'), null);
});

test('getExpiredSessionCookieOptions configures secure expiration in production', () => {
  const env = process.env as Record<string, string | undefined>;
  const originalEnv = env.NODE_ENV;
  try {
    env.NODE_ENV = 'production';
    const prodOptions = getExpiredSessionCookieOptions();
    assert.equal(prodOptions.httpOnly, true);
    assert.equal(prodOptions.secure, true);
    assert.equal(prodOptions.sameSite, 'lax');
    assert.equal(prodOptions.path, '/');
    assert.equal(prodOptions.maxAge, 0);
    assert.equal(prodOptions.expires.getTime(), 0);

    env.NODE_ENV = 'development';
    const devOptions = getExpiredSessionCookieOptions();
    assert.equal(devOptions.secure, false);
    assert.equal(devOptions.path, '/');
  } finally {
    env.NODE_ENV = originalEnv;
  }
});

test('POST /api/auth/logout returns ok:true and Set-Cookie with maxAge=0 for fetch callers', async () => {
  const req = new Request('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
  });

  const res = await POST(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.deepEqual(data, { ok: true });

  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie, 'set-cookie header must be present');
  assert.ok(setCookie.includes(`${SESSION_COOKIE}=`), 'must target ps_session');
  assert.ok(setCookie.includes('Max-Age=0'), 'must set Max-Age=0');
  assert.ok(setCookie.includes('Path=/'), 'must set Path=/');
});

test('POST /api/auth/logout redirects HTML form posts using NEXT_PUBLIC_APP_URL', async () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  try {
    process.env.NEXT_PUBLIC_APP_URL = 'https://potshop.liara.run';

    const req = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    const res = await POST(req);
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), 'https://potshop.liara.run/');

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.ok(setCookie.includes(`${SESSION_COOKIE}=`));
    assert.ok(setCookie.includes('Max-Age=0'));
  } finally {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});
