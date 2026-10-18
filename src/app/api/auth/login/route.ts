import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionCookie, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';

const schema = z.object({
  identifier: z.string().min(3, 'شماره موبایل یا ایمیل را وارد کنید'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر است'),
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
  const normalized = identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ phone: normalized }, { email: normalized }],
      isActive: true,
    },
  });

  // Same error message on both branches to avoid leaking whether a user exists.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { message: 'شماره موبایل، ایمیل یا رمز عبور اشتباه است' },
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
