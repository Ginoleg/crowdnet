"use client";

import Image from "next/image";
import type { PolymarketEvent } from "@/types/events";

export type EventInfoProps = {
  event: PolymarketEvent;
};

function formatUsd(value: number | undefined | null): string {
  const num = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDateTime(input?: string): string {
  if (!input) return "TBD";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString();
}

export default function EventInfo({ event }: EventInfoProps) {
  const thumbnail = event.image || event.featuredImage || event.icon;
  return (
    <div className="p-0">
      <div className="px-0 pb-4">
        <div className="flex items-start gap-3">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={event.title}
              width={64}
              height={64}
              className="rounded-md object-cover bg-neutral-200 shrink-0 h-16 w-16"
            />
          ) : (
            <div className="w-16 h-16 rounded-md bg-muted" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-6 tracking-[-0.2px]">
              {event.title}
            </h1>
            {/* {event.subtitle ? (
              <p className="text-sm text-muted-foreground mt-1">
                {event.subtitle}
              </p>
            ) : null} */}
          </div>
        </div>
      </div>
      <div className="px-0">
        {event.description ? (
          <p className="text-sm leading-6 whitespace-pre-line">
            {event.description}
          </p>
        ) : null}
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
          <span>Market cap: {formatUsd(event.openInterest ?? 0)}</span>
          <span>•</span>
          <span>
            Resolution: {formatDateTime(event.endDate || event.closedTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
