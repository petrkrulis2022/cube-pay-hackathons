/**
 * AgentSphere Complete Agent Data Service
 *
 * This service provides comprehensive agent data formatting for the Cube Payment System.
 * Every piece of data here will be consumed by the Cube AR Payment system for:
 * - Crypto Payments (QR Code, Voice Pay, Sound Pay)
 * - Bank Payments (Bank QR, Virtual Card)
 * - Onboarding & Education
 */

import { supabase } from "../lib/supabase";
import { getNetworkByChainId } from "../config/multiChainNetworks";
import {
  solanaNetworkService,
  SolanaNetworkConfig,
} from "./solanaNetworkService";

// Complete Agent Data Structure for Cube Payment System
export interface CompleteAgentData {
  // Core Identity
  id: string;
  name: string;
  description: string;
  agent_type: string;

  // Deployment Information - Extended for Multi-Chain
  deployment_network_name: string;
  deployment_chain_id: number | string; // number for EVM, string for Solana
  deployment_network_id: number | string;
  deployment_status: string;
  deployed_at: string;
  deployer_address: string;

  // Multi-Chain Network Support
  network_type: "evm" | "solana" | "hedera"; // Network type

  // Solana-specific fields
  solana_network?: "devnet" | "testnet" | "mainnet"; // Solana cluster
  solana_token_mint?: string; // USDC mint address on Solana
  solana_decimals?: number; // Token decimals (6 for USDC)
  agent_solana_wallet?: string; // Agent's Solana wallet for payments

  // Cross-chain compatibility
  supported_networks?: string[]; // Array of supported networks

  // Enhanced Location with Altitude - CRITICAL FOR AR POSITIONING
  location: {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
    address: string;
    location_type: string;
  };

  // AR Configuration & Ranges
  ar_config: {
    trailing_agent: boolean;
    visibility_range: number;
    interaction_range: number;
    model_url: string;
    visibility: string;
  };

  // Agent Interaction Methods
  interaction_methods: {
    text_chat: boolean;
    voice_chat: boolean;
    video_chat: boolean;
    defi_features: boolean;
  };

  // MCP Server Interactions for Educational Content
  mcp_server_interactions: {
    chat: boolean;
    voice: boolean;
    analysis: boolean;
    information_lookup: boolean;
    qa: boolean;
    educational_content: boolean;
    study_planning: boolean;
    location_services: boolean;
    directory: boolean;
    navigation: boolean;
    content_generation: boolean;
    brainstorming: boolean;
    writing: boolean;
    game_creation: boolean;
    puzzles: boolean;
    entertainment: boolean;
  };

  // Dual Wallet System
  wallet_config: {
    agent_wallet: {
      address: string;
      purpose: string;
      wallet_type: string;
    };
    deployer_wallet: {
      address: string;
      purpose: string;
      wallet_type: string;
    };
  };

  // Economics & Payment Configuration - CRITICAL FOR CUBE PAYMENTS
  payment_config: {
    payment_token: string;
    interaction_fee_amount: number;
    interaction_fee_token: string;
    payment_methods: {
      crypto_qr: boolean;
      bank_virtual_card: boolean;
      bank_qr: boolean;
      voice_pay: boolean;
      sound_pay: boolean;
      onboard_education: boolean;
    };
    revenue_potential: {
      per_interaction: number;
      daily_10_interactions: number;
      monthly_potential: number;
    };
    token_contracts: Record<string, string>;
    network_info: NetworkConfig;
  };

  // Bank Account Details - CRITICAL FOR BANK PAYMENTS
  bank_account_details: {
    account_holder_name: string;
    account_number_iban: string;
    bank_name: string;
    swift_bic_code: string;
    account_verified: boolean;
    encryption_status: string;
  };

  // Network Configuration
  network_config: NetworkConfig;

  // Performance Metrics
  performance_metrics: {
    interaction_count: number;
    total_revenue: number;
    last_interaction: string | null;
    active_since: string;
    uptime_percentage: number;
  };

  // Configuration Status
  configuration_status: {
    wallet_connected: boolean;
    bank_details_configured: boolean;
    payment_methods_configured: string[];
    configuration_complete: boolean;
  };

  // Legacy fields for backward compatibility
  interaction_fee: number;
  interaction_fee_usdc: number;
  capabilities: string[];
  features: string[];
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface RawAgentData {
  id: string;
  name: string;
  description?: string;
  agent_type?: string;
  deployment_network_name?: string;
  deployment_chain_id?: number;
  deployment_status?: string;
  deployed_at?: string;
  deployer_address?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_altitude?: number;
  location_accuracy?: number;
  location_address?: string;
  location_type?: string;
  trailing_agent?: boolean;
  visibility_range?: number;
  interaction_range?: number;
  ar_model_url?: string;
  ar_visibility?: string;
  text_chat_enabled?: boolean;
  voice_chat_enabled?: boolean;
  video_chat_enabled?: boolean;
  defi_features_enabled?: boolean;
  mcp_server_interactions?: string;
  agent_wallet_address?: string;
  agent_wallet_type?: string;
  deployer_wallet_address?: string;
  deployer_wallet_type?: string;
  payment_token?: string;
  interaction_fee_amount?: number;
  interaction_fee_token?: string;
  payment_methods_config?: string;
  revenue_potential_config?: string;
  bank_account_holder_name?: string;
  bank_account_number_iban?: string;
  bank_name?: string;
  swift_bic_code?: string;
  bank_account_verified?: boolean;
  network_config?: string;
  payment_config?: string;
  interaction_count?: number;
  total_revenue?: number;
  last_interaction?: string;
  active_since?: string;
  uptime_percentage?: number;
  wallet_connected?: boolean;
  bank_details_configured?: boolean;
  payment_methods_configured?: string;
  configuration_complete?: boolean;
  // Legacy fields
  interaction_fee_usdfc?: number;
  token_symbol?: string;
}

export class AgentDataService {
  /**
   * Get comprehensive agent data by ID
   */
  static async getAgentById(agentId: string): Promise<CompleteAgentData> {
    try {
      console.log(
        `🔍 AGENT SERVICE: Fetching comprehensive data for agent ${agentId}`
      );

      const { data, error } = await supabase
        .from("deployed_objects")
        .select(
          `
          id, name, description, agent_type,
          deployment_network_name, deployment_chain_id, deployment_status, deployed_at, deployer_address,
          location_latitude, location_longitude, location_altitude, location_accuracy, location_address, location_type,
          trailing_agent, visibility_range, interaction_range, ar_model_url, ar_visibility,
          text_chat_enabled, voice_chat_enabled, video_chat_enabled, defi_features_enabled,
          mcp_server_interactions,
          agent_wallet_address, agent_wallet_type, deployer_wallet_address, deployer_wallet_type,
          payment_token, interaction_fee_amount, interaction_fee_token,
          payment_methods_config, revenue_potential_config,
          bank_account_holder_name, bank_account_number_iban, bank_name, swift_bic_code, bank_account_verified,
          network_config, payment_config,
          interaction_count, total_revenue, last_interaction, active_since, uptime_percentage,
          wallet_connected, bank_details_configured, payment_methods_configured, configuration_complete,
          interaction_fee_usdfc, token_symbol
        `
        )
        .eq("id", agentId)
        .single();

      if (error) {
        console.error("🔍 AGENT SERVICE: Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error(`Agent ${agentId} not found`);
      }

      console.log("🔍 AGENT SERVICE: Raw data received:", data);

      const formattedAgent = this.formatCompleteAgentData(data);

      console.log("🔍 AGENT SERVICE: Formatted agent data:", {
        id: formattedAgent.id,
        name: formattedAgent.name,
        interaction_fee_amount:
          formattedAgent.payment_config.interaction_fee_amount,
        interaction_fee_token:
          formattedAgent.payment_config.interaction_fee_token,
        deployment_network_name: formattedAgent.deployment_network_name,
        deployment_chain_id: formattedAgent.deployment_chain_id,
      });

      return formattedAgent;
    } catch (error) {
      console.error("🔍 AGENT SERVICE: Error fetching agent:", error);
      throw error;
    }
  }

  /**
   * Get all agents with comprehensive data
   */
  static async getAllAgents(
    filters: {
      network?: string;
      deployer?: string;
      agent_type?: string;
      location_type?: string;
    } = {}
  ): Promise<CompleteAgentData[]> {
    try {
      console.log(
        "🔍 AGENT SERVICE: Fetching all agents with filters:",
        filters
      );

      let query = supabase
        .from("deployed_objects")
        .select(
          `
          id, name, description, agent_type,
          deployment_network_name, deployment_chain_id, deployment_status, deployed_at, deployer_address,
          location_latitude, location_longitude, location_altitude, location_accuracy, location_address, location_type,
          trailing_agent, visibility_range, interaction_range, ar_model_url, ar_visibility,
          text_chat_enabled, voice_chat_enabled, video_chat_enabled, defi_features_enabled,
          mcp_server_interactions,
          agent_wallet_address, agent_wallet_type, deployer_wallet_address, deployer_wallet_type,
          payment_token, interaction_fee_amount, interaction_fee_token,
          payment_methods_config, revenue_potential_config,
          bank_account_holder_name, bank_account_number_iban, bank_name, swift_bic_code, bank_account_verified,
          network_config, payment_config,
          interaction_count, total_revenue, last_interaction, active_since, uptime_percentage,
          wallet_connected, bank_details_configured, payment_methods_configured, configuration_complete,
          interaction_fee_usdfc, token_symbol
        `
        )
        .eq("deployment_status", "active");

      // Apply filters
      if (filters.network) {
        query = query.eq("deployment_network_name", filters.network);
      }
      if (filters.deployer) {
        query = query.eq("deployer_address", filters.deployer);
      }
      if (filters.agent_type) {
        query = query.eq("agent_type", filters.agent_type);
      }
      if (filters.location_type) {
        query = query.eq("location_type", filters.location_type);
      }

      query = query.order("deployed_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("🔍 AGENT SERVICE: Supabase error:", error);
        throw error;
      }

      console.log(`🔍 AGENT SERVICE: Fetched ${data?.length || 0} agents`);

      return data?.map((agent) => this.formatCompleteAgentData(agent)) || [];
    } catch (error) {
      console.error("🔍 AGENT SERVICE: Error fetching agents:", error);
      throw error;
    }
  }

  /**
   * Get best fallback network based on current context
   */
  static getBestFallbackNetwork(): { chainId: number; networkName: string } {
    // Try to get current network synchronously from localStorage or window context
    try {
      if (typeof window !== "undefined") {
        // Check if MetaMask is available and connected
        if (window.ethereum?.selectedAddress) {
          // Try to get cached chainId - MetaMask often caches this
          const cachedChainId = window.ethereum.chainId;
          if (cachedChainId) {
            const chainIdNumber = parseInt(cachedChainId, 16);
            const network = getNetworkByChainId(chainIdNumber);
            if (network) {
              console.log("🌐 Using current connected network:", network.name);
              return {
                chainId: chainIdNumber,
                networkName: network.name,
              };
            }
          }
        }
      }
    } catch (error) {
      console.log("⚠️ Could not get current network context");
    }

    // Better default: Use Polygon Amoy (more likely what user is testing)
    console.log("🌐 Using default network: Polygon Amoy");
    return {
      chainId: 80002,
      networkName: "Polygon Amoy",
    };
  }

  /**
   * Format raw agent data into complete structure
   */
  static formatCompleteAgentData(rawAgent: RawAgentData): CompleteAgentData {
    console.log("🔄 FORMATTING: Processing raw agent data:", rawAgent.id);

    // Parse JSON fields safely
    const mcpInteractions = this.parseJSON(rawAgent.mcp_server_interactions, {
      chat: false,
      voice: false,
      analysis: false,
      information_lookup: false,
      qa: false,
      educational_content: false,
      study_planning: false,
      location_services: false,
      directory: false,
      navigation: false,
      content_generation: false,
      brainstorming: false,
      writing: false,
      game_creation: false,
      puzzles: false,
      entertainment: false,
    });

    const paymentMethods = this.parseJSON(rawAgent.payment_methods_config, {
      crypto_qr: true,
      bank_virtual_card: false,
      bank_qr: false,
      voice_pay: false,
      sound_pay: false,
      onboard_education: false,
    });

    // Get better network fallbacks
    const fallbackNetwork = this.getBestFallbackNetwork();

    const networkConfig = this.buildNetworkConfig(
      rawAgent.deployment_chain_id || fallbackNetwork.chainId,
      rawAgent.deployment_network_name || fallbackNetwork.networkName
    );

    const tokenContracts = this.getTokenContracts(
      rawAgent.deployment_chain_id || fallbackNetwork.chainId
    );

    // Calculate revenue potential
    const feeAmount =
      rawAgent.interaction_fee_amount || rawAgent.interaction_fee_usdfc || 1.0;
    const revenuePotential = {
      per_interaction: feeAmount,
      daily_10_interactions: feeAmount * 10,
      monthly_potential: feeAmount * 10 * 30,
    };

    const completeAgent: CompleteAgentData = {
      // Core Identity
      id: rawAgent.id,
      name: rawAgent.name || "Unnamed Agent",
      description: rawAgent.description || "",
      agent_type: rawAgent.agent_type || "intelligent_assistant",

      // Deployment Information
      deployment_network_name:
        rawAgent.deployment_network_name || fallbackNetwork.networkName,
      deployment_chain_id:
        rawAgent.deployment_chain_id || fallbackNetwork.chainId,
      deployment_network_id:
        rawAgent.deployment_chain_id || fallbackNetwork.chainId,
      deployment_status: rawAgent.deployment_status || "active",
      deployed_at: rawAgent.deployed_at || new Date().toISOString(),
      deployer_address: rawAgent.deployer_address || "",

      // Multi-Chain Network Support
      network_type: this.determineNetworkType(rawAgent),

      // Solana-specific fields (only for Solana agents)
      solana_network: this.getSolanaNetwork(rawAgent),
      solana_token_mint: this.getSolanaTokenMint(rawAgent),
      solana_decimals: rawAgent.solana_decimals || 6,
      agent_solana_wallet:
        rawAgent.agent_solana_wallet || rawAgent.agent_wallet_address,

      // Cross-chain compatibility
      supported_networks: this.getSupportedNetworks(rawAgent),

      // Enhanced Location with Altitude
      location: {
        latitude: rawAgent.location_latitude || 0,
        longitude: rawAgent.location_longitude || 0,
        altitude: rawAgent.location_altitude || 0,
        accuracy: rawAgent.location_accuracy || 0,
        address: rawAgent.location_address || "",
        location_type: rawAgent.location_type || "street",
      },

      // AR Configuration & Ranges
      ar_config: {
        trailing_agent: Boolean(rawAgent.trailing_agent),
        visibility_range: rawAgent.visibility_range || 50,
        interaction_range: rawAgent.interaction_range || 15,
        model_url: rawAgent.ar_model_url || "",
        visibility: rawAgent.ar_visibility || "public",
      },

      // Agent Interaction Methods
      interaction_methods: {
        text_chat: Boolean(rawAgent.text_chat_enabled),
        voice_chat: Boolean(rawAgent.voice_chat_enabled),
        video_chat: Boolean(rawAgent.video_chat_enabled),
        defi_features: Boolean(rawAgent.defi_features_enabled),
      },

      // MCP Server Interactions
      mcp_server_interactions: mcpInteractions,

      // Dual Wallet System
      wallet_config: {
        agent_wallet: {
          address:
            rawAgent.agent_wallet_address || rawAgent.deployer_address || "",
          purpose: "Payment Receiver",
          wallet_type: rawAgent.agent_wallet_type || "crypto",
        },
        deployer_wallet: {
          address:
            rawAgent.deployer_wallet_address || rawAgent.deployer_address || "",
          purpose: "Deployer/Owner",
          wallet_type: rawAgent.deployer_wallet_type || "metamask",
        },
      },

      // Economics & Payment Configuration - CRITICAL FOR CUBE PAYMENTS
      payment_config: {
        payment_token:
          rawAgent.payment_token || rawAgent.token_symbol || "USDC",
        interaction_fee_amount: feeAmount,
        interaction_fee_token:
          rawAgent.interaction_fee_token ||
          rawAgent.payment_token ||
          rawAgent.token_symbol ||
          "USDC",
        payment_methods: paymentMethods,
        revenue_potential: revenuePotential,
        token_contracts: tokenContracts,
        network_info: networkConfig,
      },

      // Bank Account Details
      bank_account_details: {
        account_holder_name: rawAgent.bank_account_holder_name || "",
        account_number_iban: rawAgent.bank_account_number_iban || "",
        bank_name: rawAgent.bank_name || "",
        swift_bic_code: rawAgent.swift_bic_code || "",
        account_verified: Boolean(rawAgent.bank_account_verified),
        encryption_status: rawAgent.bank_account_verified
          ? "encrypted_and_secure"
          : "not_configured",
      },

      // Network Configuration
      network_config: networkConfig,

      // Performance Metrics
      performance_metrics: {
        interaction_count: rawAgent.interaction_count || 0,
        total_revenue: rawAgent.total_revenue || 0.0,
        last_interaction: rawAgent.last_interaction || null,
        active_since:
          rawAgent.active_since ||
          rawAgent.deployed_at ||
          new Date().toISOString(),
        uptime_percentage: rawAgent.uptime_percentage || 100.0,
      },

      // Configuration Status
      configuration_status: {
        wallet_connected: Boolean(rawAgent.wallet_connected),
        bank_details_configured: Boolean(rawAgent.bank_details_configured),
        payment_methods_configured: this.parseJSON(
          rawAgent.payment_methods_configured,
          ["crypto_qr"]
        ),
        configuration_complete: Boolean(rawAgent.configuration_complete),
      },

      // Legacy fields for backward compatibility
      interaction_fee: feeAmount,
      interaction_fee_usdc: feeAmount,
      capabilities: ["chat", "payment", "ar_interaction"],
      features: ["real_time_chat", "crypto_payments"],
    };

    console.log("🔄 FORMATTING: Complete agent formatted:", {
      id: completeAgent.id,
      name: completeAgent.name,
      fee_amount: completeAgent.payment_config.interaction_fee_amount,
      fee_token: completeAgent.payment_config.interaction_fee_token,
      network: completeAgent.deployment_network_name,
      chain_id: completeAgent.deployment_chain_id,
    });

    return completeAgent;
  }

  /**
   * Build network configuration based on chain ID
   */
  static buildNetworkConfig(
    chainId: number,
    networkName?: string
  ): NetworkConfig {
    const networkConfigs: Record<number, NetworkConfig> = {
      11155111: {
        name: "Ethereum Sepolia",
        chainId: 11155111,
        rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
        blockExplorer: "https://sepolia.etherscan.io",
        nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
      },
      421614: {
        name: "Arbitrum Sepolia",
        chainId: 421614,
        rpcUrl: "https://api.zan.top/arb-sepolia",
        blockExplorer: "https://sepolia.arbiscan.io",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      },
      84532: {
        name: "Base Sepolia",
        chainId: 84532,
        rpcUrl: "https://sepolia.base.org",
        blockExplorer: "https://sepolia.basescan.org",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      },
      11155420: {
        name: "OP Sepolia",
        chainId: 11155420,
        rpcUrl: "https://sepolia.optimism.io",
        blockExplorer: "https://sepolia.optimistic.etherscan.io",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      },
      43113: {
        name: "Avalanche Fuji",
        chainId: 43113,
        rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
        blockExplorer: "https://testnet.snowtrace.io",
        nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
      },
      80002: {
        name: "Polygon Amoy",
        chainId: 80002,
        rpcUrl: "https://rpc-amoy.polygon.technology",
        blockExplorer: "https://amoy.polygonscan.com",
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      },
    };

    return (
      networkConfigs[chainId] || {
        name: networkName || "Unknown Network",
        chainId: chainId,
        rpcUrl: "",
        blockExplorer: "",
        nativeCurrency: { name: "Unknown", symbol: "UNK", decimals: 18 },
      }
    );
  }

  /**
   * Get token contract addresses for a network
   */
  static getTokenContracts(chainId: number): Record<string, string> {
    const tokenContracts: Record<number, Record<string, string>> = {
      11155111: {
        // Ethereum Sepolia
        USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      },
      84532: {
        // Base Sepolia
        USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      },
      421614: {
        // Arbitrum Sepolia
        USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      },
      11155420: {
        // OP Sepolia
        USDC: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
        USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      },
      43113: {
        // Avalanche Fuji
        USDC: "0x5425890298aed601595a70AB815c96711a31Bc65",
        USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      },
      80002: {
        // Polygon Amoy
        USDC: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
        USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
      },
    };

    return (
      tokenContracts[chainId] || {
        USDC: "",
        USDT: "",
        DAI: "",
      }
    );
  }

  /**
   * Safely parse JSON strings
   */
  static parseJSON<T>(
    jsonString: string | undefined | null,
    defaultValue: T
  ): T {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn("🔄 FORMATTING: Failed to parse JSON:", jsonString);
      return defaultValue;
    }
  }

  /**
   * Debug agent data flow
   */
  static async debugAgentData(agentId: string) {
    try {
      console.log("🐛 DEBUG: Starting agent data debug for:", agentId);

      // Raw database query
      const { data: rawData, error: rawError } = await supabase
        .from("deployed_objects")
        .select("*")
        .eq("id", agentId)
        .single();

      console.log("🐛 DEBUG: Raw database data:", rawData);
      console.log("🐛 DEBUG: Raw database error:", rawError);

      // Formatted agent data
      const formattedAgent = await this.getAgentById(agentId);

      console.log("🐛 DEBUG: Formatted agent data:", formattedAgent);

      return {
        raw_database: rawData,
        formatted_agent: formattedAgent,
        critical_fields: {
          interaction_fee_amount: {
            raw: rawData?.interaction_fee_amount,
            formatted: formattedAgent.payment_config.interaction_fee_amount,
            type: typeof formattedAgent.payment_config.interaction_fee_amount,
          },
          deployment_network_name: {
            raw: rawData?.deployment_network_name,
            formatted: formattedAgent.deployment_network_name,
          },
          deployment_chain_id: {
            raw: rawData?.deployment_chain_id,
            formatted: formattedAgent.deployment_chain_id,
            type: typeof formattedAgent.deployment_chain_id,
          },
        },
      };
    } catch (error) {
      console.error("🐛 DEBUG: Debug failed:", error);
      throw error;
    }
  }

  /**
   * Determine network type from agent data
   */
  static determineNetworkType(rawAgent: any): "evm" | "solana" | "hedera" {
    // Check if explicitly set
    if (rawAgent.network_type) {
      return rawAgent.network_type;
    }

    // Check for Solana indicators
    if (
      rawAgent.solana_network ||
      rawAgent.solana_token_mint ||
      rawAgent.agent_solana_wallet ||
      rawAgent.deployment_network_name?.toLowerCase().includes("solana")
    ) {
      return "solana";
    }

    // Check for Hedera indicators
    if (rawAgent.deployment_network_name?.toLowerCase().includes("hedera")) {
      return "hedera";
    }

    // Default to EVM
    return "evm";
  }

  /**
   * Get Solana network from agent data
   */
  static getSolanaNetwork(
    rawAgent: any
  ): "devnet" | "testnet" | "mainnet" | undefined {
    if (rawAgent.solana_network) {
      return rawAgent.solana_network;
    }

    // Try to determine from deployment network name
    const networkName = rawAgent.deployment_network_name?.toLowerCase();
    if (networkName?.includes("solana")) {
      if (networkName.includes("devnet")) return "devnet";
      if (networkName.includes("testnet")) return "testnet";
      if (networkName.includes("mainnet")) return "mainnet";
      return "devnet"; // Default to devnet for development
    }

    return undefined;
  }

  /**
   * Get Solana token mint address
   */
  static getSolanaTokenMint(rawAgent: any): string | undefined {
    if (rawAgent.solana_token_mint) {
      return rawAgent.solana_token_mint;
    }

    // Get USDC mint for detected Solana network
    const solanaNetwork = this.getSolanaNetwork(rawAgent);
    if (solanaNetwork) {
      return (
        solanaNetworkService.getUSDCMintForSolana(solanaNetwork) || undefined
      );
    }

    return undefined;
  }

  /**
   * Get supported networks array
   */
  static getSupportedNetworks(rawAgent: any): string[] {
    if (
      rawAgent.supported_networks &&
      Array.isArray(rawAgent.supported_networks)
    ) {
      return rawAgent.supported_networks;
    }

    // Generate from current deployment
    const networks = [];

    if (rawAgent.deployment_network_name) {
      networks.push(
        rawAgent.deployment_network_name.toLowerCase().replace(" ", "-")
      );
    }

    return networks;
  }
}

export default AgentDataService;
