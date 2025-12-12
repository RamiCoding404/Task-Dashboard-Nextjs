import { tasks } from "@/lib/data";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const body = await req.json();
    const { id, taskId } = await params;
    const list = tasks[id] || [];
    const idx = list.findIndex((t) => t.id === taskId);
    if (idx === -1)
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    list[idx] = { ...list[idx], ...body };
    tasks[id] = list;
    return new Response(JSON.stringify({ task: list[idx] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid" }), { status: 400 });
  }
}
