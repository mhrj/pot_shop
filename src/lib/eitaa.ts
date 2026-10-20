/**
 * EitaaYar notification helper for admin alerts.
 * Fails gracefully without throwing errors so critical flows (like checkout) never break.
 */
export async function sendEitaaNotification(message: string): Promise<boolean> {
  const token = process.env.EITAA_API_TOKEN?.trim();
  const chatId = process.env.EITAA_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.warn(
      '[eitaa] EITAA_API_TOKEN or EITAA_CHAT_ID is missing. Skipping notification.',
    );
    return false;
  }

  try {
    const url = `https://eitaayar.ir/api/${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'html',
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && !data.ok)) {
      console.error(
        `[eitaa] Failed to send notification. HTTP status: ${response.status}`,
        data,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error('[eitaa] Network error sending notification:', err);
    return false;
  }
}
