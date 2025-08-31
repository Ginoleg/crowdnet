"use client";

import { useMemo, useEffect } from "react";
import { useReadContract } from "wagmi";
import type { DbMarket } from "@/types/events";
import type { BinaryOutcome } from "@/types/events";
import { Button } from "@/components/ui/button";
import BinaryPredictionMarketABI from "@/abis/BinaryPredictionMarket.json";

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

function MarketRow({
  mkt,
  selectedMarketId,
  selectedOutcome,
  onSelect,
}: {
  mkt: DbMarket;
  selectedMarketId?: string;
  selectedOutcome?: BinaryOutcome | null;
  onSelect: (marketId: string, outcome?: BinaryOutcome) => void;
}) {
  const names = defaultOutcomeNames();

  const { data: contractYesPrice, refetch } = useReadContract({
    address: mkt.hex_address as `0x${string}`,
    abi: BinaryPredictionMarketABI.abi,
    functionName: "getYesPrice",
    query: {
      enabled: !!mkt.hex_address,
      staleTime: 0,
    },
  });

  useEffect(() => {
    const handler = (e: any) => {
      const addr = e?.detail?.address as string | undefined;
      if (!addr || !mkt.hex_address) return;
      if (addr.toLowerCase() === (mkt.hex_address as string).toLowerCase()) {
        refetch();
      }
    };
    window.addEventListener("market:price-update", handler as EventListener);
    return () =>
      window.removeEventListener(
        "market:price-update",
        handler as EventListener
      );
  }, [mkt.hex_address, refetch]);

  const yesPrice = useMemo(() => {
    if (contractYesPrice) {
      return Number(contractYesPrice) / 1e18;
    } else {
      return typeof mkt.last_price === "number" ? mkt.last_price : 0.5;
    }
  }, [contractYesPrice, mkt.last_price]);

  const pctA = yesPrice;
  const isYesSelected =
    selectedMarketId === String(mkt.id) && selectedOutcome === "YES";
  const isNoSelected =
    selectedMarketId === String(mkt.id) && selectedOutcome === "NO";

  return (
    <div className="py-3 border-t mb-0 last:border-b">
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
}

export default function MarketList({
  markets,
  selectedMarketId,
  selectedOutcome,
  onSelect,
}: MarketListProps) {
  return (
    <div className="space-y-1">
      {markets.map((mkt) => (
        <MarketRow
          key={mkt.id}
          mkt={mkt}
          selectedMarketId={selectedMarketId}
          selectedOutcome={selectedOutcome}
          onSelect={onSelect}
        />
      ))}
      {markets.length === 0 ? (
        <div className="py-3 text-xs text-muted-foreground">
          No markets available.
        </div>
      ) : null}
    </div>
  );
}
