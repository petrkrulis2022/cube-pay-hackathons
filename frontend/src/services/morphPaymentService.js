import {
  MorphHoleskyTestnet,
  MorphUSDTToken,
  generateMorphPaymentURI,
} from "../config/morph-holesky-chain";

// Payment status constants
export const MORPH_PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  CONFIRMED: "confirmed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// Get connected MetaMask wallet address
export const getConnectedWalletAddress = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      return accounts[0] || null;
    } catch (error) {
      console.error("Error getting connected wallet:", error);
      return null;
    }
  }
  return null;
};

// Generate Morph payment data for agents
export const generateMorphAgentPayment = async (agent, amount = 1) => {
  // Get connected wallet address as recipient
  const connectedWallet = await getConnectedWalletAddress();
  const defaultRecipient = "0x1234567890123456789012345678901234567890";
  const recipient = connectedWallet || agent.wallet_address || defaultRecipient;

  console.log("🎯 Generating Morph Holesky agent payment:");
  console.log("- Agent:", agent.name, "(ID:", agent.id + ")");
  console.log("- Connected wallet:", connectedWallet);
  console.log("- Recipient address:", recipient);
  console.log("- Amount:", amount, "USDT");
  console.log("- Token contract:", MorphUSDTToken.address);
  console.log("- Chain ID:", MorphHoleskyTestnet.chainId);

  // Warn if using fallback address
  if (!connectedWallet) {
    console.warn("⚠️ No MetaMask wallet connected! Using fallback address.");
    console.warn(
      "⚠️ Please connect MetaMask to Morph Holesky for proper payments."
    );
  }

  return {
    recipient: recipient,
    amount: amount,
    token: "USDT",
    contractAddress: MorphUSDTToken.address,
    chainId: MorphHoleskyTestnet.chainId,
    agentId: agent.id,
    agentName: agent.name,
    network: "Morph Holesky",
    currency: "USDT",
    decimals: MorphUSDTToken.decimals,
    memo: `Payment to AR Agent: ${agent.name} (ID: ${agent.id})`,
  };
};

// Generate multiple QR code formats for better wallet compatibility
export const generateMorphQRFormats = (paymentInfo) => {
  const { amount, recipient, contractAddress, chainId } = paymentInfo;
  const amountInTokenUnits = Math.floor(
    amount * Math.pow(10, MorphUSDTToken.decimals)
  );

  // Format 1: Standard EIP-681 token transfer (contract address first)
  const format1 = `ethereum:${contractAddress}@${chainId}/transfer?address=${recipient}&uint256=${amountInTokenUnits}`;

  // Format 2: Alternative EIP-681 with function parameter
  const format2 = `ethereum:${contractAddress}@${chainId}?function=transfer(address,uint256)&address=${recipient}&uint256=${amountInTokenUnits}`;

  // Format 3: Recipient-first format (what we tried before)
  const format3 = `ethereum:${recipient}@${chainId}?value=0&contractAddress=${contractAddress}&decimal=18&symbol=USDT&amount=${amount}`;

  // Format 4: Most basic token format
  const format4 = `ethereum:${contractAddress}@${chainId}?recipient=${recipient}&amount=${amountInTokenUnits}&decimals=18`;

  console.log("📱 Generated multiple QR formats for USDT transfer:");
  console.log("1. Standard EIP-681 (RECOMMENDED):", format1);
  console.log("2. Function call format:", format2);
  console.log("3. Recipient-first format:", format3);
  console.log("4. Basic token format:", format4);

  return {
    standard: format1,
    functionCall: format2,
    recipientFirst: format3,
    basic: format4,
    recommended: format1, // Use format 1 as default (standard EIP-681)
  };
};

// Generate QR code data for Morph payments
export const generateMorphPaymentQRData = (paymentInfo) => {
  const { amount, recipient, contractAddress, chainId, memo } = paymentInfo;

  console.log("🔍 Morph QR generation input validation:");
  console.log("- Recipient:", recipient);
  console.log("- Amount:", amount, typeof amount);
  console.log("- Contract:", contractAddress);
  console.log("- Chain ID:", chainId);
  console.log("- Memo:", memo);

  // Validate recipient address (basic ETH address validation)
  if (!isValidEthereumAddress(recipient)) {
    console.error("❌ Invalid Ethereum address:", recipient);
    throw new Error("Invalid recipient address");
  }

  // Generate multiple formats for testing
  const formats = generateMorphQRFormats(paymentInfo);

  // Use the recommended format (wallet-friendly)
  const uri = formats.recommended;

  console.log("✅ Generated Morph payment QR data:");
  console.log("- Selected URI:", uri);
  console.log("- Format: Standard EIP-681 token transfer");
  console.log("- Token: USDT on Morph Holesky");
  console.log("- Amount:", amount, "USDT");
  console.log("- Contract address first (for proper token recognition)");

  return uri;
};

// Validate Ethereum address
export const isValidEthereumAddress = (address) => {
  if (!address || typeof address !== "string") return false;

  // Basic validation - starts with 0x and is 42 characters long
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
};

// Parse Morph payment QR code
export const parseMorphPaymentQR = (qrData) => {
  try {
    console.log("🔍 Parsing Morph payment QR:", qrData);

    // Check if it's an EIP-681 URI
    if (!qrData.startsWith("ethereum:")) {
      throw new Error("Invalid EIP-681 URI format");
    }

    // Parse the URI
    // Format: ethereum:<contract>@<chainId>/transfer?address=<recipient>&uint256=<amount>
    const match = qrData.match(/^ethereum:([^@]+)@(\d+)\/transfer\?(.+)$/);
    if (!match) {
      throw new Error("Invalid EIP-681 transfer format");
    }

    const [, contractAddress, chainId, params] = match;

    // Parse query parameters
    const searchParams = new URLSearchParams(params);
    const recipient = searchParams.get("address");
    const amountInUnits = searchParams.get("uint256");
    const memo = searchParams.get("memo");

    // Validate parsed data
    if (!isValidEthereumAddress(contractAddress)) {
      throw new Error("Invalid contract address");
    }

    if (!isValidEthereumAddress(recipient)) {
      throw new Error("Invalid recipient address");
    }

    if (!amountInUnits || isNaN(Number(amountInUnits))) {
      throw new Error("Invalid amount");
    }

    // Convert amount back to human-readable format
    const amount =
      Number(amountInUnits) / Math.pow(10, MorphUSDTToken.decimals);

    return {
      contractAddress,
      chainId: Number(chainId),
      recipient,
      amount,
      amountInUnits: Number(amountInUnits),
      memo: memo ? decodeURIComponent(memo) : null,
      token: "USDT",
      network: "Morph Holesky",
    };
  } catch (error) {
    console.error("Error parsing Morph payment QR:", error);
    return null;
  }
};

// Validate Morph payment format
export const validateMorphPaymentFormat = (qrData) => {
  try {
    // Check if it's a valid EIP-681 URI
    if (!qrData.startsWith("ethereum:")) {
      console.error("❌ Invalid protocol, must start with 'ethereum:'");
      return false;
    }

    // Try to parse it
    const parsed = parseMorphPaymentQR(qrData);
    if (!parsed) {
      console.error("❌ Failed to parse QR data");
      return false;
    }

    // Check if it's for the correct contract and chain
    if (
      parsed.contractAddress.toLowerCase() !==
      MorphUSDTToken.address.toLowerCase()
    ) {
      console.error("❌ Contract address mismatch");
      return false;
    }

    if (parsed.chainId !== MorphHoleskyTestnet.chainId) {
      console.error("❌ Chain ID mismatch");
      return false;
    }

    console.log("✅ Valid Morph payment format");
    console.log("- Protocol: ethereum:");
    console.log("- Contract:", parsed.contractAddress);
    console.log("- Chain ID:", parsed.chainId);
    console.log("- Recipient:", parsed.recipient);
    console.log("- Amount:", parsed.amount, "USDT");

    return true;
  } catch (error) {
    console.error("❌ Morph payment format validation error:", error);
    return false;
  }
};

// Test QR code generation and parsing
export const testMorphPaymentQR = async (agent) => {
  console.log("🧪 Testing Morph payment QR generation for agent:", agent.name);
  console.log("==================================================");

  // Generate payment data
  const paymentData = await generateMorphAgentPayment(agent, 1);
  console.log("📊 Payment data:", paymentData);

  // Generate QR code
  const qrData = generateMorphPaymentQRData(paymentData);
  console.log("📱 QR data:", qrData);

  // Parse and validate
  const parsed = parseMorphPaymentQR(qrData);
  console.log("✅ Parsed QR data:", parsed);

  // Additional validation
  console.log("🔍 QR Format Validation:");
  console.log("- Starts with 'ethereum:':", qrData.startsWith("ethereum:"));
  console.log(
    "- Contains contract address:",
    qrData.includes(MorphUSDTToken.address)
  );
  console.log(
    "- Contains chain ID:",
    qrData.includes(`@${MorphHoleskyTestnet.chainId}`)
  );
  console.log("- Contains transfer function:", qrData.includes("/transfer"));

  // Validate against EIP-681 spec
  const isValidFormat = validateMorphPaymentFormat(qrData);
  console.log("- Valid EIP-681 format:", isValidFormat);

  return {
    paymentData,
    qrData,
    parsed,
    isValid: parsed !== null,
    formatValid: isValidFormat,
  };
};

// Generate a comprehensive QR test report
export const generateMorphQRTestReport = async (agent) => {
  console.log("📊 COMPREHENSIVE MORPH QR TEST REPORT");
  console.log("=====================================");

  // Test payment generation
  const paymentData = await generateMorphAgentPayment(agent, 1);
  const qrData = generateMorphPaymentQRData(paymentData);

  // Test parsing
  const parsed = parseMorphPaymentQR(qrData);

  // Test validation
  const isValidFormat = validateMorphPaymentFormat(qrData);

  // Test example QR formats
  console.log("📱 QR Format Comparison:");
  console.log("- Our format:      ", qrData);
  console.log(
    "- EIP-681 spec:    ",
    "ethereum:<address>@<chainId>/transfer?address=<recipient>&uint256=<amount>"
  );

  const report = {
    agent: agent.name,
    paymentData,
    qrData,
    parsed,
    isValidFormat,
    status: isValidFormat && parsed ? "✅ VALID" : "❌ INVALID",
    recommendations: [],
  };

  // Add recommendations
  if (!isValidFormat) {
    report.recommendations.push("Fix QR format validation");
  }
  if (!parsed) {
    report.recommendations.push("Fix QR parsing logic");
  }

  console.log("📋 Final Report:", report);
  return report;
};

// Check if MetaMask can handle the network
export const checkMetaMaskCompatibility = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    return { compatible: false, reason: "MetaMask not detected" };
  }

  try {
    // Check if we can get accounts (indicates MetaMask is available)
    await window.ethereum.request({ method: "eth_accounts" });

    return {
      compatible: true,
      version: window.ethereum.version || "Unknown",
      isMetaMask: window.ethereum.isMetaMask || false,
    };
  } catch (error) {
    return {
      compatible: false,
      reason: `MetaMask error: ${error.message}`,
    };
  }
};

export default {
  generateMorphAgentPayment,
  generateMorphPaymentQRData,
  generateMorphQRFormats,
  getConnectedWalletAddress,
  isValidEthereumAddress,
  parseMorphPaymentQR,
  testMorphPaymentQR,
  validateMorphPaymentFormat,
  generateMorphQRTestReport,
  checkMetaMaskCompatibility,
  MORPH_PAYMENT_STATUS,
};
