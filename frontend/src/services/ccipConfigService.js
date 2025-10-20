// CCIP Configuration Service for Cross-Chain Transfers
// Manages CCIP network configurations, fee estimation, and transaction building
// Built for AR Viewer Phase 2 - CCIP Cross-Chain Implementation

import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import ccipConfigConsolidated from "../config/ccip-config-consolidated.json";
import ccipConfig from "../config/ccip-config.json"; // Keep for backward compatibility

// CCIP Router ABI for encoding transactions
const CCIP_ROUTER_ABI = [
  {
    inputs: [
      {
        internalType: "uint64",
        name: "destinationChainSelector",
        type: "uint64",
      },
      {
        components: [
          {
            internalType: "bytes",
            name: "receiver",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            internalType: "struct Client.EVMTokenAmount[]",
            name: "tokenAmounts",
            type: "tuple[]",
          },
          {
            internalType: "address",
            name: "feeToken",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "extraArgs",
            type: "bytes",
          },
        ],
        internalType: "struct Client.EVM2AnyMessage",
        name: "message",
        type: "tuple",
      },
    ],
    name: "ccipSend",
    outputs: [
      {
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "destinationChainSelector",
        type: "uint64",
      },
      {
        components: [
          {
            internalType: "bytes",
            name: "receiver",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            internalType: "struct Client.EVMTokenAmount[]",
            name: "tokenAmounts",
            type: "tuple[]",
          },
          {
            internalType: "address",
            name: "feeToken",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "extraArgs",
            type: "bytes",
          },
        ],
        internalType: "struct Client.EVM2AnyMessage",
        name: "message",
        type: "tuple",
      },
    ],
    name: "getFee",
    outputs: [
      {
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

class CCIPConfigService {
  constructor() {
    this.networkConfigs = new Map();
    this.routerABI = CCIP_ROUTER_ABI;
    this.initialized = false;
    this.supportedRoutes = new Set();

    // Initialize configurations from JSON
    this.initializeConfigurations();
  }

  /**
   * Initialize network configurations from consolidated ccip-config
   * Uses new structure: ccipConfigConsolidated.chains
   */
  initializeConfigurations() {
    try {
      console.log("🚀 Initializing CCIP configurations with consolidated structure...");
      
      // Load all chains from the consolidated configuration
      const chains = ccipConfigConsolidated.chains;
      
      Object.entries(chains).forEach(([networkName, config]) => {
        console.log(`🔍 LOADING CONFIG FOR ${networkName}:`, {
          chainId: config.chainId,
          chainSelector: config.chainSelector,
          chainSelectorType: typeof config.chainSelector,
        });

        // CRITICAL: Validate OP Sepolia configuration during initialization
        if (networkName === "OPSepolia") {
          console.log("🚨 OP SEPOLIA CONFIGURATION VALIDATION:");
          console.log(
            "  - Raw chainSelector from config:",
            config.chainSelector
          );
          console.log("  - Type:", typeof config.chainSelector);
          console.log("  - String value:", String(config.chainSelector));
          console.log("  - Expected:", "5224473277236331295");
          console.log(
            "  - Match:",
            String(config.chainSelector) === "5224473277236331295"
          );

          if (String(config.chainSelector) !== "5224473277236331295") {
            console.error(
              "❌ CRITICAL: Wrong OP Sepolia chain selector in config file!"
            );
            throw new Error(
              `OP Sepolia chain selector is wrong: expected 5224473277236331295, got ${config.chainSelector}`
            );
          } else {
            console.log(
              "✅ OP Sepolia chain selector is correct in config file"
            );
          }
        }

        // Determine chain type based on chainId
        const chainType = config.chainId === "devnet" ? "SVM" : "EVM";
        const chainIdKey = config.chainId === "devnet" ? "devnet" : config.chainId.toString();

        this.networkConfigs.set(chainIdKey, {
          chainId: config.chainId,
          chainName: config.chainName,
          chainSelector: config.chainSelector,
          router: config.router,
          usdc: config.usdc,
          lanes: config.lanes,
          rpcUrl: config.rpcUrl,
          currencySymbol: config.currencySymbol,
          feeTokens: config.feeTokens || {},
          type: chainType,
        });
      });

      // Initialize supported routes
      this.initializeSupportedRoutes();

      this.initialized = true;
      console.log(
        "✅ CCIP Configuration Service initialized with",
        this.networkConfigs.size,
        "networks"
      );
      console.log(
        "✅ Total supported cross-chain routes:",
        this.supportedRoutes.size
      );
    } catch (error) {
      console.error("❌ Failed to initialize CCIP configurations:", error);
      throw error;
    }
  }

  /**
   * Initialize supported cross-chain routes
   */
  initializeSupportedRoutes() {
    // EVM to EVM routes
    ccipConfig.supportedRoutes.evmToEvm.forEach((route) => {
      this.supportedRoutes.add(route);
    });

    // EVM to Solana routes
    ccipConfig.supportedRoutes.evmToSolana.forEach((route) => {
      this.supportedRoutes.add(route);
    });

    // Solana to EVM routes
    ccipConfig.supportedRoutes.solanaToEvm.forEach((route) => {
      this.supportedRoutes.add(route);
    });
  }

  /**
   * Get network configuration by chain ID
   * @param {string|number} chainId - The chain ID
   * @returns {Object|null} Network configuration
   */
  getNetworkConfig(chainId) {
    return this.networkConfigs.get(chainId.toString()) || null;
  }

  /**
   * Get chain configuration by name from consolidated config
   * @param {string} chainName - The chain name (e.g., "BaseSepolia", "OPSepolia")
   * @returns {Object} Chain configuration object
   */
  getChainConfig(chainName) {
    const config = ccipConfigConsolidated.chains[chainName];
    if (!config) {
      throw new Error(`Configuration not found for chain: ${chainName}`);
    }
    return config;
  }

  /**
   * Get chain selector by chain name
   * @param {string} chainName - The chain name
   * @returns {string} Chain selector
   */
  getChainSelector(chainName) {
    const config = this.getChainConfig(chainName);
    return config.chainSelector;
  }

  /**
   * Get router address by chain name
   * @param {string} chainName - The chain name
   * @returns {string} Router contract address
   */
  getRouterAddress(chainName) {
    const config = this.getChainConfig(chainName);
    return config.router;
  }

  /**
   * Get USDC token address by chain name
   * @param {string} chainName - The chain name
   * @returns {string} USDC token address
   */
  getUSDCAddress(chainName) {
    const config = this.getChainConfig(chainName);
    return config.usdc.tokenAddress;
  }

  /**
   * Get RPC URL by chain name
   * @param {string} chainName - The chain name
   * @returns {string} RPC URL
   */
  getRpcUrl(chainName) {
    const config = this.getChainConfig(chainName);
    return config.rpcUrl;
  }

  /**
   * Check if cross-chain transfer is needed
   * @param {string|number} sourceChain - Source chain ID
   * @param {string|number} destinationChain - Destination chain ID
   * @returns {boolean} True if cross-chain transfer needed
   */
  isCrossChainTransfer(sourceChain, destinationChain) {
    return sourceChain.toString() !== destinationChain.toString();
  }

  /**
   * Check if a cross-chain route is supported
   * @param {string|number} sourceChain - Source chain ID
   * @param {string|number} destinationChain - Destination chain ID
   * @returns {boolean} True if route is supported
   */
  isRouteSupported(sourceChain, destinationChain) {
    const sourceConfig = this.getNetworkConfig(sourceChain);
    const destConfig = this.getNetworkConfig(destinationChain);

    if (!sourceConfig || !destConfig) {
      return false;
    }

    const routeKey = `${sourceConfig.chainName}->${destConfig.chainName}`;
    return this.supportedRoutes.has(routeKey);
  }

  /**
   * Get available destination networks for a source network
   * @param {string|number} sourceChain - Source chain ID
   * @returns {Array} Array of supported destination networks
   */
  getAvailableDestinations(sourceChain) {
    const sourceConfig = this.getNetworkConfig(sourceChain);
    if (!sourceConfig) {
      return [];
    }

    const destinations = [];
    this.networkConfigs.forEach((config, chainId) => {
      if (
        chainId !== sourceChain.toString() &&
        this.isRouteSupported(sourceChain, chainId)
      ) {
        destinations.push({
          chainId: config.chainId,
          chainName: config.chainName,
          currencySymbol: config.currencySymbol,
          type: config.type,
        });
      }
    });

    return destinations;
  }

  // Helper to get an ethers.js Contract instance for the CCIP Router
  getRouterContract(routerAddress, provider) {
    return new ethers.Contract(routerAddress, this.routerABI, provider);
  }

  /**
   * Estimate CCIP transfer fees by calling the router contract
   * @param {string|number} sourceChain - Source chain ID
   * @param {string|number} destinationChain - Destination chain ID
   * @param {string} amount - USDC amount in human readable format
   * @param {string} recipient - Recipient address on destination chain
   * @param {string} feeToken - Fee token preference ("native", "LINK")
   * @param {Object} provider - Ethers.js provider for the source chain
   * @returns {Promise<Object>} Fee estimation result
   */
  async estimateCCIPFees(
    sourceChain,
    destinationChain,
    amount,
    recipient,
    feeToken = "native",
    provider
  ) {
    try {
      if (!this.isCrossChainTransfer(sourceChain, destinationChain)) {
        throw new Error("Not a cross-chain transfer");
      }

      if (!this.isRouteSupported(sourceChain, destinationChain)) {
        throw new Error("Cross-chain route not supported");
      }

      if (!provider) {
        throw new Error("Ethers.js provider is required for fee estimation");
      }

      const sourceConfig = this.getNetworkConfig(sourceChain);
      const destConfig = this.getNetworkConfig(destinationChain);

      // Build CCIP message
      const message = this.buildCCIPMessage(
        recipient,
        amount,
        sourceConfig,
        destConfig,
        feeToken
      );

      // Get router contract instance
      const routerContract = this.getRouterContract(
        sourceConfig.router,
        provider
      );

      // Call getFee on the router contract
      console.log("Calling router.getFee() with:", {
        destinationChainSelector: destConfig.chainSelector,
        message: message,
      });

      // Try to get fee from contract, fall back to emergency calculation
      let estimatedFee;
      try {
        estimatedFee = await routerContract.getFee(
          BigInt(destConfig.chainSelector), // Convert to BigInt for uint64
          message
        );
        console.log(
          "✅ Contract fee estimation successful:",
          estimatedFee.toString()
        );
      } catch (contractError) {
        console.warn(
          "⚠️ Contract fee estimation failed, using emergency calculation:",
          contractError.message
        );

        // Fall back to emergency fee calculation
        const emergencyFeeWei = this.getEstimatedFeeForRoute_OLD(
          sourceChain,
          destinationChain
        );
        estimatedFee = ethers.BigNumber.from(emergencyFeeWei);

        console.log("🚨 Using emergency fee:", {
          emergencyFeeWei: emergencyFeeWei,
          emergencyFeeETH: ethers.utils.formatEther(emergencyFeeWei),
        });
      }

      // Add a 20% buffer to the estimated fee for robustness
      const bufferedFee =
        BigInt(estimatedFee) +
        (BigInt(estimatedFee) * BigInt(20)) / BigInt(100);

      console.log(`💰 Actual CCIP Fee Calculation:`, {
        rawEstimatedFee: estimatedFee.toString(),
        bufferedFee: bufferedFee.toString(),
        rawEstimatedFeeETH: ethers.utils.formatEther(estimatedFee),
        bufferedFeeETH: ethers.utils.formatEther(bufferedFee),
        feeToken: feeToken,
      });

      return {
        success: true,
        sourceChain: sourceConfig.chainName,
        destinationChain: destConfig.chainName,
        amount: amount,
        estimatedFee: bufferedFee.toString(), // Return buffered fee
        feeToken: feeToken,
        message: message,
        routerAddress: sourceConfig.router,
        gasLimit: "1000000", // High gas limit for CCIP transactions
      };
    } catch (error) {
      console.error("❌ CCIP fee estimation failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Build CCIP message for cross-chain transfer
   * @param {string} recipient - Recipient address
   * @param {string} amount - USDC amount
   * @param {Object} sourceConfig - Source network config
   * @param {Object} destConfig - Destination network config
   * @param {string} feeToken - Fee token preference
   * @returns {Object} CCIP message object
   */
  buildCCIPMessage(recipient, amount, sourceConfig, destConfig, feeToken) {
    // Convert amount to wei (USDC has 6 decimals)
    const amountWei = ethers.utils.parseUnits(amount.toString(), 6);

    // FIXED: Use native ETH for CCIP fees (standard practice) with reasonable amounts
    // Fee token address resolution
    let feeTokenAddress;
    if (feeToken === "native") {
      // Use native ETH for fees (standard CCIP practice)
      feeTokenAddress = ethers.constants.AddressZero;
      console.log("💰 Using native ETH for CCIP fees (standard practice)");
    } else if (
      feeToken === "LINK" &&
      sourceConfig.feeTokens &&
      sourceConfig.feeTokens.LINK
    ) {
      feeTokenAddress = sourceConfig.feeTokens.LINK;
      console.log("💰 Using LINK token for CCIP fees:", feeTokenAddress);
    } else {
      // Default to native ETH with warning
      console.warn(
        "⚠️ Fee token not found or invalid, defaulting to native ETH"
      );
      feeTokenAddress = ethers.constants.AddressZero;
    }

    console.log(`🔧 Fee Token Resolution:`, {
      requestedFeeToken: feeToken,
      resolvedAddress: feeTokenAddress,
      isNative: feeTokenAddress === ethers.constants.AddressZero,
      availableTokens: Object.keys(sourceConfig.feeTokens || {}),
    });

    console.log(`💰 CCIP Message Components:`, {
      recipient: recipient,
      recipientFormatted: ethers.utils.getAddress(recipient),
      usdcTokenAddress: sourceConfig.usdc.tokenAddress,
      amountUSDC: amount,
      amountWei: amountWei.toString(),
      feeTokenAddress: feeTokenAddress,
    });

    return {
      receiver: ethers.utils.defaultAbiCoder.encode(["address"], [recipient]),
      data: "0x", // Empty data for simple token transfer
      tokenAmounts: [
        {
          token: sourceConfig.usdc.tokenAddress,
          amount: amountWei.toString(),
        },
      ],
      feeToken: feeTokenAddress,
      extraArgs: this.encodeExtraArgs({ gasLimit: 500000 }), // Increased gas limit for destination execution to prevent out-of-gas
    };
  }

  /**
   * Encode extra arguments for CCIP message
   * @param {Object} args - Extra arguments
   * @returns {string} Encoded extra args
   */
  encodeExtraArgs(args) {
    // FIXED: Proper CCIP extraArgs encoding with correct tag
    // According to Chainlink CCIP docs, extraArgs need the EVMExtraArgsV1 tag
    // Tag is derived from the hash of "CCIP EVMExtraArgsV1"
    const EXTRA_ARGS_V1_TAG = "0x97a657c9"; // 4-byte tag for EVMExtraArgsV1

    // Encode the gasLimit parameter
    const encodedArgs = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [args.gasLimit]
    );

    // Concatenate tag + encoded args
    const fullExtraArgs = EXTRA_ARGS_V1_TAG + encodedArgs.slice(2); // Remove 0x from encoded args

    console.log("🔧 ExtraArgs Encoding:", {
      gasLimit: args.gasLimit,
      tag: EXTRA_ARGS_V1_TAG,
      encodedArgs: encodedArgs,
      fullExtraArgs: fullExtraArgs,
      length: fullExtraArgs.length,
    });

    return fullExtraArgs;
  }

  /**
   * Simulate CCIP transaction to detect potential revert reasons
   * This function performs a dry-run of the ccipSend call to identify issues
   * before submitting the actual transaction.
   *
   * @param {string} routerAddress - CCIP Router contract address
   * @param {string} destinationChainSelector - Destination chain selector
   * @param {Object} message - CCIP message object
   * @param {string} valueWei - Transaction value in wei
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Simulation result with success/error info
   */
  async simulateCCIPTransaction(
    routerAddress,
    destinationChainSelector,
    message,
    valueWei,
    userAddress
  ) {
    try {
      console.log("🎬 SIMULATING CCIP Transaction before execution...");
      console.log("📋 Simulation Parameters:", {
        router: routerAddress,
        destinationSelector: destinationChainSelector,
        value: valueWei,
        from: userAddress,
        messageStructure: JSON.stringify(message, null, 2),
      });

      if (!window.ethereum) {
        return {
          success: false,
          error: "No MetaMask provider available for simulation",
        };
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const routerContract = new ethers.Contract(
        routerAddress,
        CCIP_ROUTER_ABI,
        provider
      );

      // Perform static call (simulation) to detect revert reasons
      try {
        console.log("🔍 Performing staticCall simulation...");

        // Pre-simulation validation checks
        console.log("🔍 Pre-simulation validation:");

        // Check if destination chain selector is supported
        try {
          const isSupported = await routerContract.isChainSupported(
            BigInt(destinationChainSelector) // Convert to BigInt for uint64
          );
          console.log(`  - Destination chain supported: ${isSupported}`);
          if (!isSupported) {
            return {
              success: false,
              error: "Destination chain not supported by CCIP Router",
              revertReason: "Destination chain not supported",
              preValidationFailed: true,
            };
          }
        } catch (checkError) {
          console.warn(
            "  - Could not check chain support:",
            checkError.message
          );
        }

        // Check if we have enough ETH for fees
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const userBalance = await provider.getBalance(userAddress);
        const requiredValue = ethers.BigNumber.from(valueWei);
        console.log(
          `  - User ETH balance: ${ethers.utils.formatEther(userBalance)} ETH`
        );
        console.log(
          `  - Required value: ${ethers.utils.formatEther(requiredValue)} ETH`
        );
        console.log(
          `  - Sufficient balance: ${userBalance.gte(requiredValue)}`
        );

        if (userBalance.lt(requiredValue)) {
          return {
            success: false,
            error: "Insufficient ETH balance for transaction value + gas",
            revertReason: "Insufficient ETH balance",
            preValidationFailed: true,
          };
        }

        const simulationResult = await routerContract.callStatic.ccipSend(
          BigInt(destinationChainSelector), // Convert to BigInt for uint64
          message,
          {
            from: userAddress,
            value: valueWei,
            gasLimit: 1000000, // High gas limit for simulation
          }
        );

        console.log("✅ SIMULATION SUCCESS - Transaction should work:", {
          simulationResult: simulationResult.toString(),
          messageId: simulationResult,
        });

        return {
          success: true,
          messageId: simulationResult.toString(),
          message: "Simulation successful - transaction should execute",
        };
      } catch (simulationError) {
        console.error("❌ SIMULATION FAILED - Transaction will revert:", {
          error: simulationError.message,
          code: simulationError.code,
          data: simulationError.data,
          reason: simulationError.reason,
          fullError: simulationError,
        });

        // Enhanced revert reason decoding
        let revertReason = "Unknown revert reason";
        let decodingAttempts = [];

        // Method 1: Check if error has a direct reason
        if (simulationError.reason) {
          revertReason = simulationError.reason;
          decodingAttempts.push("Direct reason property");
        }
        // Method 2: Try to extract from error message
        else if (simulationError.message) {
          // Look for common patterns in error messages
          const patterns = [
            /revert (.+)/i,
            /execution reverted: (.+)/i,
            /VM execution error: (.+)/i,
            /reverted with reason string '(.+)'/i,
          ];

          for (const pattern of patterns) {
            const match = simulationError.message.match(pattern);
            if (match && match[1]) {
              revertReason = match[1].trim();
              decodingAttempts.push(`Message pattern: ${pattern.source}`);
              break;
            }
          }
        }

        // Method 3: Try to decode from error data
        if (simulationError.data && simulationError.data.length > 10) {
          try {
            const errorData = simulationError.data;
            decodingAttempts.push(`Raw data: ${errorData}`);

            if (errorData.startsWith("0x08c379a0")) {
              // Standard revert with reason string
              const reason = ethers.utils.defaultAbiCoder.decode(
                ["string"],
                "0x" + errorData.slice(10)
              )[0];
              revertReason = reason;
              decodingAttempts.push("ABI decoded revert string");
            } else if (errorData.startsWith("0x4e487b71")) {
              // Panic error
              const panicCode = ethers.utils.defaultAbiCoder.decode(
                ["uint256"],
                "0x" + errorData.slice(10)
              )[0];
              revertReason = `Panic error: ${panicCode.toString()}`;
              decodingAttempts.push("Panic code decoded");
            }
          } catch (decodeError) {
            console.warn("Could not decode revert reason:", decodeError);
            decodingAttempts.push(`Decode failed: ${decodeError.message}`);
          }
        }

        // Method 4: Check for specific CCIP errors
        const ccipErrorPatterns = {
          "insufficient fee": "CCIP fee too low",
          "router not approved": "Router not approved for token transfer",
          "destination chain not supported": "Destination chain not supported",
          "token not supported": "Token not supported on this route",
          allowance: "Insufficient token allowance",
          balance: "Insufficient token balance",
        };

        for (const [pattern, description] of Object.entries(
          ccipErrorPatterns
        )) {
          if (simulationError.message?.toLowerCase().includes(pattern)) {
            revertReason = description;
            decodingAttempts.push(`CCIP pattern match: ${pattern}`);
            break;
          }
        }

        console.log("🔍 Revert reason decoding attempts:", decodingAttempts);
        console.log("🎯 Final decoded revert reason:", revertReason);

        return {
          success: false,
          error: simulationError.message,
          revertReason,
          errorCode: simulationError.code,
          rawError: simulationError,
          decodingAttempts,
        };
      }
    } catch (error) {
      console.error("🚨 Simulation setup failed:", error);
      return {
        success: false,
        error: "Simulation setup failed: " + error.message,
      };
    }
  }

  /**
   * Build CCIP transaction data for wallet execution
   * @param {string|number} sourceChain - Source chain ID
   * @param {string|number} destinationChain - Destination chain ID
   * @param {string} amount - USDC amount
   * @param {string} recipient - Recipient address
   * @param {string} feeToken - Fee token preference
   * @returns {Promise<Object>} Transaction data
   */
  async buildCCIPTransaction(
    sourceChain,
    destinationChain,
    amount,
    recipient,
    feeToken = "native"
  ) {
    try {
      console.log("🔧 Building CCIP transaction:", {
        sourceChain,
        destinationChain,
        amount,
        recipient,
        feeToken,
      });

      const sourceConfig = this.getNetworkConfig(sourceChain);
      const destConfig = this.getNetworkConfig(destinationChain);

      if (!sourceConfig || !destConfig) {
        throw new Error("Invalid source or destination chain");
      }

      // CRITICAL: Verify OP Sepolia chain selector before proceeding
      console.log("🚨 CHAIN SELECTOR CRITICAL VALIDATION:");
      console.log("  - Destination Chain ID:", destinationChain);
      console.log(
        "  - Destination Config FULL:",
        JSON.stringify(destConfig, null, 2)
      );
      console.log("  - Chain Selector from config:", destConfig.chainSelector);
      console.log("  - Chain Selector TYPE:", typeof destConfig.chainSelector);
      console.log("  - Chain Name from config:", destConfig.chainName);

      // DEBUG: Check if chainSelector is accidentally set to chainName
      if (destConfig.chainSelector === destConfig.chainName) {
        console.error("🚨 BUG DETECTED: chainSelector equals chainName!");
        console.log("  - This suggests the config loading has a bug");
        console.log("  - Expected numeric selector, got chain name");
      }

      if (destinationChain.toString() === "11155420") {
        console.log("  🎯 OP SEPOLIA DETECTED - Validating chain selector...");
        const expectedOPSepoliaSelector = "5224473277236331295";
        const actualSelector = String(destConfig.chainSelector);

        console.log(`  - Expected: ${expectedOPSepoliaSelector}`);
        console.log(`  - Actual: ${actualSelector}`);
        console.log(
          `  - Match: ${actualSelector === expectedOPSepoliaSelector}`
        );

        if (actualSelector !== expectedOPSepoliaSelector) {
          console.error(
            `  ❌ WRONG CHAIN SELECTOR! Using ${actualSelector} instead of ${expectedOPSepoliaSelector}`
          );
          throw new Error(
            `Critical error: Wrong OP Sepolia chain selector. Expected ${expectedOPSepoliaSelector}, got ${actualSelector}`
          );
        } else {
          console.log("  ✅ OP Sepolia chain selector is CORRECT");
        }
      }

      // Build CCIP message first to pass to fee estimator
      const message = this.buildCCIPMessage(
        recipient,
        amount,
        sourceConfig,
        destConfig,
        feeToken
      );

      // Get provider for fee estimation (using source chain's RPC URL)
      let rpcUrl = sourceConfig.rpcUrl;
      // Fix RPC URL format - add https:// if missing
      if (!rpcUrl.startsWith("http://") && !rpcUrl.startsWith("https://")) {
        rpcUrl = "https://" + rpcUrl;
      }
      console.log("🔧 RPC URL for provider:", rpcUrl);
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Estimate fees using the updated estimateCCIPFees function
      const feeEstimate = await this.estimateCCIPFees(
        sourceChain,
        destinationChain,
        amount,
        recipient,
        feeToken,
        provider // Pass the provider for on-chain fee estimation
      );

      console.log("✅ Fee estimate:", feeEstimate);

      if (!feeEstimate.success) {
        throw new Error(`Fee estimation failed: ${feeEstimate.error}`);
      }

      // Encode transaction data for ccipSend
      const routerInterface = new ethers.utils.Interface(this.routerABI);

      // CRITICAL DEBUG: Log the complete destination config to identify chain selector issues
      console.log("🔍 COMPREHENSIVE Chain Selector Debug:", {
        sourceChain: sourceChain,
        destinationChain: destinationChain,
        destConfigComplete: JSON.stringify(destConfig, null, 2),
        destConfigChainSelector: destConfig.chainSelector,
        destConfigChainSelectorType: typeof destConfig.chainSelector,
        destConfigChainSelectorValue: destConfig.chainSelector,
        destConfigChainSelectorHex: destConfig.chainSelector
          ? "0x" + BigInt(destConfig.chainSelector).toString(16)
          : "N/A",
        destConfigChainSelectorDecimal: destConfig.chainSelector,
        rawConfigCheck: this.getNetworkConfig(destinationChain),
      });

      // Additional validation of chain selector before encoding
      console.log("🚨 CHAIN SELECTOR VALIDATION:");
      console.log(
        "  - Raw destConfig.chainSelector:",
        destConfig.chainSelector
      );
      console.log("  - Type:", typeof destConfig.chainSelector);
      console.log("  - String value:", String(destConfig.chainSelector));
      console.log("  - BigInt conversion:", BigInt(destConfig.chainSelector));

      // CRITICAL DEBUG: Manual verification of hex conversion
      const actualValue = BigInt(destConfig.chainSelector);
      const actualHex = actualValue.toString(16);
      console.log("  - Actual decimal as BigInt:", actualValue.toString());
      console.log("  - Actual hex conversion:", "0x" + actualHex);

      // Test with known correct values
      const correctOPSepoliaDecimal = "5224473277236331295";
      const correctOPSepoliaValue = BigInt(correctOPSepoliaDecimal);
      const correctOPSepoliaHex = correctOPSepoliaValue.toString(16);
      console.log(
        "  - CORRECT OP Sepolia decimal:",
        correctOPSepoliaValue.toString()
      );
      console.log("  - CORRECT OP Sepolia hex:", "0x" + correctOPSepoliaHex);

      // Compare the values
      console.log(
        "  - Values match?:",
        actualValue.toString() === correctOPSepoliaValue.toString()
      );
      console.log("  - Hex match?:", actualHex === correctOPSepoliaHex);
      console.log("  - Expected OP Sepolia:", "5224473277236331295");
      console.log(
        "  - Match expected?:",
        String(destConfig.chainSelector) === "5224473277236331295"
      );
      console.log(
        "  - Wrong old selector?:",
        String(destConfig.chainSelector) === "5216608019844513823"
      );

      // CRITICAL FIX: Use correct chain selector for transaction encoding
      const correctChainSelector = (() => {
        console.log(
          "🔍 DEBUG: Processing chainSelector for transaction encoding:",
          {
            destinationChain: destinationChain,
            destConfigChainSelector: destConfig.chainSelector,
            isOPSepolia: destinationChain.toString() === "11155420",
            selectorCorrupted:
              destConfig.chainSelector === destConfig.chainName,
          }
        );

        // CRITICAL: Detect chain selector corruption
        if (destConfig.chainSelector === destConfig.chainName) {
          console.error(
            "🚨 CRITICAL: chainSelector corrupted to chainName in transaction encoding!"
          );
          console.error(
            `  - Got: "${destConfig.chainSelector}" (should be numeric)`
          );
          console.error(`  - ChainName: "${destConfig.chainName}"`);
        }

        // FORCE CORRECT OP SEPOLIA SELECTOR: Always use correct value
        if (destinationChain.toString() === "11155420") {
          const correctOPSelector = "5224473277236331295";
          console.log(
            "🚨 FORCING CORRECT OP SEPOLIA CHAIN SELECTOR FOR TRANSACTION ENCODING"
          );
          console.log("  - Destination Chain: OP Sepolia (11155420)");
          console.log("  - Config value:", destConfig.chainSelector);
          console.log("  - Using correct:", correctOPSelector);
          return correctOPSelector;
        }

        // For other chains, ensure we don't use a corrupted value
        if (destConfig.chainSelector === destConfig.chainName) {
          console.error(
            "🚨 Cannot fix corrupted chain selector for non-OP chain!"
          );
          throw new Error(
            `Chain selector corrupted for chain ${destinationChain}: got "${destConfig.chainSelector}" (chain name) instead of numeric selector`
          );
        }

        return destConfig.chainSelector;
      })();

      console.log(
        "🎯 FINAL CHAIN SELECTOR FOR ENCODING:",
        correctChainSelector
      );

      // FINAL VERIFICATION: Double-check chain selector before encoding
      let finalChainSelector = correctChainSelector;

      // Verify the chain selector conversion for logging
      const decimalValue = BigInt(finalChainSelector).toString();
      const hexValue = BigInt(finalChainSelector).toString(16);

      console.log("🔍 FINAL CHAIN SELECTOR VERIFICATION:");
      console.log("  - Using selector:", finalChainSelector);
      console.log("  - As decimal:", decimalValue);
      console.log("  - As hex:", "0x" + hexValue);

      // Validation for OP Sepolia (now should be correct from config)
      if (destinationChain.toString() === "11155420") {
        const expectedHex = "48810ec3e431431f";
        if (hexValue === expectedHex) {
          console.log("✅ OP Sepolia chain selector is correct!");
        } else {
          console.error("❌ OP Sepolia chain selector still wrong!");
          console.error("  - Got hex:", "0x" + hexValue);
          console.error("  - Expected hex: 0x" + expectedHex);
        }
      }

      // CRITICAL: Convert string to BigInt for proper ABI encoding
      const chainSelectorForEncoding = BigInt(finalChainSelector);
      console.log("🔢 CHAIN SELECTOR ENCODING:");
      console.log("  - String value:", finalChainSelector);
      console.log(
        "  - BigInt for encoding:",
        chainSelectorForEncoding.toString()
      );
      console.log(
        "  - Hex representation:",
        "0x" + chainSelectorForEncoding.toString(16)
      );

      const txData = routerInterface.encodeFunctionData("ccipSend", [
        chainSelectorForEncoding,
        message,
      ]);

      // Log the raw encoded transaction data to verify the chain selector
      console.log("🔍 RAW ENCODED TRANSACTION ANALYSIS:");
      console.log("  - Full txData:", txData);
      console.log(
        "  - Function selector (first 10 chars):",
        txData.substring(0, 10)
      );
      console.log(
        "  - Chain selector bytes (next 64 chars):",
        txData.substring(10, 74)
      );
      const encodedChainSelector = txData.substring(10, 74);
      console.log("  - Chain selector as hex:", "0x" + encodedChainSelector);
      console.log(
        "  - Chain selector as decimal:",
        BigInt("0x" + encodedChainSelector).toString()
      );

      console.log("✅ Transaction data encoded");

      // Set transaction value to the estimated fee (for native fee payments)
      const transactionValue = feeEstimate.estimatedFee; // This is already buffered

      console.log(`⛽ GAS & FEE TOKEN ANALYSIS:`, {
        feeToken: feeToken,
        gasLimit: "1000000", // High gas limit for CCIP transactions
        gasPrice: "wallet-estimated", // Let wallet estimate gas price
        transactionValueETH: ethers.utils.formatEther(transactionValue),
        transferAmount: `${amount} USDC`,
        feeTokenUsage:
          feeToken === "native" ? "Using ETH for fees" : "Using LINK for fees",
      });

      return {
        success: true,
        to: sourceConfig.router,
        data: txData,
        value: transactionValue, // Use the dynamically estimated and buffered fee
        chainId: sourceConfig.chainId,
        gasLimit: "1000000", // High gas limit for CCIP transactions
        gasPrice: null, // Let wallet estimate gas price
        estimatedFee: feeEstimate.estimatedFee,
        feeToken: feeToken,
        sourceChain: sourceConfig.chainName,
        destinationChain: destConfig.chainName,
        amount: amount,
        recipient: recipient,
        ccipDetails: { message: message }, // Add message details for debugging
        // Add debug information for transaction review
        isCrossChain: true,
        transactionType: "CCIP Cross-Chain",
        debugInfo: {
          userChainId: sourceChain,
          agentChainId: destinationChain,
          needsCrossChain: true,
          ccipRouter: sourceConfig.router,
          chainSelector: (() => {
            console.log("🔍 DEBUG: Processing chainSelector for debugInfo:", {
              destinationChain: destinationChain,
              destConfigChainSelector: destConfig.chainSelector,
              isOPSepolia: destinationChain.toString() === "11155420",
              selectorEqualsOPSepolia: destConfig.chainSelector === "OPSepolia",
              selectorEqualsChainName:
                destConfig.chainSelector === destConfig.chainName,
            });

            // CRITICAL BUG FIX: Detect if chainSelector was corrupted to chainName
            if (destConfig.chainSelector === destConfig.chainName) {
              console.error(
                "🚨 CRITICAL BUG: chainSelector corrupted to chainName!"
              );
              console.error(`  - chainSelector: "${destConfig.chainSelector}"`);
              console.error(`  - chainName: "${destConfig.chainName}"`);
              console.error(
                "  - This should NEVER happen - fixing automatically"
              );

              // Use correct chain selector based on destination chain
              if (destinationChain.toString() === "11155420") {
                console.log("  - Fixing OP Sepolia chain selector");
                return "5224473277236331295";
              } else {
                console.error("  - Unknown destination chain, cannot fix");
                return "CORRUPTED_CHAIN_SELECTOR_UNKNOWN_CHAIN";
              }
            }

            // Additional check for OP Sepolia specifically
            if (destinationChain.toString() === "11155420") {
              // Ensure we always use the correct OP Sepolia selector
              const expectedSelector = "5224473277236331295";

              if (String(destConfig.chainSelector) !== expectedSelector) {
                console.error("🚨 WRONG OP SEPOLIA CHAIN SELECTOR!");
                console.error(`  - Got: "${destConfig.chainSelector}"`);
                console.error(`  - Expected: "${expectedSelector}"`);
                console.error("  - Using correct value");
                return expectedSelector;
              }

              return expectedSelector; // Always use correct value for OP Sepolia
            }

            return destConfig.chainSelector;
          })(),
          chainSelectorType: typeof destConfig.chainSelector,
          chainSelectorRaw: destConfig.chainSelector,
          destConfigComplete: JSON.stringify(destConfig),
          expectedOPSepoliaSelector:
            destinationChain.toString() === "11155420"
              ? "5224473277236331295"
              : "N/A",
          extraArgs: message.extraArgs,
          transactionValue: transactionValue,
          gasLimit: "1000000", // High gas limit for CCIP transactions
        },
      };
    } catch (error) {
      console.error("❌ Failed to build CCIP transaction:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * @deprecated - Replaced by estimateCCIPFees with dynamic router queries
   * Get estimated fee for a specific route (placeholder implementation)
   * @param {string|number} sourceChain - Source chain ID
   * @param {string|number} destinationChain - Destination chain ID
   * @returns {string} Estimated fee in wei
   */
  getEstimatedFeeForRoute_OLD(sourceChain, destinationChain) {
    // FIXED: Much more reasonable CCIP fee estimation for testnets
    const sourceConfig = this.getNetworkConfig(sourceChain);
    const destConfig = this.getNetworkConfig(destinationChain);

    // FIXED: More realistic CCIP fee estimation for testnets (increased from emergency levels)
    const baseFees = {
      "EVM->EVM": "0.0005", // FIXED: 0.0005 ETH (~$1.25) - more realistic for CCIP
      "EVM->Solana": "0.001", // FIXED: 0.001 ETH (~$2.50) - cross-ecosystem premium
      "Solana->EVM": "0.0005", // FIXED: 0.0005 ETH (~$1.25)
    };

    let routeType;
    if (sourceConfig.type === "EVM" && destConfig.type === "EVM") {
      routeType = "EVM->EVM";
    } else if (sourceConfig.type === "EVM" && destConfig.type === "Solana") {
      routeType = "EVM->Solana";
    } else if (sourceConfig.type === "Solana" && destConfig.type === "EVM") {
      routeType = "Solana->EVM";
    } else {
      routeType = "EVM->EVM"; // fallback
    }

    const feeInEth = baseFees[routeType];
    const feeInWei = ethers.utils.parseEther(feeInEth).toString();

    // FIXED: Increased emergency cap to accommodate realistic fees + buffer
    const maxFeeWei = ethers.utils.parseEther("0.005").toString(); // 0.005 ETH (~$12.50) max
    const finalFeeWei =
      BigInt(feeInWei) > BigInt(maxFeeWei) ? maxFeeWei : feeInWei;

    console.log(`💰 EMERGENCY Fee Calculation:`, {
      route: `${sourceChain} -> ${destinationChain}`,
      routeType: routeType,
      requestedFeeETH: feeInEth,
      calculatedWei: feeInWei,
      cappedWei: finalFeeWei,
      finalETH: ethers.utils.formatEther(finalFeeWei),
      finalUSD: `$${(
        parseFloat(ethers.utils.formatEther(finalFeeWei)) * 2500
      ).toFixed(2)}`,
      isCapped: BigInt(feeInWei) > BigInt(maxFeeWei),
    });

    return finalFeeWei;
  }

  /**
   * Get all supported networks for UI display
   * @returns {Array} Array of network configurations
   */
  getAllSupportedNetworks() {
    const networks = [];
    this.networkConfigs.forEach((config) => {
      networks.push({
        chainId: config.chainId,
        chainName: config.chainName,
        currencySymbol: config.currencySymbol,
        type: config.type,
        rpcUrl: config.rpcUrl,
      });
    });
    return networks.sort((a, b) => {
      // Sort EVM networks first, then Solana
      if (a.type === "EVM" && b.type === "Solana") return -1;
      if (a.type === "Solana" && b.type === "EVM") return 1;
      return a.chainName.localeCompare(b.chainName);
    });
  }

  /**
   * Validate cross-chain transfer parameters
   * @param {Object} params - Transfer parameters
   * @returns {Object} Validation result
   */
  validateCrossChainTransfer(params) {
    const { sourceChain, destinationChain, amount, recipient } = params;

    // Check if networks are supported
    const sourceConfig = this.getNetworkConfig(sourceChain);
    const destConfig = this.getNetworkConfig(destinationChain);

    if (!sourceConfig) {
      return { valid: false, error: "Source network not supported" };
    }

    if (!destConfig) {
      return { valid: false, error: "Destination network not supported" };
    }

    // Check if route is supported
    if (!this.isRouteSupported(sourceChain, destinationChain)) {
      return {
        valid: false,
        error: `Cross-chain route ${sourceConfig.chainName} → ${destConfig.chainName} not supported`,
      };
    }

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return { valid: false, error: "Invalid amount" };
    }

    // Validate recipient address
    if (!recipient || recipient.length < 10) {
      return { valid: false, error: "Invalid recipient address" };
    }

    return {
      valid: true,
      sourceConfig,
      destConfig,
      message: `Cross-chain transfer ${sourceConfig.chainName} → ${destConfig.chainName}`,
    };
  }

  /**
   * Check and handle ERC-20 allowance for CCIP token transfers
   * @param {string|number} sourceChain - Source chain ID
   * @param {string} tokenAmount - Token amount in wei (e.g., "4000000" for 4 USDC)
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Allowance status and required actions
   */
  async checkAndHandleAllowance(sourceChain, tokenAmount, userAddress) {
    try {
      console.log("🔍 Checking ERC-20 allowance for CCIP transfer...", {
        sourceChain,
        tokenAmount,
        userAddress,
      });

      if (!window.ethereum) {
        throw new Error("MetaMask not available for allowance check");
      }

      const sourceConfig = this.getNetworkConfig(sourceChain);
      if (!sourceConfig || !sourceConfig.usdc) {
        throw new Error(
          `USDC configuration not found for chain ${sourceChain}`
        );
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // ERC-20 contract ABI for allowance and approve functions
      const ERC20_ABI = [
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
      ];

      // Create USDC contract instance
      const usdcContract = new ethers.Contract(
        sourceConfig.usdc.tokenAddress,
        ERC20_ABI,
        signer
      );

      // Check current allowance
      const currentAllowance = await usdcContract.allowance(
        userAddress,
        sourceConfig.router
      );

      console.log("💰 ERC-20 Allowance Check:", {
        usdcContract: sourceConfig.usdc.tokenAddress,
        ccipRouter: sourceConfig.router,
        tokenAmountWei: tokenAmount,
        currentAllowanceWei: currentAllowance.toString(),
        tokenAmountUSDC: ethers.utils.formatUnits(tokenAmount, 6),
        currentAllowanceUSDC: ethers.utils.formatUnits(currentAllowance, 6),
        isAllowanceSufficient: currentAllowance.gte(tokenAmount),
      });

      const isAllowanceSufficient = currentAllowance.gte(tokenAmount);

      return {
        success: true,
        isAllowanceSufficient,
        currentAllowance: currentAllowance.toString(),
        currentAllowanceUSDC: ethers.utils.formatUnits(currentAllowance, 6),
        requiredAmount: tokenAmount,
        requiredAmountUSDC: ethers.utils.formatUnits(tokenAmount, 6),
        usdcContractAddress: sourceConfig.usdc.tokenAddress,
        ccipRouterAddress: sourceConfig.router,
        needsApproval: !isAllowanceSufficient,
      };
    } catch (error) {
      console.error("❌ Allowance check failed:", error);
      return {
        success: false,
        error: error.message,
        needsApproval: true, // Assume approval needed if check fails
      };
    }
  }

  /**
   * Request approval for CCIP Router to spend USDC tokens
   * @param {string|number} sourceChain - Source chain ID
   * @param {string} tokenAmount - Token amount in wei to approve
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Approval transaction result
   */
  async requestUSDCApproval(sourceChain, tokenAmount, userAddress) {
    try {
      console.log("📝 Requesting USDC approval for CCIP Router...", {
        sourceChain,
        tokenAmount,
        userAddress,
      });

      if (!window.ethereum) {
        throw new Error("MetaMask not available for approval");
      }

      const sourceConfig = this.getNetworkConfig(sourceChain);
      if (!sourceConfig || !sourceConfig.usdc) {
        throw new Error(
          `USDC configuration not found for chain ${sourceChain}`
        );
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // CRITICAL: Verify signer and provider connection
      try {
        const network = await provider.getNetwork();
        const signerAddress = await signer.getAddress();

        console.log("🔍 Signer verification for approval:", {
          provider: !!provider,
          signer: !!signer,
          network: network,
          signerAddress: signerAddress,
          isConnected: provider.connection ? !!provider.connection : "unknown",
          expectedChain: sourceChain,
          actualChainId: network.chainId,
        });

        // Verify we're on the correct network
        if (network.chainId !== parseInt(sourceChain)) {
          console.warn(
            `⚠️ Network mismatch: Expected ${sourceChain}, got ${network.chainId}`
          );
          // Continue anyway - network switching should happen in UI
        }

        // Double-check the signer address matches the expected user address
        if (signerAddress.toLowerCase() !== userAddress.toLowerCase()) {
          throw new Error(
            `Signer address mismatch: expected ${userAddress}, got ${signerAddress}`
          );
        }

        console.log("✅ Signer verification passed - proceeding with approval");
      } catch (signerError) {
        console.error("❌ Signer verification failed:", signerError);
        throw new Error(`Signer connection issue: ${signerError.message}`);
      }

      // ERC-20 approve ABI
      const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ];

      // Create USDC contract instance
      const usdcContract = new ethers.Contract(
        sourceConfig.usdc.tokenAddress,
        ERC20_ABI,
        signer
      );

      console.log("🔓 Requesting USDC approval transaction:", {
        usdcContract: sourceConfig.usdc.tokenAddress,
        spender: sourceConfig.router,
        amount: tokenAmount,
        amountUSDC: ethers.utils.formatUnits(tokenAmount, 6),
      });

      // Request approval transaction
      const approveTx = await usdcContract.approve(
        sourceConfig.router,
        tokenAmount
      );

      console.log("⏳ Approval transaction sent:", {
        hash: approveTx.hash,
        waiting: "for confirmation...",
      });

      // Wait for transaction confirmation
      const receipt = await approveTx.wait();

      console.log("✅ USDC Approval successful:", {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ USDC approval failed:", error);
      return {
        success: false,
        error: error.message,
        userRejected:
          error.code === 4001 || error.message.includes("User denied"),
      };
    }
  }
}

// Create and export an instance of the service
const ccipConfigService = new CCIPConfigService();
export default ccipConfigService;
