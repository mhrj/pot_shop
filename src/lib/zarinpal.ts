import 'server-only';
import { getZarinpalConfig } from '@/lib/zarinpal-config';

export { getZarinpalConfig };

// Zarinpal expects amounts in Rials, not Toman.
export const tomanToRial = (toman: number) => Math.round(toman) * 10;

/** The envelope both v4 endpoints answer with. */
type ZarinpalResponse = {
  data?: {
    authority?: string;
    code?: number;
    ref_id?: string | number;
    card_pan?: string;
  };
  errors?: { code?: number; message?: string };
};

/**
 * A timeout or a DNS/TLS failure *rejects* the fetch rather than returning a
 * status. Both callers treat "not ok" as a handled gateway failure, so a
 * rejection has to be converted into one here: otherwise the request path would
 * 500 and strand the PENDING order it had just created, and the verify path
 * would 500 on a payment that may well have succeeded.
 */
const GATEWAY_UNREACHABLE =
  'ارتباط با درگاه پرداخت برقرار نشد. لطفاً چند لحظه بعد دوباره تلاش کنید.';
const GATEWAY_TIMEOUT_MS = 10_000;

type GatewayAttempt =
  | { reached: true; res: Response; json: ZarinpalResponse | null }
  | { reached: false };

async function postZarinpal(url: string, body: unknown): Promise<GatewayAttempt> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => null)) as ZarinpalResponse | null;
    return { reached: true, res, json };
  } catch {
    return { reached: false };
  }
}

const NOT_ENABLED =
  'درگاه پرداخت در این محیط فعال نیست. لطفاً تنظیمات زرین‌پال را بررسی کنید.';

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
  const { enabled, host, merchantId } = getZarinpalConfig();

  if (!enabled || !merchantId) {
    return { ok: false, code: 503, message: NOT_ENABLED };
  }

  const attempt = await postZarinpal(`${host}/pg/v4/payment/request.json`, {
    merchant_id: merchantId,
    amount: tomanToRial(params.amountToman),
    callback_url: params.callbackUrl,
    description: params.description,
    metadata: {
      mobile: params.mobile,
      email: params.email,
      order_id: params.orderId,
    },
  });

  if (!attempt.reached) {
    return { ok: false, code: 502, message: GATEWAY_UNREACHABLE };
  }

  const { res, json } = attempt;
  const data = json?.data;

  if (!res.ok || !data?.authority) {
    return {
      ok: false,
      code: json?.errors?.code ?? res.status,
      message: json?.errors?.message ?? 'خطا در ارتباط با درگاه پرداخت',
    };
  }

  return {
    ok: true,
    authority: data.authority,
    code: data.code ?? 100,
    redirectUrl: `${host}/pg/StartPay/${data.authority}`,
  };
}

export type ZarinpalVerifyResult =
  | { ok: true; refId: string; cardPan?: string; code: 100 | 101 }
  | { ok: false; code: number; message: string };

export async function zarinpalVerify(params: {
  amountToman: number;
  authority: string;
}): Promise<ZarinpalVerifyResult> {
  const { enabled, host, merchantId } = getZarinpalConfig();

  if (!enabled || !merchantId) {
    return { ok: false, code: 503, message: NOT_ENABLED };
  }

  const attempt = await postZarinpal(`${host}/pg/v4/payment/verify.json`, {
    merchant_id: merchantId,
    amount: tomanToRial(params.amountToman),
    authority: params.authority,
  });

  if (!attempt.reached) {
    return { ok: false, code: 502, message: GATEWAY_UNREACHABLE };
  }

  const { res, json } = attempt;
  const data = json?.data;
  const code = data?.code ?? json?.errors?.code ?? res.status;

  // A ref_id is required, not merely a success code: the verify route treats a
  // stored refId as its marker that the order is already settled, so recording a
  // PAID order without one would leave the callback replayable.
  if ((code === 100 || code === 101) && data?.ref_id != null) {
    return {
      ok: true,
      code,
      refId: String(data.ref_id),
      cardPan: data.card_pan ?? undefined,
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
  '-11': 'مرچنت‌کد فعال نیست',
  '-12': 'تلاش بیش از حد در بازه زمانی مشخص',
  '-15': 'ترمینال شما تایید نشده است',
  '-16': 'سطح تأیید پذیرنده پایین‌تر از سطح نقره‌ای است',
  '-30': 'اجازه دسترسی به ترمینال وجود ندارد',
  '-31': 'حساب بانکی تسویه‌شده فعال نیست',
  '-32': 'مبلغ وارد شده از سقف مجاز بیشتر است',
  '-40': 'پارامترهای اضافی نامعتبر است',
  '-50': 'مبلغ پرداخت‌شده با مبلغ سفارش مغایرت دارد',
  '-51': 'پرداخت ناموفق بود',
  '-54': 'درخواست مورد نظر آرشیو شده است',
};
