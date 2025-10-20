// Hedera Testnet Wallet Service
import {
  HEDERA_NETWORKS,
  HBAR_TESTNET_CONFIG,
  getHederaNetworkConfig,
} from "../config/hederaNetworks";

export interface HederaBalanceData {
  hbar: number;
  loading: boolean;
  error: string | null;
}

export class HederaWalletService {
  private currentNetwork: string;

  constructor(network: string = "TESTNET") {
    this.currentNetwork = network;
  }

  public switchNetwork(network: string): void {
    this.currentNetwork = network;
  }

  public getCurrentNetwork(): string {
    return this.currentNetwork;
  }

  public async getHBARBalance(walletAddress: string): Promise<number> {
    try {
      const networkConfig = getHederaNetworkConfig(this.currentNetwork);

      // Check if MetaMask is available
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      // First verify we're on the correct network
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      const expectedChainId = `0x${networkConfig.chainId.toString(16)}`; // 0x128 for chain 296

      if (currentChainId !== expectedChainId) {
        throw new Error(
          `Please switch to Hedera Testnet (Chain ID: ${networkConfig.chainId})`
        );
      }

      // Get balance using MetaMask eth_getBalance method
      const balanceHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
      });

      console.log("🔍 Raw balance from Hedera Testnet:", {
        address: walletAddress,
        balanceHex,
        chainId: currentChainId,
        expectedChainId,
      });

      // Convert from hex wei to HBAR (18 decimals)
      // balanceHex is a string like "0x1bc16d674ec80000"
      const balanceWei = BigInt(balanceHex);
      const hbarBalance = Number(balanceWei) / Math.pow(10, 18);

      console.log("💰 Converted HBAR balance:", hbarBalance);

      return hbarBalance;
    } catch (error) {
      console.error("Error fetching HBAR balance:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch HBAR balance: ${errorMessage}`);
    }
  }

  public async getBalances(walletAddress: string): Promise<{ hbar: number }> {
    try {
      const hbar = await this.getHBARBalance(walletAddress);
      return { hbar };
    } catch (error) {
      console.error("Error fetching balances:", error);
      throw error;
    }
  }

  public getExplorerUrl(address: string): string {
    const networkConfig = getHederaNetworkConfig(this.currentNetwork);
    return `${networkConfig.explorerUrl}/account/${address}`;
  }

  public async getCurrentWalletAddress(): Promise<string | null> {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        return null;
      }

      // Get accounts without requesting permission (eth_accounts vs eth_requestAccounts)
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) {
        return null;
      }

      return accounts[0];
    } catch (error) {
      console.error("Error getting current wallet address:", error);
      return null;
    }
  }

  public async connectWallet(): Promise<string | null> {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const walletAddress = accounts[0];

      // Check if user is on Hedera Testnet
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      const expectedChainId = `0x${getHederaNetworkConfig(
        this.currentNetwork
      ).chainId.toString(16)}`;

      if (chainId !== expectedChainId) {
        // Try to switch to Hedera Testnet
        await this.switchToHederaTestnet();
      }

      return walletAddress;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }

  public async switchToHederaTestnet(): Promise<void> {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      const networkConfig = getHederaNetworkConfig(this.currentNetwork);
      const chainIdHex = `0x${networkConfig.chainId.toString(16)}`;

      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: networkConfig.name,
                nativeCurrency: networkConfig.nativeCurrency,
                rpcUrls: [networkConfig.rpc],
                blockExplorerUrls: [networkConfig.explorerUrl],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error("Error switching to Hedera Testnet:", error);
      throw error;
    }
  }

  public async isConnectedToHederaTestnet(): Promise<boolean> {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        return false;
      }

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      const expectedChainId = `0x${getHederaNetworkConfig(
        this.currentNetwork
      ).chainId.toString(16)}`;
      return chainId === expectedChainId;
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const hederaWalletService = new HederaWalletService();
