import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { isUnoptimizedImage, persistedImageUrlSchema } from '../src/lib/image-validation';

test('persisted image URLs accept local uploads and valid absolute URLs', () => {
  const schema = z.array(persistedImageUrlSchema).max(10);

  assert.doesNotThrow(() => {
    schema.parse(['/uploads/product/abc.jpg', 'https://cdn.example.com/hero.jpg']);
  });
});

test('persisted image URLs reject malformed values', () => {
  const schema = z.array(persistedImageUrlSchema).max(10);

  assert.throws(() => {
    schema.parse(['blob:https://example.com/fake', 'not-a-url', '']);
  });
});

test('isUnoptimizedImage correctly detects SVG and placehold.co SVG placeholders', () => {
  // SVGs and SVG data URLs
  assert.equal(isUnoptimizedImage('/icons/logo.svg'), true);
  assert.equal(isUnoptimizedImage('https://cdn.example.com/vector.svg?v=2'), true);
  assert.equal(isUnoptimizedImage('data:image/svg+xml;utf8,<svg></svg>'), true);

  // placehold.co defaults to SVG unless an extension like .png or .webp is present
  assert.equal(isUnoptimizedImage('https://placehold.co/800x1000/E8D5C4/3E2723'), true);
  assert.equal(isUnoptimizedImage('https://placehold.co/800x800/E8D5C4/3E2723?text=Test'), true);
  assert.equal(isUnoptimizedImage('https://placehold.co/800x800/E8D5C4/3E2723.png?text=Test'), false);
  assert.equal(isUnoptimizedImage('https://placehold.co/800x800/E8D5C4/3E2723.webp'), false);

  // Raster formats
  assert.equal(isUnoptimizedImage('/uploads/photo.jpg'), false);
  assert.equal(isUnoptimizedImage('/images/hero-fallback.webp'), false);
  assert.equal(isUnoptimizedImage('https://example.com/banner.png'), false);

  // Edge cases
  assert.equal(isUnoptimizedImage(''), false);
  assert.equal(isUnoptimizedImage(null as unknown as string), false);
  assert.equal(isUnoptimizedImage(undefined as unknown as string), false);
});

