import { jwtVerify, type JWTPayload } from 'jose';
import { requireEnv } from '@/lib/env';

export const SESSION_COOKIE = 'ps_session';
const ALG = 'HS256';

export type SessionPayload = JWTPayload & {
  sub: string;
  role: 'CUSTOMER' | 'ADMIN';
  name?: string;
};

function secret() {
  const s = requireEnv('JWT_SECRET');
  if (s.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(s);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function getExpiredSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };
}

