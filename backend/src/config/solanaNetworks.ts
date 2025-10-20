import { clusterApiUrl, Connection } from "@solana/web3.js";

export interface SolanaNetwork {
  name: string;
  rpc: string;
  explorerUrl: string;
  cluster: "devnet" | "testnet" | "mainnet-beta";
}

export const SOLANA_NETWORKS: Record<string, SolanaNetwork> = {
  TESTNET: {
    name: "Solana Testnet",
    rpc: clusterApiUrl("testnet"),
    explorerUrl: "https://explorer.solana.com/?cluster=testnet",
    cluster: "testnet",
  },
  DEVNET: {
    name: "Solana Devnet",
    rpc: clusterApiUrl("devnet"),
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
    cluster: "devnet",
  },
  MAINNET: {
    name: "Solana Mainnet",
    rpc: clusterApiUrl("mainnet-beta"),
    explorerUrl: "https://explorer.solana.com/",
    cluster: "mainnet-beta",
  },
};

export const USDC_DEVNET_CONFIG = {
  mintAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  symbol: "USDC",
  decimals: 6,
  name: "USD Coin (Devnet)",
};

export const createConnection = (network: string): Connection => {
  const networkConfig = SOLANA_NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }
  return new Connection(networkConfig.rpc, "confirmed");
};

export const DEFAULT_NETWORK = "DEVNET";
