import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { role, isActive } = body;

    // Prevent modifying self
    if (id === admin.sub) {
      return NextResponse.json(
        { error: 'امکان تغییر نقش یا وضعیت حساب جاری شما وجود ندارد.' },
        { status: 400 },
      );
    }

    const data: { role?: 'ADMIN' | 'CUSTOMER'; isActive?: boolean } = {};

    if (role !== undefined) {
      if (role !== 'ADMIN' && role !== 'CUSTOMER') {
        return NextResponse.json({ error: 'نقش کاربری نامعتبر است.' }, { status: 400 });
      }
      data.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'وضعیت فعال‌سازی نامعتبر است.' }, { status: 400 });
      }
      data.isActive = isActive;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { error: 'خطایی در بروزرسانی کاربر رخ داد.' },
      { status: 500 },
    );
  }
}
