import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const SECRET = process.env.JWT_SECRET  || "super-secret-key";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body || {};

    const role = email?.includes("admin")
      ? "Admin"
      : email?.includes("pm")
      ? "ProjectManager"
      : "Developer";

    const user = {
      id: `user-${Date.now()}`,
      name: email?.split("@")?.[0] ?? "anonymous",
      role,
    };

    const token = jwt.sign(user, SECRET, { expiresIn: "7d" });

    const res = NextResponse.json({ user });

    res.cookies.set({
      name: "auth",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }
}
