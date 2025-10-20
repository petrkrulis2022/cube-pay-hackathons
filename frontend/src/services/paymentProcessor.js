// Enhanced Payment Processing System for AR QR Codes
// Handles tap-to-pay functionality with comprehensive error handling

import { supabase } from "../lib/supabase";
import qrCodeService from "./qrCodeService";

// Payment processor for QR codes
export class PaymentProcessor {
  constructor() {
    this.isProcessing = false;
    this.walletConnected = false;
    this.currentNetwork = null;
  }

  // Main payment processing function
  async processQRPayment(qrData) {
    if (this.isProcessing) {
      throw new Error("Payment already in progress");
    }

    this.isProcessing = true;
    console.log("💳 Starting payment processing for QR:", qrData);

    try {
      // 1. Validate QR data
      this.validatePaymentData(qrData);

      // 2. Parse payment URI
      const paymentDetails = this.parsePaymentURI(
        qrData.payment_uri || qrData.data
      );

      // 3. Check wallet connection
      await this.ensureWalletConnection();

      // 4. Switch to correct network if needed (only for Ethereum payments)
      if (paymentDetails.protocol === "ethereum" && paymentDetails.chainId) {
        await this.switchToNetwork(paymentDetails.chainId);
      } else if (paymentDetails.protocol === "solana") {
        console.log("🔗 Solana payment detected - no network switching needed");
      }

      // 5. Prepare and execute transaction
      const txResult = await this.executeTransaction(paymentDetails);

      // 6. Update QR status in database
      await this.updateQRStatus(qrData.id, "scanned", txResult.txHash);

      // 7. Show success message
      this.showPaymentSuccess(txResult);

      return { success: true, ...txResult };
    } catch (error) {
      console.error("💥 Payment processing failed:", error);

      // Update QR status to failed
      await this.updateQRStatus(qrData.id, "failed", null, error.message);

      // Show error message
      this.showPaymentError(error);

      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Validate payment data
  validatePaymentData(qrData) {
    if (!qrData) {
      throw new Error("No QR data provided");
    }

    const paymentUri = qrData.payment_uri || qrData.data;
    if (!paymentUri) {
      throw new Error("No payment URI found in QR data");
    }

    // Check if it's a valid payment URI (EIP-681 for Ethereum or Solana Pay format)
    if (
      !paymentUri.startsWith("ethereum:") &&
      !paymentUri.startsWith("solana:")
    ) {
      throw new Error(
        "Invalid payment URI format - must start with 'ethereum:' or 'solana:'"
      );
    }

    console.log("✅ Payment data validation passed");
  }

  // Parse payment URI (supports both EIP-681 and Solana Pay formats)
  parsePaymentURI(paymentUri) {
    console.log("🔍 Parsing payment URI:", paymentUri);

    try {
      if (paymentUri.startsWith("solana:")) {
        // Parse Solana Pay format: solana:recipient?amount=X&spl-token=Y&label=Z&message=W
        return this.parseSolanaPayURI(paymentUri);
      } else if (paymentUri.startsWith("ethereum:")) {
        // Parse EIP-681 format: ethereum:contractAddress@chainId/method?params
        return this.parseEthereumPayURI(paymentUri);
      } else {
        throw new Error("Unsupported payment URI format");
      }
    } catch (error) {
      console.error("❌ Error parsing payment URI:", error);
      throw error;
    }
  }

  // Parse Solana Pay URI
  parseSolanaPayURI(paymentUri) {
    console.log("🔍 Parsing Solana Pay URI:", paymentUri);

    const url = new URL(paymentUri);
    const recipient = url.pathname;
    const amount = url.searchParams.get("amount");
    const splToken = url.searchParams.get("spl-token");
    const label = url.searchParams.get("label");
    const message =
      url.searchParams.get("message") || url.searchParams.get("memo");

    return {
      protocol: "solana",
      recipient,
      amount: parseFloat(amount),
      tokenAddress: splToken,
      isToken: !!splToken,
      label: label ? decodeURIComponent(label) : null,
      message: message ? decodeURIComponent(message) : null,
      network: "solana",
    };
  }

  // Parse Ethereum EIP-681 URI
  parseEthereumPayURI(paymentUri) {
    console.log("🔍 Parsing Ethereum EIP-681 URI:", paymentUri);

    // Parse EIP-681 format: ethereum:contractAddress@chainId/method?params
    const uriParts = paymentUri.replace("ethereum:", "").split("@");
    const contractAddress = uriParts[0];

    if (uriParts.length < 2) {
      throw new Error("Invalid URI format - missing chain ID");
    }

    const [chainId, methodAndParams] = uriParts[1].split("/");

    if (!methodAndParams) {
      throw new Error("Invalid URI format - missing method");
    }

    const [method, paramString] = methodAndParams.split("?");

    if (!paramString) {
      throw new Error("Invalid URI format - missing parameters");
    }

    // Parse parameters
    const params = new URLSearchParams(paramString);
    const recipientAddress = params.get("address");
    const amount = params.get("uint256");

    if (!recipientAddress || !amount) {
      throw new Error("Missing required parameters: address and amount");
    }

    const parsedData = {
      protocol: "ethereum",
      contractAddress,
      chainId: parseInt(chainId),
      method,
      recipientAddress,
      amount: parseInt(amount),
      rawAmount: amount,
      network: "ethereum",
    };

    console.log("✅ Ethereum Payment URI parsed successfully:", parsedData);
    return parsedData;
  }

  // Ensure wallet is connected
  async ensureWalletConnection() {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask not found. Please install MetaMask to continue."
      );
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error(
          "No wallet accounts found. Please connect your wallet."
        );
      }

      this.walletConnected = true;
      console.log("✅ Wallet connected:", accounts[0]);
      return accounts[0];
    } catch (error) {
      if (error.code === 4001) {
        throw new Error("Wallet connection was rejected by user");
      }
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
  }

  // Switch to correct network
  async switchToNetwork(chainId) {
    const networkConfigs = {
      1043: {
        chainId: "0x413", // 1043 in hex
        chainName: "BlockDAG Primordial Testnet",
        rpcUrls: ["https://testnet-rpc.primordial.network"],
        nativeCurrency: { name: "BlockDAG", symbol: "BDAG", decimals: 18 },
        blockExplorerUrls: ["https://test-explorer.primordial.bdagscan.com/"],
      },
      2810: {
        chainId: "0xAFA", // 2810 in hex
        chainName: "Morph Holesky Testnet",
        rpcUrls: ["https://rpc-quicknode-holesky.morphl2.io"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://explorer-holesky.morphl2.io"],
      },
      // Add more networks as needed
    };

    const config = networkConfigs[chainId];
    if (!config) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: config.chainId }],
      });

      this.currentNetwork = chainId;
      console.log(`✅ Switched to network: ${config.chainName}`);
    } catch (switchError) {
      // Network not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [config],
          });
          this.currentNetwork = chainId;
          console.log(`✅ Added and switched to network: ${config.chainName}`);
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  }

  // Execute the blockchain transaction
  async executeTransaction(paymentDetails) {
    console.log("🚀 Executing transaction:", paymentDetails);

    try {
      if (paymentDetails.protocol === "ethereum") {
        return await this.executeEthereumTransaction(paymentDetails);
      } else if (paymentDetails.protocol === "solana") {
        return await this.executeSolanaTransaction(paymentDetails);
      } else {
        throw new Error(`Unsupported protocol: ${paymentDetails.protocol}`);
      }
    } catch (error) {
      console.error("❌ Transaction execution failed:", error);
      throw error;
    }
  }

  // Execute Ethereum transaction
  async executeEthereumTransaction(paymentDetails) {
    console.log("🔷 Executing Ethereum transaction:", paymentDetails);

    try {
      // Prepare transaction parameters for ERC-20 token transfer
      const transactionParams = {
        to: paymentDetails.contractAddress,
        from: (await window.ethereum.request({ method: "eth_accounts" }))[0],
        data: this.encodeTransferData(
          paymentDetails.recipientAddress,
          paymentDetails.amount
        ),
        gas: "0x15F90", // 90000 gas for token transfer
        gasPrice: await this.getGasPrice(),
      };

      console.log("📝 Ethereum transaction params:", transactionParams);

      // Request transaction from user
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParams],
      });

      console.log("✅ Ethereum transaction sent:", txHash);

      // Wait for transaction confirmation (optional)
      const receipt = await this.waitForTransactionReceipt(txHash);

      return {
        txHash,
        receipt,
        amount: paymentDetails.amount,
        recipient: paymentDetails.recipientAddress,
        networkChainId: paymentDetails.chainId,
        protocol: "ethereum",
      };
    } catch (error) {
      if (error.code === 4001) {
        throw new Error("Transaction was rejected by user");
      } else if (error.code === -32603) {
        throw new Error("Insufficient funds for transaction");
      }
      throw new Error(`Ethereum transaction failed: ${error.message}`);
    }
  }

  // Execute Solana transaction
  async executeSolanaTransaction(paymentDetails) {
    console.log("🌟 Executing REAL Solana transaction:", paymentDetails);

    try {
      // Check if Solana wallet is available and connected
      if (!window.solana || !window.solana.isConnected) {
        throw new Error(
          "Solana wallet not connected. Please connect your Phantom or Solflare wallet."
        );
      }

      console.log("🔗 Solana payment processing:");
      console.log("- Recipient:", paymentDetails.recipient);
      console.log("- Amount:", paymentDetails.amount);
      console.log("- Token:", paymentDetails.tokenAddress || "SOL");

      // Import Solana Web3 dynamically to handle transactions
      const {
        Connection,
        PublicKey,
        Transaction,
        SystemProgram,
        LAMPORTS_PER_SOL,
      } = await import("@solana/web3.js");

      // Use Devnet for testing (change to mainnet-beta for production)
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      const fromPubkey = new PublicKey(window.solana.publicKey.toString());
      const toPubkey = new PublicKey(paymentDetails.recipient);

      let transaction;

      if (paymentDetails.tokenAddress) {
        // SPL Token transfer (like USDC)
        const {
          createTransferInstruction,
          getAssociatedTokenAddress,
          TOKEN_PROGRAM_ID,
        } = await import("@solana/spl-token");

        const mintPubkey = new PublicKey(paymentDetails.tokenAddress);
        const fromTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          fromPubkey
        );
        const toTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          toPubkey
        );

        // Convert amount to proper decimals (USDC has 6 decimals)
        const transferAmount = Math.floor(
          paymentDetails.amount * Math.pow(10, 6)
        );

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        transaction = new Transaction({
          feePayer: fromPubkey,
          blockhash,
          lastValidBlockHeight,
        });

        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            fromPubkey,
            transferAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      } else {
        // Native SOL transfer
        const lamports = Math.floor(paymentDetails.amount * LAMPORTS_PER_SOL);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        transaction = new Transaction({
          feePayer: fromPubkey,
          blockhash,
          lastValidBlockHeight,
        });

        transaction.add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
          })
        );
      }

      // Sign and send transaction
      console.log("🔐 Requesting wallet signature...");
      const signedTransaction = await window.solana.signTransaction(
        transaction
      );

      console.log("📡 Broadcasting transaction...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      console.log("⏳ Confirming transaction...");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash,
        lastValidBlockHeight: transaction.lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log("✅ Solana transaction confirmed:", signature);

      return {
        txHash: signature,
        amount: paymentDetails.amount,
        recipient: paymentDetails.recipient,
        tokenAddress: paymentDetails.tokenAddress,
        protocol: "solana",
        network: paymentDetails.tokenAddress
          ? "solana-devnet"
          : "solana-testnet",
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      };
    } catch (error) {
      console.error("❌ Solana transaction failed:", error);
      throw new Error(`Solana transaction failed: ${error.message}`);
    }
  }

  // Encode ERC-20 transfer function data
  encodeTransferData(toAddress, amount) {
    // ERC-20 transfer function signature: transfer(address,uint256)
    const functionSignature = "0xa9059cbb";

    // Pad address to 32 bytes (remove 0x and pad to 64 chars)
    const paddedAddress = toAddress.slice(2).padStart(64, "0");

    // Pad amount to 32 bytes
    const paddedAmount = amount.toString(16).padStart(64, "0");

    return functionSignature + paddedAddress + paddedAmount;
  }

  // Get current gas price
  async getGasPrice() {
    try {
      const gasPrice = await window.ethereum.request({
        method: "eth_gasPrice",
      });
      return gasPrice;
    } catch (error) {
      console.warn("Failed to get gas price, using default");
      return "0x9502F9000"; // 40 gwei default
    }
  }

  // Wait for transaction receipt
  async waitForTransactionReceipt(txHash, maxWait = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      try {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt) {
          console.log("✅ Transaction confirmed:", receipt);
          return receipt;
        }
      } catch (error) {
        console.warn("Error checking transaction receipt:", error);
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.warn("Transaction receipt not found within timeout");
    return null;
  }

  // Update QR status in database
  async updateQRStatus(qrId, status, txHash = null, errorMessage = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "scanned" && txHash) {
        updateData.scanned_at = new Date().toISOString();
        updateData.transaction_hash = txHash;
      }

      if (status === "failed" && errorMessage) {
        updateData.error_message = errorMessage;
      }

      await qrCodeService.updateQRCodeStatus(qrId, status, updateData);
      console.log("✅ QR status updated in database");
    } catch (error) {
      console.warn("Failed to update QR status in database:", error);
    }
  }

  // Show payment success message
  showPaymentSuccess(txResult) {
    const message = `Payment successful! Transaction: ${txResult.txHash.slice(
      0,
      10
    )}...`;

    if (window.showNotification) {
      window.showNotification({
        type: "success",
        title: "Payment Completed",
        message: message,
        duration: 5000,
        action: {
          label: "View Transaction",
          onClick: () =>
            this.openTransactionExplorer(
              txResult.txHash,
              txResult.networkChainId
            ),
        },
      });
    } else {
      alert(message);
    }

    console.log("✅ Payment success notification shown");
  }

  // Show payment error message
  showPaymentError(error) {
    let message = "Payment failed";

    if (error.message.includes("rejected")) {
      message = "Payment cancelled by user";
    } else if (error.message.includes("insufficient")) {
      message = "Insufficient funds";
    } else if (error.message.includes("network")) {
      message = "Network error - please check connection";
    } else if (error.message.includes("MetaMask")) {
      message = "Please install MetaMask to continue";
    }

    if (window.showNotification) {
      window.showNotification({
        type: "error",
        title: "Payment Failed",
        message: message,
        duration: 7000,
      });
    } else {
      alert(`Error: ${message}`);
    }

    console.log("❌ Payment error notification shown");
  }

  // Open transaction in block explorer
  openTransactionExplorer(txHash, chainId) {
    const explorers = {
      1043: `https://test-explorer.primordial.bdagscan.com/tx/${txHash}`,
      2810: `https://explorer-holesky.morphl2.io/tx/${txHash}`,
    };

    const url = explorers[chainId];
    if (url) {
      window.open(url, "_blank");
    }
  }
}

// Global payment processor instance
const paymentProcessor = new PaymentProcessor();

// Export for use in components
export default paymentProcessor;

// Make globally available for debugging
if (typeof window !== "undefined") {
  window.paymentProcessor = paymentProcessor;
}
