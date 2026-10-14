import 'server-only';

const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
const HOST = SANDBOX
  ? 'https://sandbox.zarinpal.com'
  : 'https://payment.zarinpal.com';

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID;

if (!MERCHANT_ID) {
  throw new Error('ZARINPAL_MERCHANT_ID is not set');
}

// Zarinpal expects amounts in Rials, not Toman.
export const tomanToRial = (toman: number) => Math.round(toman) * 10;

export type ZarinpalRequestResult =
  | { ok: true; authority: string; redirectUrl: string; code: number }
  | { ok: false; code: number; message: string };

export async function zarinpalRequest(params: {
  amountToman: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
  orderId: string;
}): Promise<ZarinpalRequestResult> {
  const body = {
    merchant_id: MERCHANT_ID,
    amount: tomanToRial(params.amountToman),
    callback_url: params.callbackUrl,
    description: params.description,
    metadata: {
      mobile: params.mobile,
      email: params.email,
      order_id: params.orderId,
    },
  };

  const res = await fetch(`${HOST}/pg/v4/payment/request.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.data?.authority) {
    return {
      ok: false,
      code: json?.errors?.code ?? res.status,
      message: json?.errors?.message ?? 'خطا در ارتباط با درگاه پرداخت',
    };
  }

  return {
    ok: true,
    authority: json.data.authority as string,
    code: json.data.code as number,
    redirectUrl: `${HOST}/pg/StartPay/${json.data.authority}`,
  };
}

export type ZarinpalVerifyResult =
  | { ok: true; refId: string; cardPan?: string; code: 100 | 101 }
  | { ok: false; code: number; message: string };

export async function zarinpalVerify(params: {
  amountToman: number;
  authority: string;
}): Promise<ZarinpalVerifyResult> {
  const res = await fetch(`${HOST}/pg/v4/payment/verify.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      merchant_id: MERCHANT_ID,
      amount: tomanToRial(params.amountToman),
      authority: params.authority,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  const json = await res.json().catch(() => null);
  const code = json?.data?.code ?? json?.errors?.code ?? res.status;

  // 100 = successful verify, 101 = already verified (idempotent success).
  if (code === 100 || code === 101) {
    return {
      ok: true,
      code,
      refId: String(json.data.ref_id),
      cardPan: json.data.card_pan ?? undefined,
    };
  }

  return {
    ok: false,
    code,
    message: json?.errors?.message ?? 'پرداخت تأیید نشد',
  };
}

export const ZARINPAL_ERRORS: Record<number, string> = {
  '-9': 'خطای اعتبارسنجی — اطلاعات ارسالی نامعتبر است',
  '-10': 'آی‌پی یا مرچنت‌کد پذیرنده صحیح نیست',
  '-11': 'مرچنت‌کد ففعال نیست',
  '-12': 'تلاش بیش از حد در بازه زمانی مشخص',
  '-15': 'ترمینال شما تایید نشده است',
  '-16': 'سطح تأیید پذیرنده پایین‌تر از سطح نقره‌ای است',
  '-30': 'اجازه دسترسی به ترمینال وجود ندارد',
  '-31': 'حساب بانکی تسویه‌شده ففعال نیست',
  '-32': 'مبلغ وارد شده از سقفف مجاز بیشتر است',
  '-40': 'پارامترهای اضاففی نامعتبر است',
  '-50': 'مبلغ پرداخت‌شده با مبلغ سففارش مغایرت دارد',
  '-51': 'پرداخت ناموففق بود',
  '-54': 'درخواست مورد نظر آرشیو شده است',
};
