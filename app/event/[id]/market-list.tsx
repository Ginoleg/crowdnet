"use client";

import type { PolymarketMarket, BinaryOutcome } from "@/types/events";
import { Button } from "@/components/ui/button";

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

export type MarketListProps = {
  markets: PolymarketMarket[];
  selectedMarketId?: string;
  onSelect: (marketId: string, outcome?: BinaryOutcome) => void;
};

export default function MarketList({
  markets,
  selectedMarketId,
  onSelect,
}: MarketListProps) {
  return (
    <div className="space-y-1">
      {markets.map((mkt) => {
        const names = parseOutcomeNames(mkt.shortOutcomes || mkt.outcomes);
        const prices = parseOutcomePrices(mkt.outcomePrices);
        const pctA = prices[0];
        const isSelected = selectedMarketId === mkt.id;

        return (
          <div
            key={mkt.id}
            className={`py-2 rounded-md cursor-pointer -mx-3 px-3 hover:bg-muted/30 ${
              isSelected ? "ring ring-inset ring-blue-300 bg-blue-50/50" : ""
            }`}
            onClick={() => onSelect(mkt.id, "YES")}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0 gap-1.5">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm text-foreground/80 truncate"
                    title={mkt.groupItemTitle?.trim() || mkt.question}
                  >
                    {mkt.groupItemTitle?.trim() || mkt.question}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {toPercent(pctA)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
                  onClick={() => onSelect(mkt.id, "YES")}
                >
                  {names[0] || "Yes"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-500"
                  onClick={() => onSelect(mkt.id, "NO")}
                >
                  {names[1] || "No"}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
      {markets.length === 0 ? (
        <div className="py-3 text-xs text-muted-foreground">
          No markets available.
        </div>
      ) : null}
    </div>
  );
}
