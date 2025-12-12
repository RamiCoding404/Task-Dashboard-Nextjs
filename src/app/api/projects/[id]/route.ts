import { projects, persistProjects } from "@/lib/data";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("auth");
  if (!tokenCookie) {
    return Response.json(
      { message: "Unauthorized: Authentication token is required." },
      { status: 401 }
    );
  }
  if (!project)
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  return new Response(JSON.stringify({ project }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1)
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    projects[idx] = { ...projects[idx], ...body };

    persistProjects();
    return new Response(JSON.stringify({ project: projects[idx] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid" }), { status: 400 });
  }
}
