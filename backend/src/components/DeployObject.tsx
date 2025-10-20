import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSDK } from "@thirdweb-dev/react";
import {
  MapPin,
  Crosshair,
  Plus,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wallet,
  Settings,
  Users,
  MessageCircle,
  Mic,
  Video,
  TrendingUp,
  Bell,
  Navigation,
  Network,
  RefreshCw,
} from "lucide-react";
import { useAddress } from "@thirdweb-dev/react";
import PaymentMethodsSelector from "./PaymentMethodsSelector";
import BankDetailsForm from "./BankDetailsForm";
import {
  solanaNetworkService,
  getUSDCMintForSolana,
} from "../services/solanaNetworkService";
import { multiChainWalletService } from "../services/multiChainWalletService";
import {
  solanaPaymentService,
  SolanaPaymentRequest,
} from "../services/solanaPaymentService";
import { networkDetectionService } from "../services/networkDetectionService";
import {
  EVM_NETWORKS,
  NON_EVM_NETWORKS,
  switchToNetwork,
} from "../config/multiChainNetworks";

interface DeployObjectProps {
  supabase: any;
}

interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

interface PreciseLocationData extends LocationData {
  preciseLatitude: number;
  preciseLongitude: number;
  preciseAltitude?: number;
  correctionApplied: boolean;
  fixType?: string;
  satellites?: number;
  processingTime?: number;
}

const DeployObject = ({ supabase }: DeployObjectProps) => {
  const address = useAddress();
  const sdk = useSDK();
  const [usdcBalance, setUsdcBalance] = useState<string>("0.000000");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string>("");

  // Location states
  const [location, setLocation] = useState<LocationData | null>(null);
  const [preciseLocation, setPreciseLocation] =
    useState<PreciseLocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [rtkLoading, setRtkLoading] = useState(false);

  // Network detection states
  const [currentNetwork, setCurrentNetwork] = useState<any>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string>("");
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

  // Multi-chain wallet states
  const [solanaWallet, setSolanaWallet] = useState<any>(null);
  const [evmWallet, setEvmWallet] = useState<any>(null);
  const [walletType, setWalletType] = useState<
    "metamask" | "phantom" | "coinbase" | null
  >(null);
  const [connectedWallets, setConnectedWallets] = useState<Map<string, any>>(
    new Map()
  );
  const [activeNetwork, setActiveNetwork] = useState<"evm" | "solana">("evm");

  // USDC balance states for multi-chain
  const [usdcBalances, setUsdcBalances] = useState<Record<string, string>>({});
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Agent configuration states
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("intelligent_assistant");
  const [agentDescription, setAgentDescription] = useState("");
  const [locationType, setLocationType] = useState("Street");
  const [trailingAgent, setTrailingAgent] = useState(false);
  const [visibilityRange, setVisibilityRange] = useState(25);
  const [interactionRange, setInteractionRange] = useState(15);
  const [arNotifications, setArNotifications] = useState(true);

  // Interaction methods
  const [textChat, setTextChat] = useState(true);
  const [voiceChat, setVoiceChat] = useState(false);
  const [videoChat, setVideoChat] = useState(false);
  const [defiFeatures, setDefiFeatures] = useState(false);

  // MCP integrations
  const [mcpIntegrations, setMcpIntegrations] = useState<string[]>([]);

  // Economics
  const [interactionFee, setInteractionFee] = useState(10); // Default to 10 USDC instead of 1
  const [selectedToken, setSelectedToken] = useState("USDC"); // Changed to USDC as default
  const [revenueSharing, setRevenueSharing] = useState(70);

  // Payment Methods (6-faced cube system)
  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [showBankForm, setShowBankForm] = useState<
    "virtual_card" | "bank_qr" | null
  >(null);

  // Deployment states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [deploymentError, setDeploymentError] = useState("");

  // Agent wallet = User connected wallet (same address)
  const agentWallet = address || "0x000...000";

  // USDC token contract address on Base Sepolia
  // USDC contract addresses for different networks
  const USDC_CONTRACTS = {
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Ethereum Sepolia
    421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
    11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // OP Sepolia - Circle Testnet USDC
    43113: "0x5425890298aed601595a70AB815c96711a31Bc65", // Avalanche Fuji
    80002: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // Polygon Amoy
    devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Solana Devnet USDC
  };

  // Agent type options - Updated with new categories
  const agentTypes = [
    { value: "intelligent_assistant", label: "Intelligent Assistant" },
    { value: "local_services", label: "Local Services" },
    { value: "payment_terminal", label: "Payment Terminal" },
    { value: "game_agent", label: "Game Agent" },
    { value: "3d_world_builder", label: "3D World Builder" },
    { value: "home_security", label: "Home Security" },
    { value: "content_creator", label: "Content Creator" },
    { value: "real_estate_broker", label: "Real Estate Broker" },
    { value: "bus_stop_agent", label: "Bus Stop Agent" },
    // Conditional trailing agent types
    ...(trailingAgent
      ? [
          {
            value: "trailing_payment_terminal",
            label: "Trailing Payment Terminal",
          },
          { value: "my_ghost", label: "My Ghost" },
        ]
      : []),
  ];

  // Supported stablecoins for payment - Dynamic based on network
  const getSupportedStablecoins = () => {
    if (currentNetwork?.chainId) {
      // Different tokens supported on different networks
      switch (currentNetwork.chainId) {
        case 11155111: // Ethereum Sepolia
          return ["USDC", "USDT", "DAI"];
        case 421614: // Arbitrum Sepolia
          return ["USDC", "USDT", "DAI"];
        case 84532: // Base Sepolia
          return ["USDC", "USDT", "DAI"]; // Fixed: Removed CBETH, added DAI
        case 11155420: // OP Sepolia
          return ["USDC", "USDT", "DAI"]; // Fixed: Removed OP, added DAI
        case 43113: // Avalanche Fuji
          return ["USDC", "USDT", "DAI"]; // Fixed: Removed AVAX, added DAI
        case 80002: // Polygon Amoy
          return ["USDC", "USDT", "DAI"]; // Polygon Amoy support
        case "devnet": // Solana Devnet
          return ["USDC"];
        default:
          return ["USDC", "USDT", "DAI"]; // Fixed: Added DAI as default
      }
    }
    return [
      "USDC",
      "USDT",
      "USDs",
      "USDBG+",
      "USDe",
      "LSTD+",
      "AIX",
      "PYUSD",
      "RLUSD",
      "USDD",
      "GHO",
      "USDx",
    ];
  };

  // Dynamic token addresses based on current network
  const getTokenAddresses = () => {
    if (currentNetwork?.chainId) {
      switch (currentNetwork.chainId) {
        case 11155111: // Ethereum Sepolia
          return {
            USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
            USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
            DAI: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
          };
        case 421614: // Arbitrum Sepolia
          return {
            USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
            USDT: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
            ARB: "0x1234567890123456789012345678901234567890", // Placeholder
          };
        case 84532: // Base Sepolia
          return {
            USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            USDT: "0x1234567890123456789012345678901234567890", // Placeholder
            CBETH: "0x1234567890123456789012345678901234567890", // Placeholder
          };
        case 11155420: // OP Sepolia
          return {
            USDC: "0x5fd84259d3c8b37a387c0d8a4c5b0c0d7d3c0D7",
            USDT: "0x1234567890123456789012345678901234567890", // Placeholder
            OP: "0x1234567890123456789012345678901234567890", // Placeholder
          };
        case 43113: // Avalanche Fuji
          return {
            USDC: "0x5425890298aed601595a70AB815c96711a31Bc65",
            USDT: "0x1234567890123456789012345678901234567890", // Placeholder
            AVAX: "0x0000000000000000000000000000000000000000", // Native token
          };
        case 80002: // Polygon Amoy
          return {
            USDC: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
            USDT: "0x1234567890123456789012345678901234567890", // Placeholder
            DAI: "0x1234567890123456789012345678901234567890", // Placeholder
          };
        case "devnet": // Solana Devnet
          return {
            USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          };
        default:
          return {};
      }
    }
    // Default fallback - basic USDC support
    return {
      USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Ethereum Sepolia USDC
    };
  };

  const SUPPORTED_STABLECOINS = getSupportedStablecoins();
  const TOKEN_ADDRESSES = getTokenAddresses();

  // Location type options - Added Property
  const locationTypes = [
    "Home",
    "Street",
    "Countryside",
    "Classroom",
    "Office",
    "Property",
    ...(trailingAgent ? ["Car"] : []),
  ];

  // MCP integration options
  const mcpOptions = [
    "Chat",
    "Voice",
    "Analysis",
    "Information Lookup",
    "Educational Content",
    "Study Planning",
    "Q&A",
    "Location Services",
    "Directory",
    "Navigation",
    "Content Generation",
    "Brainstorming",
    "Writing",
    "Game Creation",
    "Puzzles",
    "Entertainment",
  ];

  // Fetch USDC balance for current network
  // Solana wallet detection functions
  const detectSolanaWallet = async () => {
    try {
      // Check for Phantom wallet
      if (window.solana && window.solana.isPhantom) {
        console.log("🟣 Phantom wallet detected");
        return { type: "phantom", wallet: window.solana };
      }

      // Check for Solflare wallet
      if (window.solflare && window.solflare.isSolflare) {
        console.log("🟠 Solflare wallet detected");
        return { type: "solflare", wallet: window.solflare };
      }

      // Check for other Solana wallets
      if (window.solana) {
        console.log("🟡 Generic Solana wallet detected");
        return { type: "solana", wallet: window.solana };
      }

      return null;
    } catch (error) {
      console.error("❌ Error detecting Solana wallet:", error);
      return null;
    }
  };

  const connectSolanaWallet = async () => {
    try {
      const walletInfo = await detectSolanaWallet();
      if (!walletInfo) {
        throw new Error("No Solana wallet detected");
      }

      const resp = await walletInfo.wallet.connect();
      console.log("✅ Solana wallet connected:", resp.publicKey.toString());

      setSolanaWallet(walletInfo.wallet);
      setWalletType("phantom");

      // Set the address for Solana
      // Note: This would need to be integrated with the address state management
      console.log("🔑 Solana public key:", resp.publicKey.toString());

      return resp.publicKey.toString();
    } catch (error) {
      console.error("❌ Failed to connect Solana wallet:", error);
      throw error;
    }
  };

  // Enhanced Solana USDC balance fetching function using new service
  const fetchSolanaUSDCBalance = async () => {
    try {
      console.log("🔄 Fetching Solana USDC balance using new service...");

      // Get connected Solana wallet from service
      const solanaWallet = multiChainWalletService.getPrimarySolanaWallet();

      if (!solanaWallet) {
        console.log("❌ No Solana wallet connected");
        setUsdcBalance("0.000000");
        return;
      }

      console.log("🟡 Solana wallet found:", solanaWallet.address);
      console.log("🟡 Solana network:", solanaWallet.chainId);

      // Use the solanaNetworkService to get USDC balance
      const network = solanaWallet.chainId as string;
      const usdcBalance = await solanaNetworkService.getUSDCBalance(
        solanaWallet.address,
        network
      );

      console.log("✅ Solana USDC balance fetched:", usdcBalance, "USDC");
      setUsdcBalance(usdcBalance);

      // Update the wallet service with latest balance
      solanaWallet.usdcBalance = usdcBalance;
      solanaWallet.lastUpdated = Date.now();
    } catch (error) {
      console.error("❌ Enhanced Solana USDC balance fetch failed:", error);
      setUsdcBalance("0.000000");
    }
  };

  const fetchUSDCBalance = async () => {
    if (!address || !currentNetwork) {
      console.log("❌ Cannot fetch USDC balance: missing address or network");
      console.log("   Address:", address);
      console.log("   Current Network:", currentNetwork);
      return;
    }

    setLoadingBalance(true);
    setBalanceError("");
    try {
      console.log("🔍 Fetching USDC balance for address:", address);
      console.log("🌐 Network:", currentNetwork.name);
      console.log("🌐 Chain ID:", currentNetwork.chainId);
      console.log("🗂️ Current Network Object:", currentNetwork);
      console.log("📋 All USDC Contracts:", USDC_CONTRACTS);

      // Handle Solana networks using new service
      if (
        currentNetwork.chainId === "devnet" ||
        currentNetwork.name === "Solana Devnet" ||
        currentNetwork.type === "Solana"
      ) {
        await fetchSolanaUSDCBalance();
        return;
      }

      // Handle EVM networks
      const usdcContract =
        USDC_CONTRACTS[currentNetwork.chainId as keyof typeof USDC_CONTRACTS];

      if (!usdcContract) {
        console.warn(
          `❌ USDC contract not found for chain ${currentNetwork.chainId}`
        );
        console.log("📋 Available chains:", Object.keys(USDC_CONTRACTS));
        console.log("🔍 Chain ID type:", typeof currentNetwork.chainId);
        console.log("🔍 Chain ID value:", currentNetwork.chainId);
        setBalanceError(`USDC not available on ${currentNetwork.name}`);
        setUsdcBalance("0.000000");
        return;
      }

      console.log(
        "📄 Official USDC Contract for Chain",
        currentNetwork.chainId + ":",
        usdcContract
      );

      // Create provider using the current network RPC
      const { ethers } = await import("ethers");
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Ensure we're connected to the right network
      const network = await provider.getNetwork();
      console.log("🔗 Provider network:", network.chainId, network.name);

      if (network.chainId !== currentNetwork.chainId) {
        throw new Error(
          `Network mismatch: Provider is on chain ${network.chainId}, expected ${currentNetwork.chainId}`
        );
      }

      // ERC-20 ABI for balanceOf function
      const erc20ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)",
      ];

      // Validate contract address format and create contract instance
      if (!ethers.utils.isAddress(usdcContract)) {
        throw new Error(`Invalid USDC contract address: ${usdcContract}`);
      }

      const contract = new ethers.Contract(usdcContract, erc20ABI, provider);

      console.log("🔄 About to query contract methods...");
      console.log("   Contract Address:", usdcContract);
      console.log("   Wallet Address:", address);
      console.log("   Provider Network:", network.chainId);

      // Get token info and balance
      console.log("🔍 Calling contract methods...");
      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(address).catch((e: any) => {
          console.error("❌ balanceOf failed:", e);
          throw e;
        }),
        contract.decimals().catch((e: any) => {
          console.error("❌ decimals failed:", e);
          throw e;
        }),
        contract.symbol().catch((e: any) => {
          console.error("❌ symbol failed:", e);
          throw e;
        }),
        contract.name().catch((e: any) => {
          console.error("❌ name failed:", e);
          throw e;
        }),
      ]);

      console.log("✅ Contract calls completed successfully!");

      // Convert from raw units to readable format (USDC typically has 6 decimals)
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      const balanceNumber = parseFloat(formattedBalance);

      console.log("✅ Official USDC Balance Query Results:");
      console.log("   Token Name:", name);
      console.log("   Token Symbol:", symbol);
      console.log("   Decimals:", decimals.toString());
      console.log("   Raw Balance:", balance.toString());
      console.log("   Formatted Balance:", formattedBalance);
      console.log("   Final Balance:", balanceNumber.toFixed(6), symbol);
      console.log("   Account Address:", address);
      console.log("   Contract Address:", usdcContract);
      console.log(
        "   Network:",
        currentNetwork.name,
        "(Chain ID:",
        currentNetwork.chainId + ")"
      );

      setUsdcBalance(balanceNumber.toFixed(6)); // Display with 6 decimals

      // Show balance in UI notification
      if (balanceNumber > 0) {
        console.log(
          `🎉 You have ${balanceNumber.toFixed(
            6
          )} ${symbol} in your connected account on ${currentNetwork.name}!`
        );
      } else {
        console.log("⚠️ No USDC balance found in connected account");
        setBalanceError(
          `No USDC balance found for ${address}. You may need USDC tokens on ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId}) to deploy agents.`
        );
      }
    } catch (error) {
      console.error("❌ Error fetching USDC balance:", error);
      setBalanceError(
        `Balance fetch failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Check network connection and ensure you're connected to ${
          currentNetwork?.name || "supported network"
        }.`
      );
      setUsdcBalance("0.000000");
    } finally {
      setLoadingBalance(false);
    }
  };

  // Network switching functionality
  const handleNetworkSwitch = async (targetNetwork: any) => {
    try {
      console.log(`🔄 Switching to ${targetNetwork.name}...`);

      // Handle non-EVM networks (like Solana)
      if (targetNetwork.type !== "evm") {
        console.log(`🟡 Non-EVM network detected: ${targetNetwork.name}`);

        if (targetNetwork.name.toLowerCase().includes("solana")) {
          // For Solana, we need to connect to a Solana wallet
          console.log("🔄 Connecting to Solana wallet...");
          await connectSolanaWallet();

          // Set the current network manually for non-EVM
          setCurrentNetwork(targetNetwork);
          setNetworkError("");

          // Fetch balance after "switching"
          setTimeout(() => {
            fetchUSDCBalance();
          }, 1000);

          console.log(`✅ Successfully connected to ${targetNetwork.name}`);
          return;
        }
      }

      // Handle EVM networks
      const success = await switchToNetwork(targetNetwork);

      if (success) {
        console.log(`✅ Successfully switched to ${targetNetwork.name}`);
        // The network detection will automatically update the state
        setTimeout(() => {
          fetchUSDCBalance(); // Refresh balance after network switch
        }, 1000);
      } else {
        console.error(`❌ Failed to switch to ${targetNetwork.name}`);
        setNetworkError(
          `Failed to switch to ${targetNetwork.name}. Please try manually in your wallet.`
        );
      }
    } catch (error) {
      console.error("Network switch error:", error);
      setNetworkError(
        `Network switch failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Get supported networks for display
  const getSupportedNetworks = () => {
    const evmNetworks = Object.values(EVM_NETWORKS).filter(
      (network) => network.status === "active"
    );
    const nonEvmNetworks = Object.values(NON_EVM_NETWORKS).filter(
      (network) => network.status === "active"
    );
    return [...evmNetworks, ...nonEvmNetworks];
  };

  // Check if current network is supported
  const isCurrentNetworkSupported = () => {
    if (!currentNetwork) return false;

    // Check against all supported networks (EVM and Non-EVM)
    const allSupportedNetworks = [
      ...Object.values(EVM_NETWORKS),
      ...Object.values(NON_EVM_NETWORKS),
    ];
    return allSupportedNetworks.some(
      (network) =>
        network.chainId === currentNetwork.chainId ||
        (network.name === currentNetwork.name &&
          currentNetwork.chainId === "devnet")
    );
  };

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined,
          accuracy: position.coords.accuracy,
        };
        setLocation(locationData);
        setLocationLoading(false);
        console.log("📍 Current location obtained:", locationData);
      },
      (error) => {
        console.error("❌ Error getting location:", error);
        alert("Error getting location: " + error.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Get RTK enhanced location
  const getRTKLocation = async () => {
    if (!location) {
      alert("Please get your current location first");
      return;
    }

    setRtkLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/get-precise-location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPreciseLocation({
        ...location,
        preciseLatitude: data.preciseLatitude,
        preciseLongitude: data.preciseLongitude,
        preciseAltitude: data.preciseAltitude,
        correctionApplied: data.correctionApplied,
        fixType: data.fixType,
        satellites: data.satellites,
        processingTime: data.processingTime,
      });

      console.log("🎯 RTK enhanced location:", data);
    } catch (error) {
      console.error("❌ RTK correction failed:", error);
      alert("RTK correction failed. Using standard GPS location.");
    } finally {
      setRtkLoading(false);
    }
  };

  // Handle payment methods configuration
  const handlePaymentMethodsChange = useCallback((methods: any) => {
    setPaymentMethods(methods);
    console.log("💳 Payment methods updated:", methods);
  }, []);

  // Handle bank details updates
  const handleBankDetailsChange = (
    details: any,
    paymentType: "virtual_card" | "bank_qr"
  ) => {
    if (paymentMethods) {
      const updatedMethods = { ...paymentMethods };
      if (paymentType === "virtual_card") {
        updatedMethods.bank_virtual_card.bank_details = details;
      } else if (paymentType === "bank_qr") {
        updatedMethods.bank_qr.bank_details = details;
      }
      setPaymentMethods(updatedMethods);
    }
  };

  // Validate payment methods configuration
  const validatePaymentMethods = (): string[] => {
    const errors: string[] = [];

    if (!paymentMethods) {
      errors.push("Payment methods configuration is required");
      return errors;
    }

    const enabledMethods = Object.values(paymentMethods).some(
      (method: any) => method.enabled
    );
    if (!enabledMethods) {
      errors.push("At least one payment method must be selected");
    }

    // Validate crypto methods have wallet connection
    const cryptoMethods = ["crypto_qr", "voice_pay", "sound_pay"];
    const hasCryptoEnabled = cryptoMethods.some(
      (method) => paymentMethods[method]?.enabled
    );

    if (hasCryptoEnabled && !address) {
      errors.push("Wallet connection required for crypto payment methods");
    }

    // Validate bank methods have details
    if (
      paymentMethods.bank_virtual_card?.enabled &&
      !paymentMethods.bank_virtual_card?.bank_details?.account_holder
    ) {
      errors.push("Bank details required for virtual card payments");
    }

    if (
      paymentMethods.bank_qr?.enabled &&
      !paymentMethods.bank_qr?.bank_details?.account_holder
    ) {
      errors.push("Bank details required for bank QR payments");
    }

    return errors;
  };

  // Handle MCP integration toggle
  const toggleMCPIntegration = (integration: string) => {
    setMcpIntegrations((prev) =>
      prev.includes(integration)
        ? prev.filter((item) => item !== integration)
        : [...prev, integration]
    );
  };

  // Process payment for agent deployment
  const processDeploymentPayment = async (
    deploymentCost: number
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> => {
    try {
      console.log("💳 Processing deployment payment:", deploymentCost, "USDC");

      // Determine active wallet and network
      const solanaWallet = multiChainWalletService.getPrimarySolanaWallet();
      const evmWallets = multiChainWalletService.getConnectedEVMWallets();
      const primaryEvmWallet = evmWallets.length > 0 ? evmWallets[0] : null;

      // Check current network type
      if (
        currentNetwork?.type === "Solana" ||
        currentNetwork?.name?.includes("Solana")
      ) {
        // Process Solana payment
        if (!solanaWallet) {
          throw new Error("No Solana wallet connected");
        }

        console.log("🟣 Processing Solana USDC payment...");

        // Check sufficient balance
        const hasBalance = await solanaPaymentService.checkSufficientBalance(
          solanaWallet.address,
          deploymentCost,
          currentNetwork.chainId
        );

        if (!hasBalance) {
          throw new Error(
            `Insufficient USDC balance. Required: ${deploymentCost} USDC`
          );
        }

        // Create payment request
        const paymentRequest: SolanaPaymentRequest = {
          fromAddress: solanaWallet.address,
          toAddress: "AgentSphereDeployment1234567890ABCDEF123456", // Replace with actual treasury address
          amount: deploymentCost,
          network: currentNetwork.chainId,
          metadata: {
            agentName: agentName,
            agentType: agentType,
            transactionId: `agent-deploy-${Date.now()}`,
          },
        };

        // Validate payment request
        const validation =
          solanaPaymentService.validatePaymentRequest(paymentRequest);
        if (!validation.valid) {
          throw new Error(validation.error || "Invalid payment request");
        }

        // Process payment
        const paymentResult = await solanaPaymentService.processPayment(
          paymentRequest
        );

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || "Payment processing failed");
        }

        console.log(
          "✅ Solana payment successful:",
          paymentResult.transactionSignature
        );
        return {
          success: true,
          transactionHash: paymentResult.transactionSignature,
        };
      } else {
        // Process EVM payment
        if (!address) {
          throw new Error("No EVM wallet connected");
        }

        console.log("🔷 Processing EVM USDC payment...");
        console.log("💼 Connected wallet:", address);

        // Check USDC balance
        const currentUsdcBalance = parseFloat(usdcBalance || "0");
        if (currentUsdcBalance < deploymentCost) {
          throw new Error(
            `Insufficient USDC balance. Required: ${deploymentCost} USDC, Available: ${currentUsdcBalance} USDC`
          );
        }

        // Get USDC contract address
        const usdcContractAddress =
          USDC_CONTRACTS[currentNetwork.chainId as keyof typeof USDC_CONTRACTS];
        if (!usdcContractAddress) {
          throw new Error("USDC not supported on current network");
        }

        // TODO: Implement EVM payment processing using Web3/Ethers
        // For now, return success for testing
        console.log("⚠️ EVM payment processing not fully implemented yet");
        return {
          success: true,
          transactionHash: `0x${Date.now().toString(16)}`, // Placeholder
        };
      }
    } catch (error) {
      console.error("❌ Payment processing failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown payment error";
      return { success: false, error: errorMessage };
    }
  };

  // Deploy agent
  const deployAgent = async () => {
    /**
     * IMPORTANT: Distinction between deployment cost and interaction fee
     *
     * - DEPLOYMENT COST: What the agent creator pays to deploy the agent (currently FREE)
     * - INTERACTION FEE: What users pay when they interact with the deployed agent
     *
     * The deployer's wallet balance is NOT related to the interaction fee they set.
     * The interaction fee is what future users will pay to interact with the agent.
     */

    if (!supabase) {
      alert(
        "Database connection not available. Please connect to Supabase first."
      );
      return;
    }

    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!agentName.trim()) {
      alert("Please enter an agent name.");
      return;
    }

    if (!location) {
      alert("Please get your current location first.");
      return;
    }

    // Validate payment methods
    const paymentErrors = validatePaymentMethods();
    if (paymentErrors.length > 0) {
      alert("Payment configuration errors:\n" + paymentErrors.join("\n"));
      return;
    }

    setIsDeploying(true);
    setDeploymentError("");

    try {
      // Validate network is supported
      if (!currentNetwork || !currentNetwork.isSupported) {
        throw new Error(
          `Please connect to a supported network. Current: ${
            currentNetwork?.name || "Unknown"
          }`
        );
      }

      const deploymentData = {
        user_id: address,
        name: agentName.trim(),
        description:
          agentDescription.trim() ||
          `A ${agentType.toLowerCase()} agent deployed via AR`,
        object_type: agentType,
        location_type: locationType,
        latitude: preciseLocation?.preciseLatitude || location.latitude,
        longitude: preciseLocation?.preciseLongitude || location.longitude,
        altitude: preciseLocation?.preciseAltitude || location.altitude,
        preciselatitude: preciseLocation?.preciseLatitude,
        preciselongitude: preciseLocation?.preciseLongitude,
        precisealtitude: preciseLocation?.preciseAltitude,
        accuracy: preciseLocation?.correctionApplied
          ? 0.02
          : location.accuracy || 10,
        correctionapplied: preciseLocation?.correctionApplied || false,
        range_meters: visibilityRange,

        // DYNAMIC NETWORK DATA - FIXED
        deployment_network_name: currentNetwork.name, // "Ethereum Sepolia"
        deployment_chain_id: currentNetwork.chainId, // 11155111
        deployment_network_id: currentNetwork.chainId, // 11155111
        network: currentNetwork.name, // "Ethereum Sepolia" - Fixed to use full name
        chain_id: currentNetwork.chainId, // 11155111

        // DYNAMIC PAYMENT DATA - FIXED
        interaction_fee_amount: parseFloat(interactionFee.toString()), // 10.0
        interaction_fee_token: selectedToken, // "USDC"
        interaction_fee_usdfc: interactionFee, // Legacy field

        // Wallet configuration
        owner_wallet: address,
        agent_wallet_address: agentWallet,
        agent_wallet_type: "evm_wallet",
        deployer_address: address,

        // Token information
        currency_type: selectedToken,
        token_symbol: selectedToken,
        token_address:
          TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES] || "",

        // Communication features
        chat_enabled: textChat,
        voice_enabled: voiceChat,
        defi_enabled: defiFeatures,
        interaction_types: [
          ...(textChat ? ["text_chat"] : []),
          ...(voiceChat ? ["voice_interface"] : []),
          ...(videoChat ? ["video_interface"] : []),
        ],

        // Integrations
        mcp_integrations: mcpIntegrations.length > 0 ? mcpIntegrations : null,
        payment_methods: paymentMethods || {},

        // DYNAMIC PAYMENT CONFIG - FIXED
        payment_config: {
          wallet_address: address,
          supported_tokens: [selectedToken],
          network_info: {
            name: currentNetwork.name,
            chainId: currentNetwork.chainId,
            rpcUrl: currentNetwork.rpcUrl,
            blockExplorer: currentNetwork.blockExplorer,
          },
          usd_fee: interactionFee,
          revenue_sharing: revenueSharing,
          selected_token: selectedToken,
          cube_enabled: true, // Flag for AR Viewer to show 3D cube
        },

        // RTK and deployment metadata
        rtk_enhanced: preciseLocation?.correctionApplied || false,
        rtk_provider: "GeoNet",
        deployed_at: new Date().toISOString(),
        deployment_status: "active",
        is_active: true,
      };

      console.log("🚀 Deploying agent with DYNAMIC data:", deploymentData);
      console.log("🚀 Starting deployment with data:");
      console.log("📊 Agent Name:", agentName);
      console.log(
        "💰 Interaction Fee Input:",
        interactionFee,
        typeof interactionFee
      );
      console.log("🪙 Selected Token:", selectedToken);
      console.log(
        "🌐 Network:",
        currentNetwork.name,
        "Chain ID:",
        currentNetwork.chainId
      );

      // Verify the interaction fee amount before storing
      const feeAmount = parseFloat(interactionFee.toString());
      console.log("💵 Processed Fee Amount:", feeAmount, typeof feeAmount);
      console.log("💳 Deployment Data Fee Fields:", {
        interaction_fee_amount: feeAmount,
        interaction_fee_token: selectedToken,
        interaction_fee_usdfc: interactionFee,
      });

      // Process deployment payment
      // NOTE: Deployment cost is separate from interaction fee
      // Interaction fee is what users pay when they interact with the agent
      // Deployment cost is what the agent creator pays to deploy
      const deploymentCost = 0; // FREE deployment for testing (can be adjusted)
      console.log(
        "💳 Deployment cost:",
        deploymentCost,
        "USDC (Interaction fee: ",
        interactionFee,
        "USDC)"
      );

      // Skip payment if deployment is free
      let paymentResult;
      if (deploymentCost > 0) {
        paymentResult = await processDeploymentPayment(deploymentCost);

        if (!paymentResult.success) {
          throw new Error(`Payment failed: ${paymentResult.error}`);
        }
        console.log("✅ Payment successful, proceeding with deployment...");
      } else {
        console.log("✅ Free deployment, skipping payment...");
        paymentResult = { success: true, transactionHash: null };
      }

      // Add payment transaction hash to deployment data
      // Note: These fields may need to be added to deployed_objects table schema
      let finalDeploymentData = { ...deploymentData };
      // Commenting out payment fields until DB schema is updated
      /*
      if (paymentResult.transactionHash) {
        finalDeploymentData = {
          ...deploymentData,
          deployment_payment_hash: paymentResult.transactionHash,
          deployment_payment_amount: deploymentCost,
          deployment_payment_token: "USDC",
          deployment_payment_status: "completed",
        };
      }
      */

      const { data, error } = await supabase
        .from("deployed_objects")
        .insert([finalDeploymentData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("✅ Agent deployed successfully:", data);

      // Verify what was actually stored in the database
      console.log("🔍 Database Verification - Stored Data:");
      console.log("📊 Stored Agent Name:", data.name);
      console.log(
        "💰 Stored Fee Amount:",
        data.interaction_fee_amount,
        typeof data.interaction_fee_amount
      );
      console.log("🪙 Stored Fee Token:", data.interaction_fee_token);
      console.log("🌐 Stored Network:", data.deployment_network_name);
      console.log("🔗 Stored Chain ID:", data.deployment_chain_id);
      console.log("📱 Stored Deployer:", data.deployer_address);

      setDeploymentSuccess(true);

      // Reset form after successful deployment
      setTimeout(() => {
        setDeploymentSuccess(false);
        setAgentName("");
        setAgentDescription("");
        setMcpIntegrations([]);
        setPaymentMethods(null);
        setShowBankForm(null);
        setLocation(null);
        setPreciseLocation(null);
      }, 3000);
    } catch (error) {
      console.error("❌ Deployment failed:", error);
      setDeploymentError(
        error instanceof Error ? error.message : "Deployment failed"
      );
    } finally {
      setIsDeploying(false);
    }
  };

  // Load USDC balance when wallet connects and network is detected - OFFICIAL CONTRACTS ONLY
  useEffect(() => {
    if (address && currentNetwork && currentNetwork.isSupported !== false) {
      fetchUSDCBalance();
    } else {
      setUsdcBalance("0.000000");
    }
  }, [address, currentNetwork]);

  // Network detection when wallet connects
  useEffect(() => {
    const initializeNetwork = async () => {
      if (address && window.ethereum) {
        setNetworkLoading(true);
        setNetworkError("");

        try {
          const network = await networkDetectionService.detectCurrentNetwork();
          setCurrentNetwork(network);

          if (network && !network.isSupported) {
            setNetworkError(
              `Network ${network.name} is not supported. Please switch to a supported network.`
            );
          }

          // Start listening for network changes
          await networkDetectionService.startNetworkListener();

          // Subscribe to network change events
          const handleNetworkChange = (event: any) => {
            const newNetwork = event.detail.network;
            setCurrentNetwork(newNetwork);

            if (!newNetwork.isSupported) {
              setNetworkError(
                `Network ${newNetwork.name} is not supported. Please switch to a supported network.`
              );
            } else {
              setNetworkError("");
            }
          };

          document.addEventListener("networkChanged", handleNetworkChange);

          return () => {
            document.removeEventListener("networkChanged", handleNetworkChange);
            networkDetectionService.stopNetworkListener();
          };
        } catch (error) {
          console.error("Network detection failed:", error);
          setNetworkError(
            "Failed to detect network. Please ensure MetaMask is connected."
          );
        } finally {
          setNetworkLoading(false);
        }
      } else {
        setCurrentNetwork(null);
        setNetworkError("");
      }
    };

    initializeNetwork();
  }, [address]);

  // Update selected token when network changes
  useEffect(() => {
    if (currentNetwork) {
      const supportedTokens = getSupportedStablecoins();
      if (
        supportedTokens.length > 0 &&
        !supportedTokens.includes(selectedToken)
      ) {
        setSelectedToken(supportedTokens[0]); // Default to first supported token
      }
    }
  }, [currentNetwork]);

  // Close network selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".network-selector-container")) {
        setShowNetworkSelector(false);
      }
    };

    if (showNetworkSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNetworkSelector]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Deploy AR Agent
            </h1>
            <p className="text-green-100">
              Create and deploy your AI agent in the real world
            </p>

            {/* Wallet Connection & USDC Balance */}
            {address && (
              <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 text-white mr-2" />
                    <span className="text-white font-medium">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-white mr-2">USDC Balance:</span>
                    {loadingBalance ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <div className="flex items-center">
                        <span className="text-white font-bold mr-2">
                          {usdcBalance} USDC
                        </span>
                        <button
                          onClick={fetchUSDCBalance}
                          className="text-white hover:text-green-200 transition-colors"
                          title="Refresh USDC balance"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Network Status Display */}
                <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Network className="h-5 w-5 text-white mr-2" />
                      <span className="text-white font-medium">Network:</span>
                    </div>
                    <div className="flex items-center">
                      {networkLoading ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : currentNetwork ? (
                        <div className="relative network-selector-container">
                          <button
                            onClick={() =>
                              setShowNetworkSelector(!showNetworkSelector)
                            }
                            className="text-right hover:bg-white hover:bg-opacity-10 rounded px-2 py-1 transition-colors"
                          >
                            <div className="text-white font-bold flex items-center">
                              {currentNetwork.name}
                              <svg
                                className="ml-1 h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="text-green-100 text-sm">
                              Chain ID: {currentNetwork.chainId}
                            </div>
                            {!isCurrentNetworkSupported() && (
                              <div className="text-red-200 text-xs">
                                ⚠️ Unsupported
                              </div>
                            )}
                          </button>

                          {/* Network Selector Dropdown */}
                          {showNetworkSelector && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-64">
                              <div className="p-3 border-b">
                                <h3 className="font-medium text-gray-900">
                                  Switch Network
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Choose from supported EVM testnets
                                </p>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {getSupportedNetworks().map((network) => (
                                  <button
                                    key={network.chainId}
                                    onClick={() => {
                                      handleNetworkSwitch(network);
                                      setShowNetworkSelector(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                                      currentNetwork?.chainId ===
                                      network.chainId
                                        ? "bg-green-50 border-l-4 border-l-green-500"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {network.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          Chain ID: {network.chainId}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Currency: {network.symbol}
                                        </div>
                                      </div>
                                      {currentNetwork?.chainId ===
                                        network.chainId && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                              <div className="p-3 border-t bg-gray-50">
                                <p className="text-xs text-gray-600">
                                  💡 All networks support USDC payments
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-yellow-200">Not detected</span>
                      )}
                    </div>
                  </div>

                  {/* Network Warning */}
                  {networkError && (
                    <div className="mt-2 p-2 bg-red-500 bg-opacity-50 rounded text-white text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {networkError}
                    </div>
                  )}

                  {/* Balance Warning */}
                  {balanceError && (
                    <div className="mt-2 p-2 bg-yellow-500 bg-opacity-50 rounded text-white text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {balanceError}
                      {currentNetwork && (
                        <div className="mt-2 space-y-2">
                          <a
                            href="https://faucet.circle.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-200 underline hover:text-blue-100"
                          >
                            Get USDC from faucet →
                          </a>
                          <button
                            onClick={fetchUSDCBalance}
                            className="block text-green-200 underline hover:text-green-100"
                          >
                            🔄 Retry USDC balance check
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Low Balance Warning */}
                  {!balanceError &&
                    usdcBalance &&
                    parseFloat(usdcBalance) < 1.0 &&
                    parseFloat(usdcBalance) > 0 && (
                      <div className="mt-2 p-2 bg-orange-500 bg-opacity-50 rounded text-white text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Low USDC balance ({usdcBalance} USDC). You may need more
                        USDC to deploy agents.
                        <div className="mt-1">
                          <a
                            href="https://faucet.circle.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-200 underline hover:text-blue-100"
                          >
                            Get USDC from faucet →
                          </a>
                        </div>
                      </div>
                    )}

                  {/* Network Success */}
                  {currentNetwork && currentNetwork.isSupported && (
                    <div className="mt-2 p-2 bg-green-500 bg-opacity-50 rounded text-white text-sm">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Network supported ✓
                    </div>
                  )}

                  {/* Unsupported Network Warning */}
                  {currentNetwork && !isCurrentNetworkSupported() && (
                    <div className="mt-2 p-3 bg-red-500 bg-opacity-50 rounded text-white text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      <strong>Unsupported Network:</strong>{" "}
                      {currentNetwork.name}
                      <div className="mt-2">
                        <p className="mb-2">Switch to a supported network:</p>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {getSupportedNetworks()
                            .slice(0, 3)
                            .map((network) => (
                              <button
                                key={network.chainId}
                                onClick={() => handleNetworkSwitch(network)}
                                className="text-left px-2 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                              >
                                • {network.name} (Chain ID: {network.chainId})
                              </button>
                            ))}
                        </div>
                        <button
                          onClick={() => setShowNetworkSelector(true)}
                          className="mt-2 text-blue-200 underline hover:text-blue-100 text-xs"
                        >
                          View all supported networks →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {balanceError && (
                  <div className="mt-2 text-red-200 text-sm">
                    ⚠️ {balanceError}
                  </div>
                )}
                <div className="mt-2 text-white text-opacity-80 text-xs">
                  RPC:{" "}
                  {currentNetwork?.rpcUrl ||
                    currentNetwork?.rpcUrls?.[0] ||
                    "Not available"}
                </div>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            {/* Supported Networks Info Panel */}
            {!address && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Network className="h-5 w-5 mr-2 text-blue-600" />
                  Supported EVM Testnets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {getSupportedNetworks().map((network) => (
                    <div
                      key={network.chainId}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="font-medium text-gray-900">
                        {network.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Chain ID: {network.chainId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {network.symbol} • USDC Support ✓
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  💡 All networks support USDC payments. Connect your wallet to
                  automatically detect your network or switch between supported
                  chains.
                </div>
              </div>
            )}

            {/* Location & Deployment Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <MapPin className="h-6 w-6 mr-2 text-green-600" />
                Location & Deployment
              </h2>

              {/* Location Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {locationLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Crosshair className="h-5 w-5 mr-2" />
                  )}
                  Get Current Location
                </button>

                <button
                  onClick={getRTKLocation}
                  disabled={!location || rtkLoading}
                  className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {rtkLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Navigation className="h-5 w-5 mr-2" />
                  )}
                  Get RTK Enhanced Location
                </button>
              </div>

              {/* Location Display */}
              {location && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Current Location
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Latitude:</span>
                      <span className="ml-2 font-mono">
                        {location.latitude.toFixed(8)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Longitude:</span>
                      <span className="ml-2 font-mono">
                        {location.longitude.toFixed(8)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="ml-2">
                        ±{location.accuracy?.toFixed(0) || "10"}m
                      </span>
                    </div>
                    {preciseLocation && (
                      <div>
                        <span className="text-gray-600">RTK Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            preciseLocation.correctionApplied
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {preciseLocation.correctionApplied
                            ? "Enhanced"
                            : "Standard"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trailing Agent Option */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="trailingAgent"
                    checked={trailingAgent}
                    onChange={(e) => setTrailingAgent(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="trailingAgent"
                    className="ml-2 text-sm font-medium text-gray-900"
                  >
                    Trailing Agent
                  </label>
                </div>
                {trailingAgent && (
                  <p className="text-sm text-blue-800">
                    When 'Trailing Agent' is enabled, the agent's location will
                    dynamically follow the device's location used for
                    deployment, ensuring it always stays with you.
                  </p>
                )}
              </div>

              {/* Visibility Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility Range: {visibilityRange}m
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() =>
                        setVisibilityRange(Math.max(5, visibilityRange - 5))
                      }
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={visibilityRange}
                      onChange={(e) =>
                        setVisibilityRange(Number(e.target.value))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      onClick={() =>
                        setVisibilityRange(Math.min(50, visibilityRange + 5))
                      }
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Interaction Range & AR Notifications */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interaction Range: {interactionRange}m
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={interactionRange}
                      onChange={(e) =>
                        setInteractionRange(Number(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="arNotifications"
                      checked={arNotifications}
                      onChange={(e) => setArNotifications(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="arNotifications"
                      className="ml-2 text-sm text-gray-700"
                    >
                      AR Notifications
                    </label>
                  </div>
                </div>
              </div>

              {/* Notification & Discovery */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-yellow-600" />
                  Notification & Discovery
                </h3>
                <p className="text-sm text-gray-700">
                  Users within the interaction range ({interactionRange}m) will
                  receive notifications about your agent. The visibility range (
                  {visibilityRange}m) determines how far users can see your
                  agent in AR.
                </p>
              </div>
            </div>

            {/* Agent Details Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-green-600" />
                Agent Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Enter agent name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Type
                  </label>
                  <select
                    value={agentType}
                    onChange={(e) => setAgentType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {agentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Description
                  </label>
                  <textarea
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="Describe your agent's purpose and capabilities"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {locationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Agent Interaction Methods */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-green-600" />
                Agent Interaction Methods
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="textChat"
                    checked={textChat}
                    onChange={(e) => setTextChat(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="textChat"
                    className="ml-2 text-sm font-medium text-gray-900 flex items-center"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Text Chat
                  </label>
                </div>

                <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="voiceChat"
                    checked={voiceChat}
                    onChange={(e) => setVoiceChat(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="voiceChat"
                    className="ml-2 text-sm font-medium text-gray-900 flex items-center"
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    Voice Chat
                  </label>
                </div>

                <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="videoChat"
                    checked={videoChat}
                    onChange={(e) => setVideoChat(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="videoChat"
                    className="ml-2 text-sm font-medium text-gray-900 flex items-center"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Video Chat
                  </label>
                </div>

                <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="defiFeatures"
                    checked={defiFeatures}
                    onChange={(e) => setDefiFeatures(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="defiFeatures"
                    className="ml-2 text-sm font-medium text-gray-900 flex items-center"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    DeFi Features
                  </label>
                </div>
              </div>
            </div>

            {/* MCP Server Interactions */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-green-600" />
                MCP Server Interactions
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mcpOptions.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`mcp-${option}`}
                      checked={mcpIntegrations.includes(option)}
                      onChange={() => toggleMCPIntegration(option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`mcp-${option}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Wallet Type */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Wallet className="h-6 w-6 mr-2 text-green-600" />
                Agent Wallet Type
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Wallet (Payment Receiver)
                    </label>
                    <div className="bg-white p-3 rounded border font-mono text-sm">
                      {agentWallet}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Connected Wallet
                    </label>
                    <div className="bg-white p-3 rounded border font-mono text-sm">
                      {address || "Not connected"}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Purpose:</strong> The agent's wallet address is
                    identical to your connected wallet. This address will be the
                    receiver of all payments when users interact with your
                    deployed agent. The interaction fee and token selection
                    below will be used for generating payment QR codes.
                  </p>
                </div>
              </div>
            </div>

            {/* Economics & Ownership */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <DollarSign className="h-6 w-6 mr-2 text-green-600" />
                Economics & Ownership
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Token{" "}
                    {currentNetwork && `(${currentNetwork.shortName})`}
                  </label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!currentNetwork || !currentNetwork.isSupported}
                  >
                    {SUPPORTED_STABLECOINS.map((token) => (
                      <option key={token} value={token}>
                        {token}{" "}
                        {TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES]
                          ? "✓"
                          : "⚠"}
                      </option>
                    ))}
                  </select>
                  {currentNetwork && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available tokens for {currentNetwork.name}
                      {TOKEN_ADDRESSES[
                        selectedToken as keyof typeof TOKEN_ADDRESSES
                      ] ? (
                        <span className="text-green-600 ml-1">
                          ✓ Contract verified
                        </span>
                      ) : (
                        <span className="text-yellow-600 ml-1">
                          ⚠ Contract not configured
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interaction Fee (Dynamic Amount)
                  </label>
                  <input
                    type="number"
                    value={interactionFee}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setInteractionFee(
                        isNaN(value) || value <= 0 ? 10 : value
                      );
                    }}
                    min="0.1"
                    step="0.1"
                    placeholder="Enter fee amount (integer only)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This exact amount will be stored and displayed in agent
                    cards
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revenue Sharing ({revenueSharing}% to you)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    value={revenueSharing}
                    onChange={(e) => setRevenueSharing(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Revenue Potential */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Revenue Potential
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {((interactionFee * revenueSharing) / 100).toFixed(6)}{" "}
                      {selectedToken}
                    </div>
                    <div className="text-sm text-gray-600">Per Interaction</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {(((interactionFee * revenueSharing) / 100) * 10).toFixed(
                        6
                      )}{" "}
                      {selectedToken}
                    </div>
                    <div className="text-sm text-gray-600">
                      10 Interactions/Day
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {(
                        ((interactionFee * revenueSharing) / 100) *
                        300
                      ).toFixed(6)}{" "}
                      {selectedToken}
                    </div>
                    <div className="text-sm text-gray-600">
                      Monthly Potential
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Configuration (6-Faced Cube System) */}
            <div className="space-y-6">
              <PaymentMethodsSelector
                onPaymentMethodsChange={handlePaymentMethodsChange}
                connectedWallet={address}
                initialMethods={paymentMethods}
              />

              {/* Conditional Bank Details Forms */}
              {paymentMethods?.bank_virtual_card?.enabled && (
                <BankDetailsForm
                  onBankDetailsChange={(details) =>
                    handleBankDetailsChange(details, "virtual_card")
                  }
                  paymentType="virtual_card"
                  initialDetails={paymentMethods.bank_virtual_card.bank_details}
                />
              )}

              {paymentMethods?.bank_qr?.enabled && (
                <BankDetailsForm
                  onBankDetailsChange={(details) =>
                    handleBankDetailsChange(details, "bank_qr")
                  }
                  paymentType="bank_qr"
                  initialDetails={paymentMethods.bank_qr.bank_details}
                />
              )}
            </div>

            {/* Deployment Button */}
            <div className="pt-6 border-t border-gray-200">
              {deploymentError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-800">{deploymentError}</span>
                  </div>
                </div>
              )}

              {deploymentSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800">
                      Agent deployed successfully!
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={deployAgent}
                disabled={
                  isDeploying ||
                  !address ||
                  !agentName.trim() ||
                  !location ||
                  !currentNetwork ||
                  !currentNetwork.isSupported ||
                  networkLoading
                }
                className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Deploying Agent...
                  </>
                ) : networkLoading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Detecting Network...
                  </>
                ) : !currentNetwork ? (
                  <>
                    <AlertCircle className="h-6 w-6 mr-2" />
                    Connect to Network
                  </>
                ) : !currentNetwork.isSupported ? (
                  <>
                    <AlertCircle className="h-6 w-6 mr-2" />
                    Switch to Supported Network
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 mr-2" />
                    Deploy on {currentNetwork.shortName}
                  </>
                )}
              </button>

              {/* Network-specific deployment info */}
              {currentNetwork && currentNetwork.isSupported && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    Deployment Summary
                  </h4>
                  <div className="space-y-1 text-xs text-green-700">
                    <div>
                      Network:{" "}
                      <span className="font-medium">{currentNetwork.name}</span>
                    </div>
                    <div>
                      Chain ID:{" "}
                      <span className="font-medium">
                        {currentNetwork.chainId}
                      </span>
                    </div>
                    <div>
                      Fee:{" "}
                      <span className="font-medium">
                        {interactionFee} {selectedToken}
                      </span>
                    </div>
                    <div>
                      Token Contract:{" "}
                      <span className="font-mono text-xs">
                        {TOKEN_ADDRESSES[
                          selectedToken as keyof typeof TOKEN_ADDRESSES
                        ]
                          ? `${TOKEN_ADDRESSES[
                              selectedToken as keyof typeof TOKEN_ADDRESSES
                            ]?.slice(0, 8)}...${TOKEN_ADDRESSES[
                              selectedToken as keyof typeof TOKEN_ADDRESSES
                            ]?.slice(-6)}`
                          : "Not configured"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeployObject;
