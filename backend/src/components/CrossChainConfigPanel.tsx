import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Info,
} from "lucide-react";
import { NetworkConfig, getEVMNetworks } from "../config/multiChainNetworks";

interface CrossChainConfigPanelProps {
  primaryNetwork: NetworkConfig | null;
  selectedAdditionalNetworks: NetworkConfig[];
  onAdditionalNetworksChange: (networks: NetworkConfig[]) => void;
  onCrossChainEnabledChange: (enabled: boolean) => void;
  crossChainEnabled: boolean;
  className?: string;
}

const CrossChainConfigPanel: React.FC<CrossChainConfigPanelProps> = ({
  primaryNetwork,
  selectedAdditionalNetworks,
  onAdditionalNetworksChange,
  onCrossChainEnabledChange,
  crossChainEnabled,
  className = "",
}) => {
  const [availableNetworks, setAvailableNetworks] = useState<NetworkConfig[]>(
    []
  );

  useEffect(() => {
    // Filter out the primary network from available options
    const evmNetworks = getEVMNetworks();
    const available = evmNetworks.filter(
      (network) => network.chainId !== primaryNetwork?.chainId
    );
    setAvailableNetworks(available);
  }, [primaryNetwork]);

  const handleNetworkToggle = (network: NetworkConfig) => {
    const isSelected = selectedAdditionalNetworks.some(
      (selected) => selected.chainId === network.chainId
    );

    let newSelection: NetworkConfig[];

    if (isSelected) {
      newSelection = selectedAdditionalNetworks.filter(
        (selected) => selected.chainId !== network.chainId
      );
    } else {
      newSelection = [...selectedAdditionalNetworks, network];
    }

    onAdditionalNetworksChange(newSelection);
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
      default:
        return "🌐";
    }
  };

  if (!primaryNetwork) {
    return (
      <div className={`cross-chain-config-panel ${className}`}>
        <div className="text-center py-8">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a primary network first</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cross-chain-config-panel ${className}`}>
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Cross-Chain Configuration
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Enable your agent on multiple networks for broader reach and
          redundancy.
        </p>
      </div>

      {/* Cross-Chain Enable Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Enable Cross-Chain Deployment
              </h4>
              <p className="text-sm text-gray-600">
                Deploy your agent on multiple networks simultaneously
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={crossChainEnabled}
              onChange={(e) => onCrossChainEnabledChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* Primary Network Display */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          Primary Network
        </h4>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-xl">{getNetworkIcon(primaryNetwork)}</div>
            <div>
              <h5 className="font-medium text-green-800">
                {primaryNetwork.name}
              </h5>
              <p className="text-sm text-green-600">
                Main deployment network • Chain ID: {primaryNetwork.chainId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Networks Selection */}
      <AnimatePresence>
        {crossChainEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Settings className="h-4 w-4 text-blue-600 mr-2" />
                Additional Networks
                <span className="ml-2 text-sm text-gray-600">
                  ({selectedAdditionalNetworks.length} selected)
                </span>
              </h4>

              {availableNetworks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>No additional networks available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableNetworks.map((network) => {
                    const isSelected = selectedAdditionalNetworks.some(
                      (selected) => selected.chainId === network.chainId
                    );

                    return (
                      <motion.div
                        key={network.chainId}
                        layout
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          p-4 border-2 rounded-lg cursor-pointer transition-all
                          ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }
                        `}
                        onClick={() => handleNetworkToggle(network)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg">
                              {getNetworkIcon(network)}
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-900">
                                {network.name}
                              </h6>
                              <p className="text-sm text-gray-600">
                                {network.symbol}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isSelected ? (
                              <MinusCircle className="h-5 w-5 text-blue-600" />
                            ) : (
                              <PlusCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Network Details */}
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>Chain ID: {network.chainId}</span>
                            <span className="capitalize">{network.status}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Networks Summary */}
            {selectedAdditionalNetworks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h4 className="font-medium text-gray-900 mb-3">
                  Deployment Summary
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">
                        Total Networks:
                      </span>
                      <span className="text-blue-900">
                        {1 + selectedAdditionalNetworks.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">
                        Primary:
                      </span>
                      <span className="text-blue-900">
                        {primaryNetwork.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">
                        Additional:
                      </span>
                      <span className="text-blue-900">
                        {selectedAdditionalNetworks
                          .map((n) => n.name)
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cross-Chain Benefits */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Cross-Chain Benefits
              </h5>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Increased agent accessibility across networks</li>
                <li>• Redundancy and fault tolerance</li>
                <li>• Access to different user bases</li>
                <li>• Network-specific optimizations</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deployment Cost Information */}
      {crossChainEnabled && selectedAdditionalNetworks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-yellow-800 mb-1">
                Deployment Cost Notice
              </h5>
              <p className="text-sm text-yellow-700">
                Cross-chain deployment will require gas fees on each selected
                network. Make sure you have sufficient funds in each connected
                wallet.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CrossChainConfigPanel;
