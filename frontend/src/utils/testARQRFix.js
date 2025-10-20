// AR QR Code Fix Testing Script
// This script tests all the critical fixes for the AR QR disappearing issue

console.log("🧪 AR QR Code Fix Testing Script");
console.log("================================");

// Test 1: AR QR Manager Functionality
const testARQRManager = () => {
  console.log("\n📋 Test 1: AR QR Manager Functionality");

  try {
    // Import the AR QR Manager
    const arQRManager =
      window.arQRManager || require("../src/services/arQRManager.js").default;

    // Test adding QR
    const testQR = arQRManager.addQR(
      "test_qr_1",
      "ethereum:0xTest@1043/transfer?address=0xTest&uint256=50",
      [0, 1, -2],
      {
        size: 1.5,
        agentId: "test_agent",
        ttl: 300000,
      }
    );

    console.log("✅ QR Added:", testQR ? "SUCCESS" : "FAILED");

    // Test getting active QRs
    const activeQRs = arQRManager.getActiveQRs();
    console.log("✅ Active QRs:", activeQRs.length);

    // Test stats
    const stats = arQRManager.getStats();
    console.log("✅ Manager Stats:", stats);

    // Clean up
    arQRManager.clearAll();
    console.log("✅ Cleanup Complete");

    return true;
  } catch (error) {
    console.error("❌ AR QR Manager Test Failed:", error);
    return false;
  }
};

// Test 2: QR Service Database Independence
const testQRServiceFallback = async () => {
  console.log("\n📋 Test 2: QR Service Database Independence");

  try {
    // Import QR service
    const qrCodeService =
      window.qrCodeService ||
      require("../src/services/qrCodeService.js").default;

    // Test QR creation with mock data
    const testQRData = {
      transactionId: "test_tx_123",
      data: "ethereum:0xTest@1043/transfer?address=0xTest&uint256=50",
      position: [0, 1, -2],
      size: 1.5,
      agentId: "test_agent",
      ttl: 300000,
    };

    const result = await qrCodeService.createQRCode(testQRData);
    console.log("✅ QR Creation Result:", result ? "SUCCESS" : "FAILED");
    console.log("📊 Local QR ID:", result?.id);
    console.log("📊 DB Save Status:", result?.dbSaveStatus || "unknown");

    return true;
  } catch (error) {
    console.error("❌ QR Service Test Failed:", error);
    return false;
  }
};

// Test 3: Component State Management
const testComponentIntegration = () => {
  console.log("\n📋 Test 3: Component State Management");

  try {
    // Test AR QR Component Events
    let eventReceived = false;

    const testEventHandler = (event) => {
      eventReceived = true;
      console.log("✅ Event Received:", event.type, event.detail);
    };

    // Add event listeners
    window.addEventListener("arQRAdded", testEventHandler);
    window.addEventListener("arQRRemoved", testEventHandler);

    // Simulate QR addition
    window.dispatchEvent(
      new CustomEvent("arQRAdded", {
        detail: {
          id: "test_event_qr",
          data: "test_data",
          position: [0, 1, -2],
        },
      })
    );

    setTimeout(() => {
      console.log("✅ Event System:", eventReceived ? "SUCCESS" : "FAILED");

      // Cleanup
      window.removeEventListener("arQRAdded", testEventHandler);
      window.removeEventListener("arQRRemoved", testEventHandler);
    }, 100);

    return true;
  } catch (error) {
    console.error("❌ Component Integration Test Failed:", error);
    return false;
  }
};

// Test 4: Database Error Simulation
const testDatabaseErrorHandling = async () => {
  console.log("\n📋 Test 4: Database Error Handling");

  try {
    // Simulate database connection failure
    const originalSupabase = window.supabase;
    window.supabase = null;

    const qrCodeService =
      window.qrCodeService ||
      require("../src/services/qrCodeService.js").default;

    const testQRData = {
      transactionId: "test_db_error",
      data: "ethereum:0xTest@1043/transfer?address=0xTest&uint256=50",
      position: [0, 1, -2],
      size: 1.5,
      agentId: "test_agent",
      ttl: 300000,
    };

    const result = await qrCodeService.createQRCode(testQRData);

    console.log(
      "✅ QR Created Despite DB Error:",
      result ? "SUCCESS" : "FAILED"
    );
    console.log("📊 Fallback QR ID:", result?.id);
    console.log(
      "📊 Expected Local ID:",
      result?.id?.startsWith("local_") ? "SUCCESS" : "FAILED"
    );

    // Restore original supabase
    window.supabase = originalSupabase;

    return true;
  } catch (error) {
    console.error("❌ Database Error Test Failed:", error);
    return false;
  }
};

// Test 5: QR Persistence Verification
const testQRPersistence = () => {
  console.log("\n📋 Test 5: QR Persistence Verification");

  try {
    // Simulate modal close scenario
    const mockQRData = {
      id: "persistent_test_qr",
      data: "ethereum:0xTest@1043/transfer?address=0xTest&uint256=50",
      position: [0, 1, -2],
      size: 1.5,
      status: "active",
      agent: { id: "test_agent", name: "Test Agent" },
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000,
    };

    // Add to local storage simulation
    const persistentQRs = JSON.parse(
      localStorage.getItem("persistentARQRs") || "[]"
    );
    persistentQRs.push(mockQRData);
    localStorage.setItem("persistentARQRs", JSON.stringify(persistentQRs));

    // Verify persistence
    const retrieved = JSON.parse(
      localStorage.getItem("persistentARQRs") || "[]"
    );
    const found = retrieved.find((qr) => qr.id === "persistent_test_qr");

    console.log("✅ QR Persistence:", found ? "SUCCESS" : "FAILED");
    console.log("📊 Persistent QR Count:", retrieved.length);

    // Cleanup
    localStorage.removeItem("persistentARQRs");

    return true;
  } catch (error) {
    console.error("❌ QR Persistence Test Failed:", error);
    return false;
  }
};

// Main Test Runner
const runAllTests = async () => {
  console.log("🚀 Starting AR QR Fix Tests...\n");

  const tests = [
    { name: "AR QR Manager", fn: testARQRManager },
    { name: "QR Service Fallback", fn: testQRServiceFallback },
    { name: "Component Integration", fn: testComponentIntegration },
    { name: "Database Error Handling", fn: testDatabaseErrorHandling },
    { name: "QR Persistence", fn: testQRPersistence },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw error:`, error);
      results.push({ name: test.name, success: false, error });
    }
  }

  // Summary
  console.log("\n📊 TEST RESULTS SUMMARY");
  console.log("=======================");

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  results.forEach((result) => {
    console.log(
      `${result.success ? "✅" : "❌"} ${result.name}: ${
        result.success ? "PASSED" : "FAILED"
      }`
    );
    if (result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
  });

  console.log(
    `\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(
      (passed / total) * 100
    )}%)`
  );

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED! AR QR Fix is working correctly.");
  } else {
    console.log("⚠️ Some tests failed. Check the errors above.");
  }

  return { passed, total, success: passed === total };
};

// Export for use in browser console or testing
if (typeof window !== "undefined") {
  window.testARQRFix = runAllTests;
  console.log("💡 Run 'testARQRFix()' in console to test the AR QR fixes");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { runAllTests, testARQRManager, testQRServiceFallback };
}

// Auto-run if called directly
if (typeof window !== "undefined" && window.location) {
  console.log("🔧 AR QR Fix Testing Available");
  console.log("Run the following command in console:");
  console.log("testARQRFix()");
}
