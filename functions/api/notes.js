import { checkAuth } from "../utils/auth";

export async function onRequestGet(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }

  const list = await context.env.NOTES_KV.list({ prefix: "note:" });
  const results = [];

  for (const key of list.keys) {
    const value = await context.env.NOTES_KV.get(key.name, { type: "json" });
    if (value) results.push(value);
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await context.request.json();
  if (!body.id) {
    return new Response("Missing id", { status: 400 });
  }

  await context.env.NOTES_KV.put(`note:${body.id}`, JSON.stringify(body));

  return new Response("OK", { status: 200 });
}

// DELETE: 删除一个 note
export async function onRequestDelete(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await context.request.json(); // { id }
  if (!body.id) {
    return new Response("Missing id", { status: 400 });
  }

  await context.env.NOTES_KV.delete(`note:${body.id}`);

  return new Response("OK", { status: 200 });
}

