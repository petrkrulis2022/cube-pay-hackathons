// Hedera Testnet Network Configuration
export const HEDERA_NETWORKS = {
  TESTNET: {
    name: "Hedera Testnet",
    chainId: 296,
    rpc: "https://testnet.hashio.io/api",
    explorerUrl: "https://hashscan.io/testnet",
    nativeCurrency: {
      name: "HBAR",
      symbol: "HBAR",
      decimals: 18,
    },
  },
};

// Default HBAR token configuration for Hedera Testnet
export const HBAR_TESTNET_CONFIG = {
  symbol: "HBAR",
  name: "HBAR",
  decimals: 18,
  isNative: true, // HBAR is the native currency
};

// Helper function to get network configuration
export const getHederaNetworkConfig = (network: string = "TESTNET") => {
  const config = HEDERA_NETWORKS[network as keyof typeof HEDERA_NETWORKS];
  if (!config) {
    throw new Error(`Unknown Hedera network: ${network}`);
  }
  return config;
};

// Helper function to format chain ID for MetaMask
export const getHederaChainIdHex = (network: string = "TESTNET"): string => {
  const config = getHederaNetworkConfig(network);
  return `0x${config.chainId.toString(16)}`;
};

// Helper function to check if user is on correct network
export const isHederaTestnet = (chainId: string | number): boolean => {
  const numericChainId =
    typeof chainId === "string" ? parseInt(chainId, 16) : chainId;
  return numericChainId === 296;
};

export const DEFAULT_HEDERA_NETWORK = "TESTNET";
