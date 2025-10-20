// Hedera Testnet QR Code Generator for Agent Payments
import QRCode from "qrcode";
import {
  HEDERA_NETWORKS,
  getHederaNetworkConfig,
} from "../../config/hederaNetworks";
import { hederaWalletService } from "../../services/hederaWalletService";

export interface HederaPaymentData {
  to: string; // Recipient wallet address
  value: string; // Amount in HBAR (as string for precision)
  chainId: number; // Hedera Testnet chain ID (296)
  agentId?: string; // Optional agent ID for reference
  agentName?: string; // Agent name
  description?: string; // Optional payment description
  currency: string; // Always "HBAR"
  network: string; // "Hedera Testnet"
  transactionId?: string; // Unique transaction ID
  timestamp?: number; // Payment timestamp
}

export class HederaQRCodeGenerator {
  private scene: any; // A-Frame scene
  private currentQREntity: any = null;

  constructor(scene: any) {
    this.scene = scene;
  }

  /**
   * Generate QR code for Hedera HBAR payment (MetaMask compatible)
   */
  public async generateHBARPaymentQR(
    paymentData: HederaPaymentData
  ): Promise<string> {
    try {
      // Validate input data
      if (!this.validatePaymentData(paymentData)) {
        throw new Error("Invalid payment data");
      }

      // EIP-681 format for MetaMask compatibility
      const eip681Format = this.generateEIP681Format(paymentData);

      // Generate QR code with Hedera-specific styling
      const qrDataUrl = await QRCode.toDataURL(eip681Format, {
        width: 300,
        margin: 2,
        color: {
          dark: "#7c3aed", // Purple for Hedera
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });

      console.log("🎯 Generated Hedera HBAR Payment QR Code:", {
        format: "EIP-681",
        data: eip681Format,
        recipient: paymentData.to,
        amount: `${paymentData.value} HBAR`,
        network: "Hedera Testnet (296)",
        agent: paymentData.agentName || paymentData.agentId,
      });

      return qrDataUrl;
    } catch (error) {
      console.error("❌ Error generating Hedera QR code:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate QR code: ${errorMessage}`);
    }
  }

  /**
   * Generate EIP-681 format for MetaMask compatibility
   * Format: ethereum:ADDRESS@CHAIN_ID?value=AMOUNT_IN_WEI&gas=GAS_LIMIT
   */
  private generateEIP681Format(paymentData: HederaPaymentData): string {
    try {
      const amountWei = this.hbarToWei(paymentData.value);

      // Build EIP-681 URI for native HBAR transfer
      let eip681 = `ethereum:${paymentData.to}@${paymentData.chainId}`;
      eip681 += `?value=${amountWei}`;
      eip681 += `&gas=21000`; // Standard gas limit for simple transfer

      // Add optional parameters for better UX
      if (paymentData.agentName) {
        const memo = encodeURIComponent(`Payment to ${paymentData.agentName}`);
        eip681 += `&data=0x${Buffer.from(memo).toString("hex")}`;
      }

      return eip681;
    } catch (error) {
      console.error("Error generating EIP-681 format:", error);
      throw error;
    }
  }

  /**
   * Convert HBAR to Wei (18 decimals) with precision handling
   */
  private hbarToWei(hbarAmount: string): string {
    try {
      const hbar = parseFloat(hbarAmount);
      if (isNaN(hbar) || hbar <= 0) {
        throw new Error("Invalid HBAR amount");
      }

      // Use BigInt for precise conversion to avoid floating point issues
      const hbarBigInt = BigInt(Math.floor(hbar * 1000000)); // 6 decimal precision
      const weiBigInt = hbarBigInt * BigInt(1000000000000); // Convert to 18 decimals

      return weiBigInt.toString();
    } catch (error) {
      console.error("Error converting HBAR to Wei:", error);
      throw new Error("Failed to convert HBAR amount");
    }
  }

  /**
   * Validate payment data before QR generation
   */
  private validatePaymentData(paymentData: HederaPaymentData): boolean {
    // Check required fields
    if (!paymentData.to || !paymentData.value || !paymentData.chainId) {
      console.error("Missing required payment data fields");
      return false;
    }

    // Validate Hedera address format
    if (!HederaQRCodeGenerator.isValidHederaAddress(paymentData.to)) {
      console.error("Invalid Hedera wallet address format:", paymentData.to);
      return false;
    }

    // Validate chain ID
    if (paymentData.chainId !== 296) {
      console.error(
        "Invalid chain ID for Hedera Testnet:",
        paymentData.chainId
      );
      return false;
    }

    // Validate amount
    const amount = parseFloat(paymentData.value);
    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
      console.error("Invalid HBAR amount:", paymentData.value);
      return false;
    }

    return true;
  }

  /**
   * Generate multiple QR format options for debugging and compatibility
   */
  public generateHederaQRFormats(
    paymentData: HederaPaymentData
  ): Record<string, string> {
    try {
      const formats: Record<string, string> = {};

      // EIP-681 format (primary - MetaMask compatible)
      formats.eip681 = this.generateEIP681Format(paymentData);

      // Alternative EIP-681 without gas parameter
      const amountWei = this.hbarToWei(paymentData.value);
      formats.eip681_simple = `ethereum:${paymentData.to}@${paymentData.chainId}?value=${amountWei}`;

      // JSON format (fallback)
      formats.json = JSON.stringify({
        type: "hedera_payment",
        network: "testnet",
        chainId: paymentData.chainId,
        to: paymentData.to,
        value: paymentData.value,
        currency: "HBAR",
        agentId: paymentData.agentId,
        agentName: paymentData.agentName,
        description: paymentData.description,
        timestamp: paymentData.timestamp,
      });

      // Simple URI format
      formats.simple = `hedera:${paymentData.to}?amount=${
        paymentData.value
      }&network=testnet&agent=${paymentData.agentName || paymentData.agentId}`;

      console.log("📱 Generated multiple Hedera QR formats:", formats);

      return formats;
    } catch (error) {
      console.error("Error generating QR formats:", error);
      return {};
    }
  }

  /**
   * Generate QR code with enhanced styling for display
   */
  public async generateStyledHBARQR(
    paymentData: HederaPaymentData,
    options?: {
      size?: number;
      color?: string;
      logo?: boolean;
    }
  ): Promise<string> {
    try {
      const eip681Format = this.generateEIP681Format(paymentData);
      const size = options?.size || 300;
      const color = options?.color || "#7c3aed";

      const qrDataUrl = await QRCode.toDataURL(eip681Format, {
        width: size,
        margin: 3,
        color: {
          dark: color,
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H", // High error correction for better scanning
      });

      return qrDataUrl;
    } catch (error) {
      console.error("Error generating styled QR:", error);
      throw error;
    }
  }

  /**
   * Create comprehensive payment data with user's connected wallet
   */
  public static async createAgentPaymentData(
    agent: any,
    userWalletAddress?: string,
    interactionType: "chat" | "voice" | "video" = "chat"
  ): Promise<HederaPaymentData> {
    try {
      // Get interaction fee based on type
      const interactionFees = {
        chat: 1, // 1 HBAR for text chat
        voice: 2, // 2 HBAR for voice chat
        video: 3, // 3 HBAR for video chat
      };

      const interactionFee = interactionFees[interactionType];

      // Use connected wallet or fallback to agent's deployer address
      const recipientAddress =
        userWalletAddress ||
        agent.deployer_wallet_address ||
        agent.owner_wallet ||
        agent.agent_wallet_address;

      if (!recipientAddress) {
        throw new Error("No valid recipient address found");
      }

      const paymentData: HederaPaymentData = {
        to: recipientAddress,
        value: interactionFee.toString(),
        chainId: 296, // Hedera Testnet
        agentId: agent.id,
        agentName: agent.name || agent.agent_name,
        description: `${
          interactionType.charAt(0).toUpperCase() + interactionType.slice(1)
        } interaction with ${agent.name || agent.agent_name}`,
        currency: "HBAR",
        network: "Hedera Testnet",
        transactionId: `hedera_${interactionType}_${Date.now()}_${agent.id}`,
        timestamp: Date.now(),
      };

      console.log("💰 Created Hedera payment data:", paymentData);
      return paymentData;
    } catch (error) {
      console.error("Error creating agent payment data:", error);
      throw error;
    }
  }

  /**
   * Display QR code in AR scene
   */
  public async displayQRInAR(
    paymentData: HederaPaymentData,
    position = { x: 0, y: 2, z: -3 }
  ): Promise<void> {
    try {
      // Remove existing QR code if present
      this.removeQRFromAR();

      // Generate QR code
      const qrDataUrl = await this.generateHBARPaymentQR(paymentData);

      // Create QR code entity in A-Frame
      const qrEntity = document.createElement("a-entity");
      qrEntity.setAttribute("id", "hedera-qr-payment");
      qrEntity.setAttribute(
        "position",
        `${position.x} ${position.y} ${position.z}`
      );

      // Create QR code plane
      const qrPlane = document.createElement("a-plane");
      qrPlane.setAttribute("width", "2");
      qrPlane.setAttribute("height", "2");
      qrPlane.setAttribute("material", `src: ${qrDataUrl}`);
      qrPlane.setAttribute(
        "animation",
        "property: rotation; to: 0 360 0; loop: true; dur: 10000"
      );

      // Create background
      const bgPlane = document.createElement("a-plane");
      bgPlane.setAttribute("width", "2.2");
      bgPlane.setAttribute("height", "2.2");
      bgPlane.setAttribute("material", "color: white");
      bgPlane.setAttribute("position", "0 0 -0.01");

      // Create label
      const labelEntity = document.createElement("a-text");
      labelEntity.setAttribute("value", `Pay ${paymentData.value} HBAR`);
      labelEntity.setAttribute("position", "0 -1.5 0");
      labelEntity.setAttribute("align", "center");
      labelEntity.setAttribute("color", "#4f46e5");
      labelEntity.setAttribute("font", "kelsonsans");
      labelEntity.setAttribute("width", "6");

      // Add network indicator
      const networkLabel = document.createElement("a-text");
      networkLabel.setAttribute("value", "Hedera Testnet");
      networkLabel.setAttribute("position", "0 1.5 0");
      networkLabel.setAttribute("align", "center");
      networkLabel.setAttribute("color", "#10b981");
      networkLabel.setAttribute("font", "kelsonsans");
      networkLabel.setAttribute("width", "4");

      // Assemble the QR entity
      qrEntity.appendChild(bgPlane);
      qrEntity.appendChild(qrPlane);
      qrEntity.appendChild(labelEntity);
      qrEntity.appendChild(networkLabel);

      // Add to scene
      this.scene.appendChild(qrEntity);
      this.currentQREntity = qrEntity;

      console.log("🎯 Hedera QR code displayed in AR scene");

      // Auto-remove after 30 seconds
      setTimeout(() => {
        this.removeQRFromAR();
      }, 30000);
    } catch (error) {
      console.error("❌ Error displaying QR in AR:", error);
      throw error;
    }
  }

  /**
   * Remove QR code from AR scene
   */
  public removeQRFromAR(): void {
    if (this.currentQREntity) {
      this.scene.removeChild(this.currentQREntity);
      this.currentQREntity = null;
      console.log("🗑️ Removed Hedera QR code from AR scene");
    }
  }

  /**
   * Get payment data from agent
   */
  public static getAgentPaymentData(
    agent: any,
    interactionFee: number = 1.0
  ): HederaPaymentData {
    return {
      to:
        agent.deployer_wallet_address ||
        agent.owner_wallet ||
        agent.agent_wallet_address,
      value: interactionFee.toString(),
      chainId: 296, // Hedera Testnet
      agentId: agent.id,
      agentName: agent.name || agent.agent_name,
      description: `Payment for ${agent.name || agent.agent_name} interaction`,
      currency: "HBAR",
      network: "Hedera Testnet",
      transactionId: `hedera_${Date.now()}_${agent.id}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate Hedera wallet address format
   */
  public static isValidHederaAddress(address: string): boolean {
    // Hedera uses Ethereum-style addresses (0x + 40 hex chars)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

// Export utility functions
export const generateHederaPaymentQR = async (
  paymentData: HederaPaymentData
): Promise<string> => {
  const generator = new HederaQRCodeGenerator(null);
  return generator.generateHBARPaymentQR(paymentData);
};

export const getHederaPaymentFormats = (
  paymentData: HederaPaymentData
): Record<string, string> => {
  const generator = new HederaQRCodeGenerator(null);
  return generator.generateHederaQRFormats(paymentData);
};
