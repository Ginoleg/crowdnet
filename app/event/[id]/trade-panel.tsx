"use client";

import { useMemo, useState } from "react";
import type { DbMarket } from "@/types/events";
import type { BinaryOutcome } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function defaultOutcomeNames(): string[] {
  return ["Yes", "No"];
}

function toPercent(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—%";
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

export type TradePanelProps = {
  market: DbMarket | null;
  selectedOutcome: BinaryOutcome | null;
  onSelectOutcome?: (outcome: BinaryOutcome) => void;
};

export default function TradePanel({
  market,
  selectedOutcome,
  onSelectOutcome,
}: TradePanelProps) {
  const names = defaultOutcomeNames();
  const [amount, setAmount] = useState<string>("");

  const price = useMemo(() => {
    if (!market) return null;
    const lp = typeof market.last_price === "number" ? market.last_price : 0.5;
    if (selectedOutcome === "YES") return lp;
    if (selectedOutcome === "NO") return 1 - lp;
    return null;
  }, [market, selectedOutcome]);

  if (!market) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a market to trade.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium leading-5">{market.name}</div>
      <div className="flex items-center gap-2 w-1/2">
        <Button
          size="sm"
          variant={selectedOutcome === "YES" ? "default" : "ghost"}
          onClick={() => onSelectOutcome?.("YES")}
          className={`w-full h-9 shadow-none flex-shrink ${
            selectedOutcome === "YES"
              ? "bg-emerald-500 hover:bg-emerald-500"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 grayscale-50"
          }`}
        >
          {names[0]}
        </Button>
        <Button
          size="sm"
          variant={selectedOutcome === "NO" ? "default" : "ghost"}
          onClick={() => onSelectOutcome?.("NO")}
          className={`w-full h-9 shadow-none flex-shrink ${
            selectedOutcome === "NO"
              ? "bg-rose-500 hover:bg-rose-500"
              : "bg-rose-100 text-rose-700 hover:bg-rose-200 hover:text-rose-800 grayscale-50"
          }`}
        >
          {names[1]}
        </Button>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Input
          placeholder="Amount (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full"
        />
        <Button
          className="w-full"
          size="sm"
          disabled={!selectedOutcome || !amount}
        >
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
