// Multi-Chain Deployment Service for AgentSphere
// Handles agent deployment across multiple blockchain networks

import {
  NetworkConfig,
  getNetworkByChainId,
} from "../config/multiChainNetworks";
import {
  multiChainWalletService,
  WalletConnection,
} from "./multiChainWalletService";

export interface DeploymentConfig {
  // Basic agent information
  name: string;
  description: string;
  location: { lat: number; lng: number };
  agentType: string;

  // Network configuration
  primaryNetwork: NetworkConfig;
  additionalNetworks: NetworkConfig[];
  crossChainEnabled: boolean;

  // Payment configuration
  paymentMethods: string[];
  networkPayments: Record<string, NetworkPaymentConfig>;

  // Agent-specific settings
  interactionFee: number; // In USDC
  mcp_services: string[];
  capabilities: string[];
}

export interface NetworkPaymentConfig {
  enabled: boolean;
  preferredToken: string;
  walletAddress: string;
  usdcAddress?: string;
  customTokens?: Array<{
    symbol: string;
    address: string;
    decimals: number;
  }>;
}

export interface DeploymentResult {
  success: boolean;
  networkName: string;
  chainId: number;
  transactionHash?: string;
  agentId?: string;
  contractAddress?: string;
  error?: string;
  gasUsed?: number;
  deploymentCost?: string;
}

export interface MultiChainDeploymentResult {
  primaryDeployment: DeploymentResult;
  additionalDeployments: DeploymentResult[];
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  totalCost: string;
  databaseId?: string;
}

export class MultiChainDeploymentService {
  private deploymentInProgress = false;

  async deployAgent(
    config: DeploymentConfig
  ): Promise<MultiChainDeploymentResult> {
    if (this.deploymentInProgress) {
      throw new Error("Deployment already in progress");
    }

    this.deploymentInProgress = true;
    const deploymentResults: DeploymentResult[] = [];

    try {
      console.log("🚀 Starting multi-chain agent deployment:", config.name);

      // Deploy on primary network first
      console.log(
        `📡 Deploying on primary network: ${config.primaryNetwork.name}`
      );
      const primaryDeployment = await this.deployOnNetwork(
        config.primaryNetwork,
        config,
        true
      );
      deploymentResults.push(primaryDeployment);

      // Deploy on additional networks if cross-chain is enabled
      if (config.crossChainEnabled && config.additionalNetworks.length > 0) {
        console.log(
          `🌐 Deploying on ${config.additionalNetworks.length} additional networks`
        );

        for (const network of config.additionalNetworks) {
          try {
            const deployment = await this.deployOnNetwork(
              network,
              config,
              false
            );
            deploymentResults.push(deployment);
          } catch (error) {
            console.error(`❌ Failed to deploy on ${network.name}:`, error);
            deploymentResults.push({
              success: false,
              networkName: network.name,
              chainId: network.chainId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // Calculate deployment statistics
      const successfulDeployments = deploymentResults.filter((r) => r.success);
      const failedDeployments = deploymentResults.filter((r) => !r.success);

      // Save deployment data to database
      const databaseId = await this.saveDeploymentToDatabase(
        config,
        deploymentResults
      );

      const result: MultiChainDeploymentResult = {
        primaryDeployment: deploymentResults[0],
        additionalDeployments: deploymentResults.slice(1),
        totalDeployments: deploymentResults.length,
        successfulDeployments: successfulDeployments.length,
        failedDeployments: failedDeployments.length,
        totalCost: this.calculateTotalCost(deploymentResults),
        databaseId,
      };

      console.log("✅ Multi-chain deployment completed:", result);
      return result;
    } catch (error) {
      console.error("💥 Multi-chain deployment failed:", error);
      throw error;
    } finally {
      this.deploymentInProgress = false;
    }
  }

  private async deployOnNetwork(
    network: NetworkConfig,
    config: DeploymentConfig,
    isPrimary: boolean
  ): Promise<DeploymentResult> {
    console.log(`🔧 Deploying on ${network.name} (${network.type})`);

    try {
      // Get connected wallet for this network
      const wallet = multiChainWalletService.getWalletForNetwork(network.type);
      if (!wallet) {
        throw new Error(`No wallet connected for ${network.type} network`);
      }

      // Validate network-specific payment configuration
      const paymentConfig = config.networkPayments[network.chainId];
      if (!paymentConfig) {
        throw new Error(`No payment configuration for ${network.name}`);
      }

      switch (network.type) {
        case "evm":
          return await this.deployEVMAgent(network, config, wallet, isPrimary);
        case "solana":
          return await this.deploySolanaAgent(
            network,
            config,
            wallet,
            isPrimary
          );
        case "hedera":
          return await this.deployHederaAgent(
            network,
            config,
            wallet,
            isPrimary
          );
        default:
          throw new Error(`Unsupported network type: ${network.type}`);
      }
    } catch (error) {
      console.error(`❌ Deployment failed on ${network.name}:`, error);
      return {
        success: false,
        networkName: network.name,
        chainId: network.chainId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async deployEVMAgent(
    network: NetworkConfig,
    config: DeploymentConfig,
    wallet: WalletConnection,
    isPrimary: boolean
  ): Promise<DeploymentResult> {
    console.log(`⟠ Deploying EVM agent on ${network.name}`);

    try {
      // Switch to correct network if needed
      const currentChainId = await this.getCurrentChainId();
      if (currentChainId !== network.chainId) {
        const switched = await multiChainWalletService.switchToNetwork(network);
        if (!switched) {
          throw new Error(`Failed to switch to ${network.name}`);
        }
      }

      // For now, simulate deployment with a mock transaction
      // In real implementation, this would deploy to a smart contract
      const mockTxHash = `0x${Math.random()
        .toString(16)
        .substring(2)}${Math.random().toString(16).substring(2)}`;
      const mockAgentId = `agent_${network.chainId}_${Date.now()}`;

      // Simulate gas cost calculation
      const baseFee = this.getBaseDeploymentFee(network);
      const gasUsed = Math.floor(Math.random() * 100000) + 200000; // 200k-300k gas

      console.log(`✅ EVM deployment successful on ${network.name}:`, {
        txHash: mockTxHash,
        agentId: mockAgentId,
        gasUsed,
      });

      return {
        success: true,
        networkName: network.name,
        chainId: network.chainId,
        transactionHash: mockTxHash,
        agentId: mockAgentId,
        gasUsed,
        deploymentCost: baseFee,
      };
    } catch (error) {
      throw new Error(`EVM deployment failed: ${error}`);
    }
  }

  private async deploySolanaAgent(
    network: NetworkConfig,
    config: DeploymentConfig,
    wallet: WalletConnection,
    isPrimary: boolean
  ): Promise<DeploymentResult> {
    console.log(`🌟 Deploying Solana agent on ${network.name}`);

    // Solana deployment logic would go here
    // For now, return a placeholder
    const mockSignature = `${Math.random()
      .toString(16)
      .substring(2)}${Math.random().toString(16).substring(2)}`;
    const mockProgramId = `${Math.random()
      .toString(16)
      .substring(2)}${Math.random().toString(16).substring(2)}`;

    return {
      success: true,
      networkName: network.name,
      chainId: network.chainId,
      transactionHash: mockSignature,
      agentId: mockProgramId,
      deploymentCost: "0.002", // 0.002 SOL
    };
  }

  private async deployHederaAgent(
    network: NetworkConfig,
    config: DeploymentConfig,
    wallet: WalletConnection,
    isPrimary: boolean
  ): Promise<DeploymentResult> {
    console.log(`🌿 Deploying Hedera agent on ${network.name}`);

    // Hedera deployment logic would go here
    // For now, return a placeholder
    const mockTxId = `0.0.${Math.floor(
      Math.random() * 1000000
    )}@${Date.now()}.000000000`;
    const mockAgentId = `agent_hedera_${Date.now()}`;

    return {
      success: true,
      networkName: network.name,
      chainId: network.chainId,
      transactionHash: mockTxId,
      agentId: mockAgentId,
      deploymentCost: "1.0", // 1 HBAR
    };
  }

  private async getCurrentChainId(): Promise<number> {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        return parseInt(chainId, 16);
      } catch (error) {
        console.error("Failed to get current chain ID:", error);
        return 0;
      }
    }
    return 0;
  }

  private getBaseDeploymentFee(network: NetworkConfig): string {
    // Base deployment fees in USD equivalent
    const fees: Record<string, string> = {
      [11155111]: "0.50", // Ethereum Sepolia
      [421614]: "0.05", // Arbitrum Sepolia
      [84532]: "0.05", // Base Sepolia
      [11155420]: "0.05", // OP Sepolia
      [43113]: "0.10", // Avalanche Fuji
    };

    return fees[network.chainId] || "0.25";
  }

  private calculateTotalCost(deployments: DeploymentResult[]): string {
    const total = deployments.reduce((sum, deployment) => {
      if (deployment.success && deployment.deploymentCost) {
        return sum + parseFloat(deployment.deploymentCost);
      }
      return sum;
    }, 0);

    return total.toFixed(4);
  }

  private async saveDeploymentToDatabase(
    config: DeploymentConfig,
    deployments: DeploymentResult[]
  ): Promise<string> {
    console.log("💾 Saving multi-chain deployment to database");

    const deploymentData = {
      // Basic agent info
      name: config.name,
      description: config.description,
      location: config.location,
      agent_type: config.agentType,

      // Multi-chain configuration
      deployment_network: {
        primary: {
          chainId: config.primaryNetwork.chainId,
          name: config.primaryNetwork.name,
          type: config.primaryNetwork.type,
          deployment: deployments[0],
        },
        additional: config.additionalNetworks.map((network, index) => ({
          chainId: network.chainId,
          name: network.name,
          type: network.type,
          deployment: deployments[index + 1],
        })),
        cross_chain_enabled: config.crossChainEnabled,
      },

      // Payment configuration per network
      network_config: config.networkPayments,

      // Agent settings
      interaction_fee_usdfc: config.interactionFee,
      payment_methods: config.paymentMethods,
      mcp_services: config.mcp_services,
      capabilities: config.capabilities,

      // Deployment metadata
      supported_networks: [
        config.primaryNetwork.chainId,
        ...config.additionalNetworks.map((n) => n.chainId),
      ],
      deployment_timestamp: new Date().toISOString(),
      total_deployment_cost: this.calculateTotalCost(deployments),
      successful_deployments: deployments.filter((d) => d.success).length,
      failed_deployments: deployments.filter((d) => !d.success).length,
    };

    // In a real implementation, this would call your Supabase API
    // For now, return a mock database ID
    const mockId = `multi_chain_${Date.now()}`;
    console.log("✅ Saved to database with ID:", mockId);

    return mockId;
  }

  // Utility methods for deployment validation
  public validateDeploymentConfig(config: DeploymentConfig): string[] {
    const errors: string[] = [];

    // Basic validation
    if (!config.name?.trim()) {
      errors.push("Agent name is required");
    }

    if (!config.description?.trim()) {
      errors.push("Agent description is required");
    }

    if (!config.primaryNetwork) {
      errors.push("Primary network must be selected");
    }

    if (config.interactionFee <= 0) {
      errors.push("Interaction fee must be greater than 0");
    }

    // Network-specific validation
    if (config.crossChainEnabled && config.additionalNetworks.length === 0) {
      errors.push("Additional networks required when cross-chain is enabled");
    }

    // Payment configuration validation
    const requiredNetworks = [
      config.primaryNetwork,
      ...config.additionalNetworks,
    ];
    for (const network of requiredNetworks) {
      if (network && !config.networkPayments[network.chainId]) {
        errors.push(`Payment configuration missing for ${network.name}`);
      }
    }

    // Wallet connection validation
    for (const network of requiredNetworks) {
      if (network && !multiChainWalletService.isWalletConnected(network.type)) {
        errors.push(`Wallet not connected for ${network.name}`);
      }
    }

    return errors;
  }

  public estimateDeploymentCost(config: DeploymentConfig): string {
    const networks = [config.primaryNetwork, ...config.additionalNetworks];
    let totalCost = 0;

    for (const network of networks) {
      if (network) {
        const baseFee = parseFloat(this.getBaseDeploymentFee(network));
        totalCost += baseFee;
      }
    }

    return totalCost.toFixed(4);
  }

  public getDeploymentStatus(): boolean {
    return this.deploymentInProgress;
  }
}

// Export singleton instance
export const multiChainDeploymentService = new MultiChainDeploymentService();

export default MultiChainDeploymentService;
