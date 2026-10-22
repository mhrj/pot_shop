import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionCookie, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';

import { toEn } from '@/lib/format';

const schema = z.object({
  identifier: z.string().min(1, 'شماره موبایل یا ایمیل را وارد کنید'),
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
});

// Simple in-memory login attempt limiter.
// In production, back this with Redis so it survives redeploys.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function rateLimited(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json(
      { message: 'تلاش‌های ناموفق بیش از حد. لطفاً چند دقیقه بعد امتحان کنید.' },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const { identifier, password } = parsed.data;
  const rawIdentifier = identifier.trim();
  const normalizedIdentifier = toEn(rawIdentifier);

  let user;

  if (normalizedIdentifier.includes('@')) {
    const email = normalizedIdentifier.toLowerCase();
    user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'حسابی با این ایمیل یافت نشد.' },
        { status: 404 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { message: 'این حساب ایمیل ثبت نکرده است. لطفاً با شماره موبایل وارد شوید.' },
        { status: 400 },
      );
    }
  } else {
    const phone = normalizedIdentifier.replace(/\s+/g, '');
    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { message: 'شماره موبایل نامعتبر است (باید ۱۱ رقم و با ۰۹ شروع شود).' },
        { status: 400 },
      );
    }

    user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'حسابی با این شماره موبایل یافت نشد.' },
        { status: 404 },
      );
    }
  }

  if (!user.isActive) {
    return NextResponse.json(
      { message: 'حساب کاربری شما غیرفعال شده است.' },
      { status: 403 },
    );
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json(
      { message: 'رمز عبور اشتباه است.' },
      { status: 401 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSessionCookie({
    id: user.id,
    role: user.role,
    fullName: user.fullName,
  });
  attempts.delete(ip);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, fullName: user.fullName, role: user.role },
    redirectTo: user.role === 'ADMIN' ? '/admin' : '/dashboard',
  });
}
