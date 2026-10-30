import { NextResponse } from 'next/server';
import { submitWholesaleInquiryAction } from '@/features/landing/actions/wholesale-actions';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'اطلاعات ارسالی نامعتبر است.' }, { status: 400 });
    }

    const result = await submitWholesaleInquiryAction(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      id: result.id,
    });
  } catch (error) {
    console.error('[api/wholesale] unexpected error:', error);
    return NextResponse.json(
      { error: 'خطایی در ثبت درخواست رخ داد. لطفاً مجدداً تلاش کنید.' },
      { status: 500 },
    );
  }
}
