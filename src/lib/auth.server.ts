import { jwtVerify } from "jose";

const COOKIE_NAME = "gv_session";
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET || "");

export async function parseSessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: (payload.sub as string) || undefined,
      username: (payload.username as string) || undefined,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("parseSessionToken failed", err);
    return null;
  }
}