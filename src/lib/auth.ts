import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = process.env.COOKIE_NAME || 'pm_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'parkmanager_remote_super_secret_jwt_key_2026_secured_e48b30'
);

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  const normalizedHash = hash.replace(/^\$2y\$/, '$2a$');
  return bcrypt.compareSync(password, normalizedHash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: Number(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: String(payload.role)
    };
  } catch {
    return null;
  }
}
