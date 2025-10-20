// app/dashboard/page.tsx (SERVER)
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";
import type { Me, Plan } from "@/lib/types";

function asPlan(p: string | undefined): Plan | undefined {
  return p === "free" || p === "pro" ? p : undefined;
}

export default async function Page() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/login");

  const initialUser: Partial<Me> = {
    _id: user.id,
    username: user.username,
    plan: asPlan(user.plan),
    // include spotifyUserId so client shows "connected" immediately after server render
    spotifyUserId: (user as any).spotifyUserId ?? undefined,
  };

  return <DashboardClient initialUser={initialUser} />;
}
