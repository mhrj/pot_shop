import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeIranianPhoneNumber, isValidIranianMobile, sendVerificationSms } from '@/lib/sms';
import {
  generateOtpCode,
  hashOtpCode,
  OTP_EXPIRATION_SECONDS,
  OTP_RATE_LIMIT_SECONDS,
} from '@/lib/verification';

export const runtime = 'nodejs';

const schema = z.object({
  phone: z.string().trim().min(1, 'شماره موبایل الزامی است'),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const phone = normalizeIranianPhoneNumber(parsed.data.phone);
  if (!isValidIranianMobile(phone)) {
    return NextResponse.json(
      { message: 'شماره موبایل نامعتبر است (باید ۱۱ رقم و با ۰۹ شروع شود)' },
      { status: 400 },
    );
  }

  // Rate limiting: maximum 1 request per 2 minutes per phone
  const rateLimitWindow = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
  const recentRequest = await prisma.verificationCode.findFirst({
    where: {
      phone,
      type: 'PASSWORD_RESET',
      createdAt: { gte: rateLimitWindow },
    },
  });

  if (recentRequest) {
    const elapsedSeconds = Math.floor((Date.now() - recentRequest.createdAt.getTime()) / 1000);
    const remainingSeconds = Math.max(1, OTP_RATE_LIMIT_SECONDS - elapsedSeconds);
    return NextResponse.json(
      {
        message: `لطفاً پیش از درخواست مجدد، ${remainingSeconds} ثانیه صبر کنید.`,
        remainingSeconds,
      },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, phone: true },
  });

  // Generic success response to avoid phone enumeration oracle
  const genericResponse = NextResponse.json({
    ok: true,
    message: 'کد تایید ۵ رقمی به شماره شما پیامک شد.',
    phone,
  });

  if (!user) {
    return genericResponse;
  }

  // Invalidate any previously active OTPs for this phone
  await prisma.verificationCode.updateMany({
    where: {
      phone,
      type: 'PASSWORD_RESET',
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_SECONDS * 1000);

  await prisma.verificationCode.create({
    data: {
      phone,
      codeHash,
      type: 'PASSWORD_RESET',
      expiresAt,
      userId: user.id,
    },
  });

  const smsResult = await sendVerificationSms(phone, code);
  if (!smsResult.success) {
    console.error(`[forgot-password] SMS delivery failed for ${phone}: ${smsResult.error}`);
    // Rollback this code so the user isn't locked out by rate limit if provider fails
    await prisma.verificationCode.deleteMany({
      where: { codeHash },
    }).catch(() => {});

    return NextResponse.json(
      { message: 'در حال حاضر ارسال پیامک با اختلال مواجه است. لطفاً کمی بعد تلاش کنید.' },
      { status: 502 },
    );
  }

  return genericResponse;
}
