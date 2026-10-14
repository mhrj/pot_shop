import { jwtVerify, type JWTPayload } from 'jose';

export const SESSION_COOKIE = 'ps_session';
const ALG = 'HS256';

export type SessionPayload = JWTPayload & {
  sub: string;
  role: 'CUSTOMER' | 'ADMIN';
  name?: string;
};

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
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
