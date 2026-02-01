import { checkAuth } from "../utils/auth";

export async function onRequestGet(context) {
    if (!checkAuth(context.request, context.env)) {
        return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
    }
    const { env } = context;
    let key = context.params.rr;

    if (!key) {
        return new Response("Bad Request", { status: 400 });
    }

    if (Array.isArray(key)) key = key.join("/");

    if (key === "files") {
        try {
            const objects = await env.RR_BUCKET.list();
            const Files = objects.objects.map(obj => ({
                name: obj.key,
                size: obj.size
            }));

            return new Response(JSON.stringify(Files, null, 2), {
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            });
        } catch (err) {
            return new Response("Error: " + err.message, { status: 500 });
        }
    }

    key = decodeURIComponent(key);

    try {
        const object = await env.RR_BUCKET.get(key);

        if (!object) {
            return new Response("Not Found", { status: 404 });
        }

        return new Response(object.body, {
            headers: {
                "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(key)}`,
                "Cache-Control": "public, max-age=86400"
            }
        });

    } catch (err) {
        return new Response("Error: " + err.message, { status: 500 });
    }
};



export async function onRequestPost(context) {
    if (!checkAuth(context.request, context.env)) {
        return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
    }
    const { request, env } = context;

    try {
        // 解析 multipart/form-data
        const formData = await request.formData();
        const uploadedFiles = [];

        for (const [name, value] of formData.entries()) {
            if (value instanceof File) {
                const arrayBuffer = await value.arrayBuffer();

                await env.RR_BUCKET.put(value.name, arrayBuffer, {
                    httpMetadata: { contentType: value.type },
                });

                uploadedFiles.push({
                    name: value.name,
                    size: value.size,
                });
            }
        }

        return new Response(
            JSON.stringify({ success: true, files: uploadedFiles }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};


export async function onRequestDelete(context) {
    if (!checkAuth(context.request, context.env)) {
        return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
    }
    const { request, env } = context;
    try {
        const { filename } = await request.json();

        if (!filename) {
            return new Response(
                JSON.stringify({ error: "缺少 filename 参数" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        await env.RR_BUCKET.delete(filename);

        return new Response(
            JSON.stringify({ message: `文件 ${filename} 删除成功` }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "删除失败", details: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}