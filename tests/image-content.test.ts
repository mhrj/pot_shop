import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IMAGE_EXTENSION_BY_TYPE,
  sniffImageType,
  type SniffedImageType,
} from '../src/lib/image-validation';
import { isRetryableGatewayFailure } from '../src/lib/orders';

/** Builds a fixture from byte arrays and ASCII strings. */
function bytes(...parts: (number[] | string)[]): Uint8Array {
  const out: number[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      for (const ch of part) out.push(ch.charCodeAt(0));
    } else {
      out.push(...part);
    }
  }
  return new Uint8Array(out);
}

const PAD = new Array(8).fill(0);

const FIXTURES: Record<SniffedImageType, Uint8Array> = {
  'image/png': bytes([0x89], 'PNG', [0x0d, 0x0a, 0x1a, 0x0a], 'IHDR', PAD),
  'image/jpeg': bytes([0xff, 0xd8, 0xff, 0xe0], 'JFIF', PAD),
  'image/gif': bytes('GIF89a', PAD),
  'image/webp': bytes('RIFF', [0, 0, 0, 0], 'WEBP', 'VP8 ', PAD),
  'image/avif': bytes([0, 0, 0, 0x20], 'ftyp', 'avif', PAD),
};

test('recognises every accepted format from its leading bytes', () => {
  for (const [expected, fixture] of Object.entries(FIXTURES)) {
    assert.equal(sniffImageType(fixture), expected, `expected ${expected}`);
  }
});

test('recognises the older GIF87a header as well as GIF89a', () => {
  assert.equal(sniffImageType(bytes('GIF87a', PAD)), 'image/gif');
});

test('accepts an AVIF whose avif brand is only a compatible brand', () => {
  // Major brand "mif1", with "avif" listed later in the compatible-brand list.
  const compatible = bytes([0, 0, 0, 0x20], 'ftyp', 'mif1', [0, 0, 0, 0], 'avif', PAD);
  assert.equal(sniffImageType(compatible), 'image/avif');
});

test('rejects content that is not an image however it is named', () => {
  // The upload path serves these from the site's own origin, so an HTML or SVG
  // document labelled "photo.png" must not be persisted as an image.
  const nonImages: Record<string, Uint8Array> = {
    html: bytes('<!DOCTYPE html><html><body>hi</body></html>'),
    svg: bytes('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'),
    php: bytes('<?php system($_GET["c"]); ?>'),
    plainText: bytes('this is just a text file, not an image at all'),
  };

  for (const [label, fixture] of Object.entries(nonImages)) {
    assert.equal(sniffImageType(fixture), null, `expected ${label} to be refused`);
  }
});

test('rejects empty, missing and truncated input rather than guessing', () => {
  assert.equal(sniffImageType(new Uint8Array(0)), null);
  assert.equal(sniffImageType(null), null);
  assert.equal(sniffImageType(undefined), null);

  // A bare PNG signature with nothing behind it is too short to classify.
  assert.equal(sniffImageType(bytes([0x89], 'PNG')), null);
});

test('does not mistake a RIFF container that is not WebP', () => {
  const wav = bytes('RIFF', [0, 0, 0, 0], 'WAVE', 'fmt ', PAD);
  assert.equal(sniffImageType(wav), null);
});

test('every accepted type has exactly one persisted extension', () => {
  const types = Object.keys(FIXTURES) as SniffedImageType[];
  const extensions = types.map((t) => IMAGE_EXTENSION_BY_TYPE[t]);

  assert.equal(extensions.length, types.length);
  assert.equal(new Set(extensions).size, extensions.length, 'extensions collide');
  for (const extension of extensions) {
    assert.match(extension, /^\.[a-z0-9]+$/, `unsafe extension: ${extension}`);
  }
});

test('only an unreachable or unconfigured gateway stays retryable', () => {
  // 502 (unreachable) and 503 (not configured) must not write an order off as
  // FAILED — the customer may have paid.
  assert.equal(isRetryableGatewayFailure(502), true);
  assert.equal(isRetryableGatewayFailure(503), true);

  // Real declines from the gateway are terminal.
  for (const decline of [-9, -10, -11, -12, -15, -16, -30, -31, -32, -40, -50, -51, -54]) {
    assert.equal(isRetryableGatewayFailure(decline), false, `code ${decline}`);
  }

  assert.equal(isRetryableGatewayFailure(100), false);
  assert.equal(isRetryableGatewayFailure(101), false);
  assert.equal(isRetryableGatewayFailure(500), false);
});
