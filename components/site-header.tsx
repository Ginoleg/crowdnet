"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SortTabs } from "@/components/sort-tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { CategoriesTabs } from "@/components/categories-tabs";
import { WalletConnect } from "@/components/wallet-connect";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SquarePen } from "lucide-react";

function XLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 inline -mt-[2px]"
    >
      <g>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
      </g>
    </svg>
  );
}

export function SiteHeader() {
  const expandedRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [search, setSearch] = useState<string>("");
  const debounceRef = useRef<number | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/username").then((r) => setAuthenticated(r.ok));
  }, []);

  useEffect(() => {
    const q = (searchParams.get("q") || "").toString();
    setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const trimmed = search.trim();
      const isHome = pathname === "/";
      // Avoid redirecting away from non-home routes on initial mount with empty search
      if (!trimmed && !isHome) return;

      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const query = params.toString();
      router.push(query ? `/?${query}` : "/");
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search, pathname, searchParams]);

  return (
    <nav className="w-full sticky top-0 z-50 border-black/[6%] border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div ref={containerRef} className="relative w-full h-[90px]">
        {/* Expanded two-row header */}
        <div
          ref={expandedRef}
          className={
            "absolute left-0 right-0 top-0 transition-all opacity-100 translate-y-0 duration-500 ease-out"
          }
        >
          <div className="flex items-center justify-center h-11 pt-2 px-3">
            <div className="flex items-center justify-between max-w-5xl w-full">
              <div className="flex items-center gap-6 min-w-0 flex-1">
                <Link href="/">
                  <h1 className="text-xl font-bold tracking-[-1px] -mt-[2px]">
                    Crowdbet
                  </h1>
                </Link>
                <div className="hidden sm:block w-64 md:w-80 lg:w-96 relative">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search events"
                    className="h-8 pl-9"
                  />
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
                </div>
              </div>
              <div className="flex items-center shrink-0 gap-2">
                {authenticated ? (
                  <Button
                    variant="ghost"
                    className="h-8 px-3 -mr-4 gap-1"
                    onClick={() => router.push("/event/create")}
                  >
                    <SquarePen className="h-4 w-4" />
                    Create event
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-foreground/50 hover:text-foreground h-8 px-3 -mr-4"
                      >
                        What's Crowdbet?
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      className="bg-transparent backdrop-blur-sm text-black sm:max-w-[640px] shadow-none rounded-[20px] border-none p-0 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-indigo-300/80 via-rose-300/60 to-orange-200/60">
                        <div className="bg-gradient-to-b from-white/10 via-white/50 to-white p-20">
                          <DialogHeader className="gap-3">
                            <DialogTitle className="text-5xl text-center font-bold tracking-tight">
                              Crowdbet
                            </DialogTitle>
                            <DialogDescription className="text-black text-lg items-center text-center">
                              The social prediction market for <XLogo /> users
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-8">
                            <ol className="list-decimal pl-5 space-y-1 text-base pt-8">
                              <li>Connect wallet to create account</li>
                              <li>Verify Twitter account</li>
                              <li>Publish events or trade existing ones</li>
                            </ol>
                            <div className="text-xs text-black/70 space-y-1 pt-6">
                              <p>The publisher is the oracle.</p>
                              <p>
                                Publisher takes 1% fee on traded volume, so does
                                the platform.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <WalletConnect />
              </div>
            </div>
          </div>
          <div className="w-full px-3 overflow-x-scroll scrollbar-hide">
            <div className="flex items-center max-w-5xl mx-auto">
              <SortTabs />
              <div className="border-l border-black/[9%] mx-5 h-4"></div>
              <CategoriesTabs />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
