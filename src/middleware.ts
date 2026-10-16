import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth-edge';

const PROTECTED = ['/dashboard', '/checkout', '/admin'];
const ADMIN_ONLY = ['/admin'];
const AUTH_PAGES = ['/login', '/register'];

// Carved out of the /checkout prefix. The gateway returns the customer here as
// a top-level navigation, and the ref_id it appends is itself the proof of
// payment — sending them to /login on the way out of a finished purchase means
// they never see the confirmation. `/checkout` itself, and any other child of
// it, stays protected.
const PUBLIC_CHECKOUT = ['/checkout/success', '/checkout/failed'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isProtected =
    PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) &&
    !PUBLIC_CHECKOUT.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdminOnly = ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isAdminOnly && session?.role !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && session) {
    const url = req.nextUrl.clone();
    url.pathname = session.role === 'ADMIN' ? '/admin' : '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
