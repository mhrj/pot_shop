import test from 'node:test';
import assert from 'node:assert/strict';
import { sendTelegramNotification } from '../src/lib/telegram';

test('Telegram notifications', async (t) => {
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    process.env = { ...originalEnv };
  });

  await t.test('skips notification and returns false when credentials are missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const result = await sendTelegramNotification('تست');
    assert.equal(result, false);
  });

  await t.test('handles network failure without throwing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
    process.env.TELEGRAM_CHAT_ID = 'mock-chat-id';

    // Mock global fetch to reject
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Connection refused');
    };

    try {
      const result = await sendTelegramNotification('تست');
      assert.equal(result, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('sends payload correctly when fetch succeeds', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
    process.env.TELEGRAM_CHAT_ID = 'mock-chat-id';

    let calledUrl = '';
    let calledBody: any = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calledUrl = String(url);
      calledBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    try {
      const result = await sendTelegramNotification('<b>سفارش جدید</b>');
      assert.equal(result, true);
      assert.match(calledUrl, /botmock-token\/sendMessage/);
      assert.equal(calledBody.chat_id, 'mock-chat-id');
      assert.equal(calledBody.text, '<b>سفارش جدید</b>');
      assert.equal(calledBody.parse_mode, 'HTML');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
