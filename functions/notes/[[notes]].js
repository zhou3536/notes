import { checkAuth } from "../utils/auth";

export async function onRequestGet(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }

  let key = context.params.notes;
  if (Array.isArray(key)) key = key.join("/");

  if (!key) return new Response("Bad Request", { status: 400 });

  const value = await context.env.NOTES_KV.get(key, { type: "json" });

  if (!value) return new Response("Not Found", { status: 404 });

  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }

  const body = await context.request.json();
  if (!body.id) return new Response("Missing id", { status: 400 });

  await context.env.NOTES_KV.put(`note:${body.id}`, JSON.stringify(body));
  await UpdateList(context.env);
  return new Response("OK", { status: 200 });
}

export async function onRequestDelete(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }


  const body = await context.request.json();
  if (!body.id) {
    return new Response("Missing id", { status: 400 });
  }

  await context.env.NOTES_KV.delete(`note:${body.id}`);
  await UpdateList(context.env);
  return new Response("OK", { status: 200 });
}

async function UpdateList(env) {
  let cursor = null;
  let allNotes = [];

  do {
    const listResult = await env.NOTES_KV.list({
      prefix: "note:",
      cursor
    });
    cursor = listResult.cursor;

    for (const key of listResult.keys) {
      const value = await env.NOTES_KV.get(key.name, { type: "json" });
      if (value) {
        allNotes.push({ id: value.id, title: value.title });
      }
    }
  } while (cursor);

  await env.NOTES_KV.put("AllNotes", JSON.stringify(allNotes));
}