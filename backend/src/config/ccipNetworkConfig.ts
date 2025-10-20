/**
 * Chainlink CCIP Cross-Chain Network Configuration for AgentSphere
 * Enables cross-chain payments across EVM and Solana networks
 */

export interface CCIPNetworkConfig {
  chainName: string;
  chainId: string | number;
  chainSelector: string;
  router: string;
  usdc: {
    tokenAddress: string;
    tokenPoolAddress: string;
    decimals: number | null;
  };
  lanes: Record<string, string>; // Cross-chain destination addresses
  rpcUrl: string;
  currencySymbol: string;
  feeTokens: Record<string, string>;
  inboundLanes: Record<
    string,
    {
      capacity?: string;
      usdc_support?: string;
    }
  >;
}

// CCIP Network Configurations based on the provided data
export const CCIP_NETWORKS: Record<string, CCIPNetworkConfig> = {
  EthereumSepolia: {
    chainName: "EthereumSepolia",
    chainId: 11155111,
    chainSelector: "16015286601757825753",
    router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    usdc: {
      tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      tokenPoolAddress: "0x02eef4b366225362180d704C917c50f6c46af9e0",
      decimals: 6,
    },
    lanes: {
      toAvalancheFuji: "0x12492154714fBD28F28219f6fc4315d19de1025B",
      toArbitrumSepolia: "0xBc09627e58989Ba8F1eDA775e486467d2A00944F",
      toBaseSepolia: "0x8F35B097022135E0F46831f798a240Cc8c4b0B01",
      toOPSepolia: "0x54b32C2aCb4451c6cF66bcbd856d8A7Cc2263531",
      toPolygonAmoy: "0x719Aef2C63376AdeCD62D2b59D54682aFBde914a",
      toSolanaDevnet: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
    },
    rpcUrl: "https://sepolia.infura.io/v3/",
    currencySymbol: "SepoliaETH",
    feeTokens: {
      LINK: "0x7798EE047f0355b0fA9765EDd68D1FC64d409bE7",
      WETH: "0x097D90c881289c80362C00000000000000000000",
    },
    inboundLanes: {},
  },
  ArbitrumSepolia: {
    chainName: "ArbitrumSepolia",
    chainId: 421614,
    chainSelector: "3478487238524512106",
    router: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
    usdc: {
      tokenAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      tokenPoolAddress: "0xbfd2b0B21BD22FD9aB482BAAbc815ef4974F769f",
      decimals: 6,
    },
    lanes: {
      toAvalancheFuji: "0x20C8C73eEe88bF2ED2F1e37B67E1D45925b8618",
      toBaseSepolia: "0xF162F1DBF87fb3efea1ec2b1FBA5c75A83f2F065",
      toEthereumSepolia: "0x64d7F7b8F0c90f91E2A5BB1D8a6eF98d8C663210",
      toOPSepolia: "0x0B0c12F9B5b4C3D8Fb1FDf8a5B67a8F2da4eaC58",
      toPolygonAmoy: "0x4127E7FDdB7Bc6F0Ae5b2FB6B5E3c82c7F5C1CD2",
    },
    rpcUrl: "https://api.zan.top/node/v1/arb/sepolia/public",
    currencySymbol: "ETH",
    feeTokens: {
      LINK: "0xb1D4538B4571d411F07960EF2838CE502594E80E",
      WETH: "0xE591bf0A0CF924A0674d7792db046B23CEbF5f34",
      native: "ETH",
    },
    inboundLanes: {
      fromAvalancheFuji: {
        capacity: "100,000 USDC capacity",
      },
      fromBaseSepolia: {
        capacity: "100,000 USDC capacity",
      },
      fromEthereumSepolia: {
        capacity: "100,000 USDC capacity",
      },
      fromOPSepolia: {
        capacity: "100,000 USDC capacity",
      },
      fromSolanaDevnet: {
        capacity: "100,000 capacity",
        usdc_support: "Not available",
      },
    },
  },
  OPSepolia: {
    chainName: "OPSepolia",
    chainId: 11155420,
    chainSelector: "5224473277236331295",
    router: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57",
    usdc: {
      tokenAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      tokenPoolAddress: "0x18591F40d9981C395fb85aB1982441F14657903f",
      decimals: 6,
    },
    lanes: {
      toAvalancheFuji: "0x91a144F570ABA7FB7079Fb187A267390E0cc7367",
      toArbitrumSepolia: "0x6B36c9CD74E760088817a047C3460dEdFfe9a11A",
      toBaseSepolia: "0x6D22953cdEf8B0C9F0976Cfa52c33B198fEc5881",
      toEthereumSepolia: "0x54b32C2aCb4451c6cF66bcbd856d8A7Cc2263531",
      toPolygonAmoy: "0x9E09C2A7D6B9F88c62f0E2Af4cd62dF3F4c326F1",
      toSolanaDevnet: "0x8F5bED5F7601025b12A97b01584220C12e343986",
    },
    rpcUrl: "https://sepolia.optimism.io",
    currencySymbol: "ETH",
    feeTokens: {
      LINK: "0xE4aB69C3a2A4246191b626195248937828822410",
      WETH: "0x4200000000000000000000000000000000000006",
    },
    inboundLanes: {},
  },
  BaseSepolia: {
    chainName: "BaseSepolia",
    chainId: 84532,
    chainSelector: "10344971235874465080",
    router: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
    usdc: {
      tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      tokenPoolAddress: "0x5931822f394baBC2AACF4588E98FC77a9f5aa8C9",
      decimals: 6,
    },
    lanes: {
      toAvalancheFuji: "0x212e8Fd9cCC330ab54E8141FA7d33967eF1eDafF",
      toArbitrumSepolia: "0xb52eF669d3fCeBee1f31418Facc02a16A6F6B0e5",
      toOPSepolia: "0x2945D35F428CE564F5455AD0AF28BDFCa67e76Ab",
      toEthereumSepolia: "0x29A1F4ecE9246F0042A9062FB89803fA8B1830cB",
      toPolygonAmoy: "0x82e28024D67F1e7BaF0b76FCf05e684f3aA11F96",
    },
    rpcUrl: "https://sepolia.base.org",
    currencySymbol: "ETH",
    feeTokens: {
      LINK: "0xE4aB69C3a2A4246191b626195248937828822410",
      WETH: "0x4200000000000000000000000000000000000006",
    },
    inboundLanes: {},
  },
  AvalancheFuji: {
    chainName: "AvalancheFuji",
    chainId: 43113,
    chainSelector: "14767482510784806043",
    router: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
    usdc: {
      tokenAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
      tokenPoolAddress: "0x5931822f394baBC2AACF4588E98FC77a9f5aa8C9",
      decimals: 6,
    },
    lanes: {
      toArbitrumSepolia: "0xa9946BA30DAeC98745755e4410d6e8E894Edc53B",
      toBaseSepolia: "0x0aEc1AC9F6D0c21332d7a66dDF1Fbcb32cF3B0B3",
      toOPSepolia: "0x2a9EFdc9F93D9b822129038EFCa4B63Adf3f7FB5",
      toEthereumSepolia: "0x75b9a75Ee1fFef6BE7c4F842a041De7c6153CF4E",
      toPolygonAmoy: "0xA82b9ACAcFA6FaB1FD721e7a748A30E3001351F9",
      toSolanaDevnet: "0xA5D5B0B844c8f11B61F28AC98BBA84dEA9b80953",
    },
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    currencySymbol: "AVAX",
    feeTokens: {
      LINK: "0x0b9d5D9136855f6FEc3c0993755E846de7846378",
      WAVAX: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
    },
    inboundLanes: {},
  },
  PolygonAmoy: {
    chainName: "PolygonAmoy",
    chainId: 80002,
    chainSelector: "16281711391670634445",
    router: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
    usdc: {
      tokenAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
      tokenPoolAddress: "0x5931822f394baBC2AACF4588E98FC77a9f5aa8C9",
      decimals: 6,
    },
    lanes: {
      toAvalancheFuji: "0xad6A94CFB51e7DE30FD21F417E4cBf70D3AdaD30",
      toArbitrumSepolia: "0x5b4942F603D039650AD0CfF8Bed0C49Fa6827Ed6",
      toBaseSepolia: "0x82e28024D67F1e7BaF0b76FCf05e684f3aA11F96",
      toOPSepolia: "0x600f00aef9b8ED8EDBd7284B5F04a1932c3408aF",
      toEthereumSepolia: "0x719Aef2C63376AdeCD62D2b59D54682aFBde914a",
      toSolanaDevnet: "0xF4EbCC2c077d3939434C7Ab0572660c5A45e4df5",
    },
    rpcUrl: "https://rpc-amoy.polygon.technology/",
    currencySymbol: "MATIC",
    feeTokens: {
      LINK: "0x0Fd9757a4C444933757361736173617361731904",
      WPOL: "0x360a76736173617361736173617361736173Dcf9",
    },
    inboundLanes: {},
  },
  SolanaDevnet: {
    chainName: "SolanaDevnet",
    chainId: "devnet",
    chainSelector: "16423721717087811551",
    router: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
    usdc: {
      tokenAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      tokenPoolAddress: "7hCNZAWQNSq49CCA1KtjLuZbK5cWguRSVVsJcMa3C5zL",
      decimals: 6,
    },
    lanes: {
      toAvalancheFuji: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toArbitrumSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toBaseSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toOPSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toEthereumSepolia: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
      toPolygonAmoy: "Ccip842gzYHhvdDkSyi2YVCoAWPbYJoApMFzSxQroE9C",
    },
    rpcUrl: "https://api.devnet.solana.com",
    currencySymbol: "SOL",
    feeTokens: {},
    inboundLanes: {},
  },
};

// Helper functions for CCIP operations
export const getCCIPNetworkByChainId = (
  chainId: string | number
): CCIPNetworkConfig | null => {
  return (
    Object.values(CCIP_NETWORKS).find(
      (network) => network.chainId.toString() === chainId.toString()
    ) || null
  );
};

export const getCCIPNetworkByName = (
  chainName: string
): CCIPNetworkConfig | null => {
  return CCIP_NETWORKS[chainName] || null;
};

export const getSupportedCrossChainRoutes = (
  sourceChainId: string | number
): Array<{
  destination: CCIPNetworkConfig;
  laneAddress: string;
}> => {
  const sourceNetwork = getCCIPNetworkByChainId(sourceChainId);
  if (!sourceNetwork) return [];

  return Object.entries(sourceNetwork.lanes).map(
    ([destinationKey, laneAddress]) => {
      const destinationName = destinationKey.replace("to", "");
      const destination = getCCIPNetworkByName(destinationName);
      return {
        destination: destination!,
        laneAddress,
      };
    }
  );
};

export const getCCIPFeeEstimate = async (
  amount: number
): Promise<{
  estimatedFee: string;
  feeToken: string;
  totalCost: number;
}> => {
  // This would integrate with actual CCIP fee estimation
  // For now, return estimated values based on typical CCIP fees
  const baseFee = 1.5; // Base cross-chain fee in USD
  const variableFee = amount * 0.001; // 0.1% of amount
  const totalFee = baseFee + variableFee;

  return {
    estimatedFee: totalFee.toFixed(2),
    feeToken: "LINK",
    totalCost: amount + totalFee,
  };
};

export const isCrossChainPaymentSupported = (
  sourceChainId: string | number,
  destinationChainId: string | number
): boolean => {
  const sourceNetwork = getCCIPNetworkByChainId(sourceChainId);
  const destinationNetwork = getCCIPNetworkByChainId(destinationChainId);

  if (!sourceNetwork || !destinationNetwork) return false;

  // Check if there's a lane from source to destination
  const destinationKey = `to${destinationNetwork.chainName}`;
  return sourceNetwork.lanes.hasOwnProperty(destinationKey);
};

export const getAllSupportedNetworks = (): CCIPNetworkConfig[] => {
  return Object.values(CCIP_NETWORKS);
};

// Cross-chain payment route optimization
export const findOptimalCrossChainRoute = (
  sourceChainId: string | number,
  destinationChainId: string | number
): {
  isDirect: boolean;
  route: CCIPNetworkConfig[];
  estimatedFee: string;
} => {
  const sourceNetwork = getCCIPNetworkByChainId(sourceChainId);
  const destinationNetwork = getCCIPNetworkByChainId(destinationChainId);

  if (!sourceNetwork || !destinationNetwork) {
    throw new Error("Unsupported network");
  }

  // Check for direct route
  const destinationKey = `to${destinationNetwork.chainName}`;
  if (sourceNetwork.lanes[destinationKey]) {
    return {
      isDirect: true,
      route: [sourceNetwork, destinationNetwork],
      estimatedFee: "1.5-3.0", // Direct route fee range
    };
  }

  // For now, all routes in the provided config are direct
  // In a real implementation, this would find optimal multi-hop routes
  throw new Error("No route available between specified networks");
};

export default {
  CCIP_NETWORKS,
  getCCIPNetworkByChainId,
  getCCIPNetworkByName,
  getSupportedCrossChainRoutes,
  getCCIPFeeEstimate,
  isCrossChainPaymentSupported,
  getAllSupportedNetworks,
  findOptimalCrossChainRoute,
};
