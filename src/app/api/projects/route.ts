import { projects } from "@/lib/data";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const tokenCookie = cookieStore.get("auth");

    if (!tokenCookie) {
      console.log("Access denied: 'auth' token is missing.");
      return NextResponse.json(
        { message: "Unauthorized: Authentication token is required." },
        { status: 401 }
      );
    }

    return new Response(JSON.stringify({ projects }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected API Error in /api/projects:", error);

    return NextResponse.json(
      {
        message: "Internal Server Error",
        detail: "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
