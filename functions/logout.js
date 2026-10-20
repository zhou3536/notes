export async function onRequestGet({ request }) {
  const response = new Response(null, {
    status: 302,
    headers: {
      "Location": "/login",
    },
  });

  // 获取请求头中的 Cookie 字符串
  const cookieHeader = request.headers.get("Cookie");

  if (cookieHeader) {
    // 解析出所有的 Cookie 名称
    // Cookie 格式通常为: name1=value1; name2=value2
    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
      const eqIndex = cookie.indexOf("=");
      if (eqIndex === -1) continue;
      
      const cookieName = cookie.substring(0, eqIndex).trim();

      if (cookieName) {
        // 为每个 Cookie 设置过期时间以将其清除
        // 注意：如果原 Cookie 设置时指定了 Domain 或 Secure，清除时最好保持一致，
        // 但通常 Path=/ 和 HttpOnly 是通用的最简清除方式。
        const expiredCookie = `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        // 使用 append 可以添加多个 Set-Cookie 头，不会被覆盖
        response.headers.append("Set-Cookie", expiredCookie);
      }
    }
  }

  return response;
}
