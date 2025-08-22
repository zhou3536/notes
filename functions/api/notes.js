import { checkAuth } from "../utils/auth";

export async function onRequestGet(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }

  const data = await context.env.NOTES_KV.get("notes:data");
  return new Response(data || '[]', { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await context.request.json();
  await context.env.NOTES_KV.put("notes:data", JSON.stringify(body));
  return new Response("OK", { status: 200 });
}
