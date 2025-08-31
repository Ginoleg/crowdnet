import { supabaseAdmin } from "@/lib/supabase/server-client";
import { jwtVerify } from "jose";
import { moderateEvent } from "@/lib/moderation";

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

export async function GET() {
  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("id, created_at, name, description, image_url")
    .order("created_at", { ascending: false });

  if (error) return new Response("db error", { status: 500 });

  const ids = (events ?? []).map((e) => e.id);
  if (ids.length === 0) return Response.json([]);

  const { data: markets, error: mErr } = await supabaseAdmin
    .from("event_markets")
    .select(
      "id, event_id, name, is_resolved, open_until, created_at, last_price, traded_volume, hex_address"
    )
    .in("event_id", ids);

  if (mErr) return new Response("db error", { status: 500 });

  const byEventId = new Map<number, any[]>();
  for (const m of markets || []) {
    const arr = byEventId.get(m.event_id) || [];
    arr.push(m);
    byEventId.set(m.event_id, arr);
  }

  const withMarkets = (events || []).map((e) => {
    const mkts = byEventId.get(e.id) || [];
    const traded_volume = mkts.reduce(
      (sum, m) => sum + (Number(m.traded_volume) || 0),
      0
    );
    return {
      ...e,
      markets: mkts,
      traded_volume,
    };
  });

  return Response.json(withMarkets);
}

export async function POST(req: Request) {
  const token = readToken(req);
  if (!token) return new Response("unauthorized", { status: 401 });

  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return new Response("unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description : "";
  const image_url = typeof body?.image_url === "string" ? body.image_url.trim() : "";
  const markets = Array.isArray(body?.markets) ? body.markets : [];

  if (!name) return new Response("name required", { status: 400 });

  // Moderation gate
  try {
    const moderation = await moderateEvent({
      title: name,
      description,
      markets,
    });
    if (moderation.decision !== "ALLOW") {
      return new Response(
        JSON.stringify({ error: "content_not_allowed", message: "Content not allowed." }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    return new Response("moderation failed", { status: 502 });
  }

  const { data: createdEvent, error } = await supabaseAdmin
    .from("events")
    .insert({ name, description, image_url })
    .select("id, created_at, name, description, image_url")
    .single();

  if (error || !createdEvent) return new Response("db error", { status: 500 });

  let createdMarkets: any[] = [];
  if (markets.length > 0) {
    const rows = markets
      .map((m: any) => ({
        event_id: createdEvent.id,
        name: typeof m?.name === "string" ? m.name : null,
        is_resolved: typeof m?.is_resolved === "boolean" ? m.is_resolved : null,
        open_until: typeof m?.open_until === "string" ? m.open_until : null,
        last_price: 0.5,
        traded_volume: 0,
        hex_address: null,
      }))
      .filter((m: any) => (m.name || "").trim().length > 0);

    if (rows.length > 0) {
      const { data: inserted, error: mErr } = await supabaseAdmin
        .from("event_markets")
        .insert(rows)
        .select(
          "id, event_id, name, is_resolved, open_until, created_at, last_price, traded_volume, hex_address"
        );

      if (mErr) {
        await supabaseAdmin.from("events").delete().eq("id", createdEvent.id);
        return new Response("db error", { status: 500 });
      }
      createdMarkets = inserted || [];
    }
  }

  return new Response(
    JSON.stringify({ ...createdEvent, markets: createdMarkets, traded_volume: 0 }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
} 