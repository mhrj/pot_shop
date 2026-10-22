import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionCookie, hashPassword } from '@/lib/auth';
import { getRegistrationConflict, normalizeRegistrationInput } from '@/lib/register';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    const userInput = normalizeRegistrationInput(payload);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: userInput.phone },
          ...(userInput.email ? [{ email: userInput.email }] : []),
        ],
      },
    });

    const conflict = getRegistrationConflict(userInput.phone, userInput.email, existing);
    if (conflict === 'phone') {
      return NextResponse.json({ message: 'این شماره موبایل قبلاً ثبت‌نام شده است.' }, { status: 409 });
    }
    if (conflict === 'email') {
      return NextResponse.json({ message: 'این ایمیل قبلاً ثبت‌نام شده است.' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        fullName: userInput.fullName,
        phone: userInput.phone,
        email: userInput.email || null,
        passwordHash: await hashPassword(userInput.password),
        role: 'CUSTOMER',
      },
    });

    await createSessionCookie({
      id: user.id,
      role: user.role,
      fullName: user.fullName,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: '/dashboard',
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    const target = prismaError.meta?.target ?? [];

    if (prismaError.code === 'P2002') {
      if (target.includes('email')) {
        return NextResponse.json({ message: 'این ایمیل قبلاً ثبت‌نام شده است.' }, { status: 409 });
      }
      if (target.includes('phone')) {
        return NextResponse.json({ message: 'این شماره موبایل قبلاً ثبت‌نام شده است.' }, { status: 409 });
      }
    }

    const message = error instanceof Error ? error.message : 'ثبت‌نام ناموفق بود';
    return NextResponse.json(
      { message },
      { status: /رمز عبور|شماره موبایل|نام کامل|ایمیل|اطلاعات نامعتبر/i.test(message) ? 400 : 500 },
    );
  }
}
