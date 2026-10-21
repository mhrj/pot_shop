import { NextResponse } from 'next/server';
import { trackPageView } from '@/lib/analytics-tracker';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body?.path === 'string' ? body.path : '';

    if (path) {
      await trackPageView(path, req);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Analytics tracking endpoint error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
