"use server";

import type { PolymarketEventsResponse, PolymarketEvent, Tag } from "@/types/events";

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export type FetchEventsResult = {
  events: PolymarketEventsResponse;
  error?: string;
};

export type EventsSort = "trending" | "new";

export type EventsCategory =
  | "politics"
  | "sports"
  | "crypto"
  | "tech"
  | "economy"
  | "culture"
  | "all";

export async function getEvents(
  sort: EventsSort = "trending",
  opts?: { category?: EventsCategory; offset?: number; limit?: number; q?: string }
): Promise<FetchEventsResult> {
  const limit = Math.max(1, Math.min(100, opts?.limit ?? 30));
  const q = (opts?.q || "").trim();

  // If searching, use public-search with documented params
  if (q) {
    const url = new URL("/public-search", GAMMA_API_BASE);
    url.searchParams.set("q", q);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit_per_type", "30");
    url.searchParams.set("limit", "30");
    url.searchParams.set("type", "events");
    url.searchParams.set("events_status", "active");
    if (sort === "trending") {
      url.searchParams.set("sort", "volume_24hr");
    }

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { accept: "application/json" },
        next: { revalidate: 15 },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { events: [], error: `Failed to search events (${res.status}): ${text || res.statusText}` };
      }

      const data = await res.json();
      const events = (data && Array.isArray(data.events) ? (data.events as PolymarketEventsResponse) : []) as PolymarketEventsResponse;
      return { events };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  // Otherwise, list events with sorting and optional tag filter
  const url = new URL("/events", GAMMA_API_BASE);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("order", sort === "new" ? "createdAt" : "volume24hr");
  url.searchParams.set("ascending", "false");

  if (typeof opts?.offset === "number" && opts.offset >= 0) {
    url.searchParams.set("offset", String(opts.offset));
  }

  const category = opts?.category && opts.category !== "all" ? opts.category : undefined;
  if (category) {
    url.searchParams.set("tag_slug", category);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { events: [], error: `Failed to fetch events (${res.status}): ${text || res.statusText}` };
    }

    const data = (await res.json()) as PolymarketEventsResponse;

    if (!Array.isArray(data)) {
      return { events: [], error: "Unexpected response shape from Polymarket API" };
    }

    return { events: data };
  } catch (err) {
    return { events: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type FetchEventResult = {
  event: PolymarketEvent | null;
  error?: string;
};

export async function getEventById(id: string): Promise<FetchEventResult> {
  if (!id) return { event: null, error: "Missing event id" };

  // Attempt to fetch a single event by id. If the API returns an array, pick the first.
  const url = new URL(`/events/${encodeURIComponent(id)}`, GAMMA_API_BASE);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { event: null, error: `Failed to fetch event (${res.status}): ${text || res.statusText}` };
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      const first: unknown = data[0];
      if (first && typeof first === "object") return { event: first as PolymarketEvent };
      return { event: null, error: "Event not found" };
    }

    if (data && typeof data === "object") {
      return { event: data as PolymarketEvent };
    }

    return { event: null, error: "Unexpected response shape from Polymarket API" };
  } catch (err) {
    return { event: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
  