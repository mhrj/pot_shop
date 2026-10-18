/**
/**
 * Telegram notification helper for admin alerts.
 * Fails gracefully without throwing errors so critical flows (like checkout) never break.
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      '[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing. Skipping notification.',
    );
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
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(
        `[telegram] Failed to send notification. HTTP status: ${response.status}`,
        errBody,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error('[telegram] Network error sending notification:', err);
    return false;
  }
}
