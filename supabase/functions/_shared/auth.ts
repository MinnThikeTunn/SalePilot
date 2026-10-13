import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(req: Request): Promise<{ userId: string; email?: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  return { userId: data.user.id, email: data.user.email };
}
