import { NextResponse } from 'next/server';
import { updateOrderStatusAction } from '@/features/admin/actions/order-actions';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const res = await updateOrderStatusAction({
    orderId: id,
    status: body.status,
    trackingCode: body.trackingCode,
    shippingCarrier: body.shippingCarrier,
  });

  if (!res.success) {
    const status =
      res.error === 'دسترسی غیرمجاز است'
        ? 403
        : res.error === 'سفارش یافت نشد'
          ? 404
          : res.error.includes('هم‌زمان')
            ? 409
            : 400;
    return NextResponse.json({ message: res.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    order: res.order,
    stockRestored: res.stockRestored,
  });
}
