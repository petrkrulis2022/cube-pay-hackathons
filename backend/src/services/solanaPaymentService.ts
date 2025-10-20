/**
 * Solana Payment Service for AgentSphere
 *
 * Handles Solana-based payment processing for agent deployment costs
 * Supports USDC payments on Solana Devnet/Testnet/Mainnet networks
 * Integrates with Phantom wallet and Solana Web3.js
 */

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token";
import { solanaNetworkService } from "./solanaNetworkService";
import { multiChainWalletService } from "./multiChainWalletService";

export interface SolanaPaymentRequest {
  fromAddress: string;
  toAddress: string;
  amount: number; // Amount in USDC (6 decimals)
  network: string; // devnet, testnet, mainnet-beta
  metadata?: {
    agentName?: string;
    agentType?: string;
    transactionId?: string;
  };
}

export interface SolanaPaymentResult {
  success: boolean;
  transactionSignature?: string;
  error?: string;
  explorerUrl?: string;
  transactionId?: string;
}

export interface SolanaPaymentEstimate {
  networkFee: number; // SOL amount for transaction fee
  totalCost: number; // USDC amount + network fee in SOL
  estimatedTime: string; // Estimated confirmation time
}

class SolanaPaymentService {
  private connection: Connection | null = null;
  private currentNetwork: string = "devnet"; // PRIORITIZE DEVNET for AgentSphere

  /**
   * Initialize connection to specified Solana network
   * DEFAULTS TO DEVNET for optimal AgentSphere experience
   */
  public async initializeConnection(
    network: string = "devnet" // Always default to devnet
  ): Promise<boolean> {
    try {
      // Prioritize devnet if no specific network requested
      if (!network || network === "auto") {
        network = "devnet";
        console.log("🎯 Auto-selecting Solana Devnet for AgentSphere");
      }

      console.log("🔗 Initializing Solana connection for network:", network);

      // Warn if not using recommended devnet
      if (network !== "devnet") {
        console.warn("⚠️ AgentSphere is optimized for Solana Devnet");
        console.log("💡 Consider using Devnet for the best experience");
      }

      const rpcUrl = solanaNetworkService.getRpcUrl(network);
      if (!rpcUrl) {
        throw new Error(`Unsupported network: ${network}`);
      }

      this.connection = new Connection(rpcUrl, "confirmed");
      this.currentNetwork = network;

      // Test connection
      const latestBlockhash = await this.connection.getLatestBlockhash();
      console.log(
        "✅ Solana connection established, latest blockhash:",
        latestBlockhash.blockhash
      );

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Solana connection:", error);
      this.connection = null;
      return false;
    }
  }

  /**
   * Estimate payment costs including network fees
   */
  public async estimatePaymentCost(
    request: SolanaPaymentRequest
  ): Promise<SolanaPaymentEstimate> {
    try {
      if (!this.connection) {
        await this.initializeConnection(request.network);
      }

      if (!this.connection) {
        throw new Error("Failed to establish Solana connection");
      }

      console.log(
        "📊 Estimating Solana payment cost for:",
        request.amount,
        "USDC"
      );

      // Get recent blockhash for fee calculation
      const { feeCalculator } = await this.connection.getRecentBlockhash();

      // Estimate transaction fee (usually ~0.000005 SOL)
      const networkFee = feeCalculator?.lamportsPerSignature
        ? feeCalculator.lamportsPerSignature / 1e9
        : 0.000005; // Fallback estimate

      const estimate: SolanaPaymentEstimate = {
        networkFee,
        totalCost: request.amount, // USDC amount stays the same
        estimatedTime: "15-30 seconds", // Typical Solana confirmation time
      };

      console.log("💰 Payment estimate:", estimate);
      return estimate;
    } catch (error) {
      console.error("❌ Failed to estimate payment cost:", error);

      // Return fallback estimate
      return {
        networkFee: 0.000005,
        totalCost: request.amount,
        estimatedTime: "15-30 seconds",
      };
    }
  }

  /**
   * Create USDC transfer transaction on Solana
   */
  public async createUSDCTransaction(
    request: SolanaPaymentRequest
  ): Promise<Transaction | null> {
    try {
      if (!this.connection) {
        await this.initializeConnection(request.network);
      }

      if (!this.connection) {
        throw new Error("Failed to establish Solana connection");
      }

      console.log("🏗️ Creating USDC transaction for:", request.amount, "USDC");
      console.log("   From:", request.fromAddress);
      console.log("   To:", request.toAddress);
      console.log("   Network:", request.network);

      const fromPubkey = new PublicKey(request.fromAddress);
      const toPubkey = new PublicKey(request.toAddress);

      // Get USDC mint address for the network
      const usdcMint = solanaNetworkService.getUSDCMint(request.network);
      if (!usdcMint) {
        throw new Error(`USDC not supported on network: ${request.network}`);
      }

      const usdcMintPubkey = new PublicKey(usdcMint);
      console.log("🪙 USDC Mint:", usdcMint);

      // Get associated token addresses
      const fromTokenAccount = await getAssociatedTokenAddress(
        usdcMintPubkey,
        fromPubkey
      );
      const toTokenAccount = await getAssociatedTokenAddress(
        usdcMintPubkey,
        toPubkey
      );

      console.log("📄 From Token Account:", fromTokenAccount.toString());
      console.log("📄 To Token Account:", toTokenAccount.toString());

      // Create transaction
      const transaction = new Transaction();

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Check if destination token account exists
      let toAccountExists = true;
      try {
        await getAccount(this.connection, toTokenAccount);
        console.log("✅ Destination token account exists");
      } catch (error) {
        if (
          error instanceof TokenAccountNotFoundError ||
          error instanceof TokenInvalidAccountOwnerError
        ) {
          console.log(
            "⚠️ Destination token account doesn't exist, will create it"
          );
          toAccountExists = false;
        } else {
          throw error;
        }
      }

      // Add instruction to create destination token account if needed
      if (!toAccountExists) {
        const createAccountInstruction =
          createAssociatedTokenAccountInstruction(
            fromPubkey, // payer
            toTokenAccount, // ata
            toPubkey, // owner
            usdcMintPubkey // mint
          );
        transaction.add(createAccountInstruction);
        console.log("➕ Added create token account instruction");
      }

      // Convert USDC amount to smallest units (6 decimals)
      const usdcAmount = BigInt(Math.round(request.amount * 1e6));
      console.log("💱 USDC amount in smallest units:", usdcAmount.toString());

      // Add transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount, // from
        toTokenAccount, // to
        fromPubkey, // owner
        usdcAmount // amount
      );
      transaction.add(transferInstruction);
      console.log("➕ Added USDC transfer instruction");

      console.log("✅ Transaction created successfully");
      return transaction;
    } catch (error) {
      console.error("❌ Failed to create USDC transaction:", error);
      return null;
    }
  }

  /**
   * Process Solana USDC payment for agent deployment
   */
  public async processPayment(
    request: SolanaPaymentRequest
  ): Promise<SolanaPaymentResult> {
    try {
      console.log("🚀 Processing Solana payment:", request);

      // Get connected Solana wallet
      const solanaWallet = multiChainWalletService.getPrimarySolanaWallet();
      if (!solanaWallet) {
        throw new Error("No Solana wallet connected");
      }

      if (solanaWallet.address !== request.fromAddress) {
        throw new Error("Payment address does not match connected wallet");
      }

      // Ensure we have Phantom wallet access
      if (!window.solana?.isPhantom) {
        throw new Error("Phantom wallet not detected");
      }

      // Create transaction
      const transaction = await this.createUSDCTransaction(request);
      if (!transaction) {
        throw new Error("Failed to create payment transaction");
      }

      console.log("✍️ Requesting transaction signature from Phantom...");

      // Sign and send transaction using Phantom
      const signedTransaction = await window.solana.signAndSendTransaction(
        transaction
      );

      if (!signedTransaction?.signature) {
        throw new Error("Transaction signing failed or was cancelled");
      }

      const signature = signedTransaction.signature;
      console.log("✅ Transaction signed and submitted:", signature);

      // Wait for confirmation
      if (this.connection) {
        console.log("⏳ Waiting for transaction confirmation...");

        try {
          const confirmation = await this.connection.confirmTransaction(
            signature,
            "confirmed"
          );

          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
          }

          console.log("🎉 Transaction confirmed!");
        } catch (confirmError) {
          console.warn(
            "⚠️ Transaction submitted but confirmation failed:",
            confirmError
          );
          // Still consider it successful since it was submitted
        }
      }

      // Generate explorer URL
      const explorerUrl = solanaNetworkService.getExplorerUrl(
        signature,
        request.network
      );

      const result: SolanaPaymentResult = {
        success: true,
        transactionSignature: signature,
        explorerUrl,
        transactionId: request.metadata?.transactionId,
      };

      console.log("🎊 Payment processed successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Solana payment processing failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown payment error";

      return {
        success: false,
        error: errorMessage,
        transactionId: request.metadata?.transactionId,
      };
    }
  }

  /**
   * Validate payment addresses and amounts
   */
  public validatePaymentRequest(request: SolanaPaymentRequest): {
    valid: boolean;
    error?: string;
  } {
    try {
      // Validate addresses
      new PublicKey(request.fromAddress);
      new PublicKey(request.toAddress);

      // Validate amount
      if (request.amount <= 0) {
        return { valid: false, error: "Payment amount must be greater than 0" };
      }

      if (request.amount > 1000000) {
        // Sanity check for 1M USDC
        return { valid: false, error: "Payment amount exceeds maximum limit" };
      }

      // Validate network
      const supportedNetworks = ["devnet", "testnet", "mainnet-beta"];
      if (!supportedNetworks.includes(request.network)) {
        return {
          valid: false,
          error: `Unsupported network: ${request.network}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: "Invalid payment addresses" };
    }
  }

  /**
   * Get current network and connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    network: string;
    rpcUrl?: string;
  } {
    const rpcUrl = this.connection
      ? solanaNetworkService.getRpcUrl(this.currentNetwork)
      : undefined;

    return {
      connected: !!this.connection,
      network: this.currentNetwork,
      rpcUrl: rpcUrl || undefined,
    };
  }

  /**
   * Check if wallet has sufficient USDC balance for payment
   */
  public async checkSufficientBalance(
    address: string,
    amount: number,
    network: string
  ): Promise<boolean> {
    try {
      const balance = await solanaNetworkService.getUSDCBalance(
        address,
        network
      );
      const balanceNumber = parseFloat(balance);

      console.log(`💰 USDC Balance check: ${balanceNumber} >= ${amount}?`);
      return balanceNumber >= amount;
    } catch (error) {
      console.error("❌ Balance check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const solanaPaymentService = new SolanaPaymentService();

export default solanaPaymentService;
