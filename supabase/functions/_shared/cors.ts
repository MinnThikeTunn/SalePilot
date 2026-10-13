export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function handleOptions(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
