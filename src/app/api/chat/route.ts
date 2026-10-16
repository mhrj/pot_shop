import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatToman, toFa } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  sessionId: z.string().min(8).max(64),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const ESCALATION_TOKEN = '[[HUMAN_SUPPORT]]';

async function callGroq(systemInstruction: string, history: Array<{ role: string; content: string }>, last: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemInstruction },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: last },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Groq provider request failed');
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('Groq response did not include a message');
  }
  return text;
}

async function callGemini(systemInstruction: string, history: Array<{ role: string; content: string }>, last: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    systemInstruction,
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      maxOutputTokens: 700,
    },
  });

  const chat = model.startChat({ history: history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })) });
  const result = await chat.sendMessage(last);
  return result.response.text().trim();
}

// Simple in-memory limiter. In production, back with Redis.
const hits = new Map<string, { count: number; resetAt: number }>();
function limited(key: string, max = 20, windowMs = 60_000) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || rec.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  rec.count += 1;
  return rec.count > max;
}

/**
 * Provider chat histories must open with a user turn — Gemini rejects a
 * history whose first entry is the model's. The widget seeds its thread with
 * the assistant greeting, so leading model turns are dropped here rather than
 * trusting every caller to strip them.
 */
function toProviderHistory(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
) {
  const firstUser = messages.findIndex((m) => m.role === 'user');
  return firstUser === -1 ? [] : messages.slice(firstUser);
}

async function buildCatalogContext() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      name: true,
      slug: true,
      material: true,
      diameterCm: true,
      heightCm: true,
      weightGrams: true,
      drainageHole: true,
      frostProof: true,
      stock: true,
      basePriceToman: true,
      unitsPerCarton: true,
      tiers: {
        orderBy: { minQuantity: 'asc' },
        select: { minQuantity: true, unitPriceToman: true, label: true },
      },
    },
    take: 40,
    orderBy: { isFeatured: 'desc' },
  });

  if (!products.length) {
    return 'در حال حاضر فهرست محصولات در دسترس نیست.';
  }

  return products
    .map((p) => {
      const tiers = p.tiers
        .map((t) => `${toFa(t.minQuantity)}+ عدد: ${formatToman(t.unitPriceToman)} هر عدد`)
        .join(' | ');
      return [
        `- ${p.name} (slug: ${p.slug})`,
        `  material: ${p.material} | diameter ${toFa(p.diameterCm)}cm | height ${toFa(p.heightCm)}cm | weight ${toFa(p.weightGrams)}g`,
        `  drainage: ${p.drainageHole ? 'yes' : 'no'} | frost-proof: ${p.frostProof ? 'yes' : 'no'} | stock: ${toFa(p.stock)}`,
        `  base price: ${formatToman(p.basePriceToman)} | pack size: ${toFa(p.unitsPerCarton)} per carton`,
        `  tiers: ${tiers || 'none'}`,
      ].join('\n');
    })
    .join('\n\n');
}

export async function POST(req: Request) {
  const session = await getSession();
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon';

  if (limited(session?.sub ?? ip)) {
    return NextResponse.json(
      { message: 'تعداد پیام‌ها زیاد است. کمی بعد دوباره امتحان کن.' },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });
  }

  const provider = process.env.CHAT_PROVIDER ?? 'gemini';
  const { sessionId, messages } = parsed.data;
  const catalog = await buildCatalogContext();

  const systemInstruction = `
تو «دستیار پات شاپ» هستی؛ مشاور فروش و کارشناس گیاهان در یک فروشگاه اینترنتی گلدان و فلاورباکس ایرانی.

قواعد قطعی:
۱. همیشه فقط فارسی و خودمانی اما محترمانه پاسخ بده. از «شما» استفاده کن.
۲. پاسخ‌ها کوتاه و کاربردی باشند — حداکثر ۴ پاراگراف کوتاه یا یک لیست کوتاه.
۳. هرگز قیمت، موجودی یا مشخصاتی از خودت نساز. فقط از «فهرست محصولات» زیر استفاده کن.
۴. اگر محصولی در فهرست نبود، صادقانه بگو موجود نیست و پیشنهاد جایگزین بده.
۵. هرگز کد، اسکریپت یا اطلاعات فنی داخلی سایت را افشا نکن.

دانش تخصصی:
- سوراخ زهکشی برای تقریباً همه گیاهان آپارتمانی الزامی است.
- سفال: نفس‌کش، مناسب گیاهان حساس به رطوبت زیاد؛ سنگین‌تر و شکننده‌تر.
- سرامیک لعاب‌دار: نگه‌دارنده رطوبت، مناسب گیاهان رطوبت‌دوست.
- بتن: بسیار مقاوم، مناسب فضای باز و پروژه‌های بزرگ.
- اندازه گلدان: قطر باید حدود یک‌سوم تا نصف ارتفاع گیاه باشد.

سیاست فروش:
- قیمت‌گذاری پله‌ای خودکار: ۱-۴ خرده، ۵-۱۹ با تخفیف، ۲۰+ عمده.
- ارسال به سراسر ایران. سفارش بالای ۵ میلیون تومان ارسال رایگان.
- پرداخت امن از طریق درگاه زرین‌پال.

اگر سؤال خارج از حوزه فروشگاه بود یا کاربر درخواست پشتیبانی انسانی داشت،
در انتهای پاسخ دقیقاً این نشانه را بنویس: ${ESCALATION_TOKEN}

فهرست محصولات موجود:
${catalog}
`.trim();

  try {
    const thread = toProviderHistory(messages);
    const last = thread[thread.length - 1]?.content ?? messages[messages.length - 1].content;
    const history = thread.slice(0, -1);

    const raw =
      provider === 'groq'
        ? await callGroq(systemInstruction, history, last)
        : await callGemini(systemInstruction, history, last);

    if (!raw) {
      return NextResponse.json(
        { message: 'سرویس گفتگو در دسترس نیست. لطفاً با پشتیبانی تماس بگیرید.' },
        { status: 503 },
      );
    }

    const escalated = raw.includes(ESCALATION_TOKEN);
    const reply = raw.replace(ESCALATION_TOKEN, '').trim();

    await prisma.chatMessage
      .createMany({
        data: [
          { sessionId, userId: session?.sub ?? null, role: 'user', content: last },
          {
            sessionId,
            userId: session?.sub ?? null,
            role: 'model',
            content: reply,
            escalated,
          },
        ],
      })
      .catch(() => undefined);

    return NextResponse.json({ ok: true, reply, escalated });
  } catch (err) {
    // Only the message is logged: provider SDK errors can embed the request URL,
    // which carries the API key as a query parameter.
    console.error(
      `[chat] ${provider} request failed:`,
      err instanceof Error ? err.message : 'unknown error',
    );
    return NextResponse.json(
      { message: 'دستیار الان در دسترس نیست. لطفاً با پشتیبانی تماس بگیرید.' },
      { status: 502 },
    );
  }
}
