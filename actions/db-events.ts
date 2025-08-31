"use server";

import type { PolymarketEvent, PolymarketMarket } from "@/types/events";
import { headers } from "next/headers";

export type DbEvent = {
  id: number;
  created_at: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  markets?: DbMarket[];
};

export type DbMarket = {
  id: number;
  event_id: number;
  name: string | null;
  is_resolved: boolean | null;
  open_until: string | null; // date string
  created_at: string;
};

async function apiUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

// Single source of default values for UI fields not present in DB
const DEFAULT_EVENT_JSON: PolymarketEvent = {
  id: "",
  ticker: "",
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  resolutionSource: "",
  startDate: "",
  creationDate: "",
  endDate: "",
  image: "",
  icon: "",
  active: true,
  closed: false,
  archived: false,
  new: false,
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
  published_at: "",
  createdBy: "",
  updatedBy: "",
  createdAt: "",
  updatedAt: "",
  commentsEnabled: false,
  competitive: 0,
  volume24hr: 0,
  volume1wk: 0,
  volume1mo: 0,
  volume1yr: 0,
  featuredImage: "",
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
  featuredImageOptimized: {
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
  subEvents: [],
  markets: [],
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
};

function expandDbMarket(m: DbMarket): PolymarketMarket {
  const defaultOutcomes = JSON.stringify(["Yes", "No"]);
  const defaultPrices = JSON.stringify([0.5, 0.5]);
  const end = m.open_until ? new Date(m.open_until).toISOString() : "";
  const name = m.name || "";
  return {
    id: String(m.id),
    question: name,
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
    outcomes: defaultOutcomes,
    outcomePrices: defaultPrices,
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
    createdAt: m.created_at,
    updatedAt: m.created_at,
    closedTime: end,
    wideFormat: false,
    new: false,
    mailchimpTag: "",
    featured: false,
    archived: false,
    resolvedBy: "",
    restricted: false,
    marketGroup: 0,
    groupItemTitle: name,
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
    shortOutcomes: defaultOutcomes,
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
  };
}

function expandDbEvent(ev: DbEvent): PolymarketEvent {
  const imageUrl = ev.image_url || "";
  const mappedMarkets: PolymarketMarket[] = (ev.markets || []).map(expandDbMarket);
  return {
    ...DEFAULT_EVENT_JSON,
    id: String(ev.id),
    title: ev.name || "",
    description: ev.description || "",
    image: imageUrl,
    featuredImage: imageUrl,
    icon: imageUrl,
    createdAt: ev.created_at,
    creationDate: ev.created_at,
    markets: mappedMarkets,
  } as PolymarketEvent;
}

export type FetchDbEventsResult = {
  events: PolymarketEvent[];
  error?: string;
};

export async function getDbEvents(): Promise<FetchDbEventsResult> {
  try {
    const res = await fetch(await apiUrl("/api/events"), {
      method: "GET",
      headers: { accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { events: [], error: `Failed to fetch events (${res.status}): ${text || res.statusText}` };
    }
    const data = (await res.json()) as DbEvent[];
    return { events: (data || []).map(expandDbEvent) };
  } catch (err) {
    return { events: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type FetchDbEventResult = {
  event: PolymarketEvent | null;
  error?: string;
};

export async function getDbEventById(id: string): Promise<FetchDbEventResult> {
  try {
    const res = await fetch(await apiUrl(`/api/events/${encodeURIComponent(id)}`), {
      method: "GET",
      headers: { accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (res.status === 404) return { event: null, error: "Event not found" };
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { event: null, error: `Failed to fetch event (${res.status}): ${text || res.statusText}` };
    }
    const data = (await res.json()) as DbEvent;
    return { event: expandDbEvent(data) };
  } catch (err) {
    return { event: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
} 