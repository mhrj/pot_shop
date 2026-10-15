export function getZarinpalConfig() {
  const sandbox = process.env.ZARINPAL_SANDBOX === 'true';
  const host = sandbox
    ? 'https://sandbox.zarinpal.com'
    : 'https://payment.zarinpal.com';
  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim() || null;

  return {
    enabled: Boolean(merchantId),
    sandbox,
    host,
    merchantId,
  };
}
