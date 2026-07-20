
let SECRET_KEY;
const COOKIE_NAME = "auth_token";
const COOKIE_DAYS = 7;

// 简单签名：内容 + 密钥的哈希
async function sign(value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function createToken() {
  const expires = Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000;
  const payload = `auth:${expires}`;
  const sig = await sign(payload);
  return `${payload}:${sig}`;
}

async function verifyToken(token) {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [prefix, expires, sig] = parts;
  if (prefix !== "auth") return false;
  if (Date.now() > parseInt(expires)) return false;
  const payload = `${prefix}:${expires}`;
  const expectedSig = await sign(payload);
  if (sig === expectedSig) {
    const needsRenewal = Date.now() > (parseInt(expires) - 6 * 86400000);
    return needsRenewal ? '2' : '1';
  } else {
    return false;
  }
}

export async function onRequest({ request, next, env }) {
  SECRET_KEY = env.PASSWORD;
  const url = new URL(request.url);

  // 放行登录页和登录接口
  if (url.pathname.includes("login")
    || url.pathname.includes("logout")
    || url.pathname.includes("ico")) {
    return next();
  }

  // 检查 Cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => c.trim().split("=").map(decodeURIComponent))
  );
  const token = cookies[COOKIE_NAME];
  const isValid = await verifyToken(token);
  if (isValid === '1') return next();
  if (isValid === '2') {
    // 续期：重置7天
    const newToken = await createToken();
    const response = await next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(newToken)}; Path=/; Max-Age=${COOKIE_DAYS * 86400}; HttpOnly; SameSite=Lax`
    );
    return newResponse;
  }

  // 未登录，跳转到登录页
  const fromUrl = url.pathname + url.search;
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host");
  const redirectUrl = `${protocol}://${host}/login?redirect=${encodeURIComponent(fromUrl)}`;

  return Response.redirect(redirectUrl, 302);
}