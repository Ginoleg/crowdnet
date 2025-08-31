"use client";

import Image from "next/image";
import type { DbEvent, DbMarket } from "@/types/events";

export type EventInfoProps = {
  event: DbEvent;
  markets?: DbMarket[];
};

function formatNumber(value: number | undefined | null): string {
  const num = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US").format(num);
}

function formatDateTime(input?: string | null): string {
  if (!input) return "TBD";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString();
}

function isValidHttpUrl(maybeUrl?: string | null): boolean {
  if (!maybeUrl) return false;
  try {
    const url = new URL(maybeUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function EventInfo({ event, markets = [] }: EventInfoProps) {
  const thumbnailCandidate = event.image_url;
  const hasValidThumbnail = isValidHttpUrl(thumbnailCandidate);
  const hasAnyThumbnail = Boolean(thumbnailCandidate);
  const earliestOpenUntil = markets
    .map((m) => m.open_until)
    .filter(Boolean)
    .sort((a, b) => (a! < b! ? -1 : a! > b! ? 1 : 0))[0];
  const tradedVolume =
    typeof event.traded_volume === "number"
      ? event.traded_volume
      : markets.reduce((sum, m) => sum + (Number(m.traded_volume) || 0), 0);

  return (
    <div className="p-0">
      <div className="px-0 pb-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0 h-16 w-16">
            {hasAnyThumbnail ? (
              hasValidThumbnail ? (
                <Image
                  src={thumbnailCandidate as string}
                  alt={event.name || ""}
                  width={64}
                  height={64}
                  className="rounded-md object-cover bg-neutral-200 h-16 w-16"
                />
              ) : (
                <div className="h-full w-full rounded-md bg-muted flex items-center justify-center">
                  <span className="text-[10px] text-red-600">
                    Invalid image URL
                  </span>
                </div>
              )
            ) : (
              <div className="h-full w-full rounded-md bg-muted" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-9">{event.name}</h1>
            <div className="px-0">
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                <span>Traded vol: {formatNumber(tradedVolume)}</span>
                <span>•</span>
                <span>Resolution: {formatDateTime(earliestOpenUntil)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
