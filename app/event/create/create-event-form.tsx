"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { BinaryOutcome, DbEvent, DbMarket } from "@/types/events";
import EventInfo from "@/app/event/[id]/event-info";
import MarketList from "@/app/event/[id]/market-list";
import { useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { parseEther, decodeEventLog } from "viem";
import EventFactoryABI from "@/abis/EventFactory.json";
import { wagmiConfig } from "@/lib/wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DraftMarket = {
  name: string;
  is_resolved: boolean;
  open_until: string; // YYYY-MM-DD
};

// Helpers (logic)
function buildMarketConfigs(markets: DraftMarket[]) {
  return markets.map((market) => {
    const endDate = new Date(market.open_until);
    const now = new Date();
    const durationSeconds = Math.floor(
      (endDate.getTime() - now.getTime()) / 1000
    );
    return {
      question: market.name,
      duration: BigInt(Math.max(durationSeconds, 0)),
      fee: BigInt(100),
      seedCollateral: parseEther("0.000001"),
    } as const;
  });
}

function parseMarketAddressesFromReceipt(receipt: any): string[] {
  const eventFactoryAddress =
    "0x6450031EC3DB3E802a753b03Ea7717F551AFACE7" as const;
  const addresses: string[] = [];
  for (const log of receipt?.logs || []) {
    if ((log.address || "").toLowerCase() !== eventFactoryAddress.toLowerCase())
      continue;
    try {
      const decoded = decodeEventLog({
        abi: (EventFactoryABI as any).abi,
        data: log.data,
        topics: log.topics,
      }) as { eventName: string; args: any };
      if (decoded.eventName === "MarketCreated") {
        const addr = decoded.args?.marketContract as string | undefined;
        if (addr) addresses.push(addr);
      }
    } catch {}
  }
  return addresses;
}

async function createEventInDb(payload: {
  name: string;
  description: string;
  image_url: string;
  markets: DraftMarket[];
}) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to create event (${res.status})`);
  }
  return (await res.json()) as { id: number };
}

async function patchHexAddresses(eventId: number, hexAddresses: string[]) {
  const res = await fetch(`/api/events/${eventId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ hex_addresses: hexAddresses }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Failed to update addresses (${res.status})`);
  }
}

export default function CreateEventForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [markets, setMarkets] = useState<DraftMarket[]>([
    { name: "", is_resolved: false, open_until: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [onChainSubmitting, setOnChainSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const router = useRouter();
  const [oracleType, setOracleType] = useState<
    "manual" | "flare" | "kleros" | "escrow"
  >("manual");

  // Contract interaction
  const { writeContractAsync, isPending: isContractPending } =
    useWriteContract();

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (!name.trim()) throw new Error("Event name is required");
      if (
        markets.length === 0 ||
        markets.some((m) => !m.name.trim() || !m.open_until)
      ) {
        throw new Error(
          "At least one market with name and end date is required"
        );
      }
      const created = await createEventInDb({
        name,
        description,
        image_url: imageUrl,
        markets,
      });
      setCreatedEventId(created.id);
      setSuccess("Event created. Now create it on-chain.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCreateOnChain(e: React.FormEvent) {
    e.preventDefault();
    setOnChainSubmitting(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);
    try {
      if (!createdEventId) throw new Error("Please publish the event first");
      if (!name.trim()) throw new Error("Event name is required");
      if (
        markets.length === 0 ||
        markets.some((m) => !m.name.trim() || !m.open_until)
      ) {
        throw new Error(
          "At least one market with name and end date is required"
        );
      }

      const marketConfigs = buildMarketConfigs(markets);
      const eventFactoryAddress =
        "0x6450031EC3DB3E802a753b03Ea7717F551AFACE7" as const;

      // 1) Write contract
      const hash = await writeContractAsync({
        address: eventFactoryAddress,
        abi: (EventFactoryABI as any).abi,
        functionName: "createManualEvent",
        args: [name, description, marketConfigs],
        value: parseEther("0.000001") * BigInt(marketConfigs.length),
      });
      setTxHash(hash);

      // 2) Wait for receipt
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

      // 3) Parse addresses from logs
      const addresses = parseMarketAddressesFromReceipt(receipt);
      if (addresses.length !== markets.length || addresses.length === 0) {
        throw new Error(
          "Mismatch between created markets and on-chain addresses"
        );
      }

      // 4) PATCH addresses to DB
      await patchHexAddresses(createdEventId, addresses);

      setSuccess("Event created on-chain and synced.");
      router.push(`/event/${createdEventId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setOnChainSubmitting(false);
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
          {success ? (
            <div className="text-sm text-green-600">{success}</div>
          ) : null}
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

          <div>
            <div className="block text-sm font-medium mb-2">
              Resolution oracle
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Card
                className={`cursor-pointer p-3 px-4 items-start justify-center rounded-md ${
                  oracleType === "manual"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("manual")}
              >
                <CardTitle className="text-sm mb-0">
                  Manual resolution
                </CardTitle>
              </Card>

              <Card
                className={`cursor-pointer p-3 px-4 items-start justify-center rounded-md ${
                  oracleType === "flare"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("flare")}
              >
                <CardTitle className="text-sm">Flare oracle</CardTitle>
              </Card>

              <Card
                className={`cursor-pointer p-3 px-4 items-start justify-center rounded-md ${
                  oracleType === "kleros"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("kleros")}
              >
                <CardTitle className="text-sm">Kleros court</CardTitle>
              </Card>

              <Card
                className={`cursor-pointer p-3 px-4 items-start justify-center rounded-md ${
                  oracleType === "escrow"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("escrow")}
              >
                <CardTitle className="text-sm">Third Party Escrow</CardTitle>
              </Card>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Publishing..." : "Publish event"}
            </Button>
            <Button
              type="button"
              onClick={onCreateOnChain}
              disabled={onChainSubmitting || isContractPending}
              variant="outline"
              className="w-full"
            >
              {onChainSubmitting
                ? "Creating on-chain..."
                : "Create Event on Chain"}
            </Button>
            {txHash && (
              <div className="text-xs text-muted-foreground">
                Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            )}
          </div>
        </form>
      </aside>

      {/* Mobile form below preview */}
      <div className="lg:hidden">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {success ? (
            <div className="text-sm text-green-600">{success}</div>
          ) : null}
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

          <div>
            <div className="block text-sm font-medium mb-1">
              Resolution oracle
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer ${
                  oracleType === "manual"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("manual")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Manual resolution</CardTitle>
                  <CardDescription>Default</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    size="sm"
                    variant={oracleType === "manual" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOracleType("manual");
                    }}
                  >
                    {oracleType === "manual" ? "Selected" : "Select"}
                  </Button>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer ${
                  oracleType === "flare"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("flare")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Flare oracle</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    size="sm"
                    variant={oracleType === "flare" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOracleType("flare");
                    }}
                  >
                    {oracleType === "flare" ? "Selected" : "Select"}
                  </Button>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer ${
                  oracleType === "kleros"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("kleros")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Kleros court</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    size="sm"
                    variant={oracleType === "kleros" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOracleType("kleros");
                    }}
                  >
                    {oracleType === "kleros" ? "Selected" : "Select"}
                  </Button>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer ${
                  oracleType === "escrow"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setOracleType("escrow")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Third Party Escrow</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    size="sm"
                    variant={oracleType === "escrow" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOracleType("escrow");
                    }}
                  >
                    {oracleType === "escrow" ? "Selected" : "Select"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Publishing..." : "Publish event"}
            </Button>
            <Button
              type="button"
              onClick={onCreateOnChain}
              disabled={onChainSubmitting || isContractPending}
              variant="outline"
              className="w-full"
            >
              {onChainSubmitting
                ? "Creating on-chain..."
                : "Create Event on Chain"}
            </Button>
            {txHash && (
              <div className="text-xs text-muted-foreground">
                Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
