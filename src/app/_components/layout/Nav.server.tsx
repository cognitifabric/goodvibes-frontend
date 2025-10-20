import React from "react";
import NavClient from "./Nav";
import { getSessionUser } from "@/lib/auth";

export default async function Nav() {
  // server-side: getSessionUser must read the gv_session cookie via next/headers
  const sessionUser = await getSessionUser();
  // log on server to verify detection (check terminal)
  // eslint-disable-next-line no-console
  // console.log("Nav.server: sessionUser ->", !!sessionUser, sessionUser?.id ?? null);
  const authenticated = Boolean(sessionUser?.id);
  return <NavClient initialAuthenticated={authenticated} user={sessionUser ?? undefined} />;
}