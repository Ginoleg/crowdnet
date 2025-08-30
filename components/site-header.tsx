"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
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

function XLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 inline -mt-[1px]"
    >
      <g>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
      </g>
    </svg>
  );
}

export function SiteHeader() {
  const [condensed, setCondensed] = useState(false);
  const expandedRef = useRef<HTMLDivElement | null>(null);
  const condensedRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isTransitioningRef = useRef(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const CONDENSE_THRESHOLD = 28; // px
    const EXPAND_THRESHOLD = 8; // px
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      const directionDown = y > lastScrollYRef.current;
      lastScrollYRef.current = y;

      if (isTransitioningRef.current) return;

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setCondensed((prev) => {
            if (!prev && directionDown && y > CONDENSE_THRESHOLD) return true;
            if (prev && !directionDown && y < EXPAND_THRESHOLD) return false;
            return prev;
          });
          ticking = false;
        });
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const expandedHeight = expandedRef.current?.offsetHeight ?? 0;
      const condensedHeight = condensedRef.current?.offsetHeight ?? 0;
      setContainerHeight(condensed ? condensedHeight : expandedHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [condensed]);

  useEffect(() => {
    // lock during height transition and clear on transition end
    const el = containerRef.current;
    if (!el) return;

    // only lock if height would actually change
    const expandedHeight = expandedRef.current?.offsetHeight ?? 0;
    const condensedHeight = condensedRef.current?.offsetHeight ?? 0;
    const nextHeight = condensed ? condensedHeight : expandedHeight;
    const currentHeight = el.getBoundingClientRect().height;
    if (Math.abs(nextHeight - currentHeight) > 0.5) {
      isTransitioningRef.current = true;
    }

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === "height") {
        isTransitioningRef.current = false;
        window.dispatchEvent(new Event("scroll"));
      }
    };
    el.addEventListener("transitionend", onEnd as any);
    return () => el.removeEventListener("transitionend", onEnd as any);
  }, [condensed]);

  return (
    <nav className="w-full sticky top-0 z-50 border-black/[6%] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: containerHeight, transition: "height 300ms ease-out" }}
      >
        {/* Expanded two-row header */}
        <div
          ref={expandedRef}
          className={
            "absolute left-0 right-0 top-0 transition-all" +
            (condensed
              ? " pointer-events-none opacity-0 -translate-y-3 duration-100 ease-out"
              : " opacity-100 translate-y-0 duration-500 ease-out")
          }
        >
          <div className="flex items-center justify-center h-14 px-3">
            <div className="flex items-center justify-between max-w-5xl w-full">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <h1 className="text-xl font-bold tracking-[-1px] -mt-[2px]">
                    Crowdbet
                  </h1>
                </Link>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-foreground/50 hover:text-foreground h-8"
                    >
                      What is it?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-black text-black sm:max-w-md shadow-none">
                    <DialogHeader className="gap-1">
                      <DialogTitle className="text-2xl font-bold tracking-tight">
                        Crowdbet
                      </DialogTitle>
                      <DialogDescription className="text-black items-center">
                        The social prediction market for <XLogo /> users
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <ol className="list-decimal pl-5 space-y-1 text-sm">
                        <li>Connect wallet to create account</li>
                        <li>Verify Twitter account</li>
                        <li>Publish events or trade existing ones</li>
                      </ol>
                      <div className="text-xs text-black/70 space-y-1">
                        <p>The publisher is the oracle.</p>
                        <p>
                          Publisher takes 1% fee on traded volume, so does the
                          platform.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Button className="bg-black text-white h-8 hover:bg-black hover:opacity-80">
                Connect
              </Button>
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

        {/* Condensed single-row header with logo + tabs */}
        <div
          ref={condensedRef}
          className={
            "absolute left-0 right-0 top-0 transition-all" +
            (condensed
              ? " opacity-100 translate-y-0 duration-500 ease-out"
              : " pointer-events-none opacity-0 -translate-y-2 duration-100 ease-out")
          }
        >
          <div className="flex items-center justify-center h-12 px-3 border-t">
            <div className="flex items-center justify-between w-full max-w-5xl gap-6 overflow-x-scroll scrollbar-hide">
              <div className="shrink-0 pb-[1px]">
                <span className="text-lg font-bold tracking-[-1px] mt-3 animate-in">
                  Crowdbet
                </span>
              </div>
              <div className="px-3 shrink-0">
                <div className="flex items-center mx-auto">
                  <SortTabs />
                  <div className="border-l border-black/[9%] mx-5 h-4"></div>
                  <CategoriesTabs />
                </div>
              </div>
              <Button className="bg-black text-white h-8 hover:bg-black hover:opacity-80">
                Connect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
