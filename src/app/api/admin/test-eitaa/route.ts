import { NextResponse } from 'next/server';
import { getActiveAdmin } from '@/lib/auth';
import { sendEitaaNotification } from '@/lib/eitaa';

export async function POST() {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  }

  const success = await sendEitaaNotification('تست ارسال پیام به ایتا (ایتایار) از فروشگاه پات شاپ با موفقیت انجام شد! 🎉');
  return NextResponse.json({
    ok: true,
    sent: success,
  });
}

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  }

  const success = await sendEitaaNotification('تست ارسال پیام به ایتا (ایتایار) از فروشگاه پات شاپ با موفقیت انجام شد! 🎉');
  return NextResponse.json({
    ok: true,
    sent: success,
  });
}
