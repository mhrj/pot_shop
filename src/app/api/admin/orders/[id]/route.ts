import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED']),
  trackingCode: z.string().max(60).nullable().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'اطلاعات نامعتبر' }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: 'سفارش یافت نشد' }, { status: 404 });
  }

  const data: Record<string, unknown> = {
    status: parsed.data.status,
    trackingCode: parsed.data.trackingCode || null,
  };
  if (parsed.data.status === 'SHIPPED' && !existing.shippedAt) {
    data.shippedAt = new Date();
  }
  if (parsed.data.status === 'DELIVERED' && !existing.deliveredAt) {
    data.deliveredAt = new Date();
  }

  const updated = await prisma.order.update({ where: { id }, data });
  return NextResponse.json({ ok: true, order: updated });
}
