// Dynamic Agent Data Validation Utility
// Validates agent data for AgentSphere dynamic deployment integration

import { dynamicQRService } from "../services/dynamicQRService";

/**
 * Resolves interaction fee with proper priority logic
 * Priority: interaction_fee_amount -> fee_usdc -> fee_usdt -> interaction_fee -> defaults
 */
export const resolveInteractionFee = (agent) => {
  console.log("🔍 INTERACTION FEE FIELD ANALYSIS:");
  console.log(
    `- interaction_fee_amount: ${
      agent.interaction_fee_amount
    } (type: ${typeof agent.interaction_fee_amount})`
  );
  console.log(`- interaction_fee_token: ${agent.interaction_fee_token}`);
  console.log(`- fee_usdc: ${agent.fee_usdc} (type: ${typeof agent.fee_usdc})`);
  console.log(`- fee_usdt: ${agent.fee_usdt} (type: ${typeof agent.fee_usdt})`);
  console.log(`- interaction_fee (legacy): ${agent.interaction_fee}`);
  console.log(
    `- interaction_fee_usdfc (legacy): ${agent.interaction_fee_usdfc}`
  );

  let resolvedFee = {
    amount: 1.0,
    token: "USDC",
    source: "default",
  };

  // PRIORITY 1: Use new interaction_fee_amount field if available
  if (
    agent.interaction_fee_amount !== undefined &&
    agent.interaction_fee_amount !== null &&
    !isNaN(agent.interaction_fee_amount) &&
    agent.interaction_fee_amount > 0
  ) {
    resolvedFee = {
      amount: parseFloat(agent.interaction_fee_amount),
      token: agent.interaction_fee_token || "USDC",
      source: "interaction_fee_amount",
    };

    console.log("✅ Using NEW interaction_fee_amount field");
  }
  // PRIORITY 2: Fall back to fee_usdc
  else if (
    agent.fee_usdc !== undefined &&
    agent.fee_usdc !== null &&
    !isNaN(agent.fee_usdc) &&
    agent.fee_usdc > 0
  ) {
    resolvedFee = {
      amount: parseFloat(agent.fee_usdc),
      token: "USDC",
      source: "fee_usdc",
    };

    console.log("⚠️ Using fee_usdc field");
  }
  // PRIORITY 3: Fall back to fee_usdt
  else if (
    agent.fee_usdt !== undefined &&
    agent.fee_usdt !== null &&
    !isNaN(agent.fee_usdt) &&
    agent.fee_usdt > 0
  ) {
    resolvedFee = {
      amount: parseFloat(agent.fee_usdt),
      token: "USDT",
      source: "fee_usdt",
    };

    console.log("⚠️ Using fee_usdt field");
  }
  // PRIORITY 4: Fall back to legacy interaction_fee_usdfc
  else if (
    agent.interaction_fee_usdfc !== undefined &&
    agent.interaction_fee_usdfc !== null &&
    !isNaN(agent.interaction_fee_usdfc) &&
    agent.interaction_fee_usdfc > 0
  ) {
    resolvedFee = {
      amount: parseFloat(agent.interaction_fee_usdfc),
      token: "USDC",
      source: "legacy (interaction_fee_usdfc)",
    };

    console.log("⚠️ Using LEGACY interaction_fee_usdfc field");
  }
  // PRIORITY 5: Fall back to legacy interaction_fee
  else if (
    agent.interaction_fee !== undefined &&
    agent.interaction_fee !== null &&
    !isNaN(agent.interaction_fee) &&
    agent.interaction_fee > 0
  ) {
    resolvedFee = {
      amount: parseFloat(agent.interaction_fee),
      token: "USDC",
      source: "legacy (interaction_fee)",
    };

    console.log("⚠️ Using LEGACY interaction_fee field");
  } else {
    console.log("❌ Using DEFAULT values (no valid fee found)");
  }

  console.log("🎯 RESOLVED INTERACTION FEE:");
  console.log(`- Display Fee: ${resolvedFee.amount}`);
  console.log(`- Display Token: ${resolvedFee.token}`);
  console.log(`- Data Source: ${resolvedFee.source}`);

  return resolvedFee;
};

/**
 * Validates agent data completeness for dynamic deployment
 * @param {Object} agent - Agent object from database
 * @returns {Object} Validation results with data source and completeness info
 */
export const validateAgentData = (agent) => {
  console.log("🔍 AGENT DATA VALIDATION DEBUG:");
  console.log("Agent ID:", agent.id);
  console.log("Agent Name:", agent.name || agent.agent_name);

  // Log all interaction fee related fields for debugging
  console.log("\n💰 INTERACTION FEE FIELD ANALYSIS:");
  console.log(
    "- interaction_fee_amount:",
    agent.interaction_fee_amount,
    "(type:",
    typeof agent.interaction_fee_amount,
    ")"
  );
  console.log("- interaction_fee_token:", agent.interaction_fee_token);
  console.log("- interaction_fee (legacy):", agent.interaction_fee);
  console.log("- interaction_fee_usdfc (legacy):", agent.interaction_fee_usdfc);
  console.log("- currency_type (legacy):", agent.currency_type);
  console.log("- fee_usdt:", agent.fee_usdt);
  console.log("- fee_usdc:", agent.fee_usdc);
  console.log("- fee_usds:", agent.fee_usds);
  console.log("- token_symbol:", agent.token_symbol);

  const validation = {
    hasLegacyData: !!(agent.chain_id && agent.network && agent.interaction_fee),
    hasDynamicData: !!(
      agent.deployment_chain_id &&
      agent.deployment_network_name &&
      agent.interaction_fee_amount
    ),
    hasPaymentConfig: !!(
      agent.payment_config && agent.payment_config.wallet_address
    ),
    hasWalletAddress: !!(
      agent.wallet_address ||
      agent.payment_config?.wallet_address ||
      agent.deployer_address ||
      agent.payment_recipient_address
    ),
    isComplete: false,
    dataSource: "unknown",
    missingFields: [],
    interactionFeeValidation: {},
  };

  // Enhanced interaction fee validation
  validation.interactionFeeValidation = validateInteractionFeeFields(agent);

  // Determine data source and completeness
  if (validation.hasDynamicData) {
    validation.dataSource = "dynamic";
    validation.isComplete = !!(
      agent.deployment_chain_id &&
      agent.deployment_network_name &&
      agent.interaction_fee_amount &&
      validation.hasWalletAddress
    );

    // Check for missing dynamic fields
    if (!agent.deployment_chain_id)
      validation.missingFields.push("deployment_chain_id");
    if (!agent.deployment_network_name)
      validation.missingFields.push("deployment_network_name");
    if (!agent.interaction_fee_amount)
      validation.missingFields.push("interaction_fee_amount");
    if (!validation.hasWalletAddress)
      validation.missingFields.push("wallet_address");
  } else if (validation.hasLegacyData) {
    validation.dataSource = "legacy";
    validation.isComplete = !!(
      agent.chain_id &&
      agent.network &&
      agent.interaction_fee &&
      validation.hasWalletAddress
    );

    // Check for missing legacy fields
    if (!agent.chain_id) validation.missingFields.push("chain_id");
    if (!agent.network) validation.missingFields.push("network");
    if (!agent.interaction_fee)
      validation.missingFields.push("interaction_fee");
    if (!validation.hasWalletAddress)
      validation.missingFields.push("wallet_address");
  }

  console.log("\n✅ VALIDATION RESULTS:");
  console.log("- Has Dynamic Data:", validation.hasDynamicData);
  console.log("- Has Legacy Data:", validation.hasLegacyData);
  console.log("- Data Source:", validation.dataSource);
  console.log("- Is Complete:", validation.isComplete);
  console.log("- Interaction Fee Info:", validation.interactionFeeValidation);

  return validation;
};

/**
 * Validates and resolves interaction fee fields with proper priority
 * @param {Object} agent - Agent object from database
 * @returns {Object} Interaction fee validation results
 */
export const validateInteractionFeeFields = (agent) => {
  let displayFee = null;
  let displayToken = null;
  let dataSource = "unknown";
  let isValid = false;
  const errors = [];
  const warnings = [];

  // Priority order for fee amount (NEW DYNAMIC FIELDS FIRST)
  if (
    agent.interaction_fee_amount !== undefined &&
    agent.interaction_fee_amount !== null
  ) {
    displayFee = agent.interaction_fee_amount;
    displayToken = agent.interaction_fee_token || "USDC";
    dataSource = "dynamic (interaction_fee_amount)";
  } else if (agent.fee_usdt !== undefined && agent.fee_usdt !== null) {
    displayFee = agent.fee_usdt;
    displayToken = "USDT";
    dataSource = "specific (fee_usdt)";
  } else if (agent.fee_usdc !== undefined && agent.fee_usdc !== null) {
    displayFee = agent.fee_usdc;
    displayToken = "USDC";
    dataSource = "specific (fee_usdc)";
  } else if (agent.fee_usds !== undefined && agent.fee_usds !== null) {
    displayFee = agent.fee_usds;
    displayToken = "USDs";
    dataSource = "specific (fee_usds)";
  } else if (
    agent.interaction_fee_usdfc !== undefined &&
    agent.interaction_fee_usdfc !== null
  ) {
    displayFee = agent.interaction_fee_usdfc;
    displayToken = agent.currency_type || "USDFC";
    dataSource = "legacy (interaction_fee_usdfc)";
  } else if (
    agent.interaction_fee !== undefined &&
    agent.interaction_fee !== null
  ) {
    displayFee = agent.interaction_fee;
    displayToken = agent.token_symbol || agent.currency_type || "USDT";
    dataSource = "legacy (interaction_fee)";
  } else {
    displayFee = 1.0; // Fallback
    displayToken = "USDC";
    dataSource = "fallback (hardcoded)";
    warnings.push(
      "No interaction fee found in agent data, using fallback: 1.0 USDC"
    );
  }

  // Validate the resolved fee
  if (!displayFee || isNaN(displayFee)) {
    errors.push("Invalid interaction fee amount (not a number)");
  } else if (displayFee <= 0) {
    errors.push("Invalid interaction fee amount (must be positive)");
  } else {
    isValid = true;
  }

  console.log("\n✅ RESOLVED INTERACTION FEE:");
  console.log("- Display Fee:", displayFee);
  console.log("- Display Token:", displayToken);
  console.log("- Data Source:", dataSource);
  console.log("- Is Valid:", isValid);

  return {
    amount: displayFee,
    token: displayToken,
    dataSource,
    isValid,
    errors,
    warnings,
    isDynamic: dataSource.includes("dynamic"),
    isLegacy: dataSource.includes("legacy") || dataSource.includes("specific"),
    isFallback: dataSource.includes("fallback"),
  };
};

/**
 * Format interaction fee for display with proper validation
 * @param {Object} agent - Agent object from database
 * @returns {Object} Formatted fee information
 */
export const formatInteractionFee = (agent) => {
  const validation = validateAgentData(agent);
  const feeInfo = validation.interactionFeeValidation;

  if (!feeInfo.isValid) {
    console.warn(
      "⚠️ Agent interaction fee validation failed, using fallback display"
    );
    return {
      amount: 1.0,
      token: "USDC",
      display: "1.0 USDC",
      source: "fallback",
      errors: feeInfo.errors,
      validation: validation,
    };
  }

  // Format to appropriate decimal places
  let formattedAmount;
  if (feeInfo.amount % 1 === 0) {
    formattedAmount = feeInfo.amount.toString(); // No decimal for whole numbers
  } else {
    formattedAmount = feeInfo.amount.toFixed(2).replace(/\.?0+$/, ""); // Remove trailing zeros
  }

  return {
    amount: feeInfo.amount,
    token: feeInfo.token,
    display: `${formattedAmount} ${feeInfo.token}`,
    source: feeInfo.dataSource,
    validation: validation,
    isDynamic: feeInfo.isDynamic,
    isLegacy: feeInfo.isLegacy,
    isFallback: feeInfo.isFallback,
  };
};

/**
 * Get agent network display information
 * @param {Object} agent - Agent object from database
 * @returns {Object} Network display information
 */
export const getAgentNetworkInfo = (agent) => {
  const validation = validateAgentData(agent);

  // Use dynamic fields with fallback to legacy
  const chainId = agent.deployment_chain_id || agent.chain_id;
  const networkName = agent.deployment_network_name || agent.network;

  // Map chain IDs to network names for better display
  const chainIdToNetwork = {
    1: "Ethereum Mainnet",
    11155111: "Ethereum Sepolia",
    84532: "Base Sepolia",
    421614: "Arbitrum Sepolia",
    11155420: "OP Sepolia",
    43113: "Avalanche Fuji",
    2810: "Morph Holesky",
    1043: "BlockDAG Primordial",
  };

  const displayName =
    chainIdToNetwork[chainId] || networkName || "Unknown Network";

  return {
    name: displayName,
    chainId: chainId,
    display: chainId ? `${displayName} (${chainId})` : displayName,
    isDynamic: validation.hasDynamicData,
    isLegacy: validation.hasLegacyData,
  };
};

/**
 * Test agent data migration readiness and fee display accuracy
 * @param {Array} agents - Array of agent objects
 * @returns {Object} Migration test results
 */
export const testAgentDataMigration = (agents) => {
  console.log("🔄 TESTING AGENT DATA MIGRATION READINESS");
  console.log("=".repeat(50));

  const results = agents.map((agent) => {
    const validation = validateAgentData(agent);
    const feeInfo = formatInteractionFee(agent);
    const networkInfo = getAgentNetworkInfo(agent);

    return {
      agentId: agent.id,
      agentName: agent.name || agent.agent_name,
      currentFeeDisplay: feeInfo.display,
      feeDataSource: feeInfo.source,
      feeAmount: feeInfo.amount,
      feeToken: feeInfo.token,
      networkDisplay: networkInfo.display,
      isDynamicData: validation.hasDynamicData,
      hasErrors: !validation.isComplete,
      feeValidation: validation.interactionFeeValidation,
      errors: validation.missingFields,
      warnings: validation.interactionFeeValidation.warnings,
    };
  });

  const dynamicCount = results.filter((r) => r.isDynamicData).length;
  const errorCount = results.filter((r) => r.hasErrors).length;
  const fallbackCount = results.filter((r) =>
    r.feeDataSource.includes("fallback")
  ).length;

  console.log(`📊 MIGRATION READINESS SUMMARY:`);
  console.log(`- Total agents tested: ${results.length}`);
  console.log(`- Using dynamic data: ${dynamicCount}`);
  console.log(`- Using legacy data: ${results.length - dynamicCount}`);
  console.log(`- Agents with errors: ${errorCount}`);
  console.log(`- Using fallback fees: ${fallbackCount}`);
  console.log(`- Migration ready: ${results.length - errorCount}`);

  // Log specific fee information for debugging
  console.log("\n💰 INTERACTION FEE ANALYSIS:");
  results.forEach((result) => {
    console.log(
      `- ${result.agentName}: ${result.currentFeeDisplay} (${result.feeDataSource})`
    );
  });

  return {
    results,
    summary: {
      total: results.length,
      dynamicData: dynamicCount,
      legacyData: results.length - dynamicCount,
      errors: errorCount,
      fallbackFees: fallbackCount,
      migrationReady: results.length - errorCount,
    },
  };
};
export const validateNetworkCompatibility = (agent, userNetwork) => {
  // Use dynamic deployment data with fallback to legacy
  const agentChainId = agent.deployment_chain_id || agent.chain_id;
  const agentNetworkName = agent.deployment_network_name || agent.network;

  if (!agentChainId) {
    return {
      compatible: false,
      message: "Agent deployment network information is missing",
      severity: "error",
      action: "contact_support",
    };
  }

  if (agentChainId !== userNetwork.chainId) {
    return {
      compatible: false,
      message: `This agent is deployed on ${agentNetworkName} (Chain ${agentChainId}). Please switch to this network to interact.`,
      severity: "warning",
      action: "switch_network",
      requiredNetwork: {
        chainId: agentChainId,
        name: agentNetworkName,
        rpcUrl: agent.payment_config?.network_info?.rpcUrl,
      },
      userNetwork: {
        chainId: userNetwork.chainId,
        name: userNetwork.name,
      },
    };
  }

  return {
    compatible: true,
    message: `Networks compatible: ${agentNetworkName}`,
    severity: "success",
    action: "proceed",
  };
};

/**
 * Gets comprehensive agent payment configuration with dynamic data support
 * @param {Object} agent - Agent object from database
 * @returns {Object} Normalized payment configuration
 */
export const getAgentPaymentConfig = (agent) => {
  const validation = validateAgentData(agent);

  return {
    // Use dynamic fields with fallback to legacy
    chainId: agent.deployment_chain_id || agent.chain_id,
    networkName: agent.deployment_network_name || agent.network,
    interactionFee: agent.interaction_fee_amount || agent.interaction_fee,
    feeToken: agent.interaction_fee_token || agent.currency_type || "USDC",

    // Wallet addresses (prioritize payment config)
    walletAddress:
      agent.payment_config?.wallet_address ||
      agent.wallet_address ||
      agent.deployer_address ||
      agent.payment_recipient_address,

    // Token and network info
    tokenAddress: agent.token_address,
    networkConfig: agent.payment_config?.network_info,

    // Metadata
    supportedTokens: agent.payment_config?.supported_tokens || [
      agent.interaction_fee_token || agent.currency_type || "USDC",
    ],
    deploymentStatus: agent.deployment_status || "active",
    deployedAt: agent.deployed_at || agent.created_at,

    // Data source tracking
    isUsingDynamicData: validation.hasDynamicData,
    dataSource: validation.dataSource,
    dataCompleteness: validation,

    // Enhanced features
    hasNetworkConfig: !!agent.payment_config?.network_info,
    supportsMultipleTokens: !!(
      agent.payment_config?.supported_tokens &&
      agent.payment_config.supported_tokens.length > 1
    ),

    // Migration status
    needsUpgrade:
      validation.dataSource === "legacy" && !validation.hasDynamicData,
  };
};

/**
 * Analyzes a collection of agents for data migration insights
 * @param {Array} agents - Array of agent objects
 * @returns {Object} Analysis results and recommendations
 */
export const analyzeAgentDataMigration = (agents) => {
  if (!agents || agents.length === 0) {
    return {
      totalAgents: 0,
      analysis: "No agents found",
      recommendations: ["Deploy some agents to analyze data structure"],
    };
  }

  const analysis = {
    totalAgents: agents.length,
    withDynamicData: 0,
    withLegacyData: 0,
    withIncompleteData: 0,
    withPaymentConfig: 0,
    uniqueNetworks: new Set(),
    uniqueTokens: new Set(),
    recommendations: [],
  };

  agents.forEach((agent) => {
    const validation = validateAgentData(agent);

    if (validation.hasDynamicData) {
      analysis.withDynamicData++;
    } else if (validation.hasLegacyData) {
      analysis.withLegacyData++;
    } else {
      analysis.withIncompleteData++;
    }

    if (validation.hasPaymentConfig) {
      analysis.withPaymentConfig++;
    }

    // Track networks and tokens
    const config = getAgentPaymentConfig(agent);
    if (config.networkName) analysis.uniqueNetworks.add(config.networkName);
    if (config.feeToken) analysis.uniqueTokens.add(config.feeToken);
  });

  // Convert sets to arrays for serialization
  analysis.uniqueNetworks = Array.from(analysis.uniqueNetworks);
  analysis.uniqueTokens = Array.from(analysis.uniqueTokens);

  // Generate recommendations
  if (analysis.withLegacyData > 0) {
    analysis.recommendations.push(
      `${analysis.withLegacyData} agents using legacy data structure - consider migration to dynamic deployment fields`
    );
  }

  if (analysis.withIncompleteData > 0) {
    analysis.recommendations.push(
      `${analysis.withIncompleteData} agents have incomplete payment configuration`
    );
  }

  if (analysis.withDynamicData > 0) {
    analysis.recommendations.push(
      `${analysis.withDynamicData} agents already using dynamic deployment data - ready for enhanced features`
    );
  }

  if (analysis.uniqueNetworks.length > 1) {
    analysis.recommendations.push(
      `Multi-network deployment detected (${analysis.uniqueNetworks.length} networks) - ensure network switching is properly configured`
    );
  }

  return analysis;
};

/**
 * Tests QR generation with both legacy and dynamic data
 * @param {Object} agent - Agent object to test
 * @returns {Promise<Object>} Test results
 */
export const testDynamicQRGeneration = async (agent) => {
  const results = {
    agentId: agent.id,
    agentName: agent.name,
    dataValidation: validateAgentData(agent),
    paymentConfig: getAgentPaymentConfig(agent),
    qrGenerationTest: null,
    errors: [],
  };

  try {
    // Test QR generation with dynamic service
    const qrData = await dynamicQRService.generateDynamicQR(agent, 1);

    results.qrGenerationTest = {
      success: true,
      qrCodeGenerated: !!qrData.qrCodeUrl,
      networkDetected: qrData.networkInfo?.name,
      paymentAmount: qrData.tokenInfo?.amount,
      paymentToken: qrData.tokenInfo?.symbol,
      recipientAddress: qrData.recipientAddress,
      usingDynamicData: qrData.agentInfo?.hasDynamicData,
    };
  } catch (error) {
    results.qrGenerationTest = {
      success: false,
      error: error.message,
    };
    results.errors.push(`QR Generation: ${error.message}`);
  }

  return results;
};

/**
 * Enhanced agent data query selector for Supabase
 * Returns SQL selector string that includes both legacy and dynamic fields
 */
export const getEnhancedAgentDataSelector = () => {
  return `
    id,
    name,
    description,
    latitude,
    longitude,
    altitude,
    object_type,
    agent_type,
    user_id,
    created_at,
    is_active,
    
    /* Legacy payment fields (for backward compatibility) */
    token_address,
    token_symbol,
    chain_id,
    deployer_wallet_address,
    payment_recipient_address,
    agent_wallet_address,
    interaction_fee,
    interaction_fee_usdfc,
    currency_type,
    network,
    
    /* Dynamic deployment fields (when available) */
    deployment_network_name,
    deployment_chain_id,
    deployment_network_id,
    interaction_fee_amount,
    interaction_fee_token,
    payment_config,
    deployer_address,
    deployed_at,
    deployment_status,
    
    /* Communication and features */
    text_chat,
    voice_chat,
    video_chat,
    interaction_range,
    mcp_services,
    features
  `;
};

/**
 * Logs detailed agent data analysis for debugging
 * @param {Array} agents - Array of agent objects
 */
export const logAgentDataAnalysis = (agents) => {
  console.log("🔍 Agent Data Analysis:");

  const analysis = analyzeAgentDataMigration(agents);

  console.log(`📊 Total Agents: ${analysis.totalAgents}`);
  console.log(`🆕 With Dynamic Data: ${analysis.withDynamicData}`);
  console.log(`📋 With Legacy Data: ${analysis.withLegacyData}`);
  console.log(`⚠️ With Incomplete Data: ${analysis.withIncompleteData}`);
  console.log(`💳 With Payment Config: ${analysis.withPaymentConfig}`);
  console.log(`🌐 Networks: ${analysis.uniqueNetworks.join(", ")}`);
  console.log(`💰 Tokens: ${analysis.uniqueTokens.join(", ")}`);

  if (analysis.recommendations.length > 0) {
    console.log("💡 Recommendations:");
    analysis.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  return analysis;
};

export default {
  validateAgentData,
  validateInteractionFeeFields,
  formatInteractionFee,
  getAgentNetworkInfo,
  testAgentDataMigration,
  validateNetworkCompatibility,
  getAgentPaymentConfig,
  analyzeAgentDataMigration,
  testDynamicQRGeneration,
  getEnhancedAgentDataSelector,
  logAgentDataAnalysis,
};
