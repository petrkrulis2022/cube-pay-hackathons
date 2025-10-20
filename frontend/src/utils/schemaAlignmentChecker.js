// Schema Alignment Checker for AgentSphere Enhanced Schema
// Validates AR Viewer compatibility with the enhanced AgentSphere database schema

import { supabase } from "../lib/supabase";

/**
 * Enhanced AgentSphere Schema Fields (Based on Migration 20250801120000)
 *
 * New Fields Expected:
 * - token_address: Contract address for payment token
 * - token_symbol: Symbol of payment token (USDT, USDC, etc.)
 * - chain_id: Blockchain network identifier
 * - property_location: Location details for real estate agents
 *
 * Enhanced Agent Types:
 * - intelligent_assistant, local_services, payment_terminal
 * - trailing_payment_terminal, my_ghost, game_agent
 * - world_builder_3d, home_security, content_creator
 * - real_estate_broker, bus_stop_agent
 *
 * Enhanced Currency Types:
 * - 12+ stablecoins: USDT, USDC, USDs, USDBG+, USDe, LSTD+
 * - AIX, PYUSD, RLUSD, USDD, GHO, USDx
 */

export const checkSchemaAlignment = async () => {
  try {
    console.log("🔍 Checking AgentSphere schema alignment...");

    // 1. Test database connection and get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from("deployed_objects")
      .select("*")
      .limit(1);

    if (tableError) {
      console.error("❌ Database connection failed:", tableError);
      return {
        success: false,
        error: "Database connection failed",
        tableError,
      };
    }

    // 2. Check if we have any agents to test with
    const { data: sampleAgent, error: agentError } = await supabase
      .from("deployed_objects")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    const hasAgents = !agentError && sampleAgent;

    // 3. Define expected schema fields from enhanced AgentSphere
    const expectedEnhancedFields = {
      // Core agent fields
      core: ["id", "name", "description", "capabilities", "user_id"],

      // Location fields
      location: ["latitude", "longitude", "altitude"],

      // Payment fields (enhanced)
      payment: [
        "agent_wallet_address",
        "interaction_fee_usdfc",
        "currency_type",
        "token_address", // NEW: Contract address
        "token_symbol", // NEW: Token symbol
        "chain_id", // NEW: Blockchain ID
        "network",
      ],

      // Agent type and interaction
      interaction: [
        "interaction_types",
        "interaction_range",
        "revenue_sharing_percentage",
      ],

      // Status and metadata
      metadata: ["is_active", "created_at", "updated_at"],

      // Real estate specific (new)
      realEstate: ["property_location"], // NEW: For real estate agents
    };

    // 4. Check field availability
    const fieldStatus = {};
    const allExpectedFields = [
      ...expectedEnhancedFields.core,
      ...expectedEnhancedFields.location,
      ...expectedEnhancedFields.payment,
      ...expectedEnhancedFields.interaction,
      ...expectedEnhancedFields.metadata,
      ...expectedEnhancedFields.realEstate,
    ];

    if (hasAgents) {
      console.log("📋 Testing with sample agent:", sampleAgent.name);

      allExpectedFields.forEach((field) => {
        const hasField = field in sampleAgent;
        const hasValue =
          sampleAgent[field] !== null && sampleAgent[field] !== undefined;

        fieldStatus[field] = {
          exists: hasField,
          hasValue: hasValue,
          value: hasValue ? sampleAgent[field] : null,
          type: hasValue ? typeof sampleAgent[field] : "unknown",
        };
      });
    }

    // 5. Check AR Viewer component compatibility
    const componentCompatibility = {
      marketplace: {
        requiredFields: [
          "id",
          "name",
          "latitude",
          "longitude",
          "interaction_fee_usdfc",
          "currency_type",
        ],
        enhancedFields: ["token_address", "token_symbol", "chain_id"],
        status: "checking",
      },

      detailModal: {
        requiredFields: [
          "name",
          "description",
          "capabilities",
          "agent_wallet_address",
        ],
        enhancedFields: ["token_address", "token_symbol", "property_location"],
        status: "checking",
      },

      paymentSystem: {
        requiredFields: [
          "agent_wallet_address",
          "interaction_fee_usdfc",
          "currency_type",
        ],
        enhancedFields: ["token_address", "token_symbol", "chain_id"],
        status: "checking",
      },
    };

    // 6. Evaluate compatibility
    Object.keys(componentCompatibility).forEach((component) => {
      const comp = componentCompatibility[component];
      const requiredAvailable = comp.requiredFields.every(
        (field) => fieldStatus[field]?.exists
      );
      const enhancedAvailable = comp.enhancedFields.every(
        (field) => fieldStatus[field]?.exists
      );

      if (requiredAvailable && enhancedAvailable) {
        comp.status = "fully_compatible";
      } else if (requiredAvailable) {
        comp.status = "basic_compatible";
      } else {
        comp.status = "incompatible";
      }
    });

    // 7. Generate compatibility report
    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      databaseStatus: {
        connected: true,
        hasAgents,
        sampleAgentId: hasAgents ? sampleAgent.id : null,
      },
      schemaStatus: {
        totalFieldsChecked: allExpectedFields.length,
        fieldsAvailable: Object.values(fieldStatus).filter((f) => f.exists)
          .length,
        fieldsWithValues: Object.values(fieldStatus).filter((f) => f.hasValue)
          .length,
        missingFields: Object.keys(fieldStatus).filter(
          (field) => !fieldStatus[field].exists
        ),
      },
      componentCompatibility,
      fieldStatus,
      recommendations: [],
    };

    // 8. Generate recommendations
    if (report.schemaStatus.missingFields.length > 0) {
      report.recommendations.push(
        `🔧 Apply AgentSphere enhanced schema migration for fields: ${report.schemaStatus.missingFields.join(
          ", "
        )}`
      );
    }

    if (componentCompatibility.paymentSystem.status !== "fully_compatible") {
      report.recommendations.push(
        "💳 Update payment components to handle new token fields (token_address, token_symbol, chain_id)"
      );
    }

    if (componentCompatibility.detailModal.status !== "fully_compatible") {
      report.recommendations.push(
        "📱 Enhance agent detail modal to display new token and property information"
      );
    }

    if (
      report.schemaStatus.fieldsWithValues < report.schemaStatus.fieldsAvailable
    ) {
      report.recommendations.push(
        "📊 Some fields exist but lack values - consider default value migration"
      );
    }

    // 9. Overall assessment
    const criticalFields = [
      "agent_wallet_address",
      "interaction_fee_usdfc",
      "currency_type",
    ];
    const criticalFieldsAvailable = criticalFields.every(
      (field) => fieldStatus[field]?.exists && fieldStatus[field]?.hasValue
    );

    report.overallStatus = {
      criticalFieldsOk: criticalFieldsAvailable,
      enhancedSchemaReady: report.schemaStatus.missingFields.length === 0,
      arViewerCompatible: Object.values(componentCompatibility).every(
        (c) =>
          c.status === "fully_compatible" || c.status === "basic_compatible"
      ),
    };

    return report;
  } catch (error) {
    console.error("❌ Schema alignment check failed:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Quick validation for production readiness
 */
export const quickSchemaCheck = async () => {
  try {
    console.log("⚡ Quick schema compatibility check...");

    const { data: agent, error } = await supabase
      .from("deployed_objects")
      .select(
        "agent_wallet_address, interaction_fee_usdfc, currency_type, token_address, token_symbol, chain_id"
      )
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error) {
      return {
        success: false,
        message: "No active agents found",
        compatible: false,
      };
    }

    const hasCore = agent.agent_wallet_address && agent.interaction_fee_usdfc;
    const hasEnhanced =
      agent.token_address && agent.token_symbol && agent.chain_id;

    return {
      success: true,
      compatible: hasCore,
      enhanced: hasEnhanced,
      agent: {
        wallet: agent.agent_wallet_address,
        fee: agent.interaction_fee_usdfc,
        currency: agent.currency_type,
        token: agent.token_symbol || "Legacy",
        network: agent.chain_id || "Unknown",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      compatible: false,
    };
  }
};

export default {
  checkSchemaAlignment,
  quickSchemaCheck,
};
