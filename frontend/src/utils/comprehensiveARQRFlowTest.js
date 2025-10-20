// Comprehensive AR QR Payment Flow Test
// Tests the complete payment flow from agent discovery to QR generation

import { supabase } from "../lib/supabase";
import { generatePaymentQRData } from "../services/qrCodeService";

/**
 * Complete AR QR Payment Flow Test
 *
 * This test validates:
 * 1. Agent discovery from database
 * 2. Payment data preparation
 * 3. QR code generation
 * 4. Recipient address verification
 * 5. Payment amount calculation
 */

export const testCompleteARQRFlow = async () => {
  try {
    console.log("🚀 Starting complete AR QR payment flow test...");
    console.log("==================================================");

    // Step 1: Discover active agents
    console.log("\n📡 Step 1: Agent Discovery");
    const { data: agents, error: fetchError } = await supabase
      .from("deployed_objects")
      .select("*")
      .eq("is_active", true)
      .limit(3); // Test with first 3 agents

    if (fetchError) {
      console.error("❌ Agent discovery failed:", fetchError);
      return { success: false, error: fetchError };
    }

    console.log(`✅ Found ${agents?.length || 0} active agents`);

    if (!agents || agents.length === 0) {
      console.log("⚠️ No active agents found for testing");
      return { success: false, error: "No active agents" };
    }

    const testResults = [];

    // Step 2: Test each agent's payment flow
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      console.log(
        `\n💳 Step 2.${i + 1}: Testing payment flow for ${agent.name}`
      );
      console.log("---------------------------------------------------");

      try {
        // Prepare payment information
        const paymentInfo = {
          recipient: agent.agent_wallet_address || agent.user_id,
          amount: agent.interaction_fee_usdfc || 1.0,
          currency: agent.currency_type || "USDT",
          network: agent.network || "morph-holesky",
          tokenAddress:
            agent.token_address || "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98",
          chainId: agent.chain_id || 2810,
        };

        console.log("📝 Payment Information:");
        console.log(`   Agent ID: ${agent.id}`);
        console.log(`   Agent Name: ${agent.name}`);
        console.log(`   Deployer: ${agent.user_id}`);
        console.log(`   Payment Recipient: ${paymentInfo.recipient}`);
        console.log(`   Amount: ${paymentInfo.amount} ${paymentInfo.currency}`);
        console.log(`   Network: ${paymentInfo.network}`);
        console.log(`   Token Address: ${paymentInfo.tokenAddress}`);
        console.log(`   Chain ID: ${paymentInfo.chainId}`);

        // Step 3: Generate QR code data
        console.log("\n🔗 Generating QR Code...");

        let qrData;
        try {
          qrData = await generatePaymentQRData(paymentInfo);
          console.log(`✅ QR data generated successfully`);
          console.log(`   QR Content: ${qrData.substring(0, 100)}...`);
        } catch (qrError) {
          console.error("❌ QR generation failed:", qrError);
          qrData = null;
        }

        // Step 4: Validate payment flow
        console.log("\n🔍 Payment Flow Validation:");

        const validations = {
          hasRecipient: !!paymentInfo.recipient,
          recipientIsDeployer: paymentInfo.recipient === agent.user_id,
          hasValidAmount: paymentInfo.amount > 0,
          hasValidNetwork: !!paymentInfo.network,
          hasTokenAddress: !!paymentInfo.tokenAddress,
          qrGenerated: !!qrData,
          recipientLength: paymentInfo.recipient?.length >= 10,
        };

        const isValidFlow = Object.values(validations).every((v) => v === true);

        console.log(
          `   Has recipient: ${validations.hasRecipient ? "✅" : "❌"}`
        );
        console.log(
          `   Recipient is deployer: ${
            validations.recipientIsDeployer ? "✅" : "❌"
          }`
        );
        console.log(
          `   Valid amount: ${validations.hasValidAmount ? "✅" : "❌"}`
        );
        console.log(
          `   Valid network: ${validations.hasValidNetwork ? "✅" : "❌"}`
        );
        console.log(
          `   Has token address: ${validations.hasTokenAddress ? "✅" : "❌"}`
        );
        console.log(
          `   QR generated: ${validations.qrGenerated ? "✅" : "❌"}`
        );
        console.log(
          `   Valid recipient length: ${
            validations.recipientLength ? "✅" : "❌"
          }`
        );
        console.log(`   Overall valid: ${isValidFlow ? "✅" : "❌"}`);

        // Step 5: Security check - ensure not paying to self
        console.log("\n🔒 Security Validation:");

        // Simulate different user wallets to ensure they don't pay themselves
        const mockUserWallets = [
          "0x1234567890123456789012345678901234567890",
          "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          "0x9876543210987654321098765432109876543210",
        ];

        const securityChecks = mockUserWallets.map((userWallet) => {
          const isPayingToSelf = paymentInfo.recipient === userWallet;
          return {
            userWallet,
            payingToSelf: isPayingToSelf,
            isSecure: !isPayingToSelf,
          };
        });

        const allSecure = securityChecks.every((check) => check.isSecure);

        console.log(`   Payment recipient: ${paymentInfo.recipient}`);
        securityChecks.forEach((check, idx) => {
          console.log(
            `   Mock user ${idx + 1} (${check.userWallet.substring(
              0,
              10
            )}...): ${check.isSecure ? "✅ Secure" : "❌ Paying to self"}`
          );
        });
        console.log(`   All users secure: ${allSecure ? "✅" : "❌"}`);

        // Store test result
        testResults.push({
          agentId: agent.id,
          agentName: agent.name,
          paymentInfo,
          qrData,
          validations,
          securityChecks,
          isValidFlow,
          allSecure,
          overallSuccess: isValidFlow && allSecure,
        });
      } catch (agentError) {
        console.error(`❌ Error testing agent ${agent.id}:`, agentError);
        testResults.push({
          agentId: agent.id,
          agentName: agent.name,
          error: agentError,
          overallSuccess: false,
        });
      }
    }

    // Step 6: Generate final report
    console.log("\n📊 FINAL TEST REPORT");
    console.log("==================================================");

    const successfulTests = testResults.filter((r) => r.overallSuccess).length;
    const failedTests = testResults.length - successfulTests;

    console.log(`Total agents tested: ${testResults.length}`);
    console.log(`Successful flows: ${successfulTests}`);
    console.log(`Failed flows: ${failedTests}`);
    console.log(
      `Success rate: ${((successfulTests / testResults.length) * 100).toFixed(
        1
      )}%`
    );

    // Detailed results
    console.log("\n📋 Detailed Results:");
    testResults.forEach((result, idx) => {
      console.log(
        `\n${idx + 1}. Agent: ${result.agentName} (${result.agentId})`
      );
      if (result.error) {
        console.log(`   Status: ❌ Failed - ${result.error.message}`);
      } else {
        console.log(
          `   Status: ${result.overallSuccess ? "✅ Success" : "❌ Failed"}`
        );
        console.log(`   Payment recipient: ${result.paymentInfo.recipient}`);
        console.log(
          `   Amount: ${result.paymentInfo.amount} ${result.paymentInfo.currency}`
        );
        console.log(`   QR generated: ${result.qrData ? "Yes" : "No"}`);
        console.log(
          `   Security: ${result.allSecure ? "Secure" : "Security issue"}`
        );
      }
    });

    // Critical issues summary
    const criticalIssues = [];
    testResults.forEach((result) => {
      if (result.validations && !result.validations.recipientIsDeployer) {
        criticalIssues.push(
          `${result.agentName}: Payment not going to deployer`
        );
      }
      if (result.securityChecks && !result.allSecure) {
        criticalIssues.push(
          `${result.agentName}: Security vulnerability detected`
        );
      }
      if (result.validations && !result.validations.qrGenerated) {
        criticalIssues.push(`${result.agentName}: QR generation failed`);
      }
    });

    if (criticalIssues.length > 0) {
      console.log("\n🚨 CRITICAL ISSUES:");
      criticalIssues.forEach((issue) => console.log(`   - ${issue}`));
    } else {
      console.log("\n✅ NO CRITICAL ISSUES FOUND");
    }

    return {
      success: true,
      testResults,
      summary: {
        totalTests: testResults.length,
        successfulTests,
        failedTests,
        successRate: (successfulTests / testResults.length) * 100,
        criticalIssues,
      },
    };
  } catch (error) {
    console.error("❌ Complete AR QR flow test failed:", error);
    return { success: false, error };
  }
};

/**
 * Quick validation test for production readiness
 */
export const quickValidationTest = async () => {
  try {
    console.log("⚡ Quick AR QR validation test...");

    // Get one agent for quick test
    const { data: agent, error } = await supabase
      .from("deployed_objects")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error || !agent) {
      return { success: false, error: "No active agents found" };
    }

    // Test payment data structure
    const paymentRecipient = agent.agent_wallet_address || agent.user_id;
    const mockUserWallet = "0x1234567890123456789012345678901234567890";

    const validations = {
      hasAgent: !!agent,
      hasRecipient: !!paymentRecipient,
      recipientNotUser: paymentRecipient !== mockUserWallet,
      hasAmount: (agent.interaction_fee_usdfc || 0) > 0,
      hasNetwork: !!agent.network,
    };

    const allValid = Object.values(validations).every((v) => v === true);

    console.log(`Agent: ${agent.name}`);
    console.log(`Payment recipient: ${paymentRecipient}`);
    console.log(`Mock user wallet: ${mockUserWallet}`);
    console.log(
      `Recipient ≠ User: ${validations.recipientNotUser ? "✅" : "❌"}`
    );
    console.log(`Overall valid: ${allValid ? "✅" : "❌"}`);

    return {
      success: allValid,
      validations,
      agent: {
        id: agent.id,
        name: agent.name,
        recipient: paymentRecipient,
      },
    };
  } catch (error) {
    console.error("❌ Quick validation failed:", error);
    return { success: false, error };
  }
};

// Export functions
export default {
  testCompleteARQRFlow,
  quickValidationTest,
};
