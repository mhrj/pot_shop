import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { persistedImageUrlSchema } from '../src/lib/image-validation';

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
