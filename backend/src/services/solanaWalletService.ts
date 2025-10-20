import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { createConnection, USDC_DEVNET_CONFIG } from "../config/solanaNetworks";

export interface BalanceData {
  sol: number;
  usdc: number;
  loading: boolean;
  error: string | null;
}

export class SolanaWalletService {
  private connection: Connection;
  private currentNetwork: string;

  constructor(network: string = "DEVNET") {
    this.currentNetwork = network;
    this.connection = createConnection(network);
  }

  public switchNetwork(network: string): void {
    this.currentNetwork = network;
    this.connection = createConnection(network);
  }

  public getCurrentNetwork(): string {
    return this.currentNetwork;
  }

  public async getSolBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      throw new Error("Failed to fetch SOL balance");
    }
  }

  public async getUSDCBalance(walletAddress: string): Promise<number> {
    try {
      // USDC is only available on Devnet in our configuration
      if (this.currentNetwork !== "DEVNET") {
        return 0;
      }

      const publicKey = new PublicKey(walletAddress);
      const usdcMint = new PublicKey(USDC_DEVNET_CONFIG.mintAddress);

      const associatedTokenAddress = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );

      try {
        const tokenAccount = await getAccount(
          this.connection,
          associatedTokenAddress
        );
        return (
          Number(tokenAccount.amount) /
          Math.pow(10, USDC_DEVNET_CONFIG.decimals)
        );
      } catch (error) {
        // Token account doesn't exist, balance is 0
        return 0;
      }
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      throw new Error("Failed to fetch USDC balance");
    }
  }

  public async getBalances(
    walletAddress: string
  ): Promise<{ sol: number; usdc: number }> {
    try {
      const [sol, usdc] = await Promise.all([
        this.getSolBalance(walletAddress),
        this.getUSDCBalance(walletAddress),
      ]);

      return { sol, usdc };
    } catch (error) {
      console.error("Error fetching balances:", error);
      throw error;
    }
  }

  public getExplorerUrl(address: string): string {
    const baseUrl =
      this.currentNetwork === "DEVNET"
        ? "https://explorer.solana.com/?cluster=devnet"
        : "https://explorer.solana.com/?cluster=testnet";

    return `${baseUrl}&address=${address}`;
  }
}

// Export a singleton instance
export const solanaWalletService = new SolanaWalletService();
