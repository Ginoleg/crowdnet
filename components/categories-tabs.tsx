"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORY_VALUES = [
  "all",
  "politics",
  "sports",
  "crypto",
  "tech",
  "economy",
  "culture",
] as const;

export type CategoryValue = (typeof CATEGORY_VALUES)[number];

export function CategoriesTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = (searchParams.get("category") ?? "all").toLowerCase();
  const value = CATEGORY_VALUES.includes(raw as CategoryValue)
    ? (raw as CategoryValue)
    : ("all" as const);

  function onValueChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("category");
    } else {
      params.set("category", next);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="w-full">
      <Tabs
        value={value}
        onValueChange={onValueChange}
        className="w-full py-1 max-w-5xl mx-auto"
      >
        <TabsList className="!bg-transparent">
          <TabsTrigger value="all" className="h-8 !bg-transparent">
            All
          </TabsTrigger>
          <TabsTrigger value="politics" className="h-8 !bg-transparent">
            Politics
          </TabsTrigger>
          <TabsTrigger value="sports" className="h-8 !bg-transparent">
            Sports
          </TabsTrigger>
          <TabsTrigger value="crypto" className="h-8 !bg-transparent">
            Crypto
          </TabsTrigger>
          <TabsTrigger value="tech" className="h-8 !bg-transparent">
            Tech
          </TabsTrigger>
          <TabsTrigger value="economy" className="h-8 !bg-transparent">
            Economy
          </TabsTrigger>
          <TabsTrigger value="culture" className="h-8 !bg-transparent">
            Culture
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
