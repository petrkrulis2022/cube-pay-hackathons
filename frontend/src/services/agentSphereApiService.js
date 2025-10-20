// AgentSphere API Service for Multi-Chain Integration
// Handles communication with AgentSphere backend for Polygon Amoy and Solana Devnet
// Updated to align with confirmed backend implementation (September 17, 2025)

class AgentSphereApiService {
  constructor() {
    this.baseUrl =
      process.env.REACT_APP_AGENTSPHERE_API_URL || "https://api.agentsphere.ai";

    // Supported networks aligned with confirmed backend implementation
    this.supportedNetworks = {
      // Existing EVM Networks
      11155111: "ethereum-sepolia",
      421614: "arbitrum-sepolia",
      84532: "base-sepolia",
      11155420: "op-sepolia",
      43113: "avalanche-fuji",

      // New Networks (Backend Confirmed ✅)
      80002: "polygon-amoy", // Chain ID 80002, CCIP Router configured
      devnet: "solana-devnet", // Solana Devnet, Chain selector 16423721717087811551
      "solana-devnet": "solana-devnet", // Alternative key for consistency
    };

    // USDC contract addresses confirmed by backend
    this.usdcContracts = {
      11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Ethereum Sepolia
      421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia
      84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
      11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // OP Sepolia
      43113: "0x5425890298aed601595a70AB815c96711a31Bc65", // Avalanche Fuji
      80002: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // Polygon Amoy ✅
      devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Solana Devnet ✅
    };
  }

  /**
   * Get agent payment address - Updated to use confirmed backend endpoint
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Agent payment information
   */
  async getAgentPaymentAddress(agentId) {
    try {
      console.log(`🔍 Fetching payment address for agent ${agentId}`);

      const response = await fetch(
        `${this.baseUrl}/api/agents/${agentId}/payment-address`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log(`✅ Payment address received:`, data);

      return {
        success: true,
        agentId: data.agentId,
        paymentAddress: data.paymentAddress,
        network: data.network,
        usdcContract: data.usdcContract,
        interactionFee: data.interactionFee,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch payment address:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get supported networks - Uses confirmed backend endpoint
   * @returns {Promise<Object>} List of supported networks
   */
  async getSupportedNetworks() {
    try {
      console.log(`🌐 Fetching supported networks`);

      const response = await fetch(`${this.baseUrl}/api/networks/supported`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log(`✅ Supported networks received:`, data);

      return {
        success: true,
        networks: data.networks,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch supported networks:`, error);
      return {
        success: false,
        error: error.message,
        networks: [],
      };
    }
  }

  /**
   * Verify payment transaction - Supports both EVM and Solana
   * @param {string} transactionHash - Transaction hash (EVM) or signature (Solana)
   * @returns {Promise<Object>} Payment verification result
   */
  async verifyPayment(transactionHash) {
    try {
      console.log(`🔍 Verifying payment: ${transactionHash}`);

      const response = await fetch(
        `${this.baseUrl}/api/payments/verify/${transactionHash}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log(`✅ Payment verification result:`, data);

      return {
        success: true,
        verified: data.verified,
        amount: data.amount,
        token: data.token,
        network: data.network,
        confirmations: data.confirmations,
      };
    } catch (error) {
      console.error(`❌ Failed to verify payment:`, error);
      return {
        success: false,
        error: error.message,
        verified: false,
      };
    }
  }

  /**
   * Submit payment for tracking
   * @param {string} agentId - Agent ID
   * @param {Object} paymentData - Payment transaction data
   * @returns {Promise<Object>} Submission result
   */
  async submitPayment(agentId, paymentData) {
    try {
      console.log(`📤 Submitting payment for agent ${agentId}`);

      const response = await fetch(`${this.baseUrl}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          agentId,
          ...paymentData,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log(`✅ Payment submitted successfully:`, data);

      return {
        success: true,
        payment: data,
      };
    } catch (error) {
      console.error(`❌ Failed to submit payment:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if network is supported
   * @param {string|number} chainId - Network chain ID
   * @returns {boolean} Whether network is supported
   */
  isNetworkSupported(chainId) {
    return chainId in this.supportedNetworks;
  }

  /**
   * Get network display name
   * @param {string|number} chainId - Network chain ID
   * @returns {string} Human-readable network name
   */
  getNetworkDisplayName(chainId) {
    const networkKey = this.supportedNetworks[chainId];
    const displayNames = {
      "ethereum-sepolia": "Ethereum Sepolia",
      "arbitrum-sepolia": "Arbitrum Sepolia",
      "base-sepolia": "Base Sepolia",
      "op-sepolia": "OP Sepolia",
      "avalanche-fuji": "Avalanche Fuji",
      "polygon-amoy": "Polygon Amoy",
      "solana-devnet": "Solana Devnet",
    };
    return displayNames[networkKey] || networkKey || "Unknown Network";
  }

  /**
   * Get USDC contract address for network
   * @param {string|number} chainId - Network chain ID
   * @returns {string|null} USDC contract address
   */
  getUSDCContract(chainId) {
    return this.usdcContracts[chainId] || null;
  }
}

export const agentSphereApiService = new AgentSphereApiService();
export default agentSphereApiService;
