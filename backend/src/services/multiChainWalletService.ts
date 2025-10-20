// Multi-Chain Wallet Service for AgentSphere
// Manages wallet connections across different blockchain networks with CCIP support

import {
  NetworkConfig,
  ALL_NETWORKS,
  getNetworkByChainId,
  isCCIPSupported,
  canSendCrossChainTo,
} from "../config/multiChainNetworks";
import {
  solanaNetworkService,
  SolanaNetworkConfig,
} from "./solanaNetworkService";
import {
  crossChainPaymentService,
  CrossChainPaymentRequest,
  PaymentEstimate,
} from "./crossChainPaymentService";
import { paymentTracker } from "./paymentTrackingService";

export interface WalletConnection {
  networkType: "evm" | "solana";
  walletType: string;
  address: string;
  chainId: number | string; // number for EVM, string for Solana
  isConnected: boolean;
  balance?: string;
  usdcBalance?: string; // USDC balance for payment purposes
  lastUpdated: number;
  network?: NetworkConfig | SolanaNetworkConfig;
}

export interface WalletProvider {
  name: string;
  icon: string;
  isInstalled: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  getBalance: (address: string) => Promise<string>;
  switchNetwork: (chainId: number) => Promise<boolean>;
}

export class MultiChainWalletService {
  private connectedWallets: Map<string, WalletConnection> = new Map();
  private supportedWallets: Record<string, string[]> = {
    evm: ["metamask", "coinbase", "walletconnect"],
    solana: ["phantom", "solflare"],
    hedera: ["hashpack", "metamask"],
    xrpl: ["xumm"],
    tron: ["tronlink"],
    starknet: ["argentx", "braavos"],
  };

  constructor() {
    this.initializeWalletDetection();
  }

  private initializeWalletDetection() {
    // Listen for wallet events
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        this.detectAvailableWallets();
      });
    }
  }

  private async detectAvailableWallets(): Promise<
    Record<string, WalletProvider>
  > {
    const wallets: Record<string, WalletProvider> = {};

    // MetaMask detection
    if (typeof window !== "undefined" && window.ethereum?.isMetaMask) {
      wallets.metamask = {
        name: "MetaMask",
        icon: "metamask",
        isInstalled: true,
        connect: () => this.connectMetaMask(),
        disconnect: () => this.disconnectMetaMask(),
        getBalance: (address: string) => this.getEVMBalance(address),
        switchNetwork: (chainId: number) => this.switchEVMNetwork(chainId),
      };
    }

    // Coinbase Wallet detection
    if (typeof window !== "undefined" && window.ethereum?.isCoinbaseWallet) {
      wallets.coinbase = {
        name: "Coinbase Wallet",
        icon: "coinbase",
        isInstalled: true,
        connect: () => this.connectCoinbaseWallet(),
        disconnect: () => this.disconnectCoinbaseWallet(),
        getBalance: (address: string) => this.getEVMBalance(address),
        switchNetwork: (chainId: number) => this.switchEVMNetwork(chainId),
      };
    }

    // Phantom (Solana) detection - Enhanced for Brave browser
    if (typeof window !== "undefined") {
      const windowAny = window as any;

      // Multiple detection methods for better Brave browser compatibility
      const isPhantomAvailable =
        windowAny.solana?.isPhantom ||
        windowAny.phantom?.solana?.isPhantom ||
        solanaNetworkService.isPhantomWalletAvailable();

      if (isPhantomAvailable) {
        wallets.phantom = {
          name: "Phantom",
          icon: "phantom",
          isInstalled: true,
          connect: () => this.connectPhantom(),
          disconnect: () => this.disconnectPhantom(),
          getBalance: (address: string) => this.getSolanaBalance(address),
          switchNetwork: () => Promise.resolve(true),
        };

        console.log(
          "👻 Phantom wallet detected for browser:",
          navigator.userAgent.includes("Brave") ? "Brave" : "Other"
        );
      }
    }

    return wallets;
  }

  // MetaMask Integration
  private async connectMetaMask(): Promise<string> {
    if (!window.ethereum?.isMetaMask) {
      throw new Error("MetaMask not detected");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];
      const chainId = await this.getCurrentChainId();

      const connection: WalletConnection = {
        networkType: "evm",
        walletType: "metamask",
        address,
        chainId,
        isConnected: true,
        lastUpdated: Date.now(),
      };

      this.connectedWallets.set("evm_metamask", connection);

      // Set up event listeners
      this.setupMetaMaskListeners();

      console.log("🦊 MetaMask connected:", address);
      return address;
    } catch (error) {
      console.error("MetaMask connection failed:", error);
      throw error;
    }
  }

  private setupMetaMaskListeners() {
    if (!window.ethereum) return;

    // Account changes
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        this.connectedWallets.delete("evm_metamask");
      } else {
        const connection = this.connectedWallets.get("evm_metamask");
        if (connection) {
          connection.address = accounts[0];
          connection.lastUpdated = Date.now();
        }
      }
    });

    // Chain changes
    window.ethereum.on("chainChanged", (chainId: string) => {
      const connection = this.connectedWallets.get("evm_metamask");
      if (connection) {
        connection.chainId = parseInt(chainId, 16);
        connection.lastUpdated = Date.now();
      }
    });
  }

  private async disconnectMetaMask(): Promise<void> {
    this.connectedWallets.delete("evm_metamask");
    console.log("🦊 MetaMask disconnected");
  }

  // Coinbase Wallet Integration
  private async connectCoinbaseWallet(): Promise<string> {
    if (!window.ethereum?.isCoinbaseWallet) {
      throw new Error("Coinbase Wallet not detected");
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];
      const chainId = await this.getCurrentChainId();

      const connection: WalletConnection = {
        networkType: "evm",
        walletType: "coinbase",
        address,
        chainId,
        isConnected: true,
        lastUpdated: Date.now(),
      };

      this.connectedWallets.set("evm_coinbase", connection);
      console.log("🔵 Coinbase Wallet connected:", address);
      return address;
    } catch (error) {
      console.error("Coinbase Wallet connection failed:", error);
      throw error;
    }
  }

  private async disconnectCoinbaseWallet(): Promise<void> {
    this.connectedWallets.delete("evm_coinbase");
    console.log("🔵 Coinbase Wallet disconnected");
  }

  // Phantom (Solana) Integration - Enhanced for Brave browser
  private async connectPhantom(): Promise<string> {
    // Enhanced Phantom detection for Brave browser compatibility
    const windowAny = window as any;
    const phantomProvider = windowAny.solana?.isPhantom
      ? windowAny.solana
      : windowAny.phantom?.solana?.isPhantom
      ? windowAny.phantom.solana
      : windowAny.solana; // Fallback to any Solana provider

    if (!phantomProvider) {
      throw new Error(
        "Phantom wallet not detected. Please ensure Phantom is installed and enabled in Brave browser."
      );
    }

    try {
      console.log(
        "🎯 Connecting to Phantom in Brave browser with enhanced detection"
      );

      const response = await phantomProvider.connect();
      const address = response.publicKey.toString();

      // PRIORITIZE SOLANA DEVNET - Always attempt to use Devnet for development
      const prioritizedNetwork = "devnet";
      console.log("🎯 Prioritizing Solana Devnet for Phantom connection");

      // Attempt to ensure Phantom is using Devnet
      await this.ensurePhantomDevnetConnection();

      const networkConfig =
        solanaNetworkService.getSolanaNetworkInfo(prioritizedNetwork);

      // Get balances from Devnet
      const solBalance = await solanaNetworkService.getSOLBalance(
        address,
        prioritizedNetwork
      );
      const usdcBalance = await solanaNetworkService.getUSDCBalance(
        address,
        prioritizedNetwork
      );

      const connection: WalletConnection = {
        networkType: "solana",
        walletType: "phantom",
        address,
        chainId: prioritizedNetwork, // Always use devnet as chainId
        isConnected: true,
        balance: solBalance,
        usdcBalance: usdcBalance,
        lastUpdated: Date.now(),
        network: networkConfig || undefined,
      };

      this.connectedWallets.set("solana_phantom", connection);
      console.log(
        "👻 Phantom connected to Solana Devnet (prioritized):",
        address
      );
      console.log("🌐 Network:", networkConfig?.name);
      console.log("💰 SOL Balance:", solBalance, "SOL");
      console.log("💳 USDC Balance:", usdcBalance, "USDC");

      return address;
    } catch (error) {
      console.error("Phantom connection failed in Brave browser:", error);
      throw new Error(
        `Phantom wallet connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please ensure Phantom is properly installed in Brave browser.`
      );
    }
  }

  /**
   * Ensure Phantom wallet is connected to Devnet
   * This method attempts to guide users to switch to Devnet if needed
   */
  private async ensurePhantomDevnetConnection(): Promise<void> {
    try {
      // Note: Phantom wallet doesn't expose direct network switching API
      // However, we can detect and inform users about network preferences

      console.log("🔍 Checking Phantom network configuration...");

      // Try to detect current network by making a test RPC call
      const devnetConnection = solanaNetworkService.getConnection("devnet");

      try {
        // Test Devnet connectivity
        await devnetConnection.getRecentBlockhash();
        console.log("✅ Devnet connection verified");

        // Store devnet preference for this session
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "agentsphere_preferred_solana_network",
            "devnet"
          );
        }
      } catch (devnetError) {
        console.warn("⚠️ Devnet connectivity issue:", devnetError);

        // Fallback: Still proceed but log the preference
        console.log("📝 Devnet preferred but connection issue detected");
      }

      // Display network guidance to user
      this.displaySolanaNetworkGuidance();
    } catch (error) {
      console.warn("Network priority check failed:", error);
      // Continue with connection even if network check fails
    }
  }

  /**
   * Display guidance to users about Solana network selection
   */
  private displaySolanaNetworkGuidance(): void {
    // This could be enhanced to show a modal or notification
    console.log("💡 AgentSphere works best with Solana Devnet");
    console.log("📖 To switch networks in Phantom:");
    console.log("   1. Open Phantom wallet");
    console.log("   2. Click Settings → Change Network");
    console.log("   3. Select 'Devnet' for development");

    // Optional: Emit an event that the UI can listen to for showing guidance
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("agentsphere:solana-network-guidance", {
          detail: {
            preferredNetwork: "devnet",
            message:
              "For the best experience, please ensure Phantom is set to Devnet",
          },
        })
      );
    }
  }

  private async disconnectPhantom(): Promise<void> {
    if (window.solana?.isPhantom) {
      await window.solana.disconnect();
    }
    this.connectedWallets.delete("solana_phantom");
    console.log("👻 Phantom disconnected");
  }

  // Network Management
  public async switchToNetwork(network: NetworkConfig): Promise<boolean> {
    if (network.type === "evm") {
      return await this.switchEVMNetwork(network.chainId);
    }
    // Add support for other network types
    return false;
  }

  private async switchEVMNetwork(chainId: number): Promise<boolean> {
    if (!window.ethereum) {
      return false;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        const network = getNetworkByChainId(chainId);
        if (network) {
          return await this.addEVMNetwork(network);
        }
      }
      return false;
    }
  }

  private async addEVMNetwork(network: NetworkConfig): Promise<boolean> {
    if (!window.ethereum || network.type !== "evm") {
      return false;
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
              symbol: network.symbol,
              decimals: 18,
            },
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer],
          },
        ],
      });
      return true;
    } catch (error) {
      console.error("Failed to add network:", error);
      return false;
    }
  }

  // Balance Management
  private async getEVMBalance(address: string): Promise<string> {
    if (!window.ethereum) {
      throw new Error("No EVM provider available");
    }

    try {
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      // Convert from Wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth.toFixed(4);
    } catch (error) {
      console.error("Failed to get EVM balance:", error);
      return "0.0000";
    }
  }

  private async getSolanaBalance(_address: string): Promise<string> {
    try {
      // Solana balance fetching would require additional setup
      // For now, return placeholder
      return "0.0000";
    } catch (error) {
      console.error("Failed to get Solana balance:", error);
      return "0.0000";
    }
  }

  // Utility Methods
  private async getCurrentChainId(): Promise<number> {
    if (!window.ethereum) {
      return 0;
    }

    try {
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      return parseInt(chainId, 16);
    } catch (error) {
      console.error("Failed to get chain ID:", error);
      return 0;
    }
  }

  public getWalletForNetwork(networkType: string): WalletConnection | null {
    for (const [key, wallet] of this.connectedWallets) {
      if (key.startsWith(networkType)) {
        return wallet;
      }
    }
    return null;
  }

  public getAllConnectedWallets(): Map<string, WalletConnection> {
    return new Map(this.connectedWallets);
  }

  public isWalletConnected(networkType: string, walletType?: string): boolean {
    if (walletType) {
      return this.connectedWallets.has(`${networkType}_${walletType}`);
    }

    for (const key of this.connectedWallets.keys()) {
      if (key.startsWith(networkType)) {
        return true;
      }
    }
    return false;
  }

  public getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};

    for (const networkType of Object.keys(this.supportedWallets)) {
      status[networkType] = this.isWalletConnected(networkType);
    }

    return status;
  }

  // Connect to specific wallet for network
  public async connectWallet(
    networkType: string,
    walletType: string
  ): Promise<string> {
    const key = `${networkType}_${walletType}`;

    try {
      let address: string;

      switch (key) {
        case "evm_metamask":
          address = await this.connectMetaMask();
          break;
        case "evm_coinbase":
          address = await this.connectCoinbaseWallet();
          break;
        case "solana_phantom":
          address = await this.connectPhantom();
          break;
        default:
          throw new Error(`Unsupported wallet: ${key}`);
      }

      return address;
    } catch (error) {
      console.error(`Failed to connect ${walletType} wallet:`, error);
      throw error;
    }
  }

  // Disconnect specific wallet
  public async disconnectWallet(
    networkType: string,
    walletType: string
  ): Promise<void> {
    const key = `${networkType}_${walletType}`;

    switch (key) {
      case "evm_metamask":
        await this.disconnectMetaMask();
        break;
      case "evm_coinbase":
        await this.disconnectCoinbaseWallet();
        break;
      case "solana_phantom":
        await this.disconnectPhantom();
        break;
      default:
        this.connectedWallets.delete(key);
    }
  }

  /**
   * Get connected Solana wallets only
   */
  public getConnectedSolanaWallets(): WalletConnection[] {
    return Array.from(this.connectedWallets.values()).filter(
      (wallet) => wallet.networkType === "solana"
    );
  }

  /**
   * Get connected EVM wallets only
   */
  public getConnectedEVMWallets(): WalletConnection[] {
    return Array.from(this.connectedWallets.values()).filter(
      (wallet) => wallet.networkType === "evm"
    );
  }

  /**
   * Check if any Solana wallet is connected
   */
  public isSolanaWalletConnected(): boolean {
    return this.getConnectedSolanaWallets().length > 0;
  }

  /**
   * Get primary Solana wallet connection
   */
  public getPrimarySolanaWallet(): WalletConnection | null {
    const solanaWallets = this.getConnectedSolanaWallets();
    return solanaWallets.length > 0 ? solanaWallets[0] : null;
  }

  /**
   * Refresh Solana wallet balances
   */
  public async refreshSolanaBalances(): Promise<void> {
    const solanaWallets = this.getConnectedSolanaWallets();

    for (const wallet of solanaWallets) {
      try {
        const network = wallet.chainId as string;
        const solBalance = await solanaNetworkService.getSOLBalance(
          wallet.address,
          network
        );
        const usdcBalance = await solanaNetworkService.getUSDCBalance(
          wallet.address,
          network
        );

        // Update wallet connection
        wallet.balance = solBalance;
        wallet.usdcBalance = usdcBalance;
        wallet.lastUpdated = Date.now();

        console.log(`🔄 Updated ${wallet.walletType} balances:`, {
          sol: solBalance,
          usdc: usdcBalance,
        });
      } catch (error) {
        console.error(
          "Failed to refresh Solana balance for",
          wallet.address,
          error
        );
      }
    }
  }

  // ====== CROSS-CHAIN PAYMENT METHODS ======

  /**
   * Estimate cross-chain payment to an agent
   */
  async estimateAgentPayment(
    agentWalletAddress: string,
    agentNetworkChainId: number | string,
    agentFee: number,
    userWalletType?: string
  ): Promise<
    PaymentEstimate & {
      availableWallets: Array<{
        walletType: string;
        address: string;
        network: NetworkConfig;
        balance: string;
        canAfford: boolean;
      }>;
    }
  > {
    console.log("💰 Estimating agent payment:", {
      agentWalletAddress,
      agentNetworkChainId,
      agentFee,
    });

    // Get connected wallets
    const connectedWallets = Array.from(this.connectedWallets.values());
    const availableWallets = [];

    for (const wallet of connectedWallets) {
      if (wallet.isConnected) {
        const network = getNetworkByChainId(
          typeof wallet.chainId === "string" ? 0 : wallet.chainId
        );
        if (network) {
          const balance = parseFloat(wallet.usdcBalance || "0");

          // Estimate payment for this wallet
          const estimate = await crossChainPaymentService.estimatePayment(
            wallet.chainId,
            agentNetworkChainId,
            agentFee
          );

          availableWallets.push({
            walletType: wallet.walletType,
            address: wallet.address,
            network,
            balance: wallet.usdcBalance || "0",
            canAfford: balance >= estimate.totalUserCost,
          });
        }
      }
    }

    // If user specified a wallet type, use that, otherwise use the first available
    const selectedWallet = userWalletType
      ? availableWallets.find((w) => w.walletType === userWalletType)
      : availableWallets.find((w) => w.canAfford) || availableWallets[0];

    if (!selectedWallet) {
      return {
        canProcess: false,
        agentFee,
        ccipFee: 0,
        totalUserCost: agentFee,
        estimatedTime: "N/A",
        route: {
          source: null as any,
          destination: null as any,
          isDirect: false,
        },
        error: "No connected wallets available",
        availableWallets,
      };
    }

    // Get estimate for selected wallet
    const estimate = await crossChainPaymentService.estimatePayment(
      selectedWallet.network.chainId,
      agentNetworkChainId,
      agentFee
    );

    return {
      ...estimate,
      availableWallets,
    };
  }

  /**
   * Process payment to an agent (same-chain or cross-chain)
   */
  async payAgent(
    agentId: string,
    agentName: string,
    agentWalletAddress: string,
    agentNetworkChainId: number | string,
    agentFee: number,
    fromWalletType?: string
  ): Promise<{
    success: boolean;
    paymentId?: string;
    transactionHash?: string;
    ccipMessageId?: string;
    paymentType: "same_chain" | "cross_chain";
    totalCost?: number;
    error?: string;
  }> {
    try {
      console.log("💳 Processing agent payment:", {
        agentId,
        agentName,
        agentWalletAddress,
        agentNetworkChainId,
        agentFee,
      });

      // Get user's wallet
      const connectedWallets = Array.from(
        this.connectedWallets.values()
      ).filter((w) => w.isConnected);

      const userWallet = fromWalletType
        ? connectedWallets.find((w) => w.walletType === fromWalletType)
        : connectedWallets[0];

      if (!userWallet) {
        return {
          success: false,
          error: "No connected wallet available",
          paymentType: "cross_chain",
        };
      }

      // Get network configurations
      const userNetwork = getNetworkByChainId(
        typeof userWallet.chainId === "string" ? 0 : userWallet.chainId
      );
      const agentNetwork = getNetworkByChainId(
        typeof agentNetworkChainId === "string" ? 0 : agentNetworkChainId
      );

      if (!userNetwork || !agentNetwork) {
        return {
          success: false,
          error: "Invalid network configuration",
          paymentType: "cross_chain",
        };
      }

      // Create payment request
      const paymentRequest: CrossChainPaymentRequest = {
        fromNetwork: userNetwork,
        toNetwork: agentNetwork,
        fromAddress: userWallet.address,
        toAddress: agentWalletAddress,
        amount: agentFee,
        agentId,
        agentName,
        metadata: {
          interactionType: "agent_payment",
          transactionId: `agent_${agentId}_${Date.now()}`,
          timestamp: Date.now(),
        },
      };

      // Process payment
      const result = await crossChainPaymentService.processPayment(
        paymentRequest
      );

      // Track payment if successful
      if (result.success) {
        const paymentId = await paymentTracker.recordPayment({
          agentId,
          agentName,
          amount: agentFee,
          ccipFee: result.estimatedFee || 0,
          totalCost: result.totalCost || agentFee,
          sourceNetwork: userNetwork.name,
          sourceChainId: userNetwork.chainId,
          destinationNetwork: agentNetwork.name,
          destinationChainId: agentNetwork.chainId,
          fromAddress: userWallet.address,
          toAddress: agentWalletAddress,
          paymentType: result.paymentType,
          transactionHash: result.transactionHash,
          ccipMessageId: result.ccipMessageId,
          status:
            result.paymentType === "same_chain" ? "completed" : "ccip_sent",
          interactionType: "agent_payment",
          metadata: paymentRequest.metadata,
        });

        console.log("✅ Agent payment successful:", { paymentId, result });

        return {
          success: true,
          paymentId,
          transactionHash: result.transactionHash,
          ccipMessageId: result.ccipMessageId,
          paymentType: result.paymentType,
          totalCost: result.totalCost,
        };
      } else {
        console.error("❌ Agent payment failed:", result.error);
        return {
          success: false,
          error: result.error,
          paymentType: result.paymentType,
        };
      }
    } catch (error) {
      console.error("❌ Agent payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
        paymentType: "cross_chain",
      };
    }
  }

  /**
   * Get cross-chain payment capabilities for connected wallets
   */
  getCrossChainCapabilities(): Array<{
    wallet: WalletConnection;
    supportedDestinations: NetworkConfig[];
    ccipEnabled: boolean;
  }> {
    return Array.from(this.connectedWallets.values())
      .filter((wallet) => wallet.isConnected)
      .map((wallet) => {
        const network = getNetworkByChainId(
          typeof wallet.chainId === "string" ? 0 : wallet.chainId
        );

        if (!network || !isCCIPSupported(network)) {
          return {
            wallet,
            supportedDestinations: [],
            ccipEnabled: false,
          };
        }

        const supportedDestinations = Object.values(ALL_NETWORKS).filter(
          (targetNetwork) =>
            targetNetwork.chainId !== network.chainId &&
            canSendCrossChainTo(network, targetNetwork.chainId)
        );

        return {
          wallet,
          supportedDestinations,
          ccipEnabled: true,
        };
      });
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(
    userAddress?: string,
    limit: number = 10
  ): Promise<any[]> {
    if (!userAddress) {
      // Get from first connected wallet
      const firstWallet = Array.from(this.connectedWallets.values())[0];
      if (!firstWallet) return [];
      userAddress = firstWallet.address;
    }

    return paymentTracker.getPaymentsByUser(userAddress, limit);
  }
}

// Export singleton instance
export const multiChainWalletService = new MultiChainWalletService();

// Type declarations for window objects
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}

export default MultiChainWalletService;
