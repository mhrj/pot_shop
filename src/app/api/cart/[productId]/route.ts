import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getCartTotals } from '@/lib/cart';

export const runtime = 'nodejs';

const patchSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(5000),
});

type Params = { params: Promise<{ productId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }
  const { productId } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'تعداد نامعتبر' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      stock: true,
      isActive: true,
      bundleSize: true,
      bundleLabel: true,
      minOrderQuantity: true,
    },
  });
  if (!product || !product.isActive) {
    return NextResponse.json({ message: 'محصول یافت نشد' }, { status: 404 });
  }

  const bundleSize = product.bundleSize || 1;
  const isBundle = Boolean(product.bundleLabel) && bundleSize > 1;
  const minQty = product.minOrderQuantity || 1;

  if (parsed.data.quantity < minQty) {
    return NextResponse.json(
      { message: `حداقل تعداد سفارش این کالا ${minQty} عدد است` },
      { status: 400 },
    );
  }

  if (isBundle && parsed.data.quantity % bundleSize !== 0) {
    return NextResponse.json(
      { message: `تعداد این کالا باید مضربی از ${bundleSize} باشد` },
      { status: 400 },
    );
  }

  if (product.stock < parsed.data.quantity) {
    return NextResponse.json(
      { message: 'حداکثر موجودی: ' + product.stock + ' عدد' },
      { status: 409 },
    );
  }

  const updated = await prisma.cartItem.updateMany({
    where: { userId: session.sub, productId },
    data: { quantity: parsed.data.quantity },
  });
  if (updated.count === 0) {
    return NextResponse.json({ message: 'کالا در سبد یافت نشد' }, { status: 404 });
  }

  const totals = await getCartTotals(session.sub);
  return NextResponse.json({ ok: true, totals });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }
  const { productId } = await params;

  await prisma.cartItem.deleteMany({
    where: { userId: session.sub, productId },
  });

  const totals = await getCartTotals(session.sub);
  return NextResponse.json({ ok: true, totals });
}
