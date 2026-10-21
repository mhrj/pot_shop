import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

function normalizeHex(input: string): string | null {
  let val = input.trim().toUpperCase();
  if (!val) return null;
  if (!val.startsWith('#')) val = `#${val}`;
  if (/^#([0-9A-F]{3})$/i.test(val)) {
    val = `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
  }
  if (!/^#[0-9A-F]{6}$/i.test(val)) return null;
  return val;
}

const createSchema = z.object({
  name: z.string().trim().min(2, 'نام رنگ باید حداقل ۲ حرف باشد').max(50, 'نام رنگ حداکثر ۵۰ حرف است'),
  hexCode: z.string().trim().min(3, 'کد رنگ نامعتبر است'),
});

const deleteSchema = z.object({
  id: z.string().min(1, 'شناسه رنگ الزامی است'),
});

async function ensureAdmin() {
  return getActiveAdmin();
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const colors = await prisma.globalColor.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    ok: true,
    colors,
  });
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  const hexCode = normalizeHex(parsed.data.hexCode);
  if (!hexCode) {
    return NextResponse.json(
      { message: 'کد هگز نامعتبر است (مثال: #FFFFFF)' },
      { status: 400 },
    );
  }

  const existing = await prisma.globalColor.findFirst({
    where: {
      OR: [{ name }, { hexCode }],
    },
  });

  if (existing) {
    if (existing.name.toLowerCase() === name.toLowerCase()) {
      return NextResponse.json({ message: 'رنگی با این نام قبلاً ثبت شده است' }, { status: 409 });
    }
    return NextResponse.json({ message: 'این کد رنگ قبلاً ثبت شده است' }, { status: 409 });
  }

  const color = await prisma.globalColor.create({
    data: { name, hexCode },
  });

  revalidatePath('/admin/colors');
  revalidatePath('/admin/products');
  return NextResponse.json({ ok: true, color });
}

export async function DELETE(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const queryId = searchParams.get('id');

  let id = queryId;
  if (!id) {
    const body = await req.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);
    if (parsed.success) {
      id = parsed.data.id;
    }
  }

  if (!id) {
    return NextResponse.json({ message: 'شناسه رنگ الزامی است' }, { status: 400 });
  }

  const color = await prisma.globalColor.findUnique({ where: { id } });
  if (!color) {
    return NextResponse.json({ message: 'رنگ یافت نشد' }, { status: 404 });
  }

  await prisma.globalColor.delete({ where: { id } });
  revalidatePath('/admin/colors');
  revalidatePath('/admin/products');
  return NextResponse.json({ ok: true });
}
