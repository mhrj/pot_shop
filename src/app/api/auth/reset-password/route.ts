import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeIranianPhoneNumber, isValidIranianMobile } from '@/lib/sms';
import { hashOtpCode, OTP_MAX_ATTEMPTS } from '@/lib/verification';
import { passwordSchema } from '@/lib/password-policy';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({
  phone: z.string().trim().min(1, 'شماره موبایل الزامی است'),
  code: z
    .string()
    .trim()
    .min(5, 'کد تایید باید ۵ رقم باشد')
    .max(5, 'کد تایید باید ۵ رقم باشد'),
  password: passwordSchema,
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
      { message: 'شماره موبایل نامعتبر است' },
      { status: 400 },
    );
  }

  // Normalize code digits (support Persian/Arabic numbers)
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let code = parsed.data.code;
  for (let i = 0; i < 10; i++) {
    code = code.replaceAll(faDigits[i], String(i)).replaceAll(arDigits[i], String(i));
  }

  if (!/^\d{5}$/.test(code)) {
    return NextResponse.json(
      { message: 'کد تایید باید دقیقاً ۵ رقم عددی باشد' },
      { status: 400 },
    );
  }

  const verification = await prisma.verificationCode.findFirst({
    where: {
      phone,
      type: 'PASSWORD_RESET',
      usedAt: null,
    },
    select: {
      id: true,
      codeHash: true,
      attempts: true,
      expiresAt: true,
      user: {
        select: { id: true },
      },
    },
  });

  if (!verification) {
    return NextResponse.json(
      { message: 'کد تایید نامعتبر است یا منقضی شده است' },
      { status: 400 },
    );
  }

  if (verification.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(
      { message: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.' },
      { status: 400 },
    );
  }

  if (verification.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { message: 'کد تایید منقضی شده است. لطفاً کد جدید دریافت کنید.' },
      { status: 400 },
    );
  }

  const expectedHash = hashOtpCode(code);
  if (verification.codeHash !== expectedHash) {
    const newAttempts = verification.attempts + 1;
    const isExhausted = newAttempts >= OTP_MAX_ATTEMPTS;

    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: {
        attempts: newAttempts,
        usedAt: isExhausted ? new Date() : null,
      },
    });

    if (isExhausted) {
      return NextResponse.json(
        { message: 'تعداد دفعات ورود اشتباه به ۵ بار رسید. این کد باطل شد؛ لطفاً کد جدید دریافت کنید.' },
        { status: 400 },
      );
    }

    const remainingAttempts = OTP_MAX_ATTEMPTS - newAttempts;
    return NextResponse.json(
      { message: `کد تایید اشتباه است (${remainingAttempts} تلاش باقی‌مانده)` },
      { status: 400 },
    );
  }

  // Find user
  const user = verification.user ?? (await prisma.user.findUnique({ where: { phone }, select: { id: true } }));
  if (!user) {
    return NextResponse.json(
      { message: 'کاربری با این شماره موبایل یافت نشد' },
      { status: 404 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.verificationCode.updateMany({
        where: { id: verification.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claim.count === 0) {
        throw new Error('CODE_ALREADY_USED');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Invalidate all remaining open verification codes for this phone
      await tx.verificationCode.updateMany({
        where: {
          phone,
          type: 'PASSWORD_RESET',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'CODE_ALREADY_USED') {
      return NextResponse.json(
        { message: 'این کد تایید قبلاً استفاده شده است' },
        { status: 400 },
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true, message: 'رمز عبور با موفقیت تغییر کرد.' });
}
