"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SortTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = (searchParams.get("sort") === "new" ? "new" : "trending") as
    | "trending"
    | "new";

  function onValueChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "trending") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="w-full">
      <Tabs
        value={sort}
        onValueChange={onValueChange}
        className="w-full py-1 max-w-5xl mx-auto"
      >
        <TabsList className="!bg-transparent">
          <TabsTrigger value="trending" className="h-8 !bg-transparent">
            Trending
          </TabsTrigger>
          <TabsTrigger value="new" className="h-8 !bg-transparent">
            New
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
