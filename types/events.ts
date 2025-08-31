export type BinaryOutcome = "YES" | "NO";

export type DbEvent = {
  id: number;
  created_at: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  markets?: DbMarket[];
  traded_volume?: number;
};

export type DbMarket = {
  id: number;
  event_id: number;
  name: string | null;
  is_resolved: boolean | null;
  open_until: string | null; // date string
  created_at: string;
  last_price: number | null;
  traded_volume: number;
};

