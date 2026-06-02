import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getMe, getSets } from "@/lib/api";
import { AppProvider } from "@/app/_state/AppContext";
import Nav from "@/app/_components/layout/Nav";
import ToastListener from "@/app/_components/shared/ToastListener";
import type { Me, SetDoc } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login");
  }

  let me: Me | null = null;
  let sets: SetDoc[] = [];

  try {
    const [meData, setsData] = await Promise.all([getMe(), getSets()]);
    me = meData;
    sets = setsData?.sets ?? [];
  } catch {
    // Fail gracefully; client will hydrate
  }

  return (
    <AppProvider initialMe={me} initialSets={sets}>
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Nav me={me} />
        <main className="pt-16 md:pt-[72px]">
          {children}
        </main>
        <ToastListener />
      </div>
    </AppProvider>
  );
}
