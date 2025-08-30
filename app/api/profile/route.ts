import { supabaseAdmin } from "@/lib/supabase/server-client";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function GET(req: Request) {
  // accept Authorization: Bearer <jwt> or cookie "session"
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const cookie = req.headers.get("cookie") || "";
  const cookieToken = cookie.split(";").map(s=>s.trim()).find(s=>s.startsWith("session="))?.split("=")[1];
  const token = bearer || cookieToken;
  if (!token) return new Response("unauthorized", { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    userId = String(payload["app.user_id"]);
  } catch {
    return new Response("unauthorized", { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_user")
    .select("username")
    .eq("id", userId)
    .limit(1);
  if (error) return new Response("db error", { status: 500 });

  return Response.json({ username: data?.[0]?.username ?? null });
}
