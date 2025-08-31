"use client";

import { useMemo, useState, useEffect } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { parseEther, decodeEventLog, formatEther } from "viem";
import type { DbMarket } from "@/types/events";
import type { BinaryOutcome } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BinaryPredictionMarketABI from "@/abis/BinaryPredictionMarket.json";
import { wagmiConfig } from "@/lib/wagmi";

async function patchMarketStats(
  marketId: number,
  lastPrice: number,
  tradedDelta: number
) {
  // try cookie session first; Authorization header optional for SSR APIs
  const res = await fetch(`/api/markets/${marketId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ last_price: lastPrice, traded_delta: tradedDelta }),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to update market (${res.status})`);
  }
}

function defaultOutcomeNames(): string[] {
  return ["Yes", "No"];
}

function toPercent(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—%";
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

export type TradePanelProps = {
  market: DbMarket | null;
  selectedOutcome: BinaryOutcome | null;
  onSelectOutcome?: (outcome: BinaryOutcome) => void;
};

export default function TradePanel({
  market,
  selectedOutcome,
  onSelectOutcome,
}: TradePanelProps) {
  const names = defaultOutcomeNames();
  const [amount, setAmount] = useState<string>("");
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  // Read the current YES price from the contract
  const { data: contractYesPrice, refetch: refetchYesPrice } = useReadContract({
    address: market?.hex_address as `0x${string}`,
    abi: BinaryPredictionMarketABI.abi,
    functionName: "getYesPrice",
    query: {
      enabled: !!market?.hex_address,
      staleTime: 0,
    },
  });

  const price = useMemo(() => {
    if (!market || !selectedOutcome) return null;

    // Use contract price if available, otherwise fallback to last_price
    let yesPrice: number;
    if (contractYesPrice) {
      // Convert from wei (1e18) to decimal (0-1)
      yesPrice = Number(contractYesPrice) / 1e18;
    } else {
      // Fallback to last_price from database
      yesPrice =
        typeof market.last_price === "number" ? market.last_price : 0.5;
    }

    if (selectedOutcome === "YES") return yesPrice;
    if (selectedOutcome === "NO") return 1 - yesPrice;
    return null;
  }, [market, selectedOutcome, contractYesPrice]);

  const parseTransactionLogs = (
    receipt: any,
    selectedOutcome: BinaryOutcome
  ) => {
    const logs = receipt.logs;
    let totalCollateral = BigInt(0);

    logs.forEach((log: any) => {
      try {
        const decodedLog = decodeEventLog({
          abi: BinaryPredictionMarketABI.abi,
          data: log.data,
          topics: log.topics,
        });

        if (decodedLog.eventName === "BuyYes") {
          const { collateralIn, yesMinted, yesFromSwap, newX, newY, newVault } =
            decodedLog.args as any;
          const totalTokens = BigInt(yesMinted) + BigInt(yesFromSwap);
          totalCollateral += BigInt(collateralIn);
          toast.success(`YES Trade Successful!`, {
            description: `Paid: ${formatEther(
              collateralIn
            )} ETH\nReceived: ${formatEther(
              totalTokens
            )} YES tokens\nNew Pool: ${formatEther(newX)} YES / ${formatEther(
              newY
            )} NO\nVault: ${formatEther(newVault)} ETH`,
          });
        } else if (decodedLog.eventName === "BuyNo") {
          const { collateralIn, noMinted, noFromSwap, newX, newY, newVault } =
            decodedLog.args as any;
          const totalTokens = BigInt(noMinted) + BigInt(noFromSwap);
          totalCollateral += BigInt(collateralIn);
          toast.success(`NO Trade Successful!`, {
            description: `Paid: ${formatEther(
              collateralIn
            )} ETH\nReceived: ${formatEther(
              totalTokens
            )} NO tokens\nNew Pool: ${formatEther(newX)} YES / ${formatEther(
              newY
            )} NO\nVault: ${formatEther(newVault)} ETH`,
          });
        }
      } catch (error) {
        console.error("Error decoding log:", error);
      }
    });

    return Number(formatEther(totalCollateral));
  };

  const handleTrade = async () => {
    if (!selectedOutcome || !amount || !market?.hex_address) return;

    setIsTrading(true);
    setConfirmation(null);

    try {
      // Convert USD amount to wei (assuming 1 USD = 1 ETH for simplicity)
      const value = parseEther(amount);

      // Step 1: Submit transaction
      toast.loading("Submitting transaction...", {
        description: "Please confirm the transaction in your wallet",
      });

      const hash = await writeContractAsync({
        address: market.hex_address as `0x${string}`,
        abi: BinaryPredictionMarketABI.abi,
        functionName: selectedOutcome === "YES" ? "buyYes" : "buyNo",
        value,
      });

      // Step 2: Show transaction submitted
      toast.loading("Transaction submitted...", {
        description: `Waiting for confirmation: ${hash.slice(
          0,
          10
        )}...${hash.slice(-8)}`,
      });

      // Step 3: Wait for confirmation
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

      // Step 4: Parse events and show success
      const tradedDelta = parseTransactionLogs(receipt, selectedOutcome);

      // Fallback to input amount if logs didn't yield a value
      const tradedDeltaFinal = Number.isFinite(tradedDelta)
        ? tradedDelta
        : Number(amount);

      // Determine new last price from refreshed on-chain yes price
      // Prefer refetching right away for accuracy
      const refetched = await refetchYesPrice();
      let yesPriceAfter: number | null = null;
      const yesRaw = refetched?.data ?? contractYesPrice;
      if (yesRaw) {
        yesPriceAfter = Number(yesRaw) / 1e18;
      }
      const lastPrice =
        typeof yesPriceAfter === "number" && Number.isFinite(yesPriceAfter)
          ? yesPriceAfter
          : price ?? null;

      if (market?.id && lastPrice !== null) {
        // Fire-and-forget; don't block UX on DB update
        patchMarketStats(market.id, lastPrice, tradedDeltaFinal).catch(
          () => {}
        );
      }

      // Clear the amount after successful trade
      setAmount("");

      toast.success("Transaction confirmed!", {
        description: `Transaction hash: ${hash.slice(0, 10)}...${hash.slice(
          -8
        )}`,
      });

      // Inline confirmation text for the user
      setConfirmation("Trade confirmed. Price updated.");

      // Immediately refresh the on-chain price
      await refetchYesPrice();

      // Notify other components to refresh their price for this market
      try {
        if (market?.hex_address) {
          window.dispatchEvent(
            new CustomEvent("market:price-update", {
              detail: { address: market.hex_address },
            })
          );
        }
      } catch {}
    } catch (error: any) {
      console.error("Transaction failed:", error);
      toast.error("Transaction Failed", {
        description:
          error?.message ||
          "An error occurred while processing the transaction",
      });
    } finally {
      setIsTrading(false);
    }
  };

  useEffect(() => {
    // Clear confirmation on selection or market change
    setConfirmation(null);
  }, [selectedOutcome, market?.id]);

  if (!market) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a market to trade.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium leading-5">{market.name}</div>
      <div className="flex items-center gap-2 w-1/2">
        <Button
          size="sm"
          variant={selectedOutcome === "YES" ? "default" : "ghost"}
          onClick={() => onSelectOutcome?.("YES")}
          className={`w-full h-9 shadow-none flex-shrink ${
            selectedOutcome === "YES"
              ? "bg-emerald-500 hover:bg-emerald-500"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 grayscale-50"
          }`}
        >
          {names[0]}
        </Button>
        <Button
          size="sm"
          variant={selectedOutcome === "NO" ? "default" : "ghost"}
          onClick={() => onSelectOutcome?.("NO")}
          className={`w-full h-9 shadow-none flex-shrink ${
            selectedOutcome === "NO"
              ? "bg-rose-500 hover:bg-rose-500"
              : "bg-rose-100 text-rose-700 hover:bg-rose-200 hover:text-rose-800 grayscale-50"
          }`}
        >
          {names[1]}
        </Button>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Input
          placeholder="Amount (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full"
        />
        <Button
          className="w-full"
          size="sm"
          disabled={
            !selectedOutcome || !amount || isTrading || !market?.hex_address
          }
          onClick={handleTrade}
        >
          {isTrading ? "Processing..." : `Trade ${selectedOutcome || ""}`}
        </Button>
      </div>
      {confirmation ? (
        <div className="text-xs text-green-600">{confirmation}</div>
      ) : null}
      {price !== null ? (
        <div className="text-xs text-muted-foreground">
          Estimated price: {toPercent(price)}
        </div>
      ) : null}
    </div>
  );
}
