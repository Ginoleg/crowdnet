"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { selectedTradeAtom } from "@/lib/atoms";
import type { PolymarketEvent } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function formatUsd(value: number | undefined | null): string {
  const num = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function toPercent(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—%";
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

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
  const parts = raw
    .split(/[,/|]/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return parts;
}

export type ClientEventListProps = {
  events: PolymarketEvent[];
};

export default function ClientEventList({ events }: ClientEventListProps) {
  const setSelectedTrade = useSetAtom(selectedTradeAtom);
  const router = useRouter();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y">
        {events.map((event, eventIndex) => {
          const thumbnail = event.image || event.featuredImage || event.icon;
          const markets = Array.isArray(event.markets)
            ? event.markets.slice(0, 3)
            : [];
          const totalMarketCap = event.openInterest ?? 0;
          const colIndexSm = eventIndex % 2;
          const smPl = colIndexSm === 0 ? "sm:pl-0" : "sm:pl-4";
          const smPr = colIndexSm === 0 ? "sm:pr-4" : "sm:pr-0";
          const colIndexLg = eventIndex % 3;
          let lgPl = "lg:pl-6";
          let lgPr = "lg:pr-6";
          if (colIndexLg === 0) {
            lgPl = "lg:pl-0";
            lgPr = "lg:pr-6";
          } else if (colIndexLg === 2) {
            lgPl = "lg:pl-6";
            lgPr = "lg:pr-0";
          }
          const cardPaddingClass = `${smPl} ${smPr} ${lgPl} ${lgPr}`;

          return (
            <article key={event.id} className={`w-full last:border-b`}>
              <Card
                className={`overflow-hidden border-0 shadow-none ring-0 bg-transparent py-0 py-6 px-0 ${cardPaddingClass}`}
              >
                <div>
                  <CardHeader className="h-16 px-0 pb-4">
                    <div className="flex items-center gap-2">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={event.title}
                          width={44}
                          height={44}
                          className="rounded-md object-cover bg-neutral-200 shrink-0 h-10 w-10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted" />
                      )}
                      <Link
                        href={`/event/${event.id}`}
                        className="min-w-0 group"
                      >
                        <CardTitle className="text-base font-semibold tracking-[-0.2px] leading-5 line-clamp-2 group-hover:underline">
                          {event.title}
                        </CardTitle>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="">
                      {markets.map((mkt, idx) => {
                        const names = parseOutcomeNames(
                          mkt.shortOutcomes || mkt.outcomes
                        );
                        const prices = parseOutcomePrices(mkt.outcomePrices);
                        const pctA = prices[0];
                        return (
                          <div
                            key={mkt.id}
                            className={`py-1 ${idx === 0 ? "pt-0" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col min-w-0 gap-1.5">
                                <div className="flex items-center gap-3">
                                  <span
                                    className="text-sm text-foreground/80 truncate"
                                    title={
                                      mkt.groupItemTitle?.trim() || mkt.question
                                    }
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
                                  onClick={() => {
                                    setSelectedTrade({
                                      eventId: event.id,
                                      marketId: mkt.id,
                                      outcome: "YES",
                                    });
                                    router.push(`/event/${event.id}`);
                                  }}
                                >
                                  {names[0] || "Yes"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-500"
                                  onClick={() => {
                                    setSelectedTrade({
                                      eventId: event.id,
                                      marketId: mkt.id,
                                      outcome: "NO",
                                    });
                                    router.push(`/event/${event.id}`);
                                  }}
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
                      <div className="pt-3 text-xs text-muted-foreground flex items-center gap-2">
                        <span>{formatUsd(totalMarketCap)}</span>
                        <span>•</span>
                        <span>24h vol: {formatUsd(event.volume24hr ?? 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </article>
          );
        })}
      </div>
      {events.length === 0 ? (
        <div className="mt-6 text-sm text-muted-foreground">
          No events found.
        </div>
      ) : null}
    </>
  );
}
