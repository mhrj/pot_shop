/**
 * Telegram Bot API notification helper for admin alerts.
 * Fails gracefully without throwing errors so critical flows (like checkout) never break.
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && !data.ok)) {
      console.error(
        `[telegram] Failed to send notification. HTTP status: ${response.status}`,
        data,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error('[telegram] Network error sending notification:', err);
    return false;
  }
}
