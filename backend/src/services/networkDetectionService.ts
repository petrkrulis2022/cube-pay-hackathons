import {
  EVM_NETWORKS,
  NON_EVM_NETWORKS,
  getNetworkByChainId,
  getActiveNetworks,
} from "../config/multiChainNetworks";
import { solanaNetworkService, SOLANA_NETWORKS } from "./solanaNetworkService";

// Non-EVM Network Detection Types
export interface NonEVMNetworkDetection {
  type: "solana" | "hedera";
  networkId: string;
  name: string;
  walletType: string;
  isConnected: boolean;
  address?: string;
}

export const SUPPORTED_NON_EVM_NETWORKS = {
  SOLANA_DEVNET: {
    name: "Solana Devnet",
    networkId: "solana-devnet",
    type: "solana",
    wallet: "phantom",
    chainId: "devnet",
  },
  SOLANA_TESTNET: {
    name: "Solana Testnet",
    networkId: "solana-testnet",
    type: "solana",
    wallet: "phantom",
    chainId: "testnet",
  },
} as const;

class NetworkDetectionService {
  private currentNetwork: any = null;
  private isListening: boolean = false;
  private listeners: Array<(network: any) => void> = [];
  private ethereumChainListener: ((chainId: string) => void) | null = null;

  constructor() {
    this.currentNetwork = null;
    this.isListening = false;
    this.listeners = [];
  }

  async detectCurrentNetwork() {
    if (!window.ethereum) {
      return null;
    }

    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const numericChainId = parseInt(chainId, 16);

      // Find matching supported network
      const supportedNetwork = getNetworkByChainId(numericChainId);

      this.currentNetwork = supportedNetwork || {
        chainId: numericChainId,
        name: `Unknown Network (${numericChainId})`,
        shortName: "Unknown",
        isSupported: false,
      };

      // Add isSupported flag for compatibility
      if (
        this.currentNetwork &&
        !this.currentNetwork.hasOwnProperty("isSupported")
      ) {
        this.currentNetwork.isSupported = supportedNetwork ? true : false;
      }

      return this.currentNetwork;
    } catch (error) {
      console.error("Failed to detect network:", error);
      return null;
    }
  }

  async startNetworkListener() {
    if (!window.ethereum || this.isListening) return;

    this.isListening = true;

    const handleChainChanged = (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      this.handleNetworkChange(numericChainId);
    };

    window.ethereum.on("chainChanged", handleChainChanged);

    // Store reference for cleanup
    this.ethereumChainListener = handleChainChanged;
  }

  stopNetworkListener() {
    if (window.ethereum && this.ethereumChainListener) {
      window.ethereum.removeListener(
        "chainChanged",
        this.ethereumChainListener
      );
      this.isListening = false;
    }
  }

  handleNetworkChange(chainId: number) {
    const supportedNetwork = getNetworkByChainId(chainId);

    this.currentNetwork = supportedNetwork || {
      chainId: chainId,
      name: `Unknown Network (${chainId})`,
      shortName: "Unknown",
      isSupported: false,
    };

    // Add isSupported flag for compatibility
    if (
      this.currentNetwork &&
      !this.currentNetwork.hasOwnProperty("isSupported")
    ) {
      this.currentNetwork.isSupported = supportedNetwork ? true : false;
    }

    // Emit network change event
    const event = new CustomEvent("networkChanged", {
      detail: { network: this.currentNetwork },
    });
    document.dispatchEvent(event);

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentNetwork);
      } catch (error) {
        console.error("Error in network change listener:", error);
      }
    });
  }

  addNetworkChangeListener(callback: (network: any) => void) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isNetworkSupported(chainId: number) {
    const allNetworks = [
      ...Object.values(EVM_NETWORKS),
      ...Object.values(NON_EVM_NETWORKS),
    ];
    return allNetworks.some((network) => network.chainId === chainId);
  }

  async switchToNetwork(targetNetwork: any) {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Network not added to wallet, add it first
      if (switchError.code === 4902) {
        await this.addNetworkToWallet(targetNetwork);
      } else {
        throw switchError;
      }
    }
  }

  async addNetworkToWallet(network: any) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          nativeCurrency: {
            name: network.nativeCurrency,
            symbol: network.symbol,
            decimals: 18,
          },
          blockExplorerUrls: [network.blockExplorer],
        },
      ],
    });
  }

  getCurrentNetwork() {
    return this.currentNetwork;
  }

  getSupportedNetworks() {
    return getActiveNetworks().filter((network) => network.type === "evm");
  }

  // Solana Network Detection Methods

  /**
   * Detect if Phantom wallet is available and connected
   * PRIORITIZES SOLANA DEVNET for development
   */
  async detectSolanaNetwork(): Promise<NonEVMNetworkDetection | null> {
    try {
      if (!solanaNetworkService.isPhantomWalletAvailable()) {
        return null;
      }

      const phantom = (window as any).solana;

      // ALWAYS PRIORITIZE DEVNET for AgentSphere
      const prioritizedNetwork = "devnet";
      console.log("🎯 Prioritizing Solana Devnet detection");

      if (!phantom.isConnected) {
        return {
          type: "solana",
          networkId: "solana-devnet",
          name: "Solana Devnet (Prioritized)",
          walletType: "phantom",
          isConnected: false,
        };
      }

      // Even if connected, always report Devnet as the preferred network
      const networkConfig = SOLANA_NETWORKS[prioritizedNetwork];

      return {
        type: "solana",
        networkId: `solana-${prioritizedNetwork}`,
        name: networkConfig?.name || "Solana Devnet (Prioritized)",
        walletType: "phantom",
        isConnected: true,
        address: phantom.publicKey?.toString(),
      };
    } catch (error) {
      console.error("Solana network detection failed:", error);
      return null;
    }
  }

  /**
   * Connect to Phantom wallet with Devnet prioritization
   */
  async connectSolanaWallet(): Promise<string | null> {
    try {
      if (!solanaNetworkService.isPhantomWalletAvailable()) {
        throw new Error(
          "Phantom wallet not found. Please install Phantom wallet."
        );
      }

      console.log("🎯 Connecting to Phantom with Devnet prioritization");

      const phantom = (window as any).solana;
      const response = await phantom.connect();

      const address = response.publicKey.toString();

      console.log(
        "🔗 Phantom wallet connected to Devnet (prioritized):",
        address
      );

      // Store devnet preference
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "agentsphere_preferred_solana_network",
          "devnet"
        );

        // Emit guidance event for UI
        window.dispatchEvent(
          new CustomEvent("agentsphere:solana-devnet-priority", {
            detail: {
              address: address,
              network: "devnet",
              message:
                "Connected to Phantom - Devnet prioritized for AgentSphere",
            },
          })
        );
      }

      return address;
    } catch (error) {
      console.error("Failed to connect Phantom wallet:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Phantom wallet
   */
  async disconnectSolanaWallet(): Promise<void> {
    try {
      if (solanaNetworkService.isPhantomWalletAvailable()) {
        const phantom = (window as any).solana;
        await phantom.disconnect();
        console.log("🔌 Phantom wallet disconnected");
      }
    } catch (error) {
      console.error("Failed to disconnect Phantom wallet:", error);
      throw error;
    }
  }

  /**
   * Get all available non-EVM networks
   */
  getSupportedNonEVMNetworks(): Array<{
    name: string;
    type: string;
    networkId: string;
  }> {
    return [
      {
        name: "Solana Devnet",
        type: "solana",
        networkId: "solana-devnet",
      },
      {
        name: "Solana Testnet",
        type: "solana",
        networkId: "solana-testnet",
      },
      // Future: Hedera networks
    ];
  }

  /**
   * Detect all available wallets (both EVM and non-EVM)
   */
  async detectAllWallets(): Promise<{
    evm: any;
    nonEvm: NonEVMNetworkDetection[];
  }> {
    const evmNetwork = await this.detectCurrentNetwork();
    const nonEvmNetworks: NonEVMNetworkDetection[] = [];

    // Detect Solana
    const solanaDetection = await this.detectSolanaNetwork();
    if (solanaDetection) {
      nonEvmNetworks.push(solanaDetection);
    }

    return {
      evm: evmNetwork,
      nonEvm: nonEvmNetworks,
    };
  }
}

export const networkDetectionService = new NetworkDetectionService();
