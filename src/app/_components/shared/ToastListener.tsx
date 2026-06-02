"use client";
import React from "react";
import useToast from "@/app/_hooks/useToast";

/**
 * Mounts the global toast listener.
 * Renders as an empty fragment; toast UI is portaled via useToast.
 */
export default function ToastListener() {
  const { ToastEl } = useToast();
  return <>{ToastEl}</>;
}
