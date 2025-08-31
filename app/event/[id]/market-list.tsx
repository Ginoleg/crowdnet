"use client";

import type { DbMarket } from "@/types/events";
import type { BinaryOutcome } from "@/types/events";
import { Button } from "@/components/ui/button";

function defaultOutcomeNames(): string[] {
  return ["Yes", "No"];
}

function toPercent(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—%";
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

export type MarketListProps = {
  markets: DbMarket[];
  selectedMarketId?: string;
  selectedOutcome?: BinaryOutcome | null;
  onSelect: (marketId: string, outcome?: BinaryOutcome) => void;
};

export default function MarketList({
  markets,
  selectedMarketId,
  selectedOutcome,
  onSelect,
}: MarketListProps) {
  return (
    <div className="space-y-1">
      {markets.map((mkt) => {
        const names = defaultOutcomeNames();
        const pctA = mkt.last_price ?? 0.5;
        const isYesSelected =
          selectedMarketId === String(mkt.id) && selectedOutcome === "YES";
        const isNoSelected =
          selectedMarketId === String(mkt.id) && selectedOutcome === "NO";

        return (
          <div key={mkt.id} className="py-3 border-t mb-0 last:border-b">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0 gap-1.5 w-full">
                <div className="flex items-center justify-between w-full gap-3">
                  <span
                    className="text-sm text-foreground/80 truncate"
                    title={mkt.name || ""}
                  >
                    {mkt.name}
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
                  className={`h-8 px-3 ${
                    isYesSelected
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(String(mkt.id), "YES");
                  }}
                >
                  {names[0]}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 px-3 ${
                    isNoSelected
                      ? "bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                      : "bg-rose-100 text-rose-700 hover:bg-rose-200 hover:text-rose-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(String(mkt.id), "NO");
                  }}
                >
                  {names[1]}
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
