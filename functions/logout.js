export async function onRequestGet({ request }) {
  const COOKIE_NAME = "auth_token";
  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/login",
      "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    },
  });
}