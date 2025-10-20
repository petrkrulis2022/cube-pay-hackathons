// EVM Testnet Configurations with USDC Support
// All payments processed in USDC for simplicity

export const EVM_TESTNETS = {
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    symbol: "USDC",
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "SepoliaETH",
      decimals: 18,
    },
    blockExplorer: "https://sepolia.etherscan.io",
    color: "#627EEA",
    isDefault: true,
  },
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    rpcUrl: "https://api.zan.top/node/v1/arb/sepolia/public",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    decimals: 6,
    symbol: "USDC",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorer: "https://sepolia-explorer.arbitrum.io",
    color: "#28A0F0",
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "Base",
    rpcUrl: "https://sepolia.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    symbol: "USDC",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorer: "https://sepolia-explorer.base.org",
    color: "#0052FF",
  },
  OP_SEPOLIA: {
    chainId: 11155420,
    name: "OP Sepolia",
    shortName: "Optimism",
    rpcUrl: "https://sepolia.optimism.io",
    usdcAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    decimals: 6,
    symbol: "USDC",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    color: "#FF0420",
  },
  AVALANCHE_FUJI: {
    chainId: 43113,
    name: "Avalanche Fuji",
    shortName: "Avalanche",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    decimals: 6,
    symbol: "USDC",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
    blockExplorer: "https://testnet.snowtrace.io",
    color: "#E84142",
  },
};

// Get supported chain by chainId
export const getSupportedChain = (chainId) => {
  return Object.values(EVM_TESTNETS).find((chain) => chain.chainId === chainId);
};

// Get default chain (Ethereum Sepolia)
export const getDefaultChain = () => {
  return EVM_TESTNETS.ETHEREUM_SEPOLIA;
};

// Get all supported chain IDs
export const getSupportedChainIds = () => {
  return Object.values(EVM_TESTNETS).map((chain) => chain.chainId);
};

// Chain switching utilities
export const switchToChain = async (targetChain) => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${targetChain.chainId.toString(16)}` }],
    });
    console.log(`✅ Switched to ${targetChain.name}`);
    return true;
  } catch (switchError) {
    // Chain not added to wallet, add it
    if (switchError.code === 4902) {
      return await addChainToWallet(targetChain);
    }
    throw switchError;
  }
};

export const addChainToWallet = async (chain) => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${chain.chainId.toString(16)}`,
          chainName: chain.name,
          rpcUrls: [chain.rpcUrl],
          nativeCurrency: chain.nativeCurrency,
          blockExplorerUrls: [chain.blockExplorer],
        },
      ],
    });
    console.log(`✅ Added ${chain.name} to wallet`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add ${chain.name}:`, error);
    throw error;
  }
};

// Detect user's current chain
export const detectUserChain = async () => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error("Failed to detect chain:", error);
    return null;
  }
};

// Select optimal chain for payment
export const selectOptimalChain = async (userChainId) => {
  // Check if user's chain is supported
  if (userChainId) {
    const supportedChain = getSupportedChain(userChainId);
    if (supportedChain) {
      console.log(`✅ Using user's current chain: ${supportedChain.name}`);
      return supportedChain;
    }
  }

  // Fallback to default chain
  console.log("🔄 Falling back to default chain: Ethereum Sepolia");
  return getDefaultChain();
};

export default EVM_TESTNETS;
