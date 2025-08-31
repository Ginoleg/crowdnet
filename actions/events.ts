"use server";

import { headers } from "next/headers";
import type { DbEvent, DbMarket } from "@/types/events";

async function apiUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

export type FetchDbEventsResult = {
  events: DbEvent[];
  error?: string;
};

export async function getDbEvents(): Promise<FetchDbEventsResult> {
  try {
    const res = await fetch(await apiUrl("/api/events"), {
      method: "GET",
      headers: { accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        events: [],
        error: `Failed to fetch events (${res.status}): ${text || res.statusText}`,
      };
    }
    const data = (await res.json()) as DbEvent[];
    return { events: data || [] };
  } catch (err) {
    return { events: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type FetchDbEventResult = {
  event: DbEvent | null;
  error?: string;
};

export async function getDbEventById(id: string): Promise<FetchDbEventResult> {
  try {
    const res = await fetch(await apiUrl(`/api/events/${encodeURIComponent(id)}`), {
      method: "GET",
      headers: { accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (res.status === 404) return { event: null, error: "Event not found" };
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        event: null,
        error: `Failed to fetch event (${res.status}): ${text || res.statusText}`,
      };
    }
    const data = (await res.json()) as DbEvent;
    return { event: data };
  } catch (err) {
    return { event: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
} 