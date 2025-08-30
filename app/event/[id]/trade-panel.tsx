"use client";

import { useMemo, useState } from "react";
import type { PolymarketMarket, BinaryOutcome } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function parseOutcomeNames(raw?: string): string[] {
  if (!raw) return ["Yes", "No"];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed.map(String);
  } catch {}
  const parts = raw
    .split(/[,/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 2) : ["Yes", "No"];
}

function parseOutcomePrices(raw?: string): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  } catch {}
  return raw
    .split(/[,/|]/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

function toPercent(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—%";
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

export type TradePanelProps = {
  market: PolymarketMarket | null;
  selectedOutcome: BinaryOutcome | null;
  onSelectOutcome?: (outcome: BinaryOutcome) => void;
};

export default function TradePanel({
  market,
  selectedOutcome,
  onSelectOutcome,
}: TradePanelProps) {
  const names = parseOutcomeNames(market?.shortOutcomes || market?.outcomes);
  const prices = parseOutcomePrices(market?.outcomePrices);
  const [amount, setAmount] = useState<string>("");

  const price = useMemo(() => {
    if (!market) return null;
    if (selectedOutcome === "YES") return prices[0] ?? null;
    if (selectedOutcome === "NO") return prices[1] ?? null;
    return null;
  }, [market, prices, selectedOutcome]);

  if (!market) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a market to trade.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium leading-5">
        {market.groupItemTitle?.trim() || market.question}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={selectedOutcome === "YES" ? "default" : "outline"}
          onClick={() => onSelectOutcome?.("YES")}
          className={selectedOutcome === "YES" ? "bg-emerald-600" : ""}
        >
          {names[0] || "Yes"}{" "}
          {typeof prices[0] === "number" ? `· ${toPercent(prices[0])}` : ""}
        </Button>
        <Button
          size="sm"
          variant={selectedOutcome === "NO" ? "default" : "outline"}
          onClick={() => onSelectOutcome?.("NO")}
          className={selectedOutcome === "NO" ? "bg-rose-500" : ""}
        >
          {names[1] || "No"}{" "}
          {typeof prices[1] === "number" ? `· ${toPercent(prices[1])}` : ""}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Amount (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-40"
        />
        <Button size="sm" disabled={!selectedOutcome || !amount}>
          Mock Trade
        </Button>
      </div>
      {price !== null ? (
        <div className="text-xs text-muted-foreground">
          Estimated price: {toPercent(price)}
        </div>
      ) : null}
    </div>
  );
}
