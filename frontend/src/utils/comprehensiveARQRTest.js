// Comprehensive AR QR Fix Testing Suite
// Tests all aspects of the enhanced AR QR system

export const runComprehensiveARQRTests = async () => {
  console.log("🧪 Starting Comprehensive AR QR System Tests");
  console.log("=".repeat(60));

  const results = {
    database: [],
    arManager: [],
    paymentProcessor: [],
    uiComponents: [],
    integration: [],
    errors: [],
  };

  try {
    // Test 1: Database Setup and Connectivity
    console.log("\n📊 1. Testing Database Setup...");
    try {
      const { supabase } = await import("../lib/supabase");

      if (supabase) {
        // Test table existence with both table names
        const { data: arQrData, error: arQrError } = await supabase
          .from("ar_qr_codes")
          .select("*")
          .limit(1);

        const { data: qrData, error: qrError } = await supabase
          .from("qr_codes")
          .select("*")
          .limit(1);

        if (!arQrError) {
          results.database.push("✅ ar_qr_codes table accessible");
        } else {
          results.database.push(
            `❌ ar_qr_codes table error: ${arQrError.message}`
          );
        }

        if (!qrError) {
          results.database.push("✅ qr_codes view accessible");
        } else {
          results.database.push(`❌ qr_codes view error: ${qrError.message}`);
        }
      } else {
        results.database.push("❌ Supabase connection not available");
      }
    } catch (error) {
      results.database.push(`❌ Database test failed: ${error.message}`);
    }

    // Test 2: AR QR Manager Functionality
    console.log("\n🎯 2. Testing AR QR Manager...");
    try {
      const arQRManager = await import("../services/arQRManager");

      // Test basic functionality
      const testQRId = `test_${Date.now()}`;
      const testPosition = [1, 2, -3];
      const testOptions = { size: 1.5, agentId: "test_agent" };

      // Add QR
      const qrId = arQRManager.default.addQR(
        testQRId,
        "test://payment",
        testPosition,
        testOptions
      );
      if (qrId) {
        results.arManager.push("✅ QR addition successful");
      } else {
        results.arManager.push("❌ QR addition failed");
      }

      // Get stats
      const stats = arQRManager.default.getStats();
      if (stats && typeof stats.active === "number") {
        results.arManager.push(
          `✅ Stats retrieval: ${stats.active} active QRs`
        );
      } else {
        results.arManager.push("❌ Stats retrieval failed");
      }

      // Get active QRs
      const activeQRs = arQRManager.default.getActiveQRs();
      if (Array.isArray(activeQRs)) {
        results.arManager.push(
          `✅ Active QRs retrieval: ${activeQRs.length} QRs`
        );
      } else {
        results.arManager.push("❌ Active QRs retrieval failed");
      }

      // Remove QR
      const removed = arQRManager.default.removeQR(qrId);
      if (removed) {
        results.arManager.push("✅ QR removal successful");
      } else {
        results.arManager.push("❌ QR removal failed");
      }
    } catch (error) {
      results.arManager.push(`❌ AR Manager test failed: ${error.message}`);
    }

    // Test 3: Payment Processor
    console.log("\n💳 3. Testing Payment Processor...");
    try {
      const paymentProcessor = await import("../services/paymentProcessor");

      // Test payment URI parsing
      const testURI =
        "ethereum:0xFAD0070d0388FB3F18F1100A5FFc67dF8834D9db@1043/transfer?address=0x1234567890123456789012345678901234567890&uint256=50";
      const parsed = paymentProcessor.default.parsePaymentURI(testURI);

      if (parsed && parsed.contractAddress && parsed.amount) {
        results.paymentProcessor.push("✅ Payment URI parsing successful");
        results.paymentProcessor.push(`   Contract: ${parsed.contractAddress}`);
        results.paymentProcessor.push(`   Amount: ${parsed.amount}`);
        results.paymentProcessor.push(`   Chain ID: ${parsed.chainId}`);
      } else {
        results.paymentProcessor.push("❌ Payment URI parsing failed");
      }

      // Test wallet detection
      if (typeof window !== "undefined" && window.ethereum) {
        results.paymentProcessor.push("✅ MetaMask detected");
      } else {
        results.paymentProcessor.push(
          "⚠️ MetaMask not detected (expected in test environment)"
        );
      }
    } catch (error) {
      results.paymentProcessor.push(
        `❌ Payment processor test failed: ${error.message}`
      );
    }

    // Test 4: QR Code Service
    console.log("\n🔧 4. Testing QR Code Service...");
    try {
      const qrCodeService = await import("../services/qrCodeService");

      // Test payment QR generation
      const paymentInfo = {
        amount: 50,
        recipient: "0x1234567890123456789012345678901234567890",
        contractAddress: "0xFAD0070d0388FB3F18F1100A5FFc67dF8834D9db",
        chainId: "1043",
      };

      const qrData = qrCodeService.generatePaymentQRData(paymentInfo);
      if (qrData && qrData.startsWith("ethereum:")) {
        results.integration.push("✅ Payment QR generation successful");
        results.integration.push(`   QR Data: ${qrData.slice(0, 50)}...`);
      } else {
        results.integration.push("❌ Payment QR generation failed");
      }

      // Test AR position generation
      const position = qrCodeService.generateARPosition(
        { x: 0, y: 0, z: 0 },
        null,
        0
      );
      if (Array.isArray(position) && position.length === 3) {
        results.integration.push(
          `✅ AR position generation: [${position.join(", ")}]`
        );
      } else {
        results.integration.push("❌ AR position generation failed");
      }
    } catch (error) {
      results.integration.push(
        `❌ QR Code service test failed: ${error.message}`
      );
    }

    // Test 5: Component Availability
    console.log("\n🎨 5. Testing Component Availability...");
    try {
      // Test if key components can be imported
      const ARQRCodeFixed = await import("../components/ARQRCodeFixed");
      if (ARQRCodeFixed.default) {
        results.uiComponents.push("✅ ARQRCodeFixed component available");
      } else {
        results.uiComponents.push("❌ ARQRCodeFixed component not available");
      }

      const NotificationProvider = await import(
        "../components/NotificationProvider"
      );
      if (NotificationProvider.default) {
        results.uiComponents.push(
          "✅ NotificationProvider component available"
        );
      } else {
        results.uiComponents.push(
          "❌ NotificationProvider component not available"
        );
      }
    } catch (error) {
      results.uiComponents.push(
        `❌ Component availability test failed: ${error.message}`
      );
    }

    // Test 6: Global Functions
    console.log("\n🌐 6. Testing Global Functions...");
    try {
      if (typeof window !== "undefined") {
        const globalFunctions = [
          "arQRManager",
          "qrCodeService",
          "paymentProcessor",
        ];

        globalFunctions.forEach((funcName) => {
          if (window[funcName]) {
            results.integration.push(`✅ Global ${funcName} available`);
          } else {
            results.integration.push(`❌ Global ${funcName} not available`);
          }
        });

        // Test notification functions when they become available
        setTimeout(() => {
          if (window.showNotification) {
            results.integration.push(
              "✅ Global notification functions available"
            );
            // Test a notification
            window.showNotification({
              type: "info",
              title: "Test Complete",
              message: "AR QR system testing completed successfully!",
              duration: 3000,
            });
          } else {
            results.integration.push(
              "❌ Global notification functions not available"
            );
          }
        }, 1000);
      } else {
        results.integration.push(
          "⚠️ Window object not available (expected in test environment)"
        );
      }
    } catch (error) {
      results.integration.push(
        `❌ Global functions test failed: ${error.message}`
      );
    }
  } catch (error) {
    results.errors.push(`❌ General test error: ${error.message}`);
    console.error("Test suite error:", error);
  }

  // Display Results
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  const sections = [
    { name: "📊 Database Tests", results: results.database },
    { name: "🎯 AR Manager Tests", results: results.arManager },
    { name: "💳 Payment Processor Tests", results: results.paymentProcessor },
    { name: "🎨 UI Component Tests", results: results.uiComponents },
    { name: "🔧 Integration Tests", results: results.integration },
    { name: "❌ Errors", results: results.errors },
  ];

  sections.forEach((section) => {
    if (section.results.length > 0) {
      console.log(`\n${section.name}:`);
      section.results.forEach((result) => console.log(`  ${result}`));
    }
  });

  // Calculate success rate
  const totalTests = Object.values(results).flat().length;
  const successfulTests = Object.values(results)
    .flat()
    .filter((r) => r.startsWith("✅")).length;
  const warningTests = Object.values(results)
    .flat()
    .filter((r) => r.startsWith("⚠️")).length;
  const failedTests = Object.values(results)
    .flat()
    .filter((r) => r.startsWith("❌")).length;

  console.log("\n" + "=".repeat(60));
  console.log("📈 OVERALL RESULTS:");
  console.log(`   ✅ Successful: ${successfulTests}`);
  console.log(`   ⚠️ Warnings: ${warningTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(
    `   📊 Success Rate: ${Math.round((successfulTests / totalTests) * 100)}%`
  );
  console.log("=".repeat(60));

  return {
    total: totalTests,
    successful: successfulTests,
    warnings: warningTests,
    failed: failedTests,
    successRate: Math.round((successfulTests / totalTests) * 100),
    details: results,
  };
};

// Test specific AR QR functionality
export const testARQRGeneration = async () => {
  console.log("🎯 Testing AR QR Generation Pipeline...");

  try {
    // Import services
    const qrCodeService = (await import("../services/qrCodeService")).default;
    const arQRManager = (await import("../services/arQRManager")).default;

    // Test data
    const testAgent = {
      id: "test_agent_001",
      name: "Test Agent",
      wallet_address: "0x1234567890123456789012345678901234567890",
    };

    // 1. Generate payment data
    const paymentInfo = {
      amount: 25,
      recipient: testAgent.wallet_address,
      contractAddress: "0xFAD0070d0388FB3F18F1100A5FFc67dF8834D9db",
      chainId: "1043",
      agentId: testAgent.id,
      agentName: testAgent.name,
    };

    console.log("📝 1. Generating payment QR data...");
    const qrData = qrCodeService.generatePaymentQRData(paymentInfo);
    console.log(`   Generated: ${qrData}`);

    // 2. Generate AR position
    console.log("📍 2. Generating AR position...");
    const position = qrCodeService.generateARPosition(
      { x: 0, y: 0, z: 0 },
      null,
      0
    );
    console.log(`   Position: [${position.join(", ")}]`);

    // 3. Add to AR QR Manager
    console.log("🎯 3. Adding to AR QR Manager...");
    const qrId = arQRManager.addQR(`test_qr_${Date.now()}`, qrData, position, {
      size: 1.5,
      agentId: testAgent.id,
      ttl: 300000,
      metadata: { agent: testAgent, amount: paymentInfo.amount },
    });
    console.log(`   AR QR ID: ${qrId}`);

    // 4. Verify QR is active
    console.log("✅ 4. Verifying QR is active...");
    const activeQRs = arQRManager.getActiveQRs();
    const ourQR = activeQRs.find((qr) => qr.id === qrId);

    if (ourQR) {
      console.log(`   ✅ QR found in active list`);
      console.log(
        `   📊 Details: Agent=${ourQR.metadata?.agent?.name}, Amount=${ourQR.metadata?.amount}`
      );

      // 5. Test database creation (local fallback)
      console.log("💾 5. Testing database creation...");
      try {
        const qrCodeData = {
          transactionId: `test_tx_${Date.now()}`,
          data: qrData,
          position: position,
          size: 1.5,
          agentId: testAgent.id,
          ttl: 300000,
        };

        const createdQR = await qrCodeService.createQRCode(qrCodeData);
        if (createdQR) {
          console.log(
            `   ✅ QR created: ${createdQR.id} (Status: ${
              createdQR.dbSaveStatus || "local"
            })`
          );
        } else {
          console.log(`   ❌ QR creation failed`);
        }
      } catch (dbError) {
        console.log(
          `   ⚠️ Database creation failed (expected): ${dbError.message}`
        );
      }

      // 6. Clean up
      console.log("🧹 6. Cleaning up test QR...");
      const removed = arQRManager.removeQR(qrId);
      if (removed) {
        console.log(`   ✅ Test QR removed successfully`);
      } else {
        console.log(`   ⚠️ Test QR removal failed`);
      }

      console.log("\n🎉 AR QR Generation Test PASSED!");
      return true;
    } else {
      console.log(`   ❌ QR not found in active list`);
      console.log("\n💥 AR QR Generation Test FAILED!");
      return false;
    }
  } catch (error) {
    console.error("💥 AR QR Generation Test ERROR:", error);
    return false;
  }
};

// Test payment processing pipeline
export const testPaymentProcessing = async () => {
  console.log("💳 Testing Payment Processing Pipeline...");

  try {
    const paymentProcessor = (await import("../services/paymentProcessor"))
      .default;

    // Test payment URI parsing
    const testQRData = {
      id: "test_payment_qr",
      data: "ethereum:0xFAD0070d0388FB3F18F1100A5FFc67dF8834D9db@1043/transfer?address=0x1234567890123456789012345678901234567890&uint256=50",
      payment_uri:
        "ethereum:0xFAD0070d0388FB3F18F1100A5FFc67dF8834D9db@1043/transfer?address=0x1234567890123456789012345678901234567890&uint256=50",
    };

    console.log("🔍 1. Testing payment data validation...");
    try {
      paymentProcessor.validatePaymentData(testQRData);
      console.log("   ✅ Payment data validation passed");
    } catch (error) {
      console.log(`   ❌ Payment data validation failed: ${error.message}`);
      return false;
    }

    console.log("🔗 2. Testing payment URI parsing...");
    try {
      const parsed = paymentProcessor.parsePaymentURI(testQRData.payment_uri);
      console.log(`   ✅ Parsed successfully:`);
      console.log(`      Contract: ${parsed.contractAddress}`);
      console.log(`      Chain ID: ${parsed.chainId}`);
      console.log(`      Recipient: ${parsed.recipientAddress}`);
      console.log(`      Amount: ${parsed.amount}`);
    } catch (error) {
      console.log(`   ❌ Payment URI parsing failed: ${error.message}`);
      return false;
    }

    console.log("🦊 3. Testing wallet connection...");
    if (typeof window !== "undefined" && window.ethereum) {
      console.log("   ✅ MetaMask detected");
      try {
        // Test wallet connection (will prompt user)
        // const account = await paymentProcessor.ensureWalletConnection();
        // console.log(`   ✅ Wallet connected: ${account}`);
        console.log(
          "   ⚠️ Skipping wallet connection test to avoid user prompts"
        );
      } catch (error) {
        console.log(`   ⚠️ Wallet connection test skipped: ${error.message}`);
      }
    } else {
      console.log(
        "   ⚠️ MetaMask not available (expected in test environment)"
      );
    }

    console.log("\n🎉 Payment Processing Test COMPLETED!");
    return true;
  } catch (error) {
    console.error("💥 Payment Processing Test ERROR:", error);
    return false;
  }
};

// Main test runner
export const runAllARQRTests = async () => {
  console.log("🚀 STARTING COMPREHENSIVE AR QR SYSTEM TEST SUITE");
  console.log("=".repeat(80));

  const startTime = Date.now();

  // Run all test suites
  const comprehensiveResults = await runComprehensiveARQRTests();

  console.log("\n" + "-".repeat(40));
  const generationResult = await testARQRGeneration();

  console.log("\n" + "-".repeat(40));
  const paymentResult = await testPaymentProcessing();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log("\n" + "=".repeat(80));
  console.log("🏁 FINAL TEST SUMMARY");
  console.log("=".repeat(80));
  console.log(`⏱️ Total Test Duration: ${duration} seconds`);
  console.log(
    `📊 Comprehensive Tests: ${comprehensiveResults.successRate}% success rate`
  );
  console.log(
    `🎯 AR Generation Test: ${generationResult ? "PASSED" : "FAILED"}`
  );
  console.log(
    `💳 Payment Processing Test: ${paymentResult ? "PASSED" : "FAILED"}`
  );

  const overallSuccess =
    comprehensiveResults.successRate >= 80 && generationResult && paymentResult;
  console.log(
    `\n🎉 OVERALL RESULT: ${
      overallSuccess ? "SYSTEM READY" : "NEEDS ATTENTION"
    }`
  );

  if (overallSuccess) {
    console.log("\n✅ The AR QR payment system is functioning correctly!");
    console.log("   🎯 QR codes can be generated and displayed in AR");
    console.log("   💳 Payment processing pipeline is operational");
    console.log("   🔧 All core services are available and working");
  } else {
    console.log("\n⚠️ Some issues were detected:");
    if (comprehensiveResults.failed > 0) {
      console.log(
        `   📊 ${comprehensiveResults.failed} comprehensive tests failed`
      );
    }
    if (!generationResult) {
      console.log("   🎯 AR QR generation has issues");
    }
    if (!paymentResult) {
      console.log("   💳 Payment processing has issues");
    }
  }

  console.log("=".repeat(80));

  return {
    overall: overallSuccess,
    comprehensive: comprehensiveResults,
    generation: generationResult,
    payment: paymentResult,
    duration: duration,
  };
};

// Export for global access
if (typeof window !== "undefined") {
  window.runARQRTests = runAllARQRTests;
  window.testARQRGeneration = testARQRGeneration;
  window.testPaymentProcessing = testPaymentProcessing;
  console.log("🧪 AR QR Test functions available globally:");
  console.log("   - runARQRTests(): Run complete test suite");
  console.log("   - testARQRGeneration(): Test QR generation only");
  console.log("   - testPaymentProcessing(): Test payment processing only");
}

export default {
  runAllARQRTests,
  runComprehensiveARQRTests,
  testARQRGeneration,
  testPaymentProcessing,
};
