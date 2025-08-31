"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { selectedTradeAtom } from "@/lib/atoms";
import type { DbEvent, DbMarket } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function isValidHttpUrl(maybeUrl?: string | null): boolean {
  if (!maybeUrl) return false;
  try {
    const url = new URL(maybeUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toPercent(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—%";
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

function formatNumber(value: number | undefined | null): string {
  const num = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US").format(num);
}

export type ClientEventListEvtProps = {
  events: DbEvent[];
  hrefBase?: string;
};

export default function ClientEventListEvt({
  events,
  hrefBase = "/evt",
}: ClientEventListEvtProps) {
  const setSelectedTrade = useSetAtom(selectedTradeAtom);
  const router = useRouter();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y">
        {events.map((event, eventIndex) => {
          const thumbnailCandidate = event.image_url;
          const hasAnyThumbnail = Boolean(thumbnailCandidate);
          const hasValidThumbnail = isValidHttpUrl(
            thumbnailCandidate || undefined
          );
          const markets: DbMarket[] = Array.isArray(event.markets)
            ? event.markets.slice(0, 3)
            : [];
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
                      <div className="relative shrink-0 h-10 w-10">
                        {hasAnyThumbnail ? (
                          hasValidThumbnail ? (
                            <Image
                              src={thumbnailCandidate as string}
                              alt={event.name || ""}
                              width={44}
                              height={44}
                              className="rounded-md object-cover bg-neutral-200 h-10 w-10"
                            />
                          ) : (
                            <div className="h-full w-full rounded-md bg-muted flex items-center justify-center">
                              <span className="text-[9px] text-red-600">
                                Invalid image URL
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="h-full w-full rounded-md bg-muted" />
                        )}
                      </div>
                      <Link
                        href={`${hrefBase}/${event.id}`}
                        className="min-w-0 group"
                      >
                        <CardTitle className="text-base font-semibold tracking-[-0.2px] leading-5 line-clamp-2 group-hover:underline">
                          {event.name}
                        </CardTitle>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="">
                      {markets.map((mkt, idx) => {
                        const pct = mkt.last_price ?? 0.5;
                        const vol = Number(mkt.traded_volume) || 0;
                        return (
                          <div
                            key={mkt.id}
                            className={`py-1 ${idx === 0 ? "pt-0" : ""}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-col min-w-0 gap-1.5 w-full">
                                <div className="flex items-center gap-3 w-full justify-between">
                                  <span
                                    className="text-sm text-foreground/80 truncate"
                                    title={mkt.name || ""}
                                  >
                                    {mkt.name}
                                  </span>
                                  <span className="text-sm font-semibold tabular-nums">
                                    {toPercent(pct)}
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
                                      eventId: String(event.id),
                                      marketId: String(mkt.id),
                                      outcome: "YES",
                                    });
                                    router.push(`${hrefBase}/${event.id}`);
                                  }}
                                >
                                  Yes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-500"
                                  onClick={() => {
                                    setSelectedTrade({
                                      eventId: String(event.id),
                                      marketId: String(mkt.id),
                                      outcome: "NO",
                                    });
                                    router.push(`${hrefBase}/${event.id}`);
                                  }}
                                >
                                  No
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
                        <span>
                          Traded vol: {formatNumber(event.traded_volume ?? 0)}
                        </span>
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
