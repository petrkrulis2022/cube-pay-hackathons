// EVM Networks Configuration - Same as AR Viewer
export const SUPPORTED_EVM_NETWORKS = {
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    rpcUrl: "https://sepolia.infura.io",
    nativeCurrency: "SepoliaETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    icon: "ethereum-icon.svg",
    isSupported: true,
  },
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    rpcUrl: "https://api.zan.top/arb-sepolia",
    nativeCurrency: "ETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia-explorer.arbitrum.io",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    icon: "arbitrum-icon.svg",
    isSupported: true,
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    nativeCurrency: "ETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia.basescan.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    icon: "base-icon.svg",
    isSupported: true,
  },
  OP_SEPOLIA: {
    chainId: 11155420,
    name: "OP Sepolia",
    shortName: "OP Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    nativeCurrency: "ETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    usdcAddress: "0x5fd84259d3c8b37a387c0d8a4c5b0c0d7d3c0D7",
    icon: "optimism-icon.svg",
    isSupported: true,
  },
  AVALANCHE_FUJI: {
    chainId: 43113,
    name: "Avalanche Fuji",
    shortName: "Avax Fuji",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    nativeCurrency: "AVAX",
    symbol: "AVAX",
    blockExplorer: "https://testnet.snowtrace.io",
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    icon: "avalanche-icon.svg",
    isSupported: true,
  },
};

export const getSupportedNetworkByChainId = (chainId) => {
  return Object.values(SUPPORTED_EVM_NETWORKS).find(
    (network) => network.chainId === chainId
  );
};

export const isNetworkSupported = (chainId) => {
  return !!getSupportedNetworkByChainId(chainId);
};
