import {
  HederaTestnet,
  HederaTestnetConfig,
} from "../config/hedera-testnet-chain.js";

export class HederaWalletService {
  constructor() {
    this.network = HederaTestnetConfig;
  }

  /**
   * Get connected MetaMask wallet address
   */
  async getConnectedWalletAddress() {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        return accounts[0] || null;
      } catch (error) {
        console.error("Error getting connected wallet:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Connect to MetaMask and switch to Hedera Testnet
   */
  async connectHederaWallet() {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Switch to Hedera Testnet
      await this.switchToHederaTestnet();

      return accounts[0];
    } catch (error) {
      console.error("Error connecting Hedera wallet:", error);
      throw error;
    }
  }

  /**
   * Switch MetaMask to Hedera Testnet
   */
  async switchToHederaTestnet() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HederaTestnet.chainId }],
      });
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [HederaTestnet],
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Get HBAR balance from MetaMask
   */
  async getHBARBalance(walletAddress) {
    try {
      // Verify we're on Hedera Testnet
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (currentChainId !== HederaTestnet.chainId) {
        throw new Error("Please switch to Hedera Testnet");
      }

      // Get balance using standard eth_getBalance
      const balanceHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
      });

      console.log("🔍 Hedera HBAR balance (hex):", balanceHex);

      // Convert from hex wei to HBAR (18 decimals)
      const balanceWei = BigInt(balanceHex);
      const hbarBalance = Number(balanceWei) / Math.pow(10, 18);

      console.log("💰 HBAR Balance:", hbarBalance);
      return hbarBalance;
    } catch (error) {
      console.error("Error fetching HBAR balance:", error);
      throw error;
    }
  }

  /**
   * Check if currently connected to Hedera Testnet
   */
  async isConnectedToHederaTestnet() {
    try {
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      return chainId === HederaTestnet.chainId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate Hedera payment QR data for AR viewer
   */
  async generateHederaAgentPayment(agent, hbarAmount = 1) {
    try {
      const connectedWallet = await this.getConnectedWalletAddress();

      if (!connectedWallet) {
        throw new Error("No wallet connected");
      }

      // For native HBAR payments, we use a simple ethereum: URI
      // that will trigger MetaMask to send HBAR to the recipient
      const recipientAddress = agent.deployer_wallet_address || connectedWallet;
      const amountInWei = (
        BigInt(Math.floor(hbarAmount * 1000000)) * BigInt(1000000000000)
      ).toString();

      const paymentData = {
        recipient: recipientAddress,
        amount: hbarAmount,
        amountInWei,
        currency: "HBAR",
        chainId: this.network.chainId,
        network: "Hedera Testnet",
        agentId: agent.id,
        agentName: agent.agent_name,
      };

      return paymentData;
    } catch (error) {
      console.error("Error generating Hedera payment:", error);
      throw error;
    }
  }

  /**
   * Generate EIP-681 compatible QR code data for HBAR payments
   */
  generateHederaPaymentQRData(paymentData) {
    try {
      // For native HBAR payments on Hedera Testnet
      // Use ethereum: scheme compatible with MetaMask
      const qrData = `ethereum:${paymentData.recipient}?value=${paymentData.amountInWei}&chainId=${this.network.chainId}`;

      console.log("🎯 Generated Hedera QR data:", {
        recipient: paymentData.recipient,
        amount: paymentData.amount,
        amountInWei: paymentData.amountInWei,
        qrData,
      });

      return qrData;
    } catch (error) {
      console.error("Error generating Hedera QR data:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const hederaWalletService = new HederaWalletService();
