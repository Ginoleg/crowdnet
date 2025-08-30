import { NextRequest } from "next/server";
import { createSiweMessage } from "viem/siwe";
import { recoverMessageAddress } from "viem";
import { SignJWT } from "jose";
import { supabaseAdmin } from "@/lib/supabase/server-client";
import { generateNonce } from "siwe";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function GET(req: NextRequest) {
  const address = (req.nextUrl.searchParams.get("address") || "").toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(address)) return new Response("bad address", { status: 400 });

  const nonce = generateNonce();
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

  const { error } = await supabaseAdmin.from("siwe_nonce").insert({ nonce, address_hex: address, expires_at: expires });
  if (error) {
    console.log("error", error);
    return new Response("db error", { status: 500 });
  }

  return new Response(nonce, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const message = body?.message;
  const signature = body?.signature;
  if (!message || !signature) return new Response("bad body", { status: 400 });

  // 1) Prepare the exact string the wallet signed and extract nonce
  const prepared =
    typeof message === "string" ? message : createSiweMessage(message);

  let nonce: string | undefined =
    typeof message === "string"
      ? (prepared.match(/^\s*Nonce:\s*([a-zA-Z0-9]+)\s*$/m)?.[1] ?? undefined)
      : message?.nonce;

  if (!nonce) return new Response("nonce missing", { status: 400 });

  // 2) Recover signer (EOA) and normalize
  const recovered = (
    await recoverMessageAddress({ message: prepared, signature })
  ).toLowerCase();

  // 3) Atomically claim (delete) the nonce for this address if still valid
  const nowIso = new Date().toISOString();
  const { data: claimed, error: delErr } = await supabaseAdmin
    .from("siwe_nonce")
    .delete()
    .eq("nonce", nonce)
    .eq("address_hex", recovered)
    .gt("expires_at", nowIso)
    .select("nonce");

  if (delErr) return new Response("db error", { status: 500 });
  if (!claimed?.length) return new Response("nonce invalid/used", { status: 400 });

  // 4) Upsert minimal user (one address per user)
  const { data: up, error: upErr } = await supabaseAdmin
    .from("app_user")
    .upsert({ address_hex: recovered }, { onConflict: "address_hex" })
    .select("id")
    .single();

  if (upErr || !up) return new Response("user upsert failed", { status: 500 });

  // 5) Mint JWT + set cookie
  const token = await new SignJWT({
    "app.user_id": up.id,
    "app.address": recovered,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const headers = new Headers({
    "Set-Cookie": `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${
      7 * 24 * 3600
    }; Secure`,
    "Content-Type": "application/json",
  });

  return new Response(JSON.stringify({ token }), { status: 200, headers });
}