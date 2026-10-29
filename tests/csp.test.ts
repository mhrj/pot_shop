import test from 'node:test';
import assert from 'node:assert/strict';
import nextConfig, { getCspHeader } from '../next.config';

test('Content Security Policy includes unsafe-eval in development mode', () => {
  const devCsp = getCspHeader(true);
  assert.match(devCsp, /script-src [^;]*'unsafe-eval'/);
  assert.doesNotMatch(devCsp, /\n/);
  assert.doesNotMatch(devCsp, /\s{2,}/);
});

test('Content Security Policy excludes unsafe-eval in production mode', () => {
  const prodCsp = getCspHeader(false);
  assert.doesNotMatch(prodCsp, /'unsafe-eval'/);
  assert.match(prodCsp, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(prodCsp, /\n/);
  assert.doesNotMatch(prodCsp, /\s{2,}/);
});

test('next.config headers include CSP and essential security headers', async () => {
  if (typeof nextConfig.headers !== 'function') {
    assert.fail('nextConfig.headers should be a function');
  }

  const headerConfigs = await nextConfig.headers();
  const rootConfig = headerConfigs.find((h) => h.source === '/(.*)');
  assert.ok(rootConfig, 'Root header configuration should exist');

  const headers = rootConfig.headers;
  const csp = headers.find((h) => h.key === 'Content-Security-Policy');
  const xFrameOptions = headers.find((h) => h.key === 'X-Frame-Options');
  const xContentTypeOptions = headers.find((h) => h.key === 'X-Content-Type-Options');
  const referrerPolicy = headers.find((h) => h.key === 'Referrer-Policy');

  assert.ok(csp?.value, 'CSP header should be present');
  assert.equal(xFrameOptions?.value, 'SAMEORIGIN');
  assert.equal(xContentTypeOptions?.value, 'nosniff');
  assert.equal(referrerPolicy?.value, 'strict-origin-when-cross-origin');
});
