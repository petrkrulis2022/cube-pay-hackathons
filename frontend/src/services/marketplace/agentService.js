import { supabase } from "../../lib/supabase";

const AgentService = {
  async fetchAllAgents() {
    try {
      // Fetch basic fields from deployed_objects table
      console.log("🔍 Fetching agents from database...");
      const { data, error } = await supabase
        .from("deployed_objects")
        .select("*");

      if (error) {
        console.error("AgentService fetch error:", error);
        throw new Error(error.message || "Failed to fetch agents");
      }

      console.log(`📦 Raw data from database: ${data?.length || 0} records`);
      if (data && data.length > 0) {
        console.log("📊 Sample raw agent data:", data[0]);
        console.log("📊 Available fields:", Object.keys(data[0]));

        // Debug wallet and fee fields specifically
        console.log("🔐 Wallet fields debug:", {
          user_id: data[0].user_id,
          deployer_wallet_address: data[0].deployer_wallet_address,
          payment_recipient_address: data[0].payment_recipient_address,
          token_address: data[0].token_address,
        });

        console.log("💰 Fee fields debug:", {
          interaction_fee_amount: data[0].interaction_fee_amount, // ✅ CORRECT field
          interaction_fee: data[0].interaction_fee,
          currency_type: data[0].currency_type,
          "Raw agent fee fields": {
            interaction_fee_amount: data[0].interaction_fee_amount, // ✅ CORRECT field
            interaction_fee: data[0].interaction_fee,
            interaction_fee_usdfc: data[0].interaction_fee_usdfc,
            fee_usdc: data[0].fee_usdc,
            fee_usdt: data[0].fee_usdt,
          },
        });

        // Debug fee fields specifically
        console.log("💰 Fee fields debug:", {
          interaction_fee: data[0].interaction_fee,
          interaction_fee_usdfc: data[0].interaction_fee_usdfc,
          fee_usdc: data[0].fee_usdc,
          fee_usdt: data[0].fee_usdt,
          "typeof interaction_fee": typeof data[0].interaction_fee,
          "interaction_fee value": data[0].interaction_fee,
          "Raw agent fee fields": {
            interaction_fee: data[0].interaction_fee,
            interaction_fee_usdfc: data[0].interaction_fee_usdfc,
            fee_usdc: data[0].fee_usdc,
            fee_usdt: data[0].fee_usdt,
          },
        });
      }

      // Process and normalize the data for consistent display
      const processedAgents =
        data?.map((agent) => ({
          ...agent,
          // Normalize field names for consistency
          deployment_network_name: agent.network || "Unknown Network",
          deployment_chain_id: agent.chain_id || "Unknown",
          // FIX: Use proper wallet fields, not token_address which is USDC contract
          deployer_address:
            agent.deployer_wallet_address ||
            agent.payment_recipient_address ||
            agent.user_id,
          deployed_at: agent.created_at,
          agent_type: agent.agent_type || "AI Agent",

          // Create location object from flat fields
          location: {
            latitude: agent.latitude,
            longitude: agent.longitude,
            altitude: agent.altitude,
            address: null, // Will be filled if available
          },

          // Create payment config from flat fields - FIX: Use actual fee, not hardcoded
          payment_config: {
            // Use actual fee from database - FIX: Use correct field name 'interaction_fee_amount'
            interaction_fee_amount:
              agent.interaction_fee_amount || // ✅ CORRECT field name
              agent.interaction_fee ||
              agent.interaction_fee_usdfc ||
              agent.fee_usdc ||
              agent.fee_usdt ||
              1.0,
            payment_token: agent.currency_type || "USDC", // Default to USDC for cube payments
            crypto_qr_enabled: true, // Default for AR QR payments
            bank_virtual_card_enabled: false,
            bank_qr_enabled: false,
            voice_pay_enabled: false,
            sound_pay_enabled: false,
            onboard_education_enabled: false,
          },

          // Create wallet config - FIX: Use proper wallet fields
          wallet_config: {
            agent_wallet: {
              // Agent wallet is same as deployer for now - use actual wallet, not contract
              address:
                agent.payment_recipient_address ||
                agent.deployer_wallet_address ||
                agent.user_id,
              wallet_type: "MetaMask",
            },
            deployer_wallet: {
              // Deployer's actual wallet address
              address:
                agent.deployer_wallet_address ||
                agent.payment_recipient_address ||
                agent.user_id,
              wallet_type: "MetaMask",
            },
          },

          // Create AR config with defaults
          ar_config: {
            interaction_range: 50,
            visibility_range: 100,
          },

          // Create performance metrics with defaults
          performance_metrics: {
            interaction_count: 0,
            total_revenue: 0,
          },

          // Create configuration status
          configuration_status: {
            configuration_complete: agent.is_active || false,
          },

          // Add bank account details (empty for now)
          bank_account_details: {
            account_verified: false,
            account_holder_name: "N/A",
            bank_name: "N/A",
            encryption_status: "N/A",
          },
        })) || [];

      console.log(`✅ Fetched and processed ${processedAgents.length} agents`);

      if (processedAgents.length > 0) {
        console.log("📊 Sample processed agent:", {
          name: processedAgents[0].name,
          location: processedAgents[0].location,
          payment_config: processedAgents[0].payment_config,
          wallet_config: processedAgents[0].wallet_config,
        });
      }

      return processedAgents;
    } catch (error) {
      console.error("AgentService error:", error);
      throw new Error(error.message || "Failed to fetch agents");
    }
  },

  async fetchAgentById(id) {
    try {
      const { data, error } = await supabase
        .from("deployed_objects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message || "Failed to fetch agent");
      return data;
    } catch (error) {
      console.error("AgentService fetchAgentById error:", error);
      throw new Error(error.message || "Failed to fetch agent");
    }
  },

  async fetchAgentsByNetwork(networkName) {
    try {
      const { data, error } = await supabase
        .from("deployed_objects")
        .select("*")
        .eq("network", networkName);

      if (error)
        throw new Error(error.message || "Failed to fetch agents by network");
      return data || [];
    } catch (error) {
      console.error("AgentService fetchAgentsByNetwork error:", error);
      throw new Error(error.message || "Failed to fetch agents by network");
    }
  },
};

export default AgentService;
