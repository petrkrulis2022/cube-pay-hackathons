import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Enhanced Buffer polyfill for Solana Web3.js compatibility
import { Buffer } from "buffer";

// Ensure Buffer is available globally with all methods
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// Additional polyfills for Solana compatibility
if (!globalThis.process) {
  globalThis.process = { env: {} };
}

// Ensure Buffer.from is properly available
if (Buffer && !Buffer.from) {
  Buffer.from = function (data, encoding) {
    if (typeof data === "string") {
      return new TextEncoder().encode(data);
    }
    return new Uint8Array(data);
  };
}

// Import AR QR Manager for global access - TEMPORARILY DISABLED FOR DEBUGGING
// import arQRManager from "./services/arQRManager";
// import qrCodeService from "./services/qrCodeService";

// Make AR QR services globally available for testing and debugging - TEMPORARILY DISABLED
// window.arQRManager = arQRManager;
// window.qrCodeService = qrCodeService;

console.log("🧪 AR QR services temporarily disabled for debugging blank page");

// Development testing utilities
if (import.meta.env.DEV) {
  console.log("🧪 Development mode - testing utilities disabled temporarily");

  // TODO: Re-enable after debugging blank page issue
  /*
  import("./utils/testARQRFix.js")
    .then((module) => {
      window.testARQRFix = module.runAllTests;
      console.log(
        "🧪 AR QR Fix Testing available: Run testARQRFix() in console"
      );
    })
    .catch((err) => {
      console.log("Legacy testing utilities not available");
    });

  // Load comprehensive test suite
  import("./utils/comprehensiveARQRTest.js")
    .then((module) => {
      window.runARQRTests = module.runAllARQRTests;
      window.testARQRGeneration = module.testARQRGeneration;
      window.testPaymentProcessing = module.testPaymentProcessing;
      console.log("🧪 Comprehensive AR QR Testing available:");
      console.log("   - runARQRTests(): Complete test suite");
      console.log("   - testARQRGeneration(): Test QR generation");
      console.log("   - testPaymentProcessing(): Test payment pipeline");
    })
    .catch((err) => {
      console.log(
        "Comprehensive testing utilities not available in production"
      );
    });

  // Load Solana payment service tests
  import("./utils/testSolanaService.js")
    .then((module) => {
      window.testSOLPayments = module.testSOLPayments;
      window.testUSDCPayments = module.testUSDCPayments;
      window.testQRValidation = module.testQRValidation;
      window.runComprehensiveTests = module.runComprehensiveTests;
      console.log("🚀 Solana Payment Service Testing available:");
      console.log("   - testSOLPayments(): Test SOL on Testnet");
      console.log("   - testUSDCPayments(): Test USDC on Devnet");
      console.log("   - testQRValidation(): Test QR format validation");
      console.log("   - runComprehensiveTests(): Run all Solana tests");
    })
    .catch((err) => {
      console.log("Solana testing utilities not available:", err);
    });
  */
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
