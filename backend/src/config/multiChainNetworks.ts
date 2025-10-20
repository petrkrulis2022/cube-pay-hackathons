// Multi-Chain Network Configuration for AgentSphere
// Supports EVM testnets, Solana, and CCIP cross-chain payments

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName?: string; // Add shortName for UI compatibility
  rpcUrl: string;
  nativeCurrency: string;
  symbol: string;
  blockExplorer: string;
  type: "evm" | "solana" | "hedera" | "xrpl" | "tron" | "starknet";
  usdcAddress?: string;
  agentRegistryAddress?: string;
  icon?: string;
  isTestnet: boolean;
  gasPrice?: string;
  status: "active" | "maintenance" | "deprecated";
  isSupported?: boolean; // Add for compatibility
  // CCIP Cross-chain support
  ccipSupported?: boolean;
  ccipChainSelector?: string;
  ccipRouter?: string;
  ccipLanes?: Record<string, string>;
}

// EVM Testnets with CCIP Cross-Chain Support
export const EVM_NETWORKS: Record<string, NetworkConfig> = {
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/",
    nativeCurrency: "SepoliaETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    type: "evm",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    icon: "ethereum",
    isTestnet: true,
    gasPrice: "20000000000", // 20 gwei
    status: "active",
    isSupported: true,
    // CCIP Configuration
    ccipSupported: true,
    ccipChainSelector: "16015286601757825753",
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    ccipLanes: {
      toAvalancheFuji: "0x12492154714fBD28F28219f6fc4315d19de1025B",
      toArbitrumSepolia: "0xBc09627e58989Ba8F1eDA775e486467d2A00944F",
      toBaseSepolia: "0x8F35B097022135E0F46831f798a240Cc8c4b0B01",
      toOPSepolia: "0x54b32C2aCb4451c6cF66bcbd856d8A7Cc2263531",
      toPolygonAmoy: "0x719Aef2C63376AdeCD62D2b59D54682aFBde914a",
      toSolanaDevnet: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
    },
  },
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    rpcUrl: "https://api.zan.top/node/v1/arb/sepolia/public",
    nativeCurrency: "ETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia-explorer.arbitrum.io",
    type: "evm",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    icon: "arbitrum",
    isTestnet: true,
    gasPrice: "100000000", // 0.1 gwei
    status: "active",
    isSupported: true,
    // CCIP Configuration
    ccipSupported: true,
    ccipChainSelector: "3478487238524512106",
    ccipRouter: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
    ccipLanes: {
      toAvalancheFuji: "0x20C8C73eEe88bF2ED2F1e37B67E1D45925b8618",
      toBaseSepolia: "0xF162F1DBF87fb3efea1ec2b1FBA5c75A83f2F065",
      toEthereumSepolia: "0x64d7F7b8F0c90f91E2A5BB1D8a6eF98d8C663210",
      toOPSepolia: "0x0B0c12F9B5b4C3D8Fb1FDf8a5B67a8F2da4eaC58",
      toPolygonAmoy: "0x4127E7FDdB7Bc6F0Ae5b2FB6B5E3c82c7F5C1CD2",
    },
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    nativeCurrency: "ETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia.basescan.org",
    type: "evm",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    icon: "base",
    isTestnet: true,
    gasPrice: "1000000000", // 1 gwei
    status: "active",
    isSupported: true,
    // CCIP Configuration
    ccipSupported: true,
    ccipChainSelector: "10344971235874465080",
    ccipRouter: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
    ccipLanes: {
      toAvalancheFuji: "0x212e8Fd9cCC330ab54E8141FA7d33967eF1eDafF",
      toArbitrumSepolia: "0xb52eF669d3fCeBee1f31418Facc02a16A6F6B0e5",
      toOPSepolia: "0x2945D35F428CE564F5455AD0AF28BDFCa67e76Ab",
      toEthereumSepolia: "0x29A1F4ecE9246F0042A9062FB89803fA8B1830cB",
      toPolygonAmoy: "0x82e28024D67F1e7BaF0b76FCf05e684f3aA11F96",
    },
  },
  OP_SEPOLIA: {
    chainId: 11155420,
    name: "OP Sepolia",
    shortName: "OP Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    nativeCurrency: "ETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    type: "evm",
    usdcAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    icon: "optimism",
    isTestnet: true,
    gasPrice: "1000000000", // 1 gwei
    status: "active",
    isSupported: true,
    // CCIP Configuration
    ccipSupported: true,
    ccipChainSelector: "5224473277236331295",
    ccipRouter: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57",
    ccipLanes: {
      toAvalancheFuji: "0x91a144F570ABA7FB7079Fb187A267390E0cc7367",
      toArbitrumSepolia: "0x6B36c9CD74E760088817a047C3460dEdFfe9a11A",
      toBaseSepolia: "0x6D22953cdEf8B0C9F0976Cfa52c33B198fEc5881",
      toEthereumSepolia: "0x54b32C2aCb4451c6cF66bcbd856d8A7Cc2263531",
      toPolygonAmoy: "0x9E09C2A7D6B9F88c62f0E2Af4cd62dF3F4c326F1",
      toSolanaDevnet: "0x8F5bED5F7601025b12A97b01584220C12e343986",
    },
  },
  AVALANCHE_FUJI: {
    chainId: 43113,
    name: "Avalanche Fuji",
    shortName: "Avax Fuji",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    nativeCurrency: "AVAX",
    symbol: "AVAX",
    blockExplorer: "https://testnet.snowtrace.io",
    type: "evm",
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    icon: "avalanche",
    isTestnet: true,
    gasPrice: "25000000000", // 25 gwei
    status: "active",
    isSupported: true,
    // CCIP Configuration
    ccipSupported: true,
    ccipChainSelector: "14767482510784806043",
    ccipRouter: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
    ccipLanes: {
      toArbitrumSepolia: "0xa9946BA30DAeC98745755e4410d6e8E894Edc53B",
      toBaseSepolia: "0x0aEc1AC9F6D0c21332d7a66dDF1Fbcb32cF3B0B3",
      toOPSepolia: "0x2a9EFdc9F93D9b822129038EFCa4B63Adf3f7FB5",
      toEthereumSepolia: "0x75b9a75Ee1fFef6BE7c4F842a041De7c6153CF4E",
      toPolygonAmoy: "0xA82b9ACAcFA6FaB1FD721e7a748A30E3001351F9",
      toSolanaDevnet: "0xA5D5B0B844c8f11B61F28AC98BBA84dEA9b80953",
    },
  },
  POLYGON_AMOY: {
    chainId: 80002,
    name: "Polygon Amoy",
    shortName: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology/",
    nativeCurrency: "MATIC",
    symbol: "MATIC",
    blockExplorer: "https://amoy.polygonscan.com",
    type: "evm",
    usdcAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    icon: "polygon",
    isTestnet: true,
    gasPrice: "30000000000", // 30 gwei
    status: "active",
    isSupported: true,
    // CCIP Configuration
    ccipSupported: true,
    ccipChainSelector: "16281711391670634445",
    ccipRouter: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
    ccipLanes: {
      toAvalancheFuji: "0xad6A94CFB51e7DE30FD21F417E4cBf70D3AdaD30",
      toArbitrumSepolia: "0x5b4942F603D039650AD0CfF8Bed0C49Fa6827Ed6",
      toBaseSepolia: "0x82e28024D67F1e7BaF0b76FCf05e684f3aA11F96",
      toOPSepolia: "0x600f00aef9b8ED8EDBd7284B5F04a1932c3408aF",
      toEthereumSepolia: "0x719Aef2C63376AdeCD62D2b59D54682aFBde914a",
      toSolanaDevnet: "0xF4EbCC2c077d3939434C7Ab0572660c5A45e4df5",
    },
  },
};

// Non-EVM Networks with CCIP Support
export const NON_EVM_NETWORKS: Record<string, NetworkConfig> = {
  SOLANA_DEVNET: {
    chainId: 0, // Solana doesn't use chainId, but we'll use "devnet" as identifier
    name: "Solana Devnet",
    shortName: "Solana Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    nativeCurrency: "SOL",
    symbol: "SOL",
    blockExplorer: "https://explorer.solana.com/?cluster=devnet",
    type: "solana",
    usdcAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    icon: "solana",
    isTestnet: true,
    status: "active",
    isSupported: true,
    // CCIP Configuration for Solana
    ccipSupported: true,
    ccipChainSelector: "16423721717087811551",
    ccipRouter: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
    ccipLanes: {
      toAvalancheFuji: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toArbitrumSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toBaseSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toOPSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toEthereumSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toPolygonAmoy: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
    },
  },
  HEDERA_TESTNET: {
    chainId: 296,
    name: "Hedera Testnet",
    shortName: "Hedera Testnet",
    rpcUrl: "https://testnet.hashio.io/api",
    nativeCurrency: "HBAR",
    symbol: "HBAR",
    blockExplorer: "https://hashscan.io/testnet",
    type: "hedera",
    icon: "hedera",
    isTestnet: true,
    status: "active",
    isSupported: true,
  },
  XRP_TESTNET: {
    chainId: 0,
    name: "XRP Ledger Testnet",
    shortName: "XRP Testnet",
    rpcUrl: "https://s.altnet.rippletest.net:51234",
    nativeCurrency: "XRP",
    symbol: "XRP",
    blockExplorer: "https://testnet.xrpl.org",
    type: "xrpl",
    icon: "xrp",
    isTestnet: true,
    status: "active",
    isSupported: true,
  },
  TRON_SHASTA: {
    chainId: 0,
    name: "Tron Shasta Testnet",
    shortName: "Tron Shasta",
    rpcUrl: "https://api.shasta.trongrid.io",
    nativeCurrency: "TRX",
    symbol: "TRX",
    blockExplorer: "https://shasta.tronscan.org",
    type: "tron",
    icon: "tron",
    isTestnet: true,
    status: "active",
    isSupported: true,
  },
  STARKNET_SEPOLIA: {
    chainId: 0,
    name: "Starknet Sepolia",
    shortName: "Starknet Sepolia",
    rpcUrl: "https://starknet-sepolia.public.blastapi.io",
    nativeCurrency: "ETH",
    symbol: "ETH",
    blockExplorer: "https://sepolia.starkscan.co",
    type: "starknet",
    icon: "starknet",
    isTestnet: true,
    status: "active",
    isSupported: true,
  },
};

// Combined networks for easy access
export const ALL_NETWORKS = { ...EVM_NETWORKS, ...NON_EVM_NETWORKS };

// Helper functions
export const getNetworkByChainId = (chainId: number): NetworkConfig | null => {
  return (
    Object.values(ALL_NETWORKS).find(
      (network) => network.chainId === chainId
    ) || null
  );
};

export const getNetworksByType = (
  type: NetworkConfig["type"]
): NetworkConfig[] => {
  return Object.values(ALL_NETWORKS).filter((network) => network.type === type);
};

export const getActiveNetworks = (): NetworkConfig[] => {
  return Object.values(ALL_NETWORKS).filter(
    (network) => network.status === "active"
  );
};

export const getEVMNetworks = (): NetworkConfig[] => {
  return Object.values(EVM_NETWORKS);
};

export const getNonEVMNetworks = (): NetworkConfig[] => {
  return Object.values(NON_EVM_NETWORKS);
};

// Network status checker
export const checkNetworkStatus = async (
  network: NetworkConfig
): Promise<boolean> => {
  try {
    if (network.type === "evm") {
      const response = await fetch(network.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });
      return response.ok;
    }
    // Add status checks for other network types
    return true;
  } catch (error) {
    console.error(`Network status check failed for ${network.name}:`, error);
    return false;
  }
};

// Network switching helper for MetaMask
export const switchToNetwork = async (
  network: NetworkConfig
): Promise<boolean> => {
  if (
    typeof window === "undefined" ||
    !window.ethereum ||
    network.type !== "evm"
  ) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${network.chainId.toString(16)}` }],
    });
    return true;
  } catch (switchError: any) {
    // If network is not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${network.chainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: {
                name: network.nativeCurrency,
                symbol: network.symbol,
                decimals: 18,
              },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorer],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add network:", addError);
        return false;
      }
    }
    console.error("Failed to switch network:", switchError);
    return false;
  }
};

// Gas fee estimation
export const estimateGasFee = async (
  network: NetworkConfig
): Promise<string> => {
  if (network.type !== "evm") {
    return "N/A";
  }

  try {
    const response = await fetch(network.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_gasPrice",
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    const gasPriceWei = parseInt(data.result, 16);
    const gasPriceGwei = gasPriceWei / 1e9;

    return `${gasPriceGwei.toFixed(2)} Gwei`;
  } catch (error) {
    console.error(`Gas fee estimation failed for ${network.name}:`, error);
    return network.gasPrice
      ? `${parseInt(network.gasPrice) / 1e9} Gwei`
      : "Unknown";
  }
};

// CCIP Cross-Chain Support Functions
export const isCCIPSupported = (network: NetworkConfig): boolean => {
  return network.ccipSupported === true;
};

export const getCCIPSupportedNetworks = (): NetworkConfig[] => {
  return Object.values(ALL_NETWORKS).filter((network) => network.ccipSupported);
};

export const canSendCrossChainTo = (
  sourceNetwork: NetworkConfig,
  targetChainId: number | string
): boolean => {
  if (!sourceNetwork.ccipSupported || !sourceNetwork.ccipLanes) {
    return false;
  }

  const targetNetwork = getNetworkByChainId(
    typeof targetChainId === "string" ? 0 : targetChainId
  );
  if (!targetNetwork) return false;

  // Check if there's a CCIP lane to the target network
  const targetKey = `to${targetNetwork.name.replace(/\s+/g, "")}`;
  return sourceNetwork.ccipLanes.hasOwnProperty(targetKey);
};

export const getCCIPLaneAddress = (
  sourceNetwork: NetworkConfig,
  targetNetwork: NetworkConfig
): string | null => {
  if (!sourceNetwork.ccipLanes) return null;

  const targetKey = `to${targetNetwork.name.replace(/\s+/g, "")}`;
  return sourceNetwork.ccipLanes[targetKey] || null;
};

export const estimateCrossChainFee = async (
  sourceNetwork: NetworkConfig,
  targetNetwork: NetworkConfig,
  amount: number
): Promise<{
  canSend: boolean;
  estimatedFee?: number;
  totalCost?: number;
  error?: string;
}> => {
  if (!canSendCrossChainTo(sourceNetwork, targetNetwork.chainId)) {
    return {
      canSend: false,
      error: `Cross-chain transfer not supported from ${sourceNetwork.name} to ${targetNetwork.name}`,
    };
  }

  // Base CCIP fee estimation (this would integrate with actual CCIP contracts)
  const baseFee = 1.5; // Base cross-chain fee in USD
  const variableFee = amount * 0.001; // 0.1% of amount
  const totalFee = baseFee + variableFee;

  return {
    canSend: true,
    estimatedFee: totalFee,
    totalCost: amount + totalFee,
  };
};

export const getAllCrossChainRoutes = (): Array<{
  source: NetworkConfig;
  target: NetworkConfig;
  laneAddress: string;
}> => {
  const routes: Array<{
    source: NetworkConfig;
    target: NetworkConfig;
    laneAddress: string;
  }> = [];

  const ccipNetworks = getCCIPSupportedNetworks();

  ccipNetworks.forEach((sourceNetwork) => {
    if (sourceNetwork.ccipLanes) {
      Object.entries(sourceNetwork.ccipLanes).forEach(
        ([targetKey, laneAddress]) => {
          const targetNetwork = Object.values(ALL_NETWORKS).find(
            (network) =>
              network.name.replace(/\s+/g, "") === targetKey.replace("to", "")
          );

          if (targetNetwork) {
            routes.push({
              source: sourceNetwork,
              target: targetNetwork,
              laneAddress,
            });
          }
        }
      );
    }
  });

  return routes;
};

export default {
  EVM_NETWORKS,
  NON_EVM_NETWORKS,
  ALL_NETWORKS,
  getNetworkByChainId,
  getNetworksByType,
  getActiveNetworks,
  getEVMNetworks,
  getNonEVMNetworks,
  checkNetworkStatus,
  switchToNetwork,
  estimateGasFee,
  // CCIP Cross-Chain Functions
  isCCIPSupported,
  getCCIPSupportedNetworks,
  canSendCrossChainTo,
  getCCIPLaneAddress,
  estimateCrossChainFee,
  getAllCrossChainRoutes,
};
