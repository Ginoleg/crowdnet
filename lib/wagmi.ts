// lib/wagmi.ts
"use client";

import { createConfig, http } from "wagmi";
import { sepolia, flareTestnet, liskSepolia} from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [sepolia, flareTestnet, liskSepolia],
  connectors: [injected()],
  transports: { [sepolia.id]: http(), [flareTestnet.id]: http(), [liskSepolia.id]: http()},
  ssr: true,
});
