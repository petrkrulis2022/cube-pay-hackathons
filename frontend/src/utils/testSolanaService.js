// Test Solana Payment Service functionality
import {
  generateSolanaAgentPayment,
  generateSolanaPaymentQRData,
  testSolanaPayQR,
  switchSolanaNetwork,
  getCurrentNetwork,
  validateSolanaPayFormat,
  testUSDCDevnetQR,
  USDC_DEVNET_CONFIG,
  SOLANA_NETWORKS,
} from "../services/solanaPaymentService.js";

// Simple test agent for testing
const testAgent = {
  id: "test-001",
  name: "Test AR Agent",
  type: "test",
  location: "Virtual Space",
};

// Test SOL payments on Testnet
export const testSOLPayments = () => {
  console.log("🔵 TESTING SOL PAYMENTS ON TESTNET");
  console.log("==================================");

  try {
    // Switch to Testnet
    switchSolanaNetwork("TESTNET");
    console.log("Network:", getCurrentNetwork());

    // Test SOL payment generation
    const solTest = testSolanaPayQR(testAgent, "SOL", "TESTNET");

    console.log("✅ SOL Test Results:");
    console.log("- Valid:", solTest.isValid);
    console.log("- QR Data:", solTest.qrData);
    console.log("- Payment Type:", solTest.paymentType);

    return solTest;
  } catch (error) {
    console.error("❌ SOL Test Failed:", error);
    return { isValid: false, error: error.message };
  }
};

// Test USDC payments on Devnet
export const testUSDCPayments = () => {
  console.log("🟢 TESTING USDC PAYMENTS ON DEVNET");
  console.log("===================================");

  try {
    // Test USDC payment generation
    const usdcTest = testUSDCDevnetQR(testAgent);

    console.log("✅ USDC Test Results:");
    console.log("- Valid:", usdcTest.isValid);
    console.log("- QR Data:", usdcTest.qrData);
    console.log("- Token Address:", USDC_DEVNET_CONFIG.mintAddress);

    return usdcTest;
  } catch (error) {
    console.error("❌ USDC Test Failed:", error);
    return { isValid: false, error: error.message };
  }
};

// Test QR format validation
export const testQRValidation = () => {
  console.log("🔍 TESTING QR FORMAT VALIDATION");
  console.log("==============================");

  const testCases = [
    // Valid SOL QR
    "solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1.0&label=Test%20Payment",

    // Valid USDC QR
    `solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?spl-token=${USDC_DEVNET_CONFIG.mintAddress}&amount=10.000000&label=USDC%20Payment`,

    // Invalid format
    "bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.1",

    // Missing amount
    "solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?label=Test",
  ];

  const results = testCases.map((qrData, index) => {
    const isValid = validateSolanaPayFormat(qrData);
    console.log(
      `Test ${index + 1}: ${isValid ? "✅" : "❌"} - ${qrData.substring(
        0,
        50
      )}...`
    );
    return { qrData, isValid };
  });

  return results;
};

// Run comprehensive test suite
export const runComprehensiveTests = () => {
  console.log("🚀 COMPREHENSIVE SOLANA PAYMENT SERVICE TESTS");
  console.log("============================================");

  const results = {
    timestamp: new Date().toISOString(),
    sol: testSOLPayments(),
    usdc: testUSDCPayments(),
    validation: testQRValidation(),
    summary: {},
  };

  // Generate summary
  results.summary = {
    solValid: results.sol.isValid,
    usdcValid: results.usdc.isValid,
    validationPassed: results.validation.filter((r) => r.isValid).length,
    validationTotal: results.validation.length,
    overallStatus:
      results.sol.isValid && results.usdc.isValid
        ? "✅ ALL TESTS PASSED"
        : "❌ SOME TESTS FAILED",
  };

  console.log("📊 TEST SUMMARY:");
  console.log("================");
  console.log("SOL Payments:", results.summary.solValid ? "✅" : "❌");
  console.log("USDC Payments:", results.summary.usdcValid ? "✅" : "❌");
  console.log(
    `QR Validation: ${results.summary.validationPassed}/${results.summary.validationTotal} passed`
  );
  console.log("Overall Status:", results.summary.overallStatus);

  return results;
};

// Make tests available globally for browser console testing
if (typeof window !== "undefined") {
  window.testSOLPayments = testSOLPayments;
  window.testUSDCPayments = testUSDCPayments;
  window.testQRValidation = testQRValidation;
  window.runComprehensiveTests = runComprehensiveTests;

  console.log("🧪 Solana Payment Service Tests Available:");
  console.log("- testSOLPayments(): Test SOL on Testnet");
  console.log("- testUSDCPayments(): Test USDC on Devnet");
  console.log("- testQRValidation(): Test QR format validation");
  console.log("- runComprehensiveTests(): Run all tests");
}

export default {
  testSOLPayments,
  testUSDCPayments,
  testQRValidation,
  runComprehensiveTests,
  testAgent,
};
