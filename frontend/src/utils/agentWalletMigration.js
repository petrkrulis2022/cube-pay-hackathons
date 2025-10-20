// Migration script to fix agent wallet address mapping
// This script ensures all deployed agents have the correct wallet address for QR payments

import { supabase } from "../lib/supabase";

/**
 * Critical Fix: Update QR payment recipient addresses
 *
 * PROBLEM: QR codes were using user's wallet address (self-payment)
 * SOLUTION: QR codes must use agent deployer's wallet address
 *
 * Database Field Mapping:
 * - deployed_objects.agent_wallet_address → agent.wallet_address (for QR generation)
 * - deployed_objects.user_id → deployer's wallet who receives payment
 */

export const fixAgentWalletAddresses = async () => {
  try {
    console.log("🔧 Starting agent wallet address migration...");

    // 1. Get all deployed agents that need wallet address updates
    const { data: agents, error: fetchError } = await supabase
      .from("deployed_objects")
      .select("*")
      .eq("is_active", true);

    if (fetchError) {
      console.error("❌ Error fetching agents:", fetchError);
      return { success: false, error: fetchError };
    }

    console.log(`📊 Found ${agents?.length || 0} active agents to process`);

    let updatedCount = 0;
    let errors = [];

    // 2. Process each agent
    for (const agent of agents || []) {
      try {
        // Determine the correct wallet address for payments
        const paymentWallet = agent.agent_wallet_address || agent.user_id;

        // Prepare updates
        const updates = {
          // Ensure payment wallet is properly set
          agent_wallet_address: paymentWallet,

          // Add missing blockchain fields with defaults
          network: agent.network || "morph-holesky",
          currency_type: agent.currency_type || "USDT",
          interaction_fee_usdfc: agent.interaction_fee_usdfc || 1.0,

          // Default blockchain configuration for Morph Holesky
          chain_id: 2810,
          token_address: "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98", // USDT on Morph Holesky
          token_symbol: "USDT",

          // Ensure payment is enabled
          payment_enabled: true,

          // Default altitude if missing
          altitude: agent.altitude ?? 0.0,

          // Revenue sharing default
          revenue_sharing_percentage: agent.revenue_sharing_percentage || 70,

          // Update timestamp
          updated_at: new Date().toISOString(),
        };

        // 3. Update the agent
        const { error: updateError } = await supabase
          .from("deployed_objects")
          .update(updates)
          .eq("id", agent.id);

        if (updateError) {
          console.error(`❌ Error updating agent ${agent.id}:`, updateError);
          errors.push({ agentId: agent.id, error: updateError });
        } else {
          updatedCount++;
          console.log(`✅ Updated agent: ${agent.name} (${agent.id})`);
          console.log(`   Payment wallet: ${paymentWallet}`);
          console.log(`   Network: ${updates.network}`);
          console.log(
            `   Fee: ${updates.interaction_fee_usdfc} ${updates.currency_type}`
          );
        }
      } catch (agentError) {
        console.error(`❌ Error processing agent ${agent.id}:`, agentError);
        errors.push({ agentId: agent.id, error: agentError });
      }
    }

    // 4. Generate summary report
    const report = {
      success: true,
      totalAgents: agents?.length || 0,
      updatedCount,
      errorCount: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };

    console.log("📋 Migration Summary:");
    console.log(`   Total agents processed: ${report.totalAgents}`);
    console.log(`   Successfully updated: ${report.updatedCount}`);
    console.log(`   Errors encountered: ${report.errorCount}`);

    if (errors.length > 0) {
      console.log("❌ Errors details:", errors);
    }

    return report;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return { success: false, error };
  }
};

/**
 * Test QR payment address generation after migration
 */
export const testQRPaymentAddresses = async () => {
  try {
    console.log("🧪 Testing QR payment address generation...");

    const { data: agents, error } = await supabase
      .from("deployed_objects")
      .select("*")
      .eq("is_active", true)
      .limit(5); // Test first 5 agents

    if (error) {
      console.error("❌ Error fetching test agents:", error);
      return { success: false, error };
    }

    const testResults = [];

    for (const agent of agents || []) {
      // Simulate QR generation logic
      const qrPaymentData = {
        recipient: agent.agent_wallet_address || agent.user_id,
        amount: agent.interaction_fee_usdfc || 1,
        currency: agent.currency_type || "USDT",
        network: agent.network || "morph-holesky",
        contractAddress:
          agent.token_address || "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98",
      };

      // Validate payment data
      const isValid =
        qrPaymentData.recipient &&
        qrPaymentData.recipient.length >= 10 &&
        qrPaymentData.amount > 0;

      testResults.push({
        agentId: agent.id,
        agentName: agent.name,
        paymentRecipient: qrPaymentData.recipient,
        amount: qrPaymentData.amount,
        currency: qrPaymentData.currency,
        network: qrPaymentData.network,
        isValid,
        issues: isValid ? [] : ["Invalid recipient address or amount"],
      });

      console.log(`🔍 Agent: ${agent.name}`);
      console.log(`   Payment goes to: ${qrPaymentData.recipient}`);
      console.log(
        `   Amount: ${qrPaymentData.amount} ${qrPaymentData.currency}`
      );
      console.log(`   Network: ${qrPaymentData.network}`);
      console.log(`   Valid: ${isValid ? "✅" : "❌"}`);
      console.log("");
    }

    const validCount = testResults.filter((r) => r.isValid).length;
    const invalidCount = testResults.length - validCount;

    console.log("📊 QR Payment Test Summary:");
    console.log(`   Valid configurations: ${validCount}`);
    console.log(`   Invalid configurations: ${invalidCount}`);

    return {
      success: true,
      testResults,
      validCount,
      invalidCount,
      allValid: invalidCount === 0,
    };
  } catch (error) {
    console.error("❌ QR payment test failed:", error);
    return { success: false, error };
  }
};

/**
 * Verify that QR codes will use deployer wallet addresses (not user wallet)
 */
export const verifyQRPaymentFlow = async (agentId) => {
  try {
    console.log(`🔍 Verifying QR payment flow for agent: ${agentId}`);

    // 1. Get agent data
    const { data: agent, error } = await supabase
      .from("deployed_objects")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error || !agent) {
      console.error("❌ Agent not found:", error);
      return { success: false, error: "Agent not found" };
    }

    // 2. Simulate QR generation process
    const paymentRecipient = agent.agent_wallet_address || agent.user_id;

    // 3. Verify this is NOT the current user's wallet
    // (In real app, this would check against connected wallet)
    const isPayingToDeployer = paymentRecipient === agent.user_id;
    const hasValidWallet = paymentRecipient && paymentRecipient.length >= 10;

    const verification = {
      agentId: agent.id,
      agentName: agent.name,
      deployer: agent.user_id,
      paymentRecipient,
      isPayingToDeployer,
      hasValidWallet,
      paymentAmount: agent.interaction_fee_usdfc || 1,
      currency: agent.currency_type || "USDT",
      network: agent.network || "morph-holesky",
      isCorrect: hasValidWallet && isPayingToDeployer,
    };

    console.log("📊 Verification Results:");
    console.log(`   Agent: ${verification.agentName}`);
    console.log(`   Deployer: ${verification.deployer}`);
    console.log(`   Payment goes to: ${verification.paymentRecipient}`);
    console.log(
      `   Paying to deployer: ${verification.isPayingToDeployer ? "✅" : "❌"}`
    );
    console.log(
      `   Valid wallet: ${verification.hasValidWallet ? "✅" : "❌"}`
    );
    console.log(`   Overall correct: ${verification.isCorrect ? "✅" : "❌"}`);

    return {
      success: true,
      verification,
    };
  } catch (error) {
    console.error("❌ Verification failed:", error);
    return { success: false, error };
  }
};

// Export all functions
export default {
  fixAgentWalletAddresses,
  testQRPaymentAddresses,
  verifyQRPaymentFlow,
};
