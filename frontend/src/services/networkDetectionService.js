// Network Detection Service for AR Viewer
// Handles EVM network autodetection and switching

// Supported EVM Networks Configuration
export const SUPPORTED_EVM_NETWORKS = {
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",
    nativeCurrency: "SepoliaETH",
    currency: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    icon: "/icons/ethereum.svg",
    color: "#627EEA",
    isSupported: true,
  },
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    nativeCurrency: "ETH",
    currency: "ETH",
    blockExplorer: "https://sepolia-explorer.arbitrum.io",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    icon: "/icons/arbitrum.svg",
    color: "#28A0F0",
    isSupported: true,
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    nativeCurrency: "ETH",
    currency: "ETH",
    blockExplorer: "https://sepolia-explorer.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    icon: "/icons/base.svg",
    color: "#0052FF",
    isSupported: true,
  },
  OP_SEPOLIA: {
    chainId: 11155420,
    name: "OP Sepolia",
    shortName: "OP Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    nativeCurrency: "ETH",
    currency: "ETH",
    blockExplorer: "https://sepolia-optimistic.etherscan.io",
    usdcAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    icon: "/icons/optimism.svg",
    color: "#FF0420",
    isSupported: true,
  },
  AVALANCHE_FUJI: {
    chainId: 43113,
    name: "Avalanche Fuji",
    shortName: "Fuji",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    nativeCurrency: "AVAX",
    currency: "AVAX",
    blockExplorer: "https://testnet.snowtrace.io",
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    icon: "/icons/avalanche.svg",
    color: "#E84142",
    isSupported: true,
  },
  POLYGON_AMOY: {
    chainId: 80002,
    name: "Polygon Amoy",
    shortName: "Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology/",
    nativeCurrency: "MATIC",
    currency: "MATIC",
    blockExplorer: "https://amoy.polygonscan.com",
    usdcAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    icon: "/icons/polygon.svg",
    color: "#8247E5",
    isSupported: true,
  },
};

// Non-EVM Networks
export const OTHER_NETWORKS = {
  comingSoon: [
    {
      id: "btc_lightning",
      name: "Bitcoin Lightning",
      description: "Lightning Network payments",
      icon: "/icons/bitcoin.svg",
      color: "#F7931A",
      type: "bitcoin",
      isSupported: false,
      connectionStatus: "development",
    },
    {
      id: "xrp_ledger",
      name: "XRP Ledger",
      description: "Fast cross-border payments",
      icon: "/icons/xrp.svg",
      color: "#25A162",
      type: "xrpl",
      isSupported: false,
      connectionStatus: "development",
    },
    {
      id: "tron_network",
      name: "Tron Network",
      description: "High-throughput blockchain",
      icon: "/icons/tron.svg",
      color: "#FF0000",
      type: "tron",
      isSupported: false,
      connectionStatus: "development",
    },
  ],
};

// Network Detection Service Class
class NetworkDetectionService {
  constructor() {
    this.currentNetwork = null;
    this.listeners = [];
    this.isListening = false;
  }

  // Detect current network from MetaMask
  async detectCurrentNetwork() {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    try {
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      const numericChainId = parseInt(chainId, 16);

      // Check if it's a supported EVM network
      const supportedNetwork = Object.values(SUPPORTED_EVM_NETWORKS).find(
        (network) => network.chainId === numericChainId
      );

      if (supportedNetwork) {
        return {
          ...supportedNetwork,
          isSupported: true,
          type: "evm",
        };
      }

      // Unknown network
      return {
        chainId: numericChainId,
        name: `Unknown Network`,
        isSupported: false,
        type: "unknown",
      };
    } catch (error) {
      console.error("Failed to detect network:", error);
      throw error;
    }
  }

  // Switch to a specific network
  async switchToNetwork(chainId) {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    const targetNetwork = Object.values(SUPPORTED_EVM_NETWORKS).find(
      (network) => network.chainId === chainId
    );

    if (!targetNetwork) {
      throw new Error(`Network with chain ID ${chainId} not supported`);
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      // Update current network
      this.currentNetwork = targetNetwork;
      this.notifyListeners(targetNetwork);

      return targetNetwork;
    } catch (switchError) {
      // If network doesn't exist in MetaMask, add it
      if (switchError.code === 4902) {
        await this.addNetworkToWallet(targetNetwork);
        return targetNetwork;
      }
      throw switchError;
    }
  }

  // Add a new network to MetaMask
  async addNetworkToWallet(network) {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${network.chainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: {
              name: network.nativeCurrency,
              symbol: network.currency,
              decimals: 18,
            },
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer],
          },
        ],
      });

      this.currentNetwork = network;
      this.notifyListeners(network);
    } catch (error) {
      console.error("Failed to add network:", error);
      throw error;
    }
  }

  // Check if a network is supported
  isNetworkSupported(chainId) {
    return Object.values(SUPPORTED_EVM_NETWORKS).some(
      (network) => network.chainId === chainId
    );
  }

  // Get network info by chain ID
  getNetworkInfo(chainId) {
    return Object.values(SUPPORTED_EVM_NETWORKS).find(
      (network) => network.chainId === chainId
    );
  }

  // Start listening for network changes
  startNetworkListener(callback) {
    if (!window.ethereum) {
      console.warn("MetaMask not detected, network listening unavailable");
      return () => {};
    }

    const handleChainChanged = async (chainId) => {
      try {
        const numericChainId = parseInt(chainId, 16);
        const networkInfo = await this.detectCurrentNetwork();
        this.currentNetwork = networkInfo;

        // Notify callback if provided
        if (callback) {
          callback(networkInfo);
        }

        // Notify all listeners
        this.notifyListeners(networkInfo);

        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent("networkChanged", {
            detail: { network: networkInfo, chainId: numericChainId },
          })
        );
      } catch (error) {
        console.error("Error handling network change:", error);
      }
    };

    // Add the listener
    window.ethereum.on("chainChanged", handleChainChanged);
    this.isListening = true;

    // Return cleanup function
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
      this.isListening = false;
    };
  }

  // Add a listener for network changes
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(networkInfo) {
    this.listeners.forEach((callback) => {
      try {
        callback(networkInfo);
      } catch (error) {
        console.error("Error in network listener:", error);
      }
    });
  }

  // Get current network
  getCurrentNetwork() {
    return this.currentNetwork;
  }

  // Get all supported EVM networks
  getSupportedEVMNetworks() {
    return Object.values(SUPPORTED_EVM_NETWORKS);
  }

  // Get all other networks
  getOtherNetworks() {
    return OTHER_NETWORKS;
  }
}

// Create and export singleton instance
export const networkDetectionService = new NetworkDetectionService();

// Export default
export default networkDetectionService;
