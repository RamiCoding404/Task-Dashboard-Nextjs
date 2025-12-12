"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { loginSuccess } from "@/store/authSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormValues>();
  const dispatch = useDispatch();
  const router = useRouter();

  async function onSubmit(data: FormValues) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      dispatch(loginSuccess(json.user));
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      router.push("/dashboard");
    } else {
      alert("Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-card p-6 rounded shadow"
      >
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

        <label className="block mb-3">
          <span className="text-sm">Email</span>
          <Input
            {...register("email")}
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Password</span>
          <Input
            {...register("password")}
            type="password"
            required
            placeholder="password"
          />
        </label>

        <Button type="submit">Sign in</Button>
      </form>
    </div>
  );
}
