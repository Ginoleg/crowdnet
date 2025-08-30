// lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function signSession(payload: { user_id: string }) {
  return new SignJWT({ 'app.user_id': payload.user_id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  return payload['app.user_id'] as string;
}
