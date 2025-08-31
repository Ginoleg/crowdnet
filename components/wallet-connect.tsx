"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnect() {
  return (
    <div className="scale-80 origin-right">
      <ConnectButton accountStatus="address" showBalance={false} />
    </div>
  );
}

export default WalletConnect;
