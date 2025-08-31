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

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const token = readToken(req);
  if (!token) return new Response("unauthorized", { status: 401 });

  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return new Response("unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const marketId = Number(id);
  if (!Number.isFinite(marketId)) return new Response("bad id", { status: 400 });

  const body = (await req.json().catch(() => null)) as any;
  const last_price =
    typeof body?.last_price === "number" && Number.isFinite(body.last_price)
      ? body.last_price
      : null;

  const traded_delta =
    typeof body?.traded_delta === "number" && Number.isFinite(body.traded_delta)
      ? body.traded_delta
      : typeof body?.traded_volume === "number" && Number.isFinite(body.traded_volume)
      ? body.traded_volume
      : null;

  if (last_price === null && traded_delta === null) {
    return new Response("no fields to update", { status: 400 });
  }

  // If we have a traded delta, load current traded_volume to add
  let newTradedVolume: number | undefined = undefined;
  if (traded_delta !== null) {
    const { data: row, error: selErr } = await supabaseAdmin
      .from("event_markets")
      .select("traded_volume")
      .eq("id", marketId)
      .single();
    if (selErr) return new Response("db error", { status: 500 });
    const current = Number(row?.traded_volume) || 0;
    newTradedVolume = current + traded_delta;
  }

  const update: Record<string, any> = {};
  if (last_price !== null) update.last_price = last_price;
  if (typeof newTradedVolume === "number") update.traded_volume = newTradedVolume;

  const { error } = await supabaseAdmin
    .from("event_markets")
    .update(update)
    .eq("id", marketId);

  if (error) return new Response("db error", { status: 500 });

  return new Response(null, { status: 204 });
} 