import { Env } from "../types";
import {
  handleLogin,
  handleLogout,
  handleGetMe,
  handleChangeCredentials,
} from "../services/auth.service";

export async function handleAuthRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  if (path === "/api/v1/auth/login" && method === "POST") {
    return handleLogin(request, env);
  }

  if (path === "/api/v1/auth/logout" && (method === "POST" || method === "GET")) {
    return handleLogout(request, env);
  }

  if (path === "/api/v1/auth/me" && method === "GET") {
    return handleGetMe(request, env);
  }

  if (
    (path === "/api/v1/auth/change-credentials" || path === "/api/v1/auth/change-password") &&
    method === "POST"
  ) {
    return handleChangeCredentials(request, env);
  }

  return null;
}
