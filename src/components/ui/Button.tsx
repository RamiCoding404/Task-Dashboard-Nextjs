"use client";
import React from "react";

export default function Button({
  children,
  type = "button",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
