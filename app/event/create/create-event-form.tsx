"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type {
  PolymarketEvent,
  PolymarketMarket,
  BinaryOutcome,
} from "@/types/events";
import EventInfo from "@/app/event/[id]/event-info";
import MarketList from "@/app/event/[id]/market-list";

type DraftMarket = {
  name: string;
  is_resolved: boolean;
  open_until: string; // YYYY-MM-DD
};

export default function CreateEventForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [markets, setMarkets] = useState<DraftMarket[]>([
    { name: "", is_resolved: false, open_until: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function updateMarket(idx: number, patch: Partial<DraftMarket>) {
    setMarkets((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    );
  }

  function addMarket() {
    setMarkets((prev) => [
      ...prev,
      { name: "", is_resolved: false, open_until: "" },
    ]);
  }

  function removeMarket(idx: number) {
    setMarkets((prev) => prev.filter((_, i) => i !== idx));
  }

  // Build a live preview in the same shape as the event page
  const previewMarkets: PolymarketMarket[] = useMemo(() => {
    return markets.map((m, idx) => {
      const end = m.open_until ? new Date(m.open_until).toISOString() : "";
      const defOutcomes = JSON.stringify(["Yes", "No"]);
      const defPrices = JSON.stringify([0.5, 0.5]);
      return {
        id: `new-${idx + 1}`,
        question: m.name || "",
        conditionId: "",
        slug: "",
        twitterCardImage: "",
        resolutionSource: "",
        endDate: end,
        category: "",
        ammType: "",
        liquidity: "0",
        sponsorName: "",
        sponsorImage: "",
        startDate: "",
        xAxisValue: "",
        yAxisValue: "",
        denominationToken: "",
        fee: "",
        image: "",
        icon: "",
        lowerBound: "",
        upperBound: "",
        description: "",
        outcomes: defOutcomes,
        outcomePrices: defPrices,
        volume: "0",
        active: true,
        marketType: "",
        formatType: "",
        lowerBoundDate: "",
        upperBoundDate: "",
        closed: Boolean(m.is_resolved),
        marketMakerAddress: "",
        createdBy: 0,
        updatedBy: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        closedTime: end,
        wideFormat: false,
        new: false,
        mailchimpTag: "",
        featured: false,
        archived: false,
        resolvedBy: "",
        restricted: false,
        marketGroup: 0,
        groupItemTitle: m.name || "",
        groupItemThreshold: "",
        questionID: "",
        umaEndDate: "",
        enableOrderBook: false,
        orderPriceMinTickSize: 0,
        orderMinSize: 0,
        umaResolutionStatus: "",
        curationOrder: 0,
        volumeNum: 0,
        liquidityNum: 0,
        endDateIso: end,
        startDateIso: "",
        umaEndDateIso: "",
        hasReviewedDates: false,
        readyForCron: false,
        commentsEnabled: false,
        volume24hr: 0,
        volume1wk: 0,
        volume1mo: 0,
        volume1yr: 0,
        gameStartTime: "",
        secondsDelay: 0,
        clobTokenIds: "",
        disqusThread: "",
        shortOutcomes: defOutcomes,
        teamAID: "",
        teamBID: "",
        umaBond: "",
        umaReward: "",
        fpmmLive: false,
        volume24hrAmm: 0,
        volume1wkAmm: 0,
        volume1moAmm: 0,
        volume1yrAmm: 0,
        volume24hrClob: 0,
        volume1wkClob: 0,
        volume1moClob: 0,
        volume1yrClob: 0,
        volumeAmm: 0,
        volumeClob: 0,
        liquidityAmm: 0,
        liquidityClob: 0,
        makerBaseFee: 0,
        takerBaseFee: 0,
        customLiveness: 0,
        acceptingOrders: false,
        notificationsEnabled: false,
        score: 0,
        imageOptimized: {
          id: "",
          imageUrlSource: "",
          imageUrlOptimized: "",
          imageSizeKbSource: 0,
          imageSizeKbOptimized: 0,
          imageOptimizedComplete: false,
          imageOptimizedLastUpdated: "",
          relID: 0,
          field: "",
          relname: "",
        },
        iconOptimized: {
          id: "",
          imageUrlSource: "",
          imageUrlOptimized: "",
          imageSizeKbSource: 0,
          imageSizeKbOptimized: 0,
          imageOptimizedComplete: false,
          imageOptimizedLastUpdated: "",
          relID: 0,
          field: "",
          relname: "",
        },
        events: [],
        categories: [],
        tags: [],
        creator: "",
        ready: true,
        funded: false,
        pastSlugs: "",
        readyTimestamp: "",
        fundedTimestamp: "",
        acceptingOrdersTimestamp: "",
        competitive: 0,
        rewardsMinSize: 0,
        rewardsMaxSpread: 0,
        spread: 0,
        automaticallyResolved: false,
        oneDayPriceChange: 0,
        oneHourPriceChange: 0,
        oneWeekPriceChange: 0,
        oneMonthPriceChange: 0,
        oneYearPriceChange: 0,
        lastTradePrice: 0,
        bestBid: 0,
        bestAsk: 0,
        automaticallyActive: false,
        clearBookOnStart: false,
        chartColor: "",
        seriesColor: "",
        showGmpSeries: false,
        showGmpOutcome: false,
        manualActivation: false,
        negRiskOther: false,
        gameId: "",
        groupItemRange: "",
        sportsMarketType: "",
        line: 0,
        umaResolutionStatuses: "",
        pendingDeployment: false,
        deploying: false,
        deployingTimestamp: "",
        scheduledDeploymentTimestamp: "",
        rfqEnabled: false,
        eventStartTime: "",
      } as PolymarketMarket;
    });
  }, [markets]);

  const previewEvent: PolymarketEvent = useMemo(() => {
    const nowIso = new Date().toISOString();
    return {
      id: "new",
      ticker: "",
      slug: "",
      title: name || "Untitled event",
      subtitle: "",
      description: description,
      resolutionSource: "",
      startDate: "",
      creationDate: nowIso,
      endDate: "",
      image: imageUrl,
      icon: imageUrl,
      active: true,
      closed: false,
      archived: false,
      new: true,
      featured: false,
      restricted: false,
      liquidity: 0,
      volume: 0,
      openInterest: 0,
      sortBy: "",
      category: "",
      subcategory: "",
      isTemplate: false,
      templateVariables: false,
      published_at: nowIso,
      createdBy: "",
      updatedBy: "",
      createdAt: nowIso,
      updatedAt: nowIso,
      commentsEnabled: false,
      competitive: 0,
      volume24hr: 0,
      volume1wk: 0,
      volume1mo: 0,
      volume1yr: 0,
      featuredImage: imageUrl,
      disqusThread: "",
      parentEvent: "",
      enableOrderBook: false,
      liquidityAmm: 0,
      liquidityClob: 0,
      negRisk: false,
      negRiskMarketID: "",
      negRiskFeeBips: 0,
      commentCount: 0,
      imageOptimized: {
        id: "",
        imageUrlSource: "",
        imageUrlOptimized: "",
        imageSizeKbSource: 0,
        imageSizeKbOptimized: 0,
        imageOptimizedComplete: false,
        imageOptimizedLastUpdated: nowIso,
        relID: 0,
        field: "",
        relname: "",
      },
      iconOptimized: {
        id: "",
        imageUrlSource: "",
        imageUrlOptimized: "",
        imageSizeKbSource: 0,
        imageSizeKbOptimized: 0,
        imageOptimizedComplete: false,
        imageOptimizedLastUpdated: nowIso,
        relID: 0,
        field: "",
        relname: "",
      },
      featuredImageOptimized: {
        id: "",
        imageUrlSource: "",
        imageUrlOptimized: "",
        imageSizeKbSource: 0,
        imageSizeKbOptimized: 0,
        imageOptimizedComplete: false,
        imageOptimizedLastUpdated: nowIso,
        relID: 0,
        field: "",
        relname: "",
      },
      subEvents: [],
      markets: previewMarkets,
      series: [],
      categories: [],
      collections: [],
      tags: [],
      cyom: false,
      closedTime: "",
      showAllOutcomes: false,
      showMarketImages: false,
      automaticallyResolved: false,
      enableNegRisk: false,
      automaticallyActive: false,
      eventDate: "",
      startTime: "",
      eventWeek: 0,
      seriesSlug: "",
      score: "",
      elapsed: "",
      period: "",
      live: false,
      ended: false,
      finishedTimestamp: "",
      gmpChartMode: "",
      eventCreators: [],
      tweetCount: 0,
      chats: [],
      featuredOrder: 0,
      estimateValue: false,
      cantEstimate: false,
      estimatedValue: "",
      templates: [],
      spreadsMainLine: 0,
      totalsMainLine: 0,
      carouselMap: "",
      pendingDeployment: false,
      deploying: false,
      deployingTimestamp: "",
      scheduledDeploymentTimestamp: "",
      gameStatus: "",
    } as PolymarketEvent;
  }, [name, description, imageUrl, previewMarkets]);

  const [selectedMarketId, setSelectedMarketId] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<BinaryOutcome | null>(
    null
  );

  // Keep selection in sync with first available market
  const firstMarketId = previewMarkets[0]?.id || "";
  if (!selectedMarketId && firstMarketId) {
    setSelectedMarketId(firstMarketId);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          image_url: imageUrl,
          markets,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || `Failed to create event (${res.status})`);
        setSubmitting(false);
        return;
      }
      const created = await res.json();
      router.push(`/event/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-40 lg:pb-0 w-full max-w-5xl">
      <div className="lg:col-span-2 space-y-6 w-full">
        <div className="p-0">
          <EventInfo event={previewEvent} />
        </div>

        <div className="p-0 w-full">
          <div className="px-0 pb-2">
            <h2 className="text-base font-semibold">Outcomes</h2>
          </div>
          <div className="px-0">
            {previewMarkets.length === 0 ? (
              <div className="py-3 text-sm text-muted-foreground">
                No markets available.
              </div>
            ) : (
              <MarketList
                markets={previewMarkets}
                selectedMarketId={selectedMarketId}
                selectedOutcome={selectedOutcome}
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
            {previewEvent.description ? (
              <p className="text-sm leading-6 whitespace-pre-line">
                {previewEvent.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right aside: the form */}
      <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-16 h-fit">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name"
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="image_url"
            >
              Image URL
            </label>
            <Input
              id="image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="description"
            >
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={6}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Markets</h2>
              <Button type="button" variant="secondary" onClick={addMarket}>
                Add
              </Button>
            </div>
            {markets.map((m, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Market #{idx + 1}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMarket(idx)}
                  >
                    Remove
                  </Button>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`mn_${idx}`}>
                    Name
                  </label>
                  <Input
                    id={`mn_${idx}`}
                    value={m.name}
                    onChange={(e) =>
                      updateMarket(idx, { name: e.target.value })
                    }
                    placeholder="Market name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`ou_${idx}`}>
                    Open until (YYYY-MM-DD)
                  </label>
                  <Input
                    id={`ou_${idx}`}
                    type="date"
                    value={m.open_until}
                    onChange={(e) =>
                      updateMarket(idx, { open_until: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Publishing..." : "Publish event"}
            </Button>
          </div>
        </form>
      </aside>

      {/* Mobile form below preview */}
      <div className="lg:hidden">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="m_name">
              Name
            </label>
            <Input
              id="m_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name"
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="m_image_url"
            >
              Image URL
            </label>
            <Input
              id="m_image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="m_description"
            >
              Description
            </label>
            <Textarea
              id="m_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={6}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Markets</h2>
              <Button type="button" variant="secondary" onClick={addMarket}>
                Add
              </Button>
            </div>
            {markets.map((m, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Market #{idx + 1}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMarket(idx)}
                  >
                    Remove
                  </Button>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`mmn_${idx}`}>
                    Name
                  </label>
                  <Input
                    id={`mmn_${idx}`}
                    value={m.name}
                    onChange={(e) =>
                      updateMarket(idx, { name: e.target.value })
                    }
                    placeholder="Market name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor={`mou_${idx}`}>
                    Open until (YYYY-MM-DD)
                  </label>
                  <Input
                    id={`mou_${idx}`}
                    type="date"
                    value={m.open_until}
                    onChange={(e) =>
                      updateMarket(idx, { open_until: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Publishing..." : "Publish event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
