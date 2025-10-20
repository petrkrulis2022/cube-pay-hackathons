import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Solana Network Configurations
const SOLANA_NETWORKS = {
  TESTNET: {
    name: "Solana Testnet",
    rpc: "https://api.testnet.solana.com",
    explorerUrl: "https://explorer.solana.com/?cluster=testnet",
  },
  DEVNET: {
    name: "Solana Devnet",
    rpc: "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
  },
};

// USDC Token Configuration for Devnet
const USDC_DEVNET_CONFIG = {
  mintAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  symbol: "USDC",
  decimals: 6,
  name: "USD Coin (Devnet)",
};

// Default to Testnet (backward compatibility)
let currentNetwork = "TESTNET";
let connection = new Connection(SOLANA_NETWORKS.TESTNET.rpc, "confirmed");

// Switch between networks
export const switchSolanaNetwork = (networkKey) => {
  if (!SOLANA_NETWORKS[networkKey]) {
    throw new Error(`Unsupported network: ${networkKey}`);
  }

  currentNetwork = networkKey;
  connection = new Connection(SOLANA_NETWORKS[networkKey].rpc, "confirmed");
  console.log(`🔄 Switched to ${SOLANA_NETWORKS[networkKey].name}`);
  return SOLANA_NETWORKS[networkKey];
};

// Get current network info
export const getCurrentNetwork = () => {
  return {
    key: currentNetwork,
    ...SOLANA_NETWORKS[currentNetwork],
  };
};

// Testnet/Devnet validation
export const validateNetworkConnection = async (
  networkKey = currentNetwork
) => {
  try {
    const testConnection =
      networkKey !== currentNetwork
        ? new Connection(SOLANA_NETWORKS[networkKey].rpc, "confirmed")
        : connection;

    const version = await testConnection.getVersion();
    console.log(
      `✅ ${SOLANA_NETWORKS[networkKey].name} connection successful:`,
      version
    );
    return true;
  } catch (error) {
    console.error(
      `❌ ${SOLANA_NETWORKS[networkKey].name} connection failed:`,
      error
    );
    return false;
  }
};

// Payment statuses
export const SOLANA_PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  CONFIRMED: "confirmed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// Create Solana payment QR data (supports both SOL and SPL tokens)
export const generateSolanaPaymentQRData = (paymentInfo) => {
  const {
    amount,
    recipient,
    memo,
    tokenMint = null,
    network = currentNetwork,
  } = paymentInfo;

  // Validate inputs
  console.log("🔍 Input validation for Solana QR generation:");
  console.log("- Recipient:", recipient);
  console.log("- Amount:", amount, typeof amount);
  console.log("- Memo:", memo);
  console.log("- Token Mint:", tokenMint || "Native SOL");
  console.log("- Network:", network);

  // Validate recipient address
  if (!isValidSolanaAddress(recipient)) {
    console.error("❌ Invalid Solana address:", recipient);
    throw new Error("Invalid recipient address");
  }

  // Validate token mint if provided
  if (tokenMint && !isValidSolanaAddress(tokenMint)) {
    console.error("❌ Invalid token mint address:", tokenMint);
    throw new Error("Invalid token mint address");
  }

  // Use decimal amount for better wallet compatibility
  const decimalAmount = Number(amount).toFixed(tokenMint ? 6 : 1); // 6 decimals for USDC, 1 for SOL
  console.log("- Decimal amount:", decimalAmount);

  // Create Solana Pay URL format
  let qrData = `solana:${recipient}`;

  // Add SPL token parameter if it's a token transfer
  if (tokenMint) {
    qrData += `?spl-token=${tokenMint}`;
    qrData += `&amount=${decimalAmount}`;
  } else {
    qrData += `?amount=${decimalAmount}`;
  }

  // Add label parameter
  console.log("🔍 Debug: About to define tokenSymbol");
  console.log("- tokenMint:", tokenMint);
  console.log(
    "- USDC_DEVNET_CONFIG.mintAddress:",
    USDC_DEVNET_CONFIG.mintAddress
  );
  console.log(
    "- tokenMint === USDC_DEVNET_CONFIG.mintAddress:",
    tokenMint === USDC_DEVNET_CONFIG.mintAddress
  );

  const tokenSymbol = tokenMint
    ? tokenMint === USDC_DEVNET_CONFIG.mintAddress
      ? "USDC"
      : "Token"
    : "SOL";

  console.log("✅ tokenSymbol defined as:", tokenSymbol);
  qrData += `&label=AR Agent ${tokenSymbol} Payment`;

  // Add message parameter
  if (memo) {
    qrData += `&message=${encodeURIComponent(memo)}`;
  }

  console.log(
    `✅ Generated Solana Pay QR data (${
      tokenMint ? "SPL Token" : "native SOL"
    }):`,
    qrData
  );
  console.log("📝 Format validation:");
  console.log("- Protocol: solana:");
  console.log("- Recipient address:", recipient);
  console.log("🔍 Debug: About to use tokenSymbol in console.log");
  console.log("- tokenSymbol type:", typeof tokenSymbol);
  console.log("- tokenSymbol value:", tokenSymbol);
  console.log("- Amount:", decimalAmount, tokenSymbol);
  console.log("- Token mint:", tokenMint || "None (native SOL)");
  console.log("🔍 Debug: About to access SOLANA_NETWORKS[network].name");
  console.log("- network parameter:", network);
  console.log("- SOLANA_NETWORKS keys:", Object.keys(SOLANA_NETWORKS));
  console.log("- SOLANA_NETWORKS[network]:", SOLANA_NETWORKS[network]);

  if (SOLANA_NETWORKS[network]) {
    console.log("- Network:", SOLANA_NETWORKS[network].name);
  } else {
    console.log("❌ Network not found, using current network:", currentNetwork);
    console.log(
      "- Network:",
      SOLANA_NETWORKS[currentNetwork]?.name || "Unknown"
    );
  }

  return qrData;
};

// Validate Solana address
export const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Get SPL token balance
export const getSPLTokenBalance = async (walletAddress, tokenMintAddress) => {
  try {
    if (!walletAddress || !tokenMintAddress) return null;

    const walletPublicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(tokenMintAddress);

    // Get associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      walletPublicKey
    );

    // Get token account balance
    const tokenAccountInfo = await connection.getTokenAccountBalance(
      associatedTokenAddress
    );

    if (!tokenAccountInfo.value) {
      return { balance: 0, decimals: 6, exists: false };
    }

    return {
      balance: parseFloat(tokenAccountInfo.value.uiAmount || 0),
      decimals: tokenAccountInfo.value.decimals,
      exists: true,
      raw: tokenAccountInfo.value.amount,
    };
  } catch (error) {
    console.error("Error fetching SPL token balance:", error);
    return { balance: 0, decimals: 6, exists: false };
  }
};

// Get USDC balance specifically
export const getUSDCBalance = async (
  walletAddress,
  network = currentNetwork
) => {
  if (network === "DEVNET") {
    return await getSPLTokenBalance(
      walletAddress,
      USDC_DEVNET_CONFIG.mintAddress
    );
  }
  // For testnet, return null as USDC might not be available
  return { balance: 0, decimals: 6, exists: false };
};

// Get SOL balance for an address
export const getSolanaBalance = async (publicKey) => {
  try {
    if (!publicKey) return null;

    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
  } catch (error) {
    console.error("Error fetching Solana balance:", error);
    return null;
  }
};

// Create SPL token transfer transaction
export const createSPLTokenTransfer = async (
  fromWallet,
  toWallet,
  tokenMintAddress,
  amount,
  decimals = 6
) => {
  try {
    const fromPublicKey = new PublicKey(fromWallet);
    const toPublicKey = new PublicKey(toWallet);
    const mintPublicKey = new PublicKey(tokenMintAddress);

    // Get associated token addresses
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromPublicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    );

    // Convert amount to proper decimals
    const transferAmount = Math.floor(amount * Math.pow(10, decimals));

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    // Create transaction
    const transaction = new Transaction({
      feePayer: fromPublicKey,
      blockhash,
      lastValidBlockHeight,
    });

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPublicKey,
        transferAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    return transaction;
  } catch (error) {
    console.error("Error creating SPL token transfer:", error);
    throw error;
  }
};
export const createSolanaTransfer = async (
  fromPubkey,
  toPubkey,
  amount,
  memo = null
) => {
  try {
    const fromPublicKey = new PublicKey(fromPubkey);
    const toPublicKey = new PublicKey(toPubkey);
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    // Create transaction
    const transaction = new Transaction({
      feePayer: fromPublicKey,
      blockhash,
      lastValidBlockHeight,
    });

    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports,
      })
    );

    // Add memo if provided
    if (memo) {
      const memoProgram = new PublicKey(
        "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
      );
      transaction.add({
        keys: [],
        programId: memoProgram,
        data: Buffer.from(memo, "utf8"),
      });
    }

    return transaction;
  } catch (error) {
    console.error("Error creating Solana transfer:", error);
    throw error;
  }
};

// Send and confirm transaction
export const sendSolanaTransaction = async (wallet, transaction) => {
  try {
    if (!wallet || !wallet.adapter || !wallet.adapter.connected) {
      throw new Error("Wallet not connected");
    }

    // Sign the transaction
    const signedTransaction = await wallet.adapter.signTransaction(transaction);

    // Send the transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    console.log("Transaction sent:", signature);

    // Confirm the transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: transaction.recentBlockhash,
      lastValidBlockHeight: transaction.lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Transaction confirmed:", signature);
    return {
      signature,
      status: SOLANA_PAYMENT_STATUS.CONFIRMED,
    };
  } catch (error) {
    console.error("Error sending Solana transaction:", error);
    return {
      signature: null,
      status: SOLANA_PAYMENT_STATUS.FAILED,
      error: error.message,
    };
  }
};

// Get transaction details
export const getSolanaTransaction = async (signature) => {
  try {
    const transaction = await connection.getTransaction(signature, {
      encoding: "jsonParsed",
    });

    if (!transaction) {
      return { status: SOLANA_PAYMENT_STATUS.PENDING };
    }

    const status = transaction.meta?.err
      ? SOLANA_PAYMENT_STATUS.FAILED
      : SOLANA_PAYMENT_STATUS.CONFIRMED;

    return {
      status,
      blockTime: transaction.blockTime,
      slot: transaction.slot,
      fee: transaction.meta?.fee,
      transaction,
    };
  } catch (error) {
    console.error("Error fetching Solana transaction:", error);
    return { status: SOLANA_PAYMENT_STATUS.FAILED, error: error.message };
  }
};

// Monitor transaction status
export const monitorSolanaTransaction = async (
  signature,
  maxAttempts = 30,
  intervalMs = 2000
) => {
  let attempts = 0;

  return new Promise((resolve) => {
    const checkStatus = async () => {
      attempts++;

      try {
        const result = await getSolanaTransaction(signature);

        if (
          result.status === SOLANA_PAYMENT_STATUS.CONFIRMED ||
          result.status === SOLANA_PAYMENT_STATUS.FAILED ||
          attempts >= maxAttempts
        ) {
          resolve(result);
          return;
        }

        // Continue monitoring
        setTimeout(checkStatus, intervalMs);
      } catch (error) {
        if (attempts >= maxAttempts) {
          resolve({
            status: SOLANA_PAYMENT_STATUS.FAILED,
            error: "Monitoring timeout",
          });
        } else {
          setTimeout(checkStatus, intervalMs);
        }
      }
    };

    checkStatus();
  });
};

// Generate agent payment data for Solana (supports both SOL and USDC)
export const generateSolanaAgentPayment = (
  agent,
  amount = 1,
  paymentType = "SOL",
  network = "TESTNET"
) => {
  // Test recipient addresses for different networks - Updated to use Phantom Account 2
  const testRecipients = {
    TESTNET: "EzKD7oiANv7GstQgGsxEEdenfMVKsfFkKiZkjpjzQ1QW", // Phantom Account 2
    DEVNET: "EzKD7oiANv7GstQgGsxEEdenfMVKsfFkKiZkjpjzQ1QW", // Phantom Account 2
  };

  const testRecipient = testRecipients[network] || testRecipients.TESTNET;

  let paymentData = {
    recipient: testRecipient,
    amount: amount,
    memo: `Payment to AR Agent: ${
      agent.name || agent.title || `Agent-${agent.id}`
    } (ID: ${agent.id})`,
    agentId: agent.id,
    agentName: agent.name || agent.title || `Agent-${agent.id}`,
    network: network, // Keep the network key (TESTNET/DEVNET) for generateSolanaPaymentQRData
    networkName: SOLANA_NETWORKS[network].name, // Add human-readable name separately
  };

  if (paymentType === "USDC" && network === "DEVNET") {
    paymentData = {
      ...paymentData,
      tokenMint: USDC_DEVNET_CONFIG.mintAddress,
      currency: "USDC",
      tokenInfo: USDC_DEVNET_CONFIG,
    };
  } else {
    paymentData = {
      ...paymentData,
      currency: "SOL",
      tokenMint: null,
    };
  }

  console.log("🎯 Generating Solana agent payment:");
  console.log(
    "- Agent:",
    agent.name || agent.title || `Agent-${agent.id}`,
    "(ID:",
    agent.id + ")"
  );
  console.log("- Recipient address (Phantom Account 2):", testRecipient);
  console.log("- Amount:", amount, paymentData.currency);
  console.log("- Network:", paymentData.networkName);
  console.log("- Network Key:", paymentData.network);
  console.log("- Payment type:", paymentType);
  console.log("- Token mint:", paymentData.tokenMint || "None (native SOL)");
  console.log("- Address validation:", isValidSolanaAddress(testRecipient));

  return paymentData;
}; // Parse Solana Pay QR code (supports both SOL and SPL tokens)
export const parseSolanaPayQR = (qrData) => {
  try {
    const url = new URL(qrData);

    if (url.protocol !== "solana:") {
      throw new Error("Invalid Solana Pay URL");
    }

    const recipient = url.pathname;
    const amount = url.searchParams.get("amount");
    const memo =
      url.searchParams.get("memo") || url.searchParams.get("message");
    const label = url.searchParams.get("label");
    const splToken = url.searchParams.get("spl-token");

    // Validate the parsed data
    if (!isValidSolanaAddress(recipient)) {
      throw new Error("Invalid recipient address");
    }

    if (!amount || isNaN(Number(amount))) {
      throw new Error("Invalid amount");
    }

    // Validate SPL token if present
    if (splToken && !isValidSolanaAddress(splToken)) {
      throw new Error("Invalid SPL token address");
    }

    return {
      recipient,
      amount: Number(amount),
      memo: memo ? decodeURIComponent(memo) : null,
      label: label ? decodeURIComponent(label) : null,
      tokenMint: splToken || null,
      isToken: !!splToken,
      currency: splToken
        ? splToken === USDC_DEVNET_CONFIG.mintAddress
          ? "USDC"
          : "Token"
        : "SOL",
      network: getCurrentNetwork().key.toLowerCase(),
    };
  } catch (error) {
    console.error("Error parsing Solana Pay QR:", error);
    return null;
  }
};

// Test QR code generation and parsing (enhanced for multi-token support)
export const testSolanaPayQR = (
  agent,
  paymentType = "SOL",
  network = "TESTNET"
) => {
  console.log(
    `🧪 Testing Solana Pay QR generation for agent: ${
      agent.name || agent.title || `Agent-${agent.id}`
    }`
  );
  console.log(`Payment type: ${paymentType}, Network: ${network}`);
  console.log("==================================================");

  // Generate payment data
  const paymentData = generateSolanaAgentPayment(
    agent,
    1,
    paymentType,
    network
  );
  console.log("📊 Payment data:", paymentData);

  // Generate QR code
  const qrData = generateSolanaPaymentQRData(paymentData);
  console.log("📱 QR data:", qrData);

  // Parse and validate
  const parsed = parseSolanaPayQR(qrData);
  console.log("✅ Parsed QR data:", parsed);

  // Additional validation
  console.log("🔍 QR Format Validation:");
  console.log("- Starts with 'solana:':", qrData.startsWith("solana:"));
  console.log("- Contains amount parameter:", qrData.includes("amount="));
  console.log(
    "- Contains memo parameter:",
    qrData.includes("memo=") || qrData.includes("message=")
  );

  if (paymentType === "USDC") {
    console.log(
      "- Contains SPL token parameter:",
      qrData.includes("spl-token=")
    );
    console.log("- USDC token address:", USDC_DEVNET_CONFIG.mintAddress);
  } else {
    console.log(
      "- Native SOL transfer (no token address):",
      !qrData.includes("spl-token")
    );
  }

  // Validate against Solana Pay spec
  const isValidFormat = validateSolanaPayFormat(qrData);
  console.log("- Valid Solana Pay format:", isValidFormat);

  return {
    paymentData,
    qrData,
    parsed,
    isValid: parsed !== null,
    formatValid: isValidFormat,
    paymentType,
    network,
  };
};

// Validate Solana Pay format (enhanced for SPL token support)
export const validateSolanaPayFormat = (qrData) => {
  try {
    // Check if it's a valid Solana Pay URL
    if (!qrData.startsWith("solana:")) {
      console.error("❌ Invalid protocol, must start with 'solana:'");
      return false;
    }

    // Parse as URL
    const url = new URL(qrData);

    // Check recipient (the pathname after 'solana:')
    const recipient = url.pathname;
    if (!isValidSolanaAddress(recipient)) {
      console.error("❌ Invalid recipient address:", recipient);
      return false;
    }

    // Check amount parameter
    const amount = url.searchParams.get("amount");
    if (!amount || isNaN(Number(amount))) {
      console.error("❌ Invalid or missing amount parameter:", amount);
      return false;
    }

    // Check SPL token parameter if present
    const splToken = url.searchParams.get("spl-token");
    if (splToken && !isValidSolanaAddress(splToken)) {
      console.error("❌ Invalid SPL token address:", splToken);
      return false;
    }

    console.log("✅ Valid Solana Pay format");
    console.log("- Protocol: solana:");
    console.log("- Recipient:", recipient);
    console.log("- Amount:", amount, splToken ? "tokens" : "SOL");
    if (splToken) {
      console.log("- Token mint:", splToken);
      console.log("- Type: SPL Token transfer");
    } else {
      console.log("- Type: Native SOL transfer");
    }

    return true;
  } catch (error) {
    console.error("❌ Solana Pay format validation error:", error);
    return false;
  }
};

// Check balance for current network and token type
export const checkNetworkBalance = async (
  address,
  tokenType = "SOL",
  network = currentNetwork
) => {
  try {
    if (tokenType === "USDC" && network === "DEVNET") {
      const balance = await getUSDCBalance(address, network);
      console.log(
        `💰 USDC balance for ${address} on ${SOLANA_NETWORKS[network].name}:`,
        balance.balance,
        "USDC"
      );
      return balance.balance;
    } else {
      const balance = await getSolanaBalance(address);
      console.log(
        `💰 SOL balance for ${address} on ${SOLANA_NETWORKS[network].name}:`,
        balance,
        "SOL"
      );
      return balance;
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error);
    return null;
  }
};

// Generate a comprehensive QR test report (enhanced for multi-network/token support)
export const generateQRTestReport = async (
  agent,
  paymentType = "SOL",
  network = "TESTNET"
) => {
  console.log("📊 COMPREHENSIVE SOLANA QR TEST REPORT");
  console.log("=====================================");
  console.log(
    `Payment Type: ${paymentType}, Network: ${SOLANA_NETWORKS[network].name}`
  );

  // Test payment generation
  const paymentData = generateSolanaAgentPayment(
    agent,
    1,
    paymentType,
    network
  );
  const qrData = generateSolanaPaymentQRData(paymentData);

  // Test parsing
  const parsed = parseSolanaPayQR(qrData);

  // Test validation
  const isValidFormat = validateSolanaPayFormat(qrData);

  // Check recipient balance
  const recipientBalance = await checkNetworkBalance(
    paymentData.recipient,
    paymentType,
    network
  );

  // Test example QR formats
  console.log("📱 QR Format Comparison:");
  console.log("- Our format:      ", qrData);

  if (paymentType === "USDC") {
    console.log(
      "- USDC example:    ",
      `solana:${paymentData.recipient}?spl-token=${USDC_DEVNET_CONFIG.mintAddress}&amount=10.000000&label=USDC%20Payment&message=AR%20Agent%20Service`
    );
  } else {
    console.log(
      "- SOL example:     ",
      `solana:${paymentData.recipient}?amount=0.1&label=Payment&message=AR%20Agent%20Service`
    );
  }

  console.log(
    "- Solana Pay spec: ",
    `solana:<recipient>?${
      paymentType === "USDC" ? "spl-token=<mint>&" : ""
    }amount=<amount>&label=<label>&message=<message>`
  );

  const report = {
    agent: agent.name || agent.title || `Agent-${agent.id}`,
    paymentType,
    network: SOLANA_NETWORKS[network].name,
    paymentData,
    qrData,
    parsed,
    isValidFormat,
    recipientBalance,
    tokenInfo: paymentType === "USDC" ? USDC_DEVNET_CONFIG : null,
    status: isValidFormat && parsed ? "✅ VALID" : "❌ INVALID",
    recommendations: [],
  };

  // Add recommendations
  if (!isValidFormat) {
    report.recommendations.push("Fix QR format validation");
  }
  if (recipientBalance === null || recipientBalance === 0) {
    const tokenType =
      paymentType === "USDC" ? "USDC from faucet" : "SOL from faucet";
    report.recommendations.push(
      `Recipient address needs ${network.toLowerCase()} ${tokenType}`
    );
  }
  if (!parsed) {
    report.recommendations.push("Fix QR parsing logic");
  }
  if (paymentType === "USDC" && network !== "DEVNET") {
    report.recommendations.push("USDC only available on Devnet");
  }

  console.log("📋 Final Report:", report);
  return report;
};

// Quick test function for USDC on Devnet
export const testUSDCDevnetQR = (agent) => {
  console.log("🧪 TESTING USDC ON SOLANA DEVNET");
  console.log("================================");

  // Switch to Devnet
  switchSolanaNetwork("DEVNET");

  // Generate USDC payment
  const usdcTest = testSolanaPayQR(agent, "USDC", "DEVNET");

  console.log("✅ USDC Devnet QR Test Results:");
  console.log("- QR Data:", usdcTest.qrData);
  console.log("- USDC Token Address:", USDC_DEVNET_CONFIG.mintAddress);
  console.log("- Network:", SOLANA_NETWORKS.DEVNET.name);
  console.log("- Valid:", usdcTest.isValid);

  return usdcTest;
};

// Named exports for direct imports
export { SOLANA_NETWORKS, USDC_DEVNET_CONFIG };

export default {
  // Network management
  switchSolanaNetwork,
  getCurrentNetwork,
  validateNetworkConnection,

  // Payment QR generation
  generateSolanaPaymentQRData,
  generateSolanaAgentPayment,

  // Address and validation
  isValidSolanaAddress,
  validateSolanaPayFormat,

  // Balance checking
  getSolanaBalance,
  getSPLTokenBalance,
  getUSDCBalance,
  checkNetworkBalance,

  // Transaction creation
  createSolanaTransfer,
  createSPLTokenTransfer,
  sendSolanaTransaction,
  getSolanaTransaction,
  monitorSolanaTransaction,

  // QR parsing and testing
  parseSolanaPayQR,
  testSolanaPayQR,
  generateQRTestReport,

  // Constants
  SOLANA_PAYMENT_STATUS,
  SOLANA_NETWORKS,
  USDC_DEVNET_CONFIG,
};
