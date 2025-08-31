import { supabaseAdmin } from "@/lib/supabase/server-client";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) return new Response("bad id", { status: 400 });

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .select("id, created_at, name, description, image_url")
    .eq("id", idNum)
    .single();

  if (error && String(error.code) === "PGRST116") {
    return new Response("not found", { status: 404 });
  }
  if (error || !event) return new Response("db error", { status: 500 });

  const { data: markets, error: mErr } = await supabaseAdmin
    .from("event_markets")
    .select("id, event_id, name, is_resolved, open_until, created_at")
    .eq("event_id", idNum);

  if (mErr) return new Response("db error", { status: 500 });

  return Response.json({ ...event, markets: markets || [] });
} 