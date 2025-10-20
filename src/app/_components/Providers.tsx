"use client";
import React from "react";
import { AppProvider } from "../_state/DashboardState";

export default function Providers({ children, initial }: { children: React.ReactNode; initial?: any }) {
  // You can pass initial state here if you fetch it server-side and want to hydrate the client provider
  return <AppProvider initial={initial}>{children}</AppProvider>;
}