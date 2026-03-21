import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "fd_admin_session";
const EXPIRY = 24 * 60 * 60; // 24h in seconds

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || "fallback-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(): Promise<string> {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EXPIRY}s`)
    .setIssuedAt()
    .sign(getSecret());
  return token;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME, EXPIRY };
