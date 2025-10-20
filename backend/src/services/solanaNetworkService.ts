/**
 * Solana Network Service for AgentSphere
 * Handles Solana Devnet/Testnet configuration and USDC token operations
 */

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export interface SolanaNetworkConfig {
  name: string;
  chainId: string;
  rpcUrl: string;
  explorerUrl: string;
  usdcMint: string;
  symbol: string;
  decimals: number;
  type: "solana";
}

// Solana Network Configurations
export const SOLANA_NETWORKS: Record<string, SolanaNetworkConfig> = {
  devnet: {
    name: "Solana Devnet",
    chainId: "devnet",
    rpcUrl: clusterApiUrl("devnet"),
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
    usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC Devnet mint
    symbol: "SOL",
    decimals: 9,
    type: "solana",
  },
  testnet: {
    name: "Solana Testnet",
    chainId: "testnet",
    rpcUrl: clusterApiUrl("testnet"),
    explorerUrl: "https://explorer.solana.com/?cluster=testnet",
    usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC Testnet mint
    symbol: "SOL",
    decimals: 9,
    type: "solana",
  },
  mainnet: {
    name: "Solana Mainnet",
    chainId: "mainnet-beta",
    rpcUrl: clusterApiUrl("mainnet-beta"),
    explorerUrl: "https://explorer.solana.com",
    usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC Mainnet mint
    symbol: "SOL",
    decimals: 9,
    type: "solana",
  },
};

export class SolanaNetworkService {
  private connections: Map<string, Connection> = new Map();

  /**
   * Get Solana network configuration
   */
  public getSolanaNetworkInfo(network: string): SolanaNetworkConfig | null {
    return SOLANA_NETWORKS[network] || null;
  }

  /**
   * Get USDC mint address for a Solana network
   */
  public getUSDCMintForSolana(network: string): string | null {
    return SOLANA_NETWORKS[network]?.usdcMint || null;
  }

  /**
   * Get USDC mint address for a Solana network (alias for compatibility)
   */
  public getUSDCMint(network: string): string | null {
    return this.getUSDCMintForSolana(network);
  }

  /**
   * Get RPC URL for a Solana network
   */
  public getRpcUrl(network: string): string | null {
    return SOLANA_NETWORKS[network]?.rpcUrl || null;
  }

  /**
   * Get explorer URL for a transaction
   */
  public getExplorerUrl(signature: string, network: string = "devnet"): string {
    const config = this.getSolanaNetworkInfo(network);
    if (!config) return "";

    const clusterParam =
      network === "mainnet-beta" ? "" : `?cluster=${network}`;
    return `${config.explorerUrl}/tx/${signature}${clusterParam}`;
  }

  /**
   * Get Solana connection for a network
   */
  public getConnection(network: string): Connection {
    if (!this.connections.has(network)) {
      const config = this.getSolanaNetworkInfo(network);
      if (!config) {
        throw new Error(`Unknown Solana network: ${network}`);
      }

      const connection = new Connection(config.rpcUrl, "confirmed");
      this.connections.set(network, connection);
    }

    return this.connections.get(network)!;
  }

  /**
   * Get SOL balance for an address
   */
  public async getSOLBalance(
    address: string,
    network: string = "devnet"
  ): Promise<string> {
    try {
      const connection = this.getConnection(network);
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);

      // Convert lamports to SOL
      return (balance / 1e9).toFixed(4);
    } catch (error) {
      console.error("Failed to get SOL balance:", error);
      return "0.0000";
    }
  }

  /**
   * Get USDC token balance for an address
   */
  public async getUSDCBalance(
    address: string,
    network: string = "devnet"
  ): Promise<string> {
    try {
      const connection = this.getConnection(network);
      const publicKey = new PublicKey(address);
      const usdcMint = this.getUSDCMintForSolana(network);

      if (!usdcMint) {
        return "0.00";
      }

      // Get token accounts for the USDC mint
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        publicKey,
        {
          mint: new PublicKey(usdcMint),
        }
      );

      if (tokenAccounts.value.length === 0) {
        return "0.00";
      }

      // Get balance from the first token account
      const accountInfo = await connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      return accountInfo.value.uiAmount?.toString() || "0.00";
    } catch (error) {
      console.error("Failed to get USDC balance:", error);
      return "0.00";
    }
  }

  /**
   * Format Solana address for display (short version)
   */
  public formatSolanaAddress(address: string): string {
    if (!address) return "";
    return `${address.substring(0, 8)}...${address.substring(
      address.length - 8
    )}`;
  }

  /**
   * Validate Solana address
   */
  public isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get explorer URL for a transaction (legacy method)
   */
  public getTransactionExplorerUrl(
    signature: string,
    network: string = "devnet"
  ): string {
    return this.getExplorerUrl(signature, network);
  }

  /**
   * Get all supported Solana networks with devnet prioritization
   */
  public getSupportedNetworks(): SolanaNetworkConfig[] {
    const networks = Object.values(SOLANA_NETWORKS);

    // Sort to prioritize devnet first
    return networks.sort((a, b) => {
      if (a.chainId === "devnet") return -1;
      if (b.chainId === "devnet") return 1;
      return 0;
    });
  }

  /**
   * Check if current network is the recommended devnet
   */
  public isUsingRecommendedNetwork(): boolean {
    const current = this.getPreferredNetwork();
    return current === "devnet";
  }

  /**
   * Get network recommendations for users
   */
  public getNetworkRecommendation(): {
    recommended: SolanaNetworkConfig;
    message: string;
    isUsingRecommended: boolean;
  } {
    const recommended = SOLANA_NETWORKS.devnet;
    const isRecommended = this.isUsingRecommendedNetwork();

    return {
      recommended,
      message: isRecommended
        ? "✅ You're using the recommended Solana Devnet for AgentSphere"
        : "💡 AgentSphere works best with Solana Devnet. Consider switching for optimal experience.",
      isUsingRecommended: isRecommended,
    };
  }

  /**
   * Check if Phantom wallet is available (Enhanced for Brave browser compatibility)
   */
  public isPhantomWalletAvailable(): boolean {
    if (typeof window === "undefined") return false;

    // Enhanced detection for different browsers including Brave
    const windowAny = window as any;

    // Primary check: Standard Phantom detection
    if (windowAny.solana?.isPhantom) {
      console.log("✅ Phantom wallet detected (standard method)");
      return true;
    }

    // Secondary check: Brave browser specific detection
    if (windowAny.phantom?.solana?.isPhantom) {
      console.log("✅ Phantom wallet detected (Brave browser method)");
      return true;
    }

    // Tertiary check: Check for Solana provider with Phantom characteristics
    if (windowAny.solana && windowAny.solana.isConnected !== undefined) {
      // Additional checks to confirm it's Phantom
      const hasPhantomMethods =
        typeof windowAny.solana.connect === "function" &&
        typeof windowAny.solana.disconnect === "function" &&
        typeof windowAny.solana.signTransaction === "function";

      if (hasPhantomMethods) {
        console.log(
          "✅ Phantom wallet detected (method signature verification)"
        );
        return true;
      }
    }

    // Final check: Look for any Solana provider and try to identify if it's Phantom
    if (windowAny.solana) {
      // Check if the provider has the typical Phantom wallet properties
      const solanaProvider = windowAny.solana;
      const isLikelyPhantom =
        solanaProvider.publicKey !== undefined ||
        solanaProvider._publicKey !== undefined ||
        (typeof solanaProvider.connect === "function" &&
          typeof solanaProvider.disconnect === "function");

      if (isLikelyPhantom) {
        console.log("✅ Phantom-like Solana wallet detected (fallback method)");
        return true;
      }
    }

    console.log("❌ Phantom wallet not detected - Available providers:", {
      solana: !!windowAny.solana,
      phantom: !!windowAny.phantom,
      userAgent: navigator.userAgent.includes("Brave") ? "Brave" : "Other",
    });

    return false;
  }

  /**
   * Get current Solana network from Phantom wallet
   * PRIORITIZES DEVNET for AgentSphere development
   */
  public async getCurrentSolanaNetwork(): Promise<string | null> {
    try {
      if (!this.isPhantomWalletAvailable()) {
        return null;
      }

      // ALWAYS PRIORITIZE DEVNET for AgentSphere
      console.log("🎯 AgentSphere prioritizes Solana Devnet for development");

      // Check if user has a stored preference
      const storedPreference =
        typeof window !== "undefined"
          ? window.localStorage.getItem("agentsphere_preferred_solana_network")
          : null;

      if (storedPreference && SOLANA_NETWORKS[storedPreference]) {
        console.log("📱 Using stored network preference:", storedPreference);
        return storedPreference;
      }

      // Default to devnet with priority messaging
      console.log("🔧 Defaulting to Devnet (recommended for AgentSphere)");

      // Store the preference
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "agentsphere_preferred_solana_network",
          "devnet"
        );
      }

      return "devnet";
    } catch (error) {
      console.error("Failed to get current Solana network:", error);
      // Always fallback to devnet for AgentSphere
      return "devnet";
    }
  }

  /**
   * Set preferred Solana network (with devnet prioritization)
   */
  public setPreferredNetwork(network: string): boolean {
    if (!SOLANA_NETWORKS[network]) {
      console.error("Unsupported Solana network:", network);
      return false;
    }

    // Warn if not using devnet
    if (network !== "devnet") {
      console.warn("⚠️ AgentSphere is optimized for Solana Devnet");
      console.log("💡 Consider switching to Devnet for the best experience");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "agentsphere_preferred_solana_network",
        network
      );
    }

    console.log(
      `🔧 Solana network preference set to: ${SOLANA_NETWORKS[network].name}`
    );
    return true;
  }

  /**
   * Get preferred Solana network (defaults to devnet)
   */
  public getPreferredNetwork(): string {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("agentsphere_preferred_solana_network")
        : null;

    // Always default to devnet for AgentSphere
    return stored && SOLANA_NETWORKS[stored] ? stored : "devnet";
  }
}

// Export singleton instance
export const solanaNetworkService = new SolanaNetworkService();

// Export utility functions
export const getSolanaNetworkInfo = (network: string) =>
  solanaNetworkService.getSolanaNetworkInfo(network);

export const getUSDCMintForSolana = (network: string) =>
  solanaNetworkService.getUSDCMintForSolana(network);

export const formatSolanaAddress = (address: string) =>
  solanaNetworkService.formatSolanaAddress(address);

export const isValidSolanaAddress = (address: string) =>
  solanaNetworkService.isValidSolanaAddress(address);

export default solanaNetworkService;
