"use client";

import { useMemo, useState } from "react";
import type {
  PolymarketEvent,
  PolymarketMarket,
  BinaryOutcome,
} from "@/types/events";
import { useAtomValue } from "jotai";
import { selectedTradeAtom } from "@/lib/atoms";
import EventInfo from "./event-info";
import MarketList from "./market-list";
import TradePanel from "./trade-panel";

export type EventClientProps = {
  event: PolymarketEvent;
  markets: PolymarketMarket[];
  initialMarketId?: string;
  initialOutcome?: BinaryOutcome | null;
};

export default function EventClient({
  event,
  markets,
  initialMarketId,
  initialOutcome = null,
}: EventClientProps) {
  const selectedTrade = useAtomValue(selectedTradeAtom);

  const fallbackMarketId = markets[0]?.id ?? "";

  const [selectedMarketId, setSelectedMarketId] = useState<string>(() => {
    if (
      selectedTrade &&
      selectedTrade.eventId === event.id &&
      selectedTrade.marketId
    )
      return selectedTrade.marketId;
    if (initialMarketId) return initialMarketId;
    return fallbackMarketId;
  });

  const [selectedOutcome, setSelectedOutcome] = useState<BinaryOutcome | null>(
    () => {
      if (
        selectedTrade &&
        selectedTrade.eventId === event.id &&
        selectedTrade.outcome
      )
        return selectedTrade.outcome;
      return initialOutcome ?? null;
    }
  );

  const selectedMarket = useMemo<PolymarketMarket | null>(() => {
    return markets.find((m) => m.id === selectedMarketId) ?? markets[0] ?? null;
  }, [markets, selectedMarketId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="p-0">
          <EventInfo event={event} />
        </div>

        <div className="p-0">
          <div className="px-0 pb-2">
            <h2 className="text-base font-semibold">Outcomes</h2>
          </div>
          <div className="px-0">
            {markets.length === 0 ? (
              <div className="py-3 text-sm text-muted-foreground">
                No markets available.
              </div>
            ) : (
              <MarketList
                markets={markets}
                selectedMarketId={selectedMarket?.id || ""}
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
            {event.description ? (
              <p className="text-sm leading-6 whitespace-pre-line">
                {event.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <aside className="lg:col-span-1 lg:sticky lg:top-16 h-fit">
        <div className="p-0">
          <div className="px-0 pb-2">
            <h2 className="text-base font-semibold">Trade</h2>
          </div>
          <div className="px-0">
            <TradePanel
              market={selectedMarket}
              selectedOutcome={selectedOutcome}
              onSelectOutcome={(o) => setSelectedOutcome(o)}
            />
            <div className="mt-4 text-xs text-muted-foreground">
              Trade on the selected market.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
