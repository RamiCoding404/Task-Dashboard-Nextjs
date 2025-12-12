export async function POST() {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return new Response(JSON.stringify({ message: "Logged out" }), {
    status: 200,
    headers,
  });
}
