import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { addToCart, getCartTotals } from '@/lib/cart';

export const runtime = 'nodejs';

const addSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(5000),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }

  const totals = await getCartTotals(session.sub);
  return NextResponse.json(totals);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }

  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'اطلاعات نامعتبر' }, { status: 400 });
  }

  try {
    await addToCart(session.sub, parsed.data.productId, parsed.data.quantity);
    const totals = await getCartTotals(session.sub);
    return NextResponse.json({ ok: true, totals });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطای غیرمنتظره' },
      { status: 400 },
    );
  }
}
