import { NextResponse } from 'next/server';
import { SESSION_COOKIE, getExpiredSessionCookieOptions } from '@/lib/auth-edge';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const acceptsHtml = req.headers.get('accept')?.includes('text/html');
  const isFormPost = req.headers.get('content-type')?.includes('application/x-www-form-urlencoded');
  const cookieOptions = getExpiredSessionCookieOptions();

  // If invoked via standard HTML form submission, redirect
  if (acceptsHtml && isFormPost) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const res = NextResponse.redirect(new URL('/', baseUrl), { status: 303 });
    res.cookies.set(SESSION_COOKIE, '', cookieOptions);
    return res;
  }

  // Standard JSON response for client-side fetch callers
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', cookieOptions);
  return res;
}

