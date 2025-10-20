// Dynamic QR Service for AR Viewer
// Handles EVM network autodetection and QR generation
// Based on existing payment patterns from main branch

import QRCode from "qrcode";

class DynamicQRService {
  constructor() {
    this.currentNetwork = null;
    // USDC token addresses for supported testnets (EVM + Solana)
    this.usdcTokenAddresses = {
      // EVM Networks
      11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Ethereum Sepolia
      421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia
      84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
      11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // OP Sepolia
      43113: "0x5425890298aed601595a70AB815c96711a31Bc65", // Avalanche Fuji
      80002: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // Polygon Amoy ✅ NEW

      // Solana Networks
      "solana-devnet": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Solana Devnet ✅ NEW
    };

    // Network configurations for all supported chains
    this.supportedNetworks = {
      // EVM Networks
      11155111: {
        name: "Ethereum Sepolia",
        symbol: "ETH",
        type: "EVM",
        rpc: "https://sepolia.infura.io/v3/",
        explorer: "https://sepolia.etherscan.io/",
      },
      421614: {
        name: "Arbitrum Sepolia",
        symbol: "ETH",
        type: "EVM",
        rpc: "https://sepolia-rollup.arbitrum.io/rpc",
        explorer: "https://sepolia.arbiscan.io/",
      },
      84532: {
        name: "Base Sepolia",
        symbol: "ETH",
        type: "EVM",
        rpc: "https://sepolia.base.org",
        explorer: "https://sepolia.basescan.org/",
      },
      11155420: {
        name: "OP Sepolia",
        symbol: "ETH",
        type: "EVM",
        rpc: "https://sepolia.optimism.io",
        explorer: "https://sepolia-optimism.etherscan.io/",
      },
      43113: {
        name: "Avalanche Fuji",
        symbol: "AVAX",
        type: "EVM",
        rpc: "https://api.avax-test.network/ext/bc/C/rpc",
        explorer: "https://testnet.snowtrace.io/",
      },
      80002: {
        name: "Polygon Amoy",
        symbol: "MATIC",
        type: "EVM",
        rpc: "https://rpc-amoy.polygon.technology/",
        explorer: "https://amoy.polygonscan.com/",
      },

      // Solana Networks
      "solana-devnet": {
        name: "Solana Devnet",
        symbol: "SOL",
        type: "SVM",
        rpc: "https://api.devnet.solana.com",
        explorer: "https://explorer.solana.com/?cluster=devnet",
      },
    };
  }

  // Network utility methods
  detectChainType(chainId) {
    if (chainId === "solana-devnet" || chainId === "devnet") {
      return "SVM"; // Solana Virtual Machine
    }
    return "EVM"; // Ethereum Virtual Machine
  }

  isEVMNetwork(chainId) {
    return this.detectChainType(chainId) === "EVM";
  }

  isSolanaNetwork(chainId) {
    return this.detectChainType(chainId) === "SVM";
  }

  getSupportedNetworks() {
    return this.supportedNetworks;
  }

  getNetworkInfo(chainId) {
    return this.supportedNetworks[chainId] || null;
  }

  // Enhanced QR generation with multi-chain support
  async generateDynamicQR(agentData, amountUSD = null) {
    try {
      console.log(
        "🔗 Generating dynamic QR code for:",
        agentData?.name || "agent"
      );

      if (!agentData) {
        throw new Error("Agent data is required for QR generation");
      }

      // Extract payment details from agent data
      const walletAddress =
        agentData.agent_wallet_address || agentData.payment_recipient_address;
      const feeAmount =
        agentData.interaction_fee_amount || agentData.fee_amount || "1.00";
      const feeToken =
        agentData.interaction_fee_token || agentData.fee_token || "USDC";
      const chainId = agentData.chain_id || 11155111; // Default to Ethereum Sepolia

      if (!walletAddress) {
        throw new Error("No wallet address found for QR generation");
      }

      // Detect current network if connected
      let targetNetwork = chainId;
      let chainType = this.detectChainType(targetNetwork);

      // For EVM networks, try to detect current network
      if (
        chainType === "EVM" &&
        typeof window !== "undefined" &&
        window.ethereum
      ) {
        try {
          const currentChainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          targetNetwork = parseInt(currentChainId, 16);
          console.log("🌐 Detected EVM network:", targetNetwork);
        } catch (error) {
          console.warn(
            "⚠️ Could not detect EVM network, using default:",
            targetNetwork
          );
        }
      }

      // For Solana networks, check if Phantom/Solflare is available
      if (
        chainType === "SVM" &&
        typeof window !== "undefined" &&
        (window.solana || window.phantom)
      ) {
        console.log("🌐 Detected Solana wallet available");
        targetNetwork = "solana-devnet"; // Use Solana devnet
      }

      // Get token address for current network
      const tokenAddress = this.usdcTokenAddresses[targetNetwork];
      const networkInfo = this.getNetworkInfo(targetNetwork);

      if (!networkInfo) {
        throw new Error(`Unsupported network: ${targetNetwork}`);
      }

      // Generate transaction data based on chain type
      let paymentUri;
      let transferData;

      if (this.isEVMNetwork(targetNetwork)) {
        // EVM network handling
        transferData = this.generateTransferData(
          walletAddress,
          feeAmount,
          feeToken,
          tokenAddress
        );

        // Create mobile-compatible EIP-681 URI for scanning with chain ID
        if (tokenAddress) {
          // ERC-20 token transfer URI format with chain ID
          const amountInDecimals = Math.floor(
            parseFloat(feeAmount) * Math.pow(10, 6)
          ); // USDC has 6 decimals
          paymentUri = `ethereum:${tokenAddress}@${targetNetwork}/transfer?address=${walletAddress}&uint256=${amountInDecimals}`;
          console.log(
            `📱 Generated EIP-681 for ERC-20 on chain ${targetNetwork}: ${paymentUri}`
          );
        } else {
          // Direct ETH transfer URI format with chain ID
          const amountInWei = this.parseAmount(feeAmount);
          paymentUri = `ethereum:${walletAddress}@${targetNetwork}?value=${amountInWei}`;
          console.log(
            `📱 Generated EIP-681 for ETH on chain ${targetNetwork}: ${paymentUri}`
          );
        }
      } else if (this.isSolanaNetwork(targetNetwork)) {
        // Solana network handling
        transferData = ""; // Solana doesn't use data field like EVM

        // Create Solana Pay URI format
        const amountInDecimals = parseFloat(feeAmount); // USDC on Solana also has 6 decimals
        paymentUri = `solana:${tokenAddress}?amount=${amountInDecimals}&spl-token=${tokenAddress}&recipient=${walletAddress}`;
        console.log(`📱 Generated Solana Pay URI: ${paymentUri}`);
      }

      // Create QR code data for click handling
      const clickData = {
        to: tokenAddress || walletAddress,
        value:
          this.isEVMNetwork(targetNetwork) && tokenAddress
            ? "0"
            : this.isEVMNetwork(targetNetwork)
            ? this.parseAmount(feeAmount)
            : "0",
        data: transferData,
        chainId: targetNetwork,
        chainType: chainType,
        amount: feeAmount,
        token: feeToken,
        recipient: walletAddress,
        agentName: agentData.name || "Agent",
        networkInfo: networkInfo,
      };

      // Generate QR code using the appropriate URI format
      const qrCodeDataUrl = await QRCode.toDataURL(paymentUri, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });

      console.log("✅ QR code generated successfully");
      console.log(`📱 Payment URI (${chainType}):`, paymentUri);

      return {
        success: true,
        qrData: qrCodeDataUrl,
        paymentUri: paymentUri,
        transactionData: clickData,
        network: targetNetwork,
        networkInfo: networkInfo,
        chainType: chainType,
        amount: feeAmount,
        token: feeToken,
        recipient: walletAddress,
      };
    } catch (error) {
      console.error("❌ QR generation failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  generateTransferData(
    recipientAddress,
    amount,
    token = "USDC",
    tokenAddress = null
  ) {
    if (!tokenAddress) {
      // Direct ETH transfer - no data needed
      return "0x";
    }

    // ERC-20 transfer function signature: transfer(address,uint256)
    const functionSignature = "0xa9059cbb"; // transfer function

    // Encode recipient address (32 bytes, padded)
    const encodedRecipient = recipientAddress
      .replace("0x", "")
      .padStart(64, "0");

    // Convert amount to wei (assuming 6 decimals for USDC)
    const decimals = token === "USDC" ? 6 : 18;
    const amountWei = (parseFloat(amount) * Math.pow(10, decimals))
      .toString(16)
      .padStart(64, "0");

    return functionSignature + encodedRecipient + amountWei;
  }

  parseAmount(amount) {
    // Convert amount to wei for ETH transactions
    return (parseFloat(amount) * Math.pow(10, 18)).toString(16);
  }

  async handleQRClick(agentData, qrData) {
    try {
      console.log("🔥 QR Code clicked! Attempting transaction...");

      const chainType =
        qrData.chainType || this.detectChainType(qrData.chainId);

      if (chainType === "EVM") {
        return await this.handleEVMTransaction(qrData);
      } else if (chainType === "SVM") {
        return await this.handleSolanaTransaction(qrData);
      } else {
        throw new Error(`Unsupported chain type: ${chainType}`);
      }
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleEVMTransaction(qrData) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error(
        "MetaMask not detected. Please install MetaMask to proceed with the transaction."
      );
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts connected. Please connect your wallet.");
    }

    const fromAddress = accounts[0];
    console.log("👤 Connected EVM account:", fromAddress);

    // Prepare transaction parameters
    const transactionParams = {
      from: fromAddress,
      to: qrData.to,
      value: qrData.value === "0" ? "0x0" : "0x" + qrData.value,
      data: qrData.data || "0x",
      gas: "0x15f90", // 90000 gas limit for ERC-20 transfers
    };

    console.log("🔧 EVM Transaction params prepared:", {
      to: transactionParams.to,
      value: transactionParams.value,
      dataLength: transactionParams.data.length,
      gas: transactionParams.gas,
    });

    // Check if we need to switch networks
    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    const targetChainId = "0x" + qrData.chainId.toString(16);

    if (currentChainId !== targetChainId) {
      console.log(
        `🔄 Switching network from ${currentChainId} to ${targetChainId}`
      );
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError) {
        console.warn(
          "⚠️ Network switch failed, proceeding with current network"
        );
      }
    }

    // Send transaction
    console.log("📤 Sending EVM transaction:", transactionParams);
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParams],
    });

    console.log("✅ EVM Transaction sent! Hash:", txHash);

    return {
      success: true,
      transactionHash: txHash,
      message: "Transaction sent successfully!",
      chainType: "EVM",
    };
  }

  async handleSolanaTransaction(qrData) {
    if (typeof window === "undefined" || (!window.solana && !window.phantom)) {
      throw new Error(
        "Solana wallet not detected. Please install Phantom or another Solana wallet."
      );
    }

    // Try to connect to Solana wallet (Phantom, Solflare, etc.)
    const wallet = window.phantom?.solana || window.solana;

    if (!wallet.isConnected) {
      await wallet.connect();
    }

    console.log("👤 Connected Solana account:", wallet.publicKey.toString());

    // For now, return a placeholder response
    // Full Solana transaction implementation would require additional dependencies
    console.log("🔧 Solana transaction data:", qrData);

    return {
      success: true,
      message: "Solana transaction initiated. Please complete in your wallet.",
      chainType: "SVM",
      note: "Full Solana transaction support requires additional implementation",
    };
  }

  // USDC Balance fetching methods
  async fetchUSDCBalance(walletAddress, chainId) {
    try {
      console.log(
        `💰 Fetching USDC balance for ${walletAddress} on chain ${chainId}`
      );

      const chainType = this.detectChainType(chainId);

      if (chainType === "EVM") {
        return await this.fetchEVMUSDCBalance(walletAddress, chainId);
      } else if (chainType === "SVM") {
        return await this.fetchSolanaUSDCBalance(walletAddress);
      } else {
        throw new Error(`Unsupported chain type: ${chainType}`);
      }
    } catch (error) {
      console.error("❌ Balance fetch error:", error);
      return {
        success: false,
        balance: "0",
        formatted: "0.00 USDC",
        error: error.message,
      };
    }
  }

  async fetchEVMUSDCBalance(walletAddress, chainId) {
    if (!window.ethereum) {
      throw new Error("MetaMask not available");
    }

    const networkInfo = this.getNetworkInfo(chainId);
    if (!networkInfo || !networkInfo.usdcAddress) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }

    try {
      // ERC-20 balanceOf ABI
      const balanceOfABI = [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
      ];

      // Create contract call data
      const data = window.ethereum.utils?.encodeFunctionCall
        ? window.ethereum.utils.encodeFunctionCall(balanceOfABI[0], [
            walletAddress,
          ])
        : this.encodeBalanceOfCall(walletAddress);

      // Call contract
      const balance = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: networkInfo.usdcAddress,
            data: data,
          },
          "latest",
        ],
      });

      // Parse balance (USDC has 6 decimals)
      const balanceInWei = parseInt(balance, 16);
      const balanceInUSDC = balanceInWei / Math.pow(10, 6);

      console.log(`✅ EVM USDC Balance: ${balanceInUSDC} USDC`);

      return {
        success: true,
        balance: balanceInWei.toString(),
        formatted: `${balanceInUSDC.toFixed(2)} USDC`,
        network: networkInfo.name,
        chainId: chainId,
      };
    } catch (error) {
      console.error(`❌ EVM balance fetch error for chain ${chainId}:`, error);
      return {
        success: false,
        balance: "0",
        formatted: "0.00 USDC",
        error: error.message,
        network: networkInfo.name,
        chainId: chainId,
      };
    }
  }

  async fetchSolanaUSDCBalance(walletAddress) {
    if (!window.phantom?.solana && !window.solana) {
      throw new Error("Solana wallet not available");
    }

    try {
      // For Solana Devnet USDC balance, we would need to:
      // 1. Connect to Solana RPC
      // 2. Get associated token account for USDC mint
      // 3. Query token account balance

      // Placeholder implementation - would need @solana/web3.js and @solana/spl-token
      console.log("🔄 Fetching Solana USDC balance (placeholder)...");

      // Return placeholder data for now
      return {
        success: true,
        balance: "1000000", // 1 USDC in micro-units (6 decimals)
        formatted: "1.00 USDC",
        network: "Solana Devnet",
        chainId: "solana-devnet",
        note: "Placeholder balance - requires full Solana integration",
      };
    } catch (error) {
      console.error("❌ Solana balance fetch error:", error);
      return {
        success: false,
        balance: "0",
        formatted: "0.00 USDC",
        error: error.message,
        network: "Solana Devnet",
        chainId: "solana-devnet",
      };
    }
  }

  // Helper method to encode balanceOf function call
  encodeBalanceOfCall(address) {
    // balanceOf(address) function selector: 0x70a08231
    const functionSelector = "0x70a08231";
    // Remove 0x prefix and pad address to 32 bytes
    const paddedAddress = address.slice(2).padStart(64, "0");
    return functionSelector + paddedAddress;
  }

  // Get current wallet balance for display
  async getCurrentWalletBalance(chainId) {
    try {
      const chainType = this.detectChainType(chainId);

      if (chainType === "EVM") {
        if (!window.ethereum) return null;

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts && accounts.length > 0) {
          return await this.fetchUSDCBalance(accounts[0], chainId);
        }
      } else if (chainType === "SVM") {
        const wallet = window.phantom?.solana || window.solana;
        if (wallet && wallet.isConnected) {
          return await this.fetchUSDCBalance(
            wallet.publicKey.toString(),
            chainId
          );
        }
      }

      return null;
    } catch (error) {
      console.error("❌ Current wallet balance error:", error);
      return null;
    }
  }
}

export const dynamicQRService = new DynamicQRService();
export default dynamicQRService;
