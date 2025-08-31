"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { BinaryOutcome, DbEvent, DbMarket } from "@/types/events";
import EventInfo from "@/app/event/[id]/event-info";
import MarketList from "@/app/event/[id]/market-list";

type DraftMarket = {
  name: string;
  is_resolved: boolean;
  open_until: string; // YYYY-MM-DD
};

export default function CreateEventForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [markets, setMarkets] = useState<DraftMarket[]>([
    { name: "", is_resolved: false, open_until: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function updateMarket(idx: number, patch: Partial<DraftMarket>) {
    setMarkets((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    );
  }

  function addMarket() {
    setMarkets((prev) => [
      ...prev,
      { name: "", is_resolved: false, open_until: "" },
    ]);
  }

  function removeMarket(idx: number) {
    setMarkets((prev) => prev.filter((_, i) => i !== idx));
  }

  // Build a live preview using native DB types
  const previewMarkets: DbMarket[] = useMemo(() => {
    return markets.map((m, idx) => {
      const createdAt = new Date().toISOString();
      return {
        id: idx + 1,
        event_id: 0,
        name: m.name || "",
        is_resolved: Boolean(m.is_resolved),
        open_until: m.open_until || null,
        created_at: createdAt,
        last_price: 0.5,
        traded_volume: 0,
      } as DbMarket;
    });
  }, [markets]);

  const previewEvent: DbEvent = useMemo(() => {
    const nowIso = new Date().toISOString();
    const traded_volume = previewMarkets.reduce(
      (sum, m) => sum + (Number(m.traded_volume) || 0),
      0
    );
    return {
      id: 0,
      created_at: nowIso,
      name: name || "Untitled event",
      description: description || null,
      image_url: imageUrl || null,
      markets: previewMarkets,
      traded_volume,
    } as DbEvent;
  }, [name, description, imageUrl, previewMarkets]);

  const [selectedMarketId, setSelectedMarketId] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<BinaryOutcome | null>(
    null
  );

  // Keep selection in sync with first available market
  const firstMarketId = previewMarkets[0]?.id;
  if (!selectedMarketId && typeof firstMarketId !== "undefined") {
    setSelectedMarketId(String(firstMarketId));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          image_url: imageUrl,
          markets,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || `Failed to create event (${res.status})`);
        setSubmitting(false);
        return;
      }
      const created = await res.json();
      router.push(`/event/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-40 lg:pb-0 w-full max-w-5xl">
      <div className="lg:col-span-2 space-y-6 w-full">
        <div className="p-0">
          <EventInfo event={previewEvent} markets={previewMarkets} />
        </div>

        <div className="p-0 w-full">
          <div className="px-0 pb-2">
            <h2 className="text-base font-semibold">Outcomes</h2>
          </div>
          <div className="px-0">
            {previewMarkets.length === 0 ? (
              <div className="py-3 text-sm text-muted-foreground">
                No markets available.
              </div>
            ) : (
              <MarketList
                markets={previewMarkets}
                selectedMarketId={selectedMarketId}
                selectedOutcome={selectedOutcome}
                onSelect={(marketId, outcome) => {
                  setSelectedMarketId(marketId);
                  setSelectedOutcome(outcome ?? null);
                }}
              />
            )}
          </div>
          <div>
            <div className="px-0 pb-2 pt-8">
              <h2 className="text-base font-semibold">Description</h2>
            </div>
            {previewEvent.description ? (
              <p className="text-sm leading-6 whitespace-pre-line">
                {previewEvent.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right aside: the form */}
      <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-16 h-fit">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name"
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="image_url"
            >
              Image URL
            </label>
            <Input
              id="image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="description"
            >
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={6}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Markets</h2>
              <Button type="button" variant="secondary" onClick={addMarket}>
                Add
              </Button>
            </div>
            {markets.map((m, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Market #{idx + 1}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMarket(idx)}
                  >
                    Remove
                  </Button>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`mn_${idx}`}>
                    Name
                  </label>
                  <Input
                    id={`mn_${idx}`}
                    value={m.name}
                    onChange={(e) =>
                      updateMarket(idx, { name: e.target.value })
                    }
                    placeholder="Market name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`ou_${idx}`}>
                    Open until (YYYY-MM-DD)
                  </label>
                  <Input
                    id={`ou_${idx}`}
                    type="date"
                    value={m.open_until}
                    onChange={(e) =>
                      updateMarket(idx, { open_until: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Publishing..." : "Publish event"}
            </Button>
          </div>
        </form>
      </aside>

      {/* Mobile form below preview */}
      <div className="lg:hidden">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="m_name">
              Name
            </label>
            <Input
              id="m_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name"
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="m_image_url"
            >
              Image URL
            </label>
            <Input
              id="m_image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="m_description"
            >
              Description
            </label>
            <Textarea
              id="m_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={6}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Markets</h2>
              <Button type="button" variant="secondary" onClick={addMarket}>
                Add
              </Button>
            </div>
            {markets.map((m, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Market #{idx + 1}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMarket(idx)}
                  >
                    Remove
                  </Button>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`mmn_${idx}`}>
                    Name
                  </label>
                  <Input
                    id={`mmn_${idx}`}
                    value={m.name}
                    onChange={(e) =>
                      updateMarket(idx, { name: e.target.value })
                    }
                    placeholder="Market name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`mou_${idx}`}>
                    Open until (YYYY-MM-DD)
                  </label>
                  <Input
                    id={`mou_${idx}`}
                    type="date"
                    value={m.open_until}
                    onChange={(e) =>
                      updateMarket(idx, { open_until: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Publishing..." : "Publish event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
