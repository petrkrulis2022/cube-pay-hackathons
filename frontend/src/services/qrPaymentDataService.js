// QR Payment Data Service - Enhanced Cube QR Integration
// Connects existing cube clicks to user-facing dual-interactive QR codes

import { dynamicQRService } from "./dynamicQRService";
import morphPaymentService from "./morphPaymentService";
import solanaPaymentService from "./solanaPaymentService";
import evmPaymentService from "./evmPaymentService";

class QRPaymentDataService {
  constructor() {
    this.activeQRSession = null;
    this.qrDisplayMode = "user-facing"; // Always face user for optimal scanning
  }

  /**
   * Generate user-facing QR code for Cube integration
   * Called when "Crypto QR Code" button is clicked on cube face
   */
  async generateCubeQRPayment(agent, amount = null) {
    try {
      console.log("🎯 CUBE QR INTEGRATION: Generating user-facing QR payment");
      console.log("- Agent:", agent?.name || agent?.id);
      console.log("- Amount:", amount || agent?.interaction_fee || 1, "USD");

      // Use existing dynamic QR service for network detection and payment generation
      const qrResult = await dynamicQRService.generateDynamicQR(
        agent,
        amount || agent?.interaction_fee || 1
      );

      // Enhance with user-facing positioning and dual-interaction metadata
      const enhancedQRData = {
        ...qrResult,

        // User-facing positioning configuration
        positioning: {
          mode: "user-facing", // Always face user regardless of cube rotation
          billboardMode: true, // Use billboard rendering for camera-facing display
          autoPosition: true, // Automatically position for optimal scanning
          distance: 2.5, // Optimal distance from user for mobile scanning
        },

        // Dual interaction configuration
        interaction: {
          clickable: true, // Enable mouse/touch click for in-app payment
          scannable: true, // Enable external device scanning
          clickHandler: "executeInAppPayment", // Function to call on click
          scanHandler: "processExternalScan", // Function to call on external scan
          clickTarget: "metamask", // Open MetaMask on click
          scanTarget: "any-wallet", // Compatible with any wallet on scan
        },

        // Display enhancement
        display: {
          showClickInstructions: true, // Show "Click to Pay" text
          showScanInstructions: true, // Show "Scan with Mobile" text
          enableGlowEffect: true, // Pulsing glow for attention
          enableFloatingAnimation: true, // Gentle floating motion
          highContrast: true, // Enhanced contrast for scanning
        },

        // Cube integration metadata
        cubeIntegration: {
          sourceButton: "crypto_qr", // Which cube face triggered this
          replacesCube: true, // QR replaces cube in view
          backToCubeEnabled: true, // Show back to cube button
          cubePosition: [0, 0, -3], // Original cube position for restoration
        },

        // Session tracking
        session: {
          id: `cube_qr_${Date.now()}_${agent.id}`,
          timestamp: new Date().toISOString(),
          source: "cube_crypto_qr_button",
          agent: {
            id: agent.id,
            name: agent.name,
          },
        },
      };

      // Store active session for interaction handling
      this.activeQRSession = enhancedQRData;

      console.log("✅ CUBE QR INTEGRATION: Enhanced QR data generated");
      console.log("- Positioning: User-facing billboard mode");
      console.log("- Interaction: Click + Scan enabled");
      console.log("- Payment URI:", enhancedQRData.eip681URI);

      return enhancedQRData;
    } catch (error) {
      console.error(
        "❌ CUBE QR INTEGRATION: Failed to generate QR payment:",
        error
      );
      throw new Error(`QR generation failed: ${error.message}`);
    }
  }

  /**
   * Handle in-app payment when QR code is clicked
   * This maintains existing payment flow while adding click interaction
   */
  async handleQRClick(qrData) {
    try {
      console.log("🖱️ CUBE QR INTEGRATION: QR code clicked for in-app payment");

      if (!qrData || !this.activeQRSession) {
        throw new Error("No active QR session");
      }

      // Use existing dynamic QR service execution
      const paymentResult = await dynamicQRService.executePayment(qrData);

      console.log(
        "✅ CUBE QR INTEGRATION: In-app payment completed",
        paymentResult
      );

      // Update session with click result
      this.activeQRSession.clickResult = {
        success: true,
        transactionHash: paymentResult.transactionHash,
        timestamp: new Date().toISOString(),
        method: "click",
      };

      return paymentResult;
    } catch (error) {
      console.error("❌ CUBE QR INTEGRATION: Click payment failed:", error);

      // Update session with error
      if (this.activeQRSession) {
        this.activeQRSession.clickResult = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          method: "click",
        };
      }

      throw error;
    }
  }

  /**
   * Handle external scan (logged for analytics)
   * This tracks when QR is scanned by external devices
   */
  handleQRScan(qrData, scanSource = "external") {
    try {
      console.log("📱 CUBE QR INTEGRATION: QR code scanned externally");

      if (this.activeQRSession) {
        // Update session with scan tracking
        this.activeQRSession.scanResult = {
          scanned: true,
          scanSource: scanSource,
          timestamp: new Date().toISOString(),
          method: "scan",
        };

        console.log("✅ CUBE QR INTEGRATION: External scan tracked");
      }

      // External scans are handled by the scanning device/wallet
      // No further action needed from our app
      return {
        success: true,
        message: "QR scanned by external device",
        expectedAction: "User will complete payment in their wallet app",
      };
    } catch (error) {
      console.error("❌ CUBE QR INTEGRATION: Error tracking scan:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get positioning data for user-facing QR display
   * Ensures QR always faces user regardless of cube rotation
   */
  getUserFacingPosition(userPosition = [0, 0, 0], cubePosition = [0, 0, -3]) {
    // Calculate position that's always facing the user
    // Place QR slightly closer than cube for prominence
    const qrDistance = 2.0; // Closer than cube for scanning
    const qrHeight = 0.5; // Slightly elevated for better scanning angle

    return {
      position: [0, qrHeight, -qrDistance], // Always centered and facing camera
      rotation: [0, 0, 0], // No rotation needed with billboard mode
      scale: [1.5, 1.5, 1.5], // Optimal size for mobile scanning
      billboard: true, // Always face camera/user
    };
  }

  /**
   * Generate enhanced QR display configuration
   * Combines positioning, interaction, and visual enhancement
   */
  generateQRDisplayConfig(qrData) {
    const position = this.getUserFacingPosition();

    return {
      // Three.js positioning
      position: position.position,
      rotation: position.rotation,
      scale: position.scale,
      billboard: position.billboard,

      // Visual enhancements
      visual: {
        size: 1.8, // Large enough for mobile scanning
        glowColor: "#00ff00", // Green glow to match cube theme
        glowIntensity: 0.6,
        floatAmplitude: 0.1, // Gentle floating motion
        floatSpeed: 1.5,
        pulseEffect: true, // Attention-grabbing pulse
      },

      // Interaction zones
      interaction: {
        clickZone: {
          enabled: true,
          size: 2.0, // Larger than visual QR for easier clicking
          cursor: "pointer",
          hoverEffect: true,
        },
        scanZone: {
          enabled: true,
          instructions: "👆 Tap to Pay or 📱 Scan with Mobile",
          position: [0, -1.2, 0], // Below QR code
        },
      },

      // UI elements
      ui: {
        backButton: {
          enabled: true,
          text: "← Back to Cube",
          position: [0, -2.2, 0],
          onClick: "returnToCube",
        },
        paymentInfo: {
          enabled: true,
          amount: qrData.tokenInfo?.amount || "1",
          currency: qrData.tokenInfo?.symbol || "USDC",
          network: qrData.networkInfo?.name || "Unknown",
          position: [0, -1.7, 0],
        },
      },
    };
  }

  /**
   * Clear active QR session
   * Called when returning to cube or closing QR display
   */
  clearSession() {
    console.log("🧹 CUBE QR INTEGRATION: Clearing active QR session");

    if (this.activeQRSession) {
      // Log session completion for analytics
      console.log("📊 QR Session Summary:", {
        sessionId: this.activeQRSession.session.id,
        duration:
          Date.now() -
          new Date(this.activeQRSession.session.timestamp).getTime(),
        clickExecuted: !!this.activeQRSession.clickResult,
        scanDetected: !!this.activeQRSession.scanResult,
        successful: this.activeQRSession.clickResult?.success || false,
      });
    }

    this.activeQRSession = null;
  }

  /**
   * Get current active session (if any)
   */
  getActiveSession() {
    return this.activeQRSession;
  }

  /**
   * Check if QR is currently active
   */
  isQRActive() {
    return !!this.activeQRSession;
  }
}

// Export singleton instance
export const qrPaymentDataService = new QRPaymentDataService();
export default qrPaymentDataService;
