"use client";
import React from "react";

export default function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const colors: Record<string, string> = {
    gray: "bg-slate-200 text-slate-800",
    green: "bg-emerald-200 text-emerald-900",
    red: "bg-rose-200 text-rose-900",
    yellow: "bg-amber-200 text-amber-900",
    blue: "bg-sky-200 text-sky-900",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        colors[color] || colors.gray
      }`}
    >
      {children}
    </span>
  );
}
