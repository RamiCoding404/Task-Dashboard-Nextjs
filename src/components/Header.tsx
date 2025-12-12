"use client";
import useAuth from "@/lib/useAuth";
import { useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    dispatch(logout());
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    router.push("/login");
  }

  return (
    <header className="w-full bg-card border-b p-3 flex items-center justify-between">
      <div>
        <a href="/dashboard" className="font-semibold text-lg">
          Dashboard
        </a>
      </div>
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.role}</div>
            </div>
            <button onClick={handleLogout} className="text-sm text-rose-600">
              Logout
            </button>
          </div>
        ) : (
          <a href="/login" className="text-sm text-sky-600">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
