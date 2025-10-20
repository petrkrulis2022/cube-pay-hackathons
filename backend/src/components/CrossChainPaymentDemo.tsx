/**
 * Cross-Chain Payment Demo Component
 * Demonstrates the new CCIP cross-chain payment capabilities
 */

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Zap,
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import { multiChainWalletService } from "../services/multiChainWalletService";
import { crossChainPaymentService } from "../services/crossChainPaymentService";
import {
  getAllCrossChainRoutes,
  getCCIPSupportedNetworks,
} from "../config/multiChainNetworks";

interface CrossChainDemoProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CrossChainPaymentDemo: React.FC<CrossChainDemoProps> = ({
  isVisible,
  onClose,
}) => {
  const [connectedWallets, setConnectedWallets] = useState<any[]>([]);
  const [crossChainCapabilities, setCrossChainCapabilities] = useState<any[]>(
    []
  );
  const [supportedNetworks, setSupportedNetworks] = useState<any[]>([]);
  const [crossChainRoutes, setCrossChainRoutes] = useState<any[]>([]);
  const [paymentEstimate, setPaymentEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock agent data for demonstration
  const mockAgent = {
    id: "demo-agent-123",
    name: "Cross-Chain AI Assistant",
    walletAddress: "0x742d35cc6ba9b34F8E35c7a84B5D8b1A9a3E8F1B",
    networkChainId: 80002, // Polygon Amoy
    networkName: "Polygon Amoy",
    interactionFee: 4.0,
  };

  useEffect(() => {
    if (isVisible) {
      loadCrossChainData();
    }
  }, [isVisible]);

  const loadCrossChainData = async () => {
    try {
      setLoading(true);

      // Get connected wallets
      const wallets = multiChainWalletService.getConnectedWallets();
      setConnectedWallets(wallets);

      // Get cross-chain capabilities
      const capabilities = multiChainWalletService.getCrossChainCapabilities();
      setCrossChainCapabilities(capabilities);

      // Get supported networks
      const networks = getCCIPSupportedNetworks();
      setSupportedNetworks(networks);

      // Get all cross-chain routes
      const routes = getAllCrossChainRoutes();
      setCrossChainRoutes(routes.slice(0, 10)); // Show first 10 routes

      // Get payment estimate for first available wallet
      if (wallets.length > 0) {
        const estimate = await multiChainWalletService.estimateAgentPayment(
          mockAgent.walletAddress,
          mockAgent.networkChainId,
          mockAgent.interactionFee
        );
        setPaymentEstimate(estimate);
      }
    } catch (error) {
      console.error("Error loading cross-chain data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPayment = async () => {
    try {
      setLoading(true);
      console.log("🚀 Testing cross-chain payment to agent...");

      const result = await multiChainWalletService.payAgent(
        mockAgent.id,
        mockAgent.name,
        mockAgent.walletAddress,
        mockAgent.networkChainId,
        mockAgent.interactionFee
      );

      console.log("Payment result:", result);

      if (result.success) {
        alert(
          `✅ Payment successful!\nPayment Type: ${result.paymentType}\nTransaction Hash: ${result.transactionHash}\nTotal Cost: $${result.totalCost}`
        );
      } else {
        alert(`❌ Payment failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Payment test failed:", error);
      alert(`❌ Payment test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Globe className="h-6 w-6" />
                CCIP Cross-Chain Payment Demo
              </h2>
              <p className="text-purple-100 mt-1">
                Universal agent payments across all supported blockchains
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Loading cross-chain capabilities...
              </p>
            </div>
          )}

          {/* Agent Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Demo Agent Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Agent Name</p>
                <p className="font-medium">{mockAgent.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deployment Network</p>
                <p className="font-medium">{mockAgent.networkName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Agent Wallet</p>
                <p className="font-mono text-sm">
                  {mockAgent.walletAddress.slice(0, 20)}...
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Interaction Fee</p>
                <p className="font-medium text-green-600">
                  ${mockAgent.interactionFee} USDC
                </p>
              </div>
            </div>
          </div>

          {/* Payment Estimate */}
          {paymentEstimate && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Payment Estimate
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Agent Fee</p>
                  <p className="font-medium">
                    ${paymentEstimate.agentFee} USDC
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cross-Chain Fee</p>
                  <p className="font-medium text-orange-600">
                    ${paymentEstimate.ccipFee}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="font-bold text-blue-600">
                    ${paymentEstimate.totalUserCost}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Estimated Time: {paymentEstimate.estimatedTime}
                </span>
              </div>
              {paymentEstimate.canProcess && (
                <button
                  onClick={handleTestPayment}
                  disabled={loading}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Test Cross-Chain Payment
                </button>
              )}
            </div>
          )}

          {/* Connected Wallets */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Connected Wallets
            </h3>
            {connectedWallets.length === 0 ? (
              <p className="text-gray-500 italic">
                No wallets connected. Connect a wallet to test cross-chain
                payments.
              </p>
            ) : (
              <div className="space-y-2">
                {connectedWallets.map((wallet, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {wallet.walletType}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {wallet.address.slice(0, 20)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">USDC Balance</p>
                      <p className="font-medium">
                        {wallet.usdcBalance || "0"} USDC
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-Chain Capabilities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Cross-Chain Capabilities
            </h3>
            {crossChainCapabilities.length === 0 ? (
              <p className="text-gray-500 italic">
                No CCIP-enabled wallets connected.
              </p>
            ) : (
              <div className="space-y-3">
                {crossChainCapabilities.map((capability, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium capitalize">
                          {capability.wallet.walletType}
                        </p>
                        <p className="text-sm text-gray-600">
                          {capability.ccipEnabled
                            ? "CCIP Enabled"
                            : "CCIP Not Supported"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          capability.ccipEnabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {capability.supportedDestinations.length} Destinations
                      </span>
                    </div>
                    {capability.supportedDestinations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {capability.supportedDestinations
                          .slice(0, 5)
                          .map((dest: any, idx: number) => (
                            <span
                              key={idx}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {dest.shortName || dest.name}
                            </span>
                          ))}
                        {capability.supportedDestinations.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{capability.supportedDestinations.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supported Networks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Supported Networks ({supportedNetworks.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {supportedNetworks.map((network, index) => (
                <div key={index} className="border rounded-lg p-3 text-center">
                  <p className="font-medium text-sm">
                    {network.shortName || network.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {network.ccipSupported ? "CCIP Ready" : "Standard"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Cross-Chain Routes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Available Cross-Chain Routes (Sample)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {crossChainRoutes.map((route, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {route.source.shortName}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {route.target.shortName}
                    </span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-purple-800 font-medium">
              🌐 AgentSphere Cross-Chain Integration Complete!
            </p>
            <p className="text-purple-600 text-sm mt-1">
              Agents can now receive payments from any supported blockchain
              network
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossChainPaymentDemo;
