import { checkAuth } from "../utils/auth";

export async function onRequestGet(context) {
    if (!checkAuth(context.request, context.env)) {
        return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
    }

    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    if (!key) {
        return new Response("Missing file name", { status: 400 });
    }

    try {
        const object = await env.RR_BUCKET.get(key);
        if (!object) {
            return new Response("Not Found", { status: 404 });
        }

        // 设置下载头
        return new Response(object.body, {
            headers: {
                "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${key.split("/").pop()}"`
            }
        });
    } catch (err) {
        return new Response("Error: " + err.message, { status: 500 });
    }
}
