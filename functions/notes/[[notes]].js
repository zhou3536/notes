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
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export async function onRequestPost(context) {
  if (!checkAuth(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }

  const body = await context.request.json();
  if (body.action === 'ReloadList') {
    await ReloadList(context.env);
    return new Response("OK", { status: 200 });
  }
  if (!body.id) return new Response("Missing id", { status: 400 });
  if (!body.title) return new Response("Missing title", { status: 400 });
  if (!body.content) return new Response("Missing content", { status: 400 });

  await context.env.NOTES_KV.put(`note:${body.id}`, JSON.stringify(body));
  await UpdateList(context.env, 'push', body);
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
  await UpdateList(context.env, 'delete', body);
  return new Response("OK", { status: 200 });
}

async function ReloadList(env) {
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

async function UpdateList(env, type, body) {
  const key = "AllNotes";
  let listStr = await env.NOTES_KV.get(key);
  let list = [];
  if (listStr) {
    try {
      list = JSON.parse(listStr);
    } catch (e) {
      list = [];
    }
  }

  if (type === 'push') {
    const index = list.findIndex(item => item.id === body.id);
    if (index >= 0) {
      list[index].title = body.title;
    } else {
      list.push({ id: body.id, title: body.title });
    }
  } else if (type === 'delete') {
    list = list.filter(item => item.id !== body.id);
  }

  await env.NOTES_KV.put(key, JSON.stringify(list));
}