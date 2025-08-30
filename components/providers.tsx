// app/providers.tsx
"use client";

import { type ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { getAccount } from "@wagmi/core";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  const [status, setStatus] = useState<AuthenticationStatus>("unauthenticated");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/username").then((r) =>
      setStatus(r.ok ? "authenticated" : "unauthenticated")
    );
  }, []);

  const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      console.log("getNonce");
      const { address } = getAccount(wagmiConfig);
      if (!address) throw new Error("No wallet connected");
      const res = await fetch(`/api/nonce?address=${address}`);
      console.log("getNonce", { res });
      return await res.text();
    },
    createMessage: ({ nonce, address, chainId }) => {
      try {
        const cid =
          typeof chainId === "bigint" ? Number(chainId) : Number(chainId);
        if (!address) throw new Error("No address");
        if (!Number.isFinite(cid))
          throw new Error(
            `Bad chainId: ${String(chainId)} (${typeof chainId})`
          );

        console.log("createMessage in", {
          domain: window.location.host,
          address,
          statement: "Sign in",
          uri: window.location.origin,
          version: "1",
          chainId: cid,
          nonce,
        });

        const msg = new SiweMessage({
          domain: window.location.host,
          address,
          statement: "Sign in",
          uri: window.location.origin,
          version: "1",
          chainId: cid,
          nonce,
        }).prepareMessage(); // returns string

        console.log("createMessage out (len)", msg.length);
        return msg;
      } catch (e) {
        console.error("createMessage error →", e);
        // Quick escape hatch so you can sign *something* and see the flow
        return `Sign-in test\nAddress: ${address}\nNonce: ${nonce}\nChain: ${String(
          chainId
        )}`;
      }
    },
    verify: async ({ message, signature }) => {
      console.log("verify", { message, signature });
      const verifyRes = await fetch("/api/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });

      const ok = Boolean(verifyRes.ok);
      if (ok) {
        setStatus("authenticated");
        router.refresh();
      }
      return ok;
    },
    signOut: async () => {
      await fetch("/api/logout", { method: "POST" });
      setStatus("unauthenticated");
      router.refresh();
    },
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <RainbowKitAuthenticationProvider
          adapter={authenticationAdapter}
          status={status}
        >
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: "#111111",
              accentColorForeground: "#ffffff",
              borderRadius: "medium",
              fontStack: "system",
            })}
          >
            {children}
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default Providers;
