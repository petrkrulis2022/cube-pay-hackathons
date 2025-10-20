import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  DollarSign,
  Settings,
  Network,
  Wallet,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
} from "lucide-react";
import NetworkSelectionGrid from "./NetworkSelectionGrid";
import MultiWalletConnector from "./MultiWalletConnector";
import CrossChainConfigPanel from "./CrossChainConfigPanel";
import PaymentMethodsSelector from "./PaymentMethodsSelector";
import BankDetailsForm from "./BankDetailsForm";
import { multiChainDeploymentService } from "../services/multiChainDeploymentService";
import { multiChainWalletService } from "../services/multiChainWalletService";
import { EVM_NETWORKS } from "../config/multiChainNetworks";
import { supabase } from "../lib/supabase";

interface AgentFormData {
  name: string;
  description: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  interactionFee: number;
  paymentMethods: string[];
  bankDetails?: any;
  multiChain: {
    primaryNetwork: string;
    additionalNetworks: string[];
    crossChainEnabled: boolean;
    crossChainConfig?: any;
  };
}

const AGENT_TYPES = [
  {
    id: "ai-assistant",
    name: "AI Assistant",
    description: "General purpose AI assistant",
  },
  {
    id: "location-guide",
    name: "Location Guide",
    description: "Location-specific information and guidance",
  },
  {
    id: "service-provider",
    name: "Service Provider",
    description: "Specific service offerings",
  },
  {
    id: "ar-experience",
    name: "AR Experience",
    description: "Augmented reality experiences",
  },
  { id: "custom", name: "Custom", description: "Custom agent type" },
];

const DEPLOYMENT_STEPS = [
  { id: "basic", name: "Basic Info", icon: Info },
  { id: "location", name: "Location", icon: MapPin },
  { id: "networks", name: "Networks", icon: Network },
  { id: "wallets", name: "Wallets", icon: Wallet },
  { id: "payment", name: "Payment", icon: DollarSign },
  { id: "deploy", name: "Deploy", icon: Zap },
];

export const EnhancedDeploymentForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    description: "",
    type: "",
    location: { latitude: 0, longitude: 0 },
    interactionFee: 0,
    paymentMethods: [],
    multiChain: {
      primaryNetwork: "",
      additionalNetworks: [],
      crossChainEnabled: false,
    },
  });

  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: "idle" | "deploying" | "success" | "error";
    message?: string;
    deploymentId?: string;
  }>({ status: "idle" });

  const [walletConnections, setWalletConnections] = useState<
    Record<string, any>
  >({});
  const [networkStatuses, setNetworkStatuses] = useState<Record<string, any>>(
    {}
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    // Initialize wallet service and load network statuses
    initializeWalletService();
    loadNetworkStatuses();
  }, []);

  const initializeWalletService = async () => {
    try {
      // await multiChainWalletService.initialize();
      // const connections = await multiChainWalletService.getConnectedWallets();
      // setWalletConnections(connections);
      console.log(
        "Wallet service initialization skipped - methods not implemented yet"
      );
    } catch (error) {
      console.error("Failed to initialize wallet service:", error);
    }
  };

  const loadNetworkStatuses = async () => {
    const statuses: Record<string, any> = {};
    for (const [chainId, network] of Object.entries(EVM_NETWORKS)) {
      try {
        // const status = await multiChainWalletService.getNetworkStatus(chainId);
        // statuses[chainId] = status;
        statuses[chainId] = { healthy: true }; // Temporary placeholder
      } catch (error) {
        statuses[chainId] = { healthy: false, error: (error as Error).message };
      }
    }
    setNetworkStatuses(statuses);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) errors.name = "Agent name is required";
        if (!formData.description.trim())
          errors.description = "Description is required";
        if (!formData.type) errors.type = "Agent type is required";
        break;

      case 1: // Location
        if (!formData.location.latitude || !formData.location.longitude) {
          errors.location = "Location coordinates are required";
        }
        break;

      case 2: // Networks
        if (!formData.multiChain.primaryNetwork) {
          errors.primaryNetwork = "Primary network is required";
        }
        break;

      case 3: // Wallets
        const requiredNetworks = [
          formData.multiChain.primaryNetwork,
          ...formData.multiChain.additionalNetworks,
        ].filter(Boolean);

        for (const chainId of requiredNetworks) {
          if (!walletConnections[chainId]) {
            errors.wallets = `Wallet connection required for ${
              EVM_NETWORKS[chainId]?.name || chainId
            }`;
            break;
          }
        }
        break;

      case 4: // Payment
        if (formData.paymentMethods.length === 0) {
          errors.payment = "At least one payment method is required";
        }
        if (formData.interactionFee <= 0) {
          errors.fee = "Interaction fee must be greater than 0";
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, DEPLOYMENT_STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNetworkSelection = (
    primaryChainId: string,
    additionalChainIds: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      multiChain: {
        ...prev.multiChain,
        primaryNetwork: primaryChainId,
        additionalNetworks: additionalChainIds,
      },
    }));
  };

  const handleCrossChainConfig = (enabled: boolean, config?: any) => {
    setFormData((prev) => ({
      ...prev,
      multiChain: {
        ...prev.multiChain,
        crossChainEnabled: enabled,
        crossChainConfig: config,
      },
    }));
  };

  const handleWalletConnection = async (
    chainId: string,
    walletType: string
  ) => {
    try {
      const connection = await multiChainWalletService.connectWallet(
        chainId,
        walletType
      );
      setWalletConnections((prev) => ({
        ...prev,
        [chainId]: connection,
      }));
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const handleDeploy = async () => {
    if (!validateStep(4)) return;

    setDeploymentStatus({
      status: "deploying",
      message: "Preparing deployment...",
    });

    try {
      // Prepare deployment configuration
      const deploymentConfig = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        interactionFee: formData.interactionFee,
        paymentMethods: formData.paymentMethods,
        bankDetails: formData.bankDetails,
        primaryNetwork: formData.multiChain.primaryNetwork,
        additionalNetworks: formData.multiChain.additionalNetworks,
        crossChainEnabled: formData.multiChain.crossChainEnabled,
        crossChainConfig: formData.multiChain.crossChainConfig,
        walletConnections,
      };

      setDeploymentStatus({
        status: "deploying",
        message: "Deploying agent to blockchain networks...",
      });

      // Deploy using multi-chain service
      // const deploymentResult = await multiChainDeploymentService.deployAgent(
      //   deploymentConfig
      // );

      // Temporary success simulation
      setTimeout(() => {
        setDeploymentStatus({
          status: "success",
          message: `Agent deployment simulated successfully!`,
          deploymentId: "temp-" + Date.now(),
        });
      }, 2000);

      return; // Exit early for now
    } catch (error) {
      console.error("Deployment failed:", error);
      setDeploymentStatus({
        status: "error",
        message: `Deployment failed: ${(error as Error).message}`,
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter agent name"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your agent's capabilities"
              />
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AGENT_TYPES.map((type) => (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === type.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, type: type.id }))
                    }
                  >
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </motion.div>
                ))}
              </div>
              {validationErrors.type && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.type}
                </p>
              )}
            </div>
          </motion.div>
        );

      case 1: // Location
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Set Agent Location
              </h3>
              <p className="text-gray-600 mb-6">
                Choose where your agent will be geographically anchored
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.latitude}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        latitude: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.longitude}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        longitude: parseFloat(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address (Optional)
              </label>
              <input
                type="text"
                value={formData.location.address || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., New York, NY"
              />
            </div>

            {validationErrors.location && (
              <p className="text-red-500 text-sm">
                {validationErrors.location}
              </p>
            )}
          </motion.div>
        );

      case 2: // Networks
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Blockchain Networks
              </h3>
              <p className="text-gray-600 mb-6">
                Choose which networks to deploy your agent on
              </p>
            </div>

            <NetworkSelectionGrid
              selectedPrimary={formData.multiChain.primaryNetwork}
              selectedAdditional={formData.multiChain.additionalNetworks}
              onSelectionChange={handleNetworkSelection}
              networkStatuses={networkStatuses}
            />

            <CrossChainConfigPanel
              primaryNetwork={formData.multiChain.primaryNetwork}
              additionalNetworks={formData.multiChain.additionalNetworks}
              crossChainEnabled={formData.multiChain.crossChainEnabled}
              onConfigChange={handleCrossChainConfig}
            />

            {validationErrors.primaryNetwork && (
              <p className="text-red-500 text-sm">
                {validationErrors.primaryNetwork}
              </p>
            )}
          </motion.div>
        );

      case 3: // Wallets
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Connect Wallets
              </h3>
              <p className="text-gray-600 mb-6">
                Connect wallets for each selected network
              </p>
            </div>

            <MultiWalletConnector
              selectedNetworks={[
                formData.multiChain.primaryNetwork,
                ...formData.multiChain.additionalNetworks,
              ].filter(Boolean)}
              connectedWallets={walletConnections}
              onWalletConnect={handleWalletConnection}
              onWalletDisconnect={(chainId) => {
                setWalletConnections((prev) => {
                  const updated = { ...prev };
                  delete updated[chainId];
                  return updated;
                });
              }}
            />

            {validationErrors.wallets && (
              <p className="text-red-500 text-sm">{validationErrors.wallets}</p>
            )}
          </motion.div>
        );

      case 4: // Payment
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payment Configuration
              </h3>
              <p className="text-gray-600 mb-6">
                Set up payment methods and interaction fees
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interaction Fee (USDC)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.interactionFee}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    interactionFee: parseFloat(e.target.value),
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 0.50"
              />
              {validationErrors.fee && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.fee}
                </p>
              )}
            </div>

            <PaymentMethodsSelector
              selectedMethods={formData.paymentMethods}
              onMethodsChange={(methods) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentMethods: methods,
                }))
              }
            />

            {formData.paymentMethods.includes("bank_transfer") && (
              <BankDetailsForm
                onDetailsChange={(details) =>
                  setFormData((prev) => ({
                    ...prev,
                    bankDetails: details,
                  }))
                }
              />
            )}

            {validationErrors.payment && (
              <p className="text-red-500 text-sm">{validationErrors.payment}</p>
            )}
          </motion.div>
        );

      case 5: // Deploy
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Deploy Agent
              </h3>
              <p className="text-gray-600 mb-6">
                Review your configuration and deploy your agent
              </p>
            </div>

            {/* Deployment Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{formData.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-900">{formData.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Primary Network:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {EVM_NETWORKS[formData.multiChain.primaryNetwork]?.name ||
                      "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Additional Networks:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {formData.multiChain.additionalNetworks.length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Cross-chain:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {formData.multiChain.crossChainEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Interaction Fee:
                  </span>
                  <span className="ml-2 text-gray-900">
                    ${formData.interactionFee} USDC
                  </span>
                </div>
              </div>
            </div>

            {/* Deployment Status */}
            <AnimatePresence>
              {deploymentStatus.status !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-lg border ${
                    deploymentStatus.status === "success"
                      ? "bg-green-50 border-green-200"
                      : deploymentStatus.status === "error"
                      ? "bg-red-50 border-red-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center">
                    {deploymentStatus.status === "deploying" && (
                      <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3" />
                    )}
                    {deploymentStatus.status === "success" && (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    )}
                    {deploymentStatus.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    )}
                    <span className="text-sm font-medium">
                      {deploymentStatus.message}
                    </span>
                  </div>
                  {deploymentStatus.deploymentId && (
                    <p className="text-xs text-gray-600 mt-2">
                      Deployment ID: {deploymentStatus.deploymentId}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deploy Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeploy}
              disabled={deploymentStatus.status === "deploying"}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deploymentStatus.status === "deploying"
                ? "Deploying..."
                : "Deploy Agent"}
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Progress Steps */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          {DEPLOYMENT_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            const isAccessible = currentStep >= index;

            return (
              <React.Fragment key={step.id}>
                <motion.div
                  className={`flex items-center space-x-2 ${
                    isAccessible
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                  onClick={() => isAccessible && setCurrentStep(index)}
                  whileHover={isAccessible ? { scale: 1.05 } : {}}
                  whileTap={isAccessible ? { scale: 0.95 } : {}}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {step.name}
                  </span>
                </motion.div>
                {index < DEPLOYMENT_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </motion.button>

        {currentStep < DEPLOYMENT_STEPS.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg"
          >
            Next
          </motion.button>
        )}
      </div>
    </div>
  );
};
