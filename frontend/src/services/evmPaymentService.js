// EVM Payment Service for USDC payments across multiple testnets
// Handles payment generation, QR creation, and transaction processing

import {
  EVM_TESTNETS,
  detectUserChain,
  selectOptimalChain,
  switchToChain,
} from "../config/evmTestnets";

// ERC-20 Transfer Function Signature
const ERC20_TRANSFER_SIGNATURE = "0xa9059cbb";

class EVMPaymentService {
  constructor() {
    this.currentChain = null;
    this.isInitialized = false;
  }

  // Initialize service and detect user's chain
  async initialize() {
    try {
      const userChainId = await detectUserChain();
      this.currentChain = await selectOptimalChain(userChainId);
      this.isInitialized = true;
      console.log(
        `🔧 EVM Payment Service initialized with ${this.currentChain.name}`
      );
      return this.currentChain;
    } catch (error) {
      console.error("❌ Failed to initialize EVM Payment Service:", error);
      throw error;
    }
  }

  // Generate USDC payment data for agent
  async generateEVMAgentPayment(agent, amount = 1) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const paymentData = {
        agent: {
          id: agent.id,
          name: agent.name || agent.title || `Agent-${agent.id}`,
          wallet_address:
            agent.wallet_address ||
            "0x1234567890123456789012345678901234567890",
        },
        payment: {
          amount: amount,
          token: "USDC",
          decimals: this.currentChain.decimals,
          contract: this.currentChain.usdcAddress,
          chain: this.currentChain,
        },
        transaction: {
          to: this.currentChain.usdcAddress,
          data: this.encodeTransferData(
            agent.wallet_address ||
              "0x1234567890123456789012345678901234567890",
            amount
          ),
          value: "0", // No ETH value for ERC-20 transfers
        },
        metadata: {
          timestamp: Date.now(),
          transactionId: `evm_${this.currentChain.chainId}_${Date.now()}_${
            agent.id
          }`,
          network: this.currentChain.name,
          explorerUrl: `${this.currentChain.blockExplorer}/tx/`,
        },
      };

      // Generate QR code data
      paymentData.qrData = this.generateQRData(
        paymentData.transaction,
        this.currentChain.chainId
      );

      console.log(
        `✅ Generated EVM payment for ${amount} USDC on ${this.currentChain.name}`
      );
      return paymentData;
    } catch (error) {
      console.error("❌ Error generating EVM payment:", error);
      throw error;
    }
  }

  // Encode ERC-20 transfer function data
  encodeTransferData(recipient, amount) {
    try {
      // Remove 0x prefix and pad to 32 bytes (64 hex chars)
      const paddedRecipient = recipient
        .slice(2)
        .toLowerCase()
        .padStart(64, "0");

      // Convert amount to wei (considering 6 decimals for USDC)
      const amountInWei = Math.floor(
        amount * Math.pow(10, this.currentChain.decimals)
      );
      const paddedAmount = amountInWei.toString(16).padStart(64, "0");

      const data = ERC20_TRANSFER_SIGNATURE + paddedRecipient + paddedAmount;

      console.log(`🔧 Encoded transfer: ${amount} USDC -> ${recipient}`);
      return data;
    } catch (error) {
      console.error("❌ Error encoding transfer data:", error);
      throw error;
    }
  }

  // Generate QR code data for wallet apps
  generateQRData(transaction, chainId) {
    const qrData = {
      chainId: `0x${chainId.toString(16)}`,
      to: transaction.to,
      data: transaction.data,
      value: transaction.value || "0",
    };

    return {
      raw: qrData,
      json: JSON.stringify(qrData),
      eip681: this.generateEIP681URI(transaction, chainId),
      walletConnect: this.generateWalletConnectURI(qrData),
    };
  }

  // Generate EIP-681 compatible URI for wallet apps
  generateEIP681URI(transaction, chainId) {
    const params = new URLSearchParams({
      value: transaction.value || "0",
      data: transaction.data,
    });

    return `ethereum:${transaction.to}@${chainId}?${params.toString()}`;
  }

  // Generate WalletConnect compatible URI
  generateWalletConnectURI(qrData) {
    return `wc:${Buffer.from(JSON.stringify(qrData)).toString("base64")}`;
  }

  // Switch to specific chain
  async switchChain(chainName) {
    const targetChain = Object.values(EVM_TESTNETS).find(
      (chain) => chain.name === chainName || chain.shortName === chainName
    );

    if (!targetChain) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }

    try {
      await switchToChain(targetChain);
      this.currentChain = targetChain;
      console.log(`✅ Switched to ${targetChain.name}`);
      return targetChain;
    } catch (error) {
      console.error(`❌ Failed to switch to ${chainName}:`, error);
      throw error;
    }
  }

  // Get current chain info
  getCurrentChain() {
    return this.currentChain;
  }

  // Get all supported chains
  getSupportedChains() {
    return Object.values(EVM_TESTNETS);
  }

  // Check if payment is valid
  validatePayment(paymentData) {
    try {
      const { agent, payment, transaction } = paymentData;

      // Validate required fields
      if (!agent.wallet_address || !payment.amount || !transaction.to) {
        return { isValid: false, error: "Missing required payment fields" };
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(agent.wallet_address)) {
        return { isValid: false, error: "Invalid wallet address format" };
      }

      // Validate amount
      if (payment.amount <= 0) {
        return { isValid: false, error: "Amount must be greater than 0" };
      }

      // Validate contract address
      if (!/^0x[a-fA-F0-9]{40}$/.test(transaction.to)) {
        return { isValid: false, error: "Invalid contract address" };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  // Process payment (initiate transaction)
  async processPayment(paymentData) {
    try {
      const validation = this.validatePayment(paymentData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      // Request transaction
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [paymentData.transaction],
      });

      console.log(`✅ Transaction sent: ${txHash}`);

      return {
        success: true,
        txHash,
        explorerUrl: `${this.currentChain.blockExplorer}/tx/${txHash}`,
        chain: this.currentChain.name,
      };
    } catch (error) {
      console.error("❌ Payment processing failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Test payment generation for all chains
  async testAllChains(testAgent) {
    const results = [];

    for (const chain of Object.values(EVM_TESTNETS)) {
      try {
        this.currentChain = chain;
        const payment = await this.generateEVMAgentPayment(testAgent, 1);

        results.push({
          chain: chain.name,
          success: true,
          payment: payment,
        });
      } catch (error) {
        results.push({
          chain: chain.name,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

// Create singleton instance
const evmPaymentService = new EVMPaymentService();

// Export service and utilities
export default evmPaymentService;
export { EVM_TESTNETS, detectUserChain, selectOptimalChain, switchToChain };
export { evmPaymentService };
