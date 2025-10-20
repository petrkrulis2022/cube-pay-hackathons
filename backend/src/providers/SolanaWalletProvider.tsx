import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { SOLANA_NETWORKS } from "../config/solanaNetworks";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaWalletProviderProps {
  children: React.ReactNode;
  network?: string;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({
  children,
  network = "DEVNET",
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const solanaNetwork = useMemo(() => {
    switch (network) {
      case "TESTNET":
        return WalletAdapterNetwork.Testnet;
      case "MAINNET":
        return WalletAdapterNetwork.Mainnet;
      case "DEVNET":
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, [network]);

  // Get endpoint from our network configuration
  const endpoint = useMemo(() => {
    const networkConfig = SOLANA_NETWORKS[network];
    return networkConfig ? networkConfig.rpc : clusterApiUrl(solanaNetwork);
  }, [network, solanaNetwork]);

  // Configure supported wallets
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [solanaNetwork]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
