import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActiveAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

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

const updateSchema = z.object({
  name: z.string().trim().min(2, 'نام رنگ باید حداقل ۲ حرف باشد').max(50).optional(),
  hexCode: z.string().trim().min(3).optional(),
});

async function ensureAdmin() {
  return getActiveAdmin();
}

export async function PATCH(req: Request, { params }: Params) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر' },
      { status: 400 },
    );
  }

  const existing = await prisma.globalColor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: 'رنگ یافت نشد' }, { status: 404 });
  }

  const dataToUpdate: { name?: string; hexCode?: string } = {};
  if (parsed.data.name) {
    dataToUpdate.name = parsed.data.name.trim();
  }
  if (parsed.data.hexCode) {
    const hex = normalizeHex(parsed.data.hexCode);
    if (!hex) {
      return NextResponse.json({ message: 'کد هگز نامعتبر است' }, { status: 400 });
    }
    dataToUpdate.hexCode = hex;
  }

  const conflict = await prisma.globalColor.findFirst({
    where: {
      OR: [
        ...(dataToUpdate.name ? [{ name: dataToUpdate.name }] : []),
        ...(dataToUpdate.hexCode ? [{ hexCode: dataToUpdate.hexCode }] : []),
      ],
      NOT: { id },
    },
  });

  if (conflict) {
    return NextResponse.json({ message: 'این نام یا کد رنگ قبلاً استفاده شده است' }, { status: 409 });
  }

  const updated = await prisma.globalColor.update({
    where: { id },
    data: dataToUpdate,
  });

  return NextResponse.json({ ok: true, color: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.globalColor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: 'رنگ یافت نشد' }, { status: 404 });
  }

  await prisma.globalColor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
