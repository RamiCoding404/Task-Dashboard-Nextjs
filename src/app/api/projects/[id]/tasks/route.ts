/* eslint-disable @typescript-eslint/no-explicit-any */
import { tasks, persistProjects } from "@/lib/data";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = tasks[id] || [];
  const cookieStore = await cookies();

  const tokenCookie = cookieStore.get("auth");
  if (!tokenCookie) {
    return Response.json(
      { message: "Unauthorized: Authentication token is required." },
      { status: 401 }
    );
  }
  return new Response(JSON.stringify({ tasks: list }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;
    const list = tasks[id] || [];
    const newTask = { id: `t-${id}-${Date.now()}`, ...body };
    list.push(newTask);
    tasks[id] = list;
    persistProjects();
    return new Response(JSON.stringify({ task: newTask }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid" }), { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;
    const list = tasks[id] || [];

    // Bulk update: { taskIds: string[], patch: {...} }
    if (body && Array.isArray(body.taskIds) && body.patch) {
      const updated: any[] = [];
      for (const tid of body.taskIds) {
        const idx = list.findIndex((t) => t.id === tid);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...body.patch };
          updated.push(list[idx]);
        }
      }
      tasks[id] = list;
      persistProjects();
      return new Response(JSON.stringify({ tasks: updated }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid" }), { status: 400 });
  }
}
