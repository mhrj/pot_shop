import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashToken, isPasswordResetTokenValid } from '@/lib/password-reset';
import { passwordSchema } from '@/lib/password-policy';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({
  token: z.string().min(16).max(200),
  // Same rule as registration — a reset must not be able to install a weaker
  // password than the policy requires.
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

  const tokenHash = hashToken(parsed.data.token);
  const tokenEntry = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenEntry) {
    return NextResponse.json({ message: 'لینک بازیابی نامعتبر یا منقضی شده است' }, { status: 400 });
  }

  if (!isPasswordResetTokenValid(tokenEntry)) {
    return NextResponse.json({ message: 'لینک بازیابی نامعتبر یا منقضی شده است' }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenEntry.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenEntry.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, message: 'رمز عبور با موفقیت تغییر کرد.' });
}
