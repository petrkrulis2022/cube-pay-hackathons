import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Activity,
  DollarSign,
} from "lucide-react";
import {
  NetworkConfig,
  getEVMNetworks,
  getNonEVMNetworks,
  estimateGasFee,
} from "../config/multiChainNetworks";

interface NetworkSelectionGridProps {
  selectedNetwork: NetworkConfig | null;
  onNetworkSelect: (network: NetworkConfig) => void;
  showNonEVM?: boolean;
  className?: string;
}

const NetworkSelectionGrid: React.FC<NetworkSelectionGridProps> = ({
  selectedNetwork,
  onNetworkSelect,
  showNonEVM = false,
  className = "",
}) => {
  const [networkStatus, setNetworkStatus] = useState<Record<string, boolean>>(
    {}
  );
  const [gasFees, setGasFees] = useState<Record<string, string>>({});
  const [loadingFees, setLoadingFees] = useState(true);

  const evmNetworks = getEVMNetworks();
  const nonEvmNetworks = getNonEVMNetworks();
  const networksToShow = showNonEVM
    ? [...evmNetworks, ...nonEvmNetworks]
    : evmNetworks;

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    setLoadingFees(true);

    // Load gas fees for EVM networks
    const feePromises = evmNetworks.map(async (network) => {
      try {
        const fee = await estimateGasFee(network);
        return { chainId: network.chainId, fee };
      } catch (error) {
        return { chainId: network.chainId, fee: "Unknown" };
      }
    });

    const feeResults = await Promise.all(feePromises);
    const newGasFees: Record<string, string> = {};

    feeResults.forEach(({ chainId, fee }) => {
      newGasFees[chainId] = fee;
    });

    setGasFees(newGasFees);
    setLoadingFees(false);
  };

  const getNetworkIcon = (network: NetworkConfig): string => {
    switch (network.icon) {
      case "ethereum":
        return "⟠";
      case "arbitrum":
        return "🅰️";
      case "base":
        return "🔵";
      case "optimism":
        return "🔴";
      case "avalanche":
        return "🔺";
      case "solana":
        return "🌟";
      case "hedera":
        return "🌿";
      case "xrp":
        return "💧";
      case "tron":
        return "🟡";
      case "starknet":
        return "⭐";
      default:
        return "🌐";
    }
  };

  const getNetworkStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "maintenance":
        return "text-yellow-600 bg-yellow-100";
      case "deprecated":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className={`network-selection-grid ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Deployment Network
        </h3>
        <p className="text-sm text-gray-600">
          Choose the blockchain network for your agent deployment.
          {!showNonEVM && " All payments will be processed in USDC."}
        </p>
      </div>

      {/* EVM Networks Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="font-medium text-gray-900">EVM Compatible Networks</h4>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Recommended
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evmNetworks.map((network) => (
            <NetworkCard
              key={network.chainId}
              network={network}
              isSelected={selectedNetwork?.chainId === network.chainId}
              onClick={() => onNetworkSelect(network)}
              gasFee={gasFees[network.chainId]}
              loadingFee={loadingFees}
            />
          ))}
        </div>
      </div>

      {/* Non-EVM Networks Section */}
      {showNonEVM && (
        <div>
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 text-purple-600 mr-2" />
            <h4 className="font-medium text-gray-900">Alternative Networks</h4>
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Coming Soon
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonEvmNetworks.map((network) => (
              <NetworkCard
                key={`${network.type}-${network.name}`}
                network={network}
                isSelected={selectedNetwork?.name === network.name}
                onClick={() => onNetworkSelect(network)}
                disabled={true} // Disabled for now
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface NetworkCardProps {
  network: NetworkConfig;
  isSelected: boolean;
  onClick: () => void;
  gasFee?: string;
  loadingFee?: boolean;
  disabled?: boolean;
}

const NetworkCard: React.FC<NetworkCardProps> = ({
  network,
  isSelected,
  onClick,
  gasFee,
  loadingFee = false,
  disabled = false,
}) => {
  const getNetworkIcon = (network: NetworkConfig): string => {
    switch (network.icon) {
      case "ethereum":
        return "⟠";
      case "arbitrum":
        return "🅰️";
      case "base":
        return "🔵";
      case "optimism":
        return "🔴";
      case "avalanche":
        return "🔺";
      case "solana":
        return "🌟";
      case "hedera":
        return "🌿";
      case "xrp":
        return "💧";
      case "tron":
        return "🟡";
      case "starknet":
        return "⭐";
      default:
        return "🌐";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "maintenance":
        return "text-yellow-600";
      case "deprecated":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <motion.div
      layout
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-lg"
            : disabled
            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
        }
      `}
      onClick={disabled ? undefined : onClick}
    >
      {/* Network Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getNetworkIcon(network)}</div>
          <div>
            <h4 className="font-semibold text-gray-900">{network.name}</h4>
            <p className="text-sm text-gray-600">{network.symbol}</p>
          </div>
        </div>

        {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
      </div>

      {/* Network Details */}
      <div className="space-y-2">
        {/* Chain ID */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Chain ID:</span>
          <span className="font-mono text-gray-900">{network.chainId}</span>
        </div>

        {/* Gas Fee (EVM only) */}
        {network.type === "evm" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              Gas Fee:
            </span>
            <span className="font-mono text-gray-900">
              {loadingFee ? (
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              ) : (
                gasFee || "Unknown"
              )}
            </span>
          </div>
        )}

        {/* USDC Address */}
        {network.usdcAddress && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">USDC:</span>{" "}
            {network.usdcAddress.slice(0, 8)}...
          </div>
        )}

        {/* Network Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Activity className={`h-3 w-3 ${getStatusColor(network.status)}`} />
            <span
              className={`text-xs font-medium ${getStatusColor(
                network.status
              )}`}
            >
              {network.status.charAt(0).toUpperCase() + network.status.slice(1)}
            </span>
          </div>

          {network.isTestnet && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Testnet
            </span>
          )}
        </div>
      </div>

      {/* Explorer Link */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <a
          href={network.blockExplorer}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Block Explorer
        </a>
      </div>

      {/* Coming Soon Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-xl flex items-center justify-center">
          <span className="px-3 py-1 bg-gray-800 text-white text-sm rounded-full">
            Coming Soon
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default NetworkSelectionGrid;
