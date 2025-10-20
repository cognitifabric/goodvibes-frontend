import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./_components/Providers";
import "./globals.css";
import Nav from "./_components/layout/Nav.server";
import Footer from "./_components/layout/Footer";
import ToastBridgeClient from "./_components/ToastBridge.client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QueueVibes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} app-auth-bg`}>
        <Nav />
        <ToastBridgeClient />
        <main style={{ paddingTop: "var(--nav-height)" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
