export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Lexware-Api-Key",
};

export function jsonResponse(data: any, status = 200, customHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...customHeaders
    }
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export function isDemoRequest(request: Request, userEmail?: string): boolean {
  const host = request.headers.get("host") || "";
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const combined = `${host} ${origin} ${referer}`.toLowerCase();
  if (combined.includes("actanex-demo") || combined.includes("demo-web") || combined.includes("demo.actanex")) {
    return true;
  }
  if (userEmail && userEmail.toLowerCase().includes("demo")) {
    return true;
  }
  return false;
}
