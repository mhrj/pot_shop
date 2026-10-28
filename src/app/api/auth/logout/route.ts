import { NextResponse } from 'next/server';
import { destroySessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  await destroySessionCookie();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
