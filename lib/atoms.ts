import { atom } from "jotai";
import type { BinaryOutcome } from "@/types/events";

export type SelectedTrade = {
  eventId: string;
  marketId?: string;
  outcome?: BinaryOutcome;
};

export const selectedTradeAtom = atom<SelectedTrade | null>(null); 