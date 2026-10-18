import { NextResponse } from 'next/server';
import { getActiveAdmin } from '@/lib/auth';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST() {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  }

  const success = await sendTelegramNotification('تست ارسال پیام به تلگرام از طریق پروکسی پات شاپ با موفقیت انجام شد! 🎉');
  return NextResponse.json({
    ok: true,
    sent: success,
    usingProxy: Boolean(process.env.TELEGRAM_PROXY_URL),
    proxyUrl: process.env.TELEGRAM_PROXY_URL ? 'تنظیم شده' : 'خالی (مستقیم)',
  });
}

export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  }

  const success = await sendTelegramNotification('تست ارسال پیام به تلگرام از طریق پروکسی پات شاپ با موفقیت انجام شد! 🎉');
  return NextResponse.json({
    ok: true,
    sent: success,
    usingProxy: Boolean(process.env.TELEGRAM_PROXY_URL),
    proxyUrl: process.env.TELEGRAM_PROXY_URL ? 'تنظیم شده' : 'خالی (مستقیم)',
  });
}
