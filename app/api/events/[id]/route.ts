import { supabaseAdmin } from "@/lib/supabase/server-client";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

function readToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.headers.get("cookie") || "";
  const part = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("session="));
  return part ? part.split("=")[1] : null;
}

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
    .select("id, event_id, name, is_resolved, open_until, created_at, last_price, traded_volume, hex_address")
    .eq("event_id", idNum)
    .order("id", { ascending: true });

  if (mErr) return new Response("db error", { status: 500 });

  const mkts = markets || [];
  const traded_volume = mkts.reduce((sum, m) => sum + (Number(m.traded_volume) || 0), 0);

  return Response.json({ ...event, markets: mkts, traded_volume });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const token = readToken(req);
  if (!token) return new Response("unauthorized", { status: 401 });
  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return new Response("unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) return new Response("bad id", { status: 400 });

  const body = await req.json().catch(() => null) as any;
  const hex_addresses = Array.isArray(body?.hex_addresses) ? body.hex_addresses : null;
  if (!hex_addresses || hex_addresses.length === 0) {
    return new Response("hex_addresses required", { status: 400 });
  }
  if (!hex_addresses.every((a: unknown) => typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a))) {
    return new Response("invalid hex_addresses", { status: 400 });
  }

  const { data: markets, error: mErr } = await supabaseAdmin
    .from("event_markets")
    .select("id")
    .eq("event_id", idNum)
    .order("id", { ascending: true });

  if (mErr) return new Response("db error", { status: 500 });
  const mkts = markets || [];
  if (mkts.length !== hex_addresses.length) {
    return new Response("mismatched addresses length", { status: 400 });
  }

  for (let i = 0; i < mkts.length; i++) {
    const marketId = mkts[i].id;
    const addr = hex_addresses[i];
    const { error: uErr } = await supabaseAdmin
      .from("event_markets")
      .update({ hex_address: addr })
      .eq("id", marketId);
    if (uErr) return new Response("db error", { status: 500 });
  }

  return new Response(null, { status: 204 });
} 