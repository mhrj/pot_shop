import { NextResponse } from 'next/server';
import { getActiveAdmin } from '@/lib/auth';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST() {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  }

  const success = await sendTelegramNotification('تست موفقیت‌آمیز بود!');
  return NextResponse.json({ ok: true, sent: success });
}

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  }

  const success = await sendTelegramNotification('تست موفقیت‌آمیز بود!');
  return NextResponse.json({ ok: true, sent: success });
}
