// lib/auth.ts
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";

const COOKIE_NAME = "gv_session";
const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET || "");

export async function getSessionUser() {
  try {
    // headers() / cookies() can be awaited depending on your Next version/types
    const h = await headers();
    const fromHdr = {
      id: h.get("x-user-id") || undefined,
      username: h.get("x-user-name") || undefined,
      plan: h.get("x-user-plan") || undefined,
    };
    if (fromHdr.id) {
      // eslint-disable-next-line no-console
      // console.log("getSessionUser: found headers session", fromHdr.id);
      return fromHdr;
    }

    const c = await cookies();
    const token = c.get(COOKIE_NAME)?.value;
    // eslint-disable-next-line no-console
    // console.log(
    //   "getSessionUser: cookie present?",
    //   !!token,
    //   "cookieLen:",
    //   token?.length ?? 0,
    //   "SECRET_SET:",
    //   !!process.env.AUTH_JWT_SECRET
    // );

    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, secret);
      // eslint-disable-next-line no-console
      // console.log("getSessionUser: jwt payload", payload);
      return {
        id: (payload.sub as string) || undefined,
        username: (payload.username as string) || undefined,
        plan: (payload.plan as string) || undefined,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("getSessionUser: jwtVerify failed:", err);
      return null;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("getSessionUser error", err);
    return null;
  }
}
