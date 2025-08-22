export function checkAuth(request, env) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return false;
    }
    const base64 = authHeader.split(" ")[1];
    const [user, pass] = atob(base64).split(":");
    return user === env.ADMIN_USER && pass === env.ADMIN_PASS;
  }
  