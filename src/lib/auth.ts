// lib/auth.ts
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";

const COOKIE_NAME = "gv_session";
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET);

export async function getSessionUser() {
  // Try middleware-injected headers first (cheap), else verify cookie again
  const h = await headers();
  const fromHdr = {
    id: h.get("x-user-id") || undefined,
    username: h.get("x-user-name") || undefined,
    plan: h.get("x-user-plan") || undefined,
  };
  if (fromHdr.id) return fromHdr;

  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: (payload.sub as string) || undefined,
      username: (payload.username as string) || undefined,
      plan: (payload.plan as string) || undefined,
    };
  } catch {
    return null;
  }
}
