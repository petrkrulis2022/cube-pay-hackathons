// Hedera Testnet configuration for AR viewer
export const HederaTestnet = {
  chainId: "0x128", // 296 in hex
  chainName: "Hedera Testnet",
  nativeCurrency: {
    name: "HBAR",
    symbol: "HBAR",
    decimals: 18, // Hedera uses 18 decimals like Ethereum
  },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

export const HederaTestnetConfig = {
  name: "Hedera Testnet",
  chainId: 296,
  rpc: "https://testnet.hashio.io/api",
  explorer: "https://hashscan.io/testnet",
  currency: {
    name: "HBAR",
    symbol: "HBAR",
    decimals: 18,
  },
};

export const HEDERA_PAYMENT_CONFIG = {
  interactionFee: 1, // 1 HBAR per agent interaction
  gasLimit: 21000,
  paymentType: "native", // Native HBAR payments
};
