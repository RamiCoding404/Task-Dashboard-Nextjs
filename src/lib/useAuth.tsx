/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export function useAuth() {
  const user = useSelector((s: RootState) => (s as any).auth?.user ?? null);
  const hydrated = useSelector(
    (s: RootState) => (s as any).auth?.hydrated ?? false
  );

  function hasRole(role: string | string[]) {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }

  return { user, isAuthenticated: !!user, hasRole, hydrated };
}

export default useAuth;
