import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashToken, createResetToken, sendPasswordResetEmail, getRecoverySupportMessage } from '@/lib/password-reset';
import { getEnv } from '@/lib/env';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().trim().email('ایمیل معتبر نیست'),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });

  const genericResponse = NextResponse.json({
    ok: true,
    message: 'اگر حسابی با این ایمیل ثبت شده باشد، لینک بازیابی ارسال شد.',
  });

  if (!user) {
    return genericResponse;
  }

  if (!user.email) {
    return NextResponse.json({
      ok: true,
      message: `برای این حساب، بازیابی از طریق ایمیل در دسترس نیست. ${getRecoverySupportMessage()}`,
    });
  }

  const token = await createResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const appUrl = getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail({ to: user.email, resetUrl });
    return NextResponse.json({
      ok: true,
      message: 'اگر حسابی با این ایمیل ثبت شده باشد، لینک بازیابی ارسال شد.',
    });
  } catch (error) {
    console.error('[password-reset] email delivery failed:', error);
    return NextResponse.json({
      ok: true,
      message: `در حال حاضر ارسال لینک بازیابی ممکن نیست. ${getRecoverySupportMessage()}`,
    });
  }
}
