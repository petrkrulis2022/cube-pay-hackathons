/**
 * Cross-Chain Payment Service for AgentSphere
 * Handles CCIP-based cross-chain USDC payments for agent interactions
 */

import {
  NetworkConfig,
  getCCIPSupportedNetworks,
  canSendCrossChainTo,
  getCCIPLaneAddress,
  estimateCrossChainFee,
  getNetworkByChainId,
} from "../config/multiChainNetworks";
import { getCCIPNetworkByChainId } from "../config/ccipNetworkConfig";

export interface CrossChainPaymentRequest {
  fromNetwork: NetworkConfig;
  toNetwork: NetworkConfig;
  fromAddress: string;
  toAddress: string; // Agent wallet address
  amount: number; // USDC amount
  agentId?: string;
  agentName?: string;
  metadata?: {
    interactionType?: string;
    transactionId?: string;
    timestamp?: number;
  };
}

export interface CrossChainPaymentResult {
  success: boolean;
  transactionHash?: string;
  ccipMessageId?: string;
  estimatedFee?: number;
  totalCost?: number;
  error?: string;
  paymentType: "same_chain" | "cross_chain";
  sourceNetwork: string;
  destinationNetwork: string;
}

export interface PaymentEstimate {
  canProcess: boolean;
  agentFee: number; // What agent receives
  ccipFee: number; // Cross-chain transfer fee
  totalUserCost: number; // Total cost to user
  estimatedTime: string; // Estimated completion time
  route: {
    source: NetworkConfig;
    destination: NetworkConfig;
    isDirect: boolean;
  };
  error?: string;
}

export class CrossChainPaymentService {
  private supportedNetworks: NetworkConfig[];

  constructor() {
    this.supportedNetworks = getCCIPSupportedNetworks();
  }

  /**
   * Estimate cross-chain payment costs and feasibility
   */
  async estimatePayment(
    sourceChainId: number | string,
    destinationChainId: number | string,
    agentFee: number
  ): Promise<PaymentEstimate> {
    const sourceNetwork = getNetworkByChainId(
      typeof sourceChainId === "string" ? 0 : sourceChainId
    );
    const destinationNetwork = getNetworkByChainId(
      typeof destinationChainId === "string" ? 0 : destinationChainId
    );

    if (!sourceNetwork || !destinationNetwork) {
      return {
        canProcess: false,
        agentFee,
        ccipFee: 0,
        totalUserCost: agentFee,
        estimatedTime: "N/A",
        route: {
          source: sourceNetwork!,
          destination: destinationNetwork!,
          isDirect: false,
        },
        error: "Unsupported network",
      };
    }

    // Same chain payment (no CCIP fees)
    if (sourceChainId.toString() === destinationChainId.toString()) {
      return {
        canProcess: true,
        agentFee,
        ccipFee: 0,
        totalUserCost: agentFee,
        estimatedTime: "1-2 minutes",
        route: {
          source: sourceNetwork,
          destination: destinationNetwork,
          isDirect: true,
        },
      };
    }

    // Cross-chain payment estimation
    if (!canSendCrossChainTo(sourceNetwork, destinationChainId)) {
      return {
        canProcess: false,
        agentFee,
        ccipFee: 0,
        totalUserCost: agentFee,
        estimatedTime: "N/A",
        route: {
          source: sourceNetwork,
          destination: destinationNetwork,
          isDirect: false,
        },
        error: `Cross-chain transfer not available from ${sourceNetwork.name} to ${destinationNetwork.name}`,
      };
    }

    const feeEstimate = await estimateCrossChainFee(
      sourceNetwork,
      destinationNetwork,
      agentFee
    );

    if (!feeEstimate.canSend) {
      return {
        canProcess: false,
        agentFee,
        ccipFee: 0,
        totalUserCost: agentFee,
        estimatedTime: "N/A",
        route: {
          source: sourceNetwork,
          destination: destinationNetwork,
          isDirect: false,
        },
        error: feeEstimate.error,
      };
    }

    return {
      canProcess: true,
      agentFee,
      ccipFee: feeEstimate.estimatedFee || 2.5,
      totalUserCost: feeEstimate.totalCost || agentFee + 2.5,
      estimatedTime: "5-15 minutes",
      route: {
        source: sourceNetwork,
        destination: destinationNetwork,
        isDirect: true,
      },
    };
  }

  /**
   * Process cross-chain payment (implementation would integrate with actual CCIP contracts)
   */
  async processPayment(
    request: CrossChainPaymentRequest
  ): Promise<CrossChainPaymentResult> {
    try {
      // Validate payment request
      const validation = this.validatePaymentRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          paymentType: "cross_chain",
          sourceNetwork: request.fromNetwork.name,
          destinationNetwork: request.toNetwork.name,
        };
      }

      // Check if same chain or cross-chain
      const isSameChain =
        request.fromNetwork.chainId === request.toNetwork.chainId;

      if (isSameChain) {
        return this.processSameChainPayment(request);
      } else {
        return this.processCrossChainPayment(request);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Payment processing failed",
        paymentType: "cross_chain",
        sourceNetwork: request.fromNetwork.name,
        destinationNetwork: request.toNetwork.name,
      };
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: CrossChainPaymentRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request.fromNetwork || !request.toNetwork) {
      return { valid: false, error: "Invalid network configuration" };
    }

    if (!request.fromAddress || !request.toAddress) {
      return { valid: false, error: "Invalid wallet addresses" };
    }

    if (request.amount <= 0) {
      return { valid: false, error: "Invalid payment amount" };
    }

    // Check if networks are supported
    if (
      !this.supportedNetworks.find(
        (n) => n.chainId === request.fromNetwork.chainId
      )
    ) {
      return {
        valid: false,
        error: `Source network ${request.fromNetwork.name} not supported`,
      };
    }

    if (
      !this.supportedNetworks.find(
        (n) => n.chainId === request.toNetwork.chainId
      )
    ) {
      return {
        valid: false,
        error: `Destination network ${request.toNetwork.name} not supported`,
      };
    }

    return { valid: true };
  }

  /**
   * Process same-chain payment (existing functionality)
   */
  private async processSameChainPayment(
    request: CrossChainPaymentRequest
  ): Promise<CrossChainPaymentResult> {
    // This would integrate with existing same-chain payment logic
    // For now, simulate successful payment
    console.log("🔄 Processing same-chain payment:", request);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    return {
      success: true,
      transactionHash: mockTxHash,
      paymentType: "same_chain",
      sourceNetwork: request.fromNetwork.name,
      destinationNetwork: request.toNetwork.name,
      totalCost: request.amount,
    };
  }

  /**
   * Process cross-chain payment using CCIP
   */
  private async processCrossChainPayment(
    request: CrossChainPaymentRequest
  ): Promise<CrossChainPaymentResult> {
    console.log("🌉 Processing cross-chain payment via CCIP:", request);

    // Get CCIP configurations
    const sourceCCIP = getCCIPNetworkByChainId(request.fromNetwork.chainId);
    const destinationCCIP = getCCIPNetworkByChainId(request.toNetwork.chainId);

    if (!sourceCCIP || !destinationCCIP) {
      return {
        success: false,
        error: "CCIP configuration not found for networks",
        paymentType: "cross_chain",
        sourceNetwork: request.fromNetwork.name,
        destinationNetwork: request.toNetwork.name,
      };
    }

    // Get CCIP lane address
    const laneAddress = getCCIPLaneAddress(
      request.fromNetwork,
      request.toNetwork
    );
    if (!laneAddress) {
      return {
        success: false,
        error: "No CCIP lane available between networks",
        paymentType: "cross_chain",
        sourceNetwork: request.fromNetwork.name,
        destinationNetwork: request.toNetwork.name,
      };
    }

    // Estimate fees
    const feeEstimate = await estimateCrossChainFee(
      request.fromNetwork,
      request.toNetwork,
      request.amount
    );

    if (!feeEstimate.canSend) {
      return {
        success: false,
        error: feeEstimate.error || "Cross-chain transfer not available",
        paymentType: "cross_chain",
        sourceNetwork: request.fromNetwork.name,
        destinationNetwork: request.toNetwork.name,
      };
    }

    // TODO: Integrate with actual CCIP smart contracts
    // This would involve:
    // 1. Approve USDC spending by CCIP router
    // 2. Call CCIP router with destination chain selector and recipient
    // 3. Monitor CCIP message execution

    // Simulate CCIP processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const mockCCIPMessageId = `0x${Math.random().toString(16).substr(2, 64)}`;

    return {
      success: true,
      transactionHash: mockTxHash,
      ccipMessageId: mockCCIPMessageId,
      estimatedFee: feeEstimate.estimatedFee,
      totalCost: feeEstimate.totalCost,
      paymentType: "cross_chain",
      sourceNetwork: request.fromNetwork.name,
      destinationNetwork: request.toNetwork.name,
    };
  }

  /**
   * Get all supported cross-chain routes for display
   */
  getSupportedRoutes(): Array<{
    source: NetworkConfig;
    destinations: NetworkConfig[];
  }> {
    return this.supportedNetworks.map((sourceNetwork) => ({
      source: sourceNetwork,
      destinations: this.supportedNetworks.filter(
        (targetNetwork) =>
          targetNetwork.chainId !== sourceNetwork.chainId &&
          canSendCrossChainTo(sourceNetwork, targetNetwork.chainId)
      ),
    }));
  }

  /**
   * Check if user has sufficient balance for cross-chain payment
   */
  async checkSufficientBalance(requiredAmount: number): Promise<{
    hasSufficientBalance: boolean;
    currentBalance: number;
    requiredAmount: number;
    deficit?: number;
  }> {
    // TODO: Integrate with actual balance checking
    // This would check USDC balance on the source network

    // For now, simulate balance check
    const mockBalance = 10.0; // Mock balance
    const hasSufficientBalance = mockBalance >= requiredAmount;

    return {
      hasSufficientBalance,
      currentBalance: mockBalance,
      requiredAmount,
      deficit: hasSufficientBalance ? undefined : requiredAmount - mockBalance,
    };
  }

  /**
   * Get payment history (for future implementation)
   */
  async getPaymentHistory(limit: number = 10): Promise<
    Array<{
      id: string;
      timestamp: number;
      amount: number;
      sourceNetwork: string;
      destinationNetwork: string;
      agentId?: string;
      agentName?: string;
      status: "pending" | "completed" | "failed";
      transactionHash?: string;
      ccipMessageId?: string;
    }>
  > {
    console.log(`Getting payment history with limit: ${limit}`);
    // TODO: Implement payment history tracking
    return [];
  }
}

// Export singleton instance
export const crossChainPaymentService = new CrossChainPaymentService();

export default crossChainPaymentService;
