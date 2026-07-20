let SECRET_KEY;
const COOKIE_NAME = "auth_token";
const COOKIE_DAYS = 7;

async function sign(value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

async function createToken() {
  const expires = Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000;
  const payload = `auth:${expires}`;
  const sig = await sign(payload);
  return `${payload}:${sig}`;
}

export async function onRequestPost({ request, env }) {
  SECRET_KEY = env.PASSWORD;
  const body = await request.json();
  const { username, password } = body;
  const { USERNAME, PASSWORD } = env;

  if (username === USERNAME && password === PASSWORD) {
    const token = await createToken();
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_DAYS * 86400}; HttpOnly; SameSite=Lax`,
      },
    });
  }

  return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}