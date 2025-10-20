import React from "react";
import HederaWalletConnect from "../components/HederaWalletConnect";

const HederaWallet: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Hedera Testnet Integration
            </h1>
            <p className="text-xl text-gray-600">
              Connect your MetaMask wallet to Hedera Testnet and view your HBAR
              balance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wallet Connection */}
            <div className="flex justify-center">
              <HederaWalletConnect />
            </div>

            {/* Information Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Hedera Testnet Features
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        MetaMask Integration
                      </h3>
                      <p className="text-sm text-gray-600">
                        Connect seamlessly with MetaMask using Hedera Testnet
                        network configuration.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Real-time HBAR Balance
                      </h3>
                      <p className="text-sm text-gray-600">
                        View your HBAR balance with automatic updates on Hedera
                        Testnet.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Network Auto-Detection
                      </h3>
                      <p className="text-sm text-gray-600">
                        Automatically detect and switch to Hedera Testnet if
                        needed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        HashScan Integration
                      </h3>
                      <p className="text-sm text-gray-600">
                        Direct links to HashScan explorer for transaction
                        history.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Getting Started
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Install MetaMask browser extension</li>
                    <li>2. Add Hedera Testnet to your networks</li>
                    <li>
                      3. Get test HBAR from{" "}
                      <a
                        href="https://portal.hedera.com/faucet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600"
                      >
                        Hedera Faucet
                      </a>
                    </li>
                    <li>4. Connect your wallet using the button above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Network Information */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Network Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Hedera Testnet
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Chain ID:</strong> 296
                  </p>
                  <p>
                    <strong>RPC URL:</strong> https://testnet.hashio.io/api
                  </p>
                  <p>
                    <strong>Currency:</strong> HBAR
                  </p>
                  <p>
                    <strong>Explorer:</strong> hashscan.io/testnet
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Network Features
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Consensus:</strong> Hashgraph
                  </p>
                  <p>
                    <strong>Finality:</strong> ~3-5 seconds
                  </p>
                  <p>
                    <strong>Energy Efficient:</strong> Yes
                  </p>
                  <p>
                    <strong>Smart Contracts:</strong> EVM Compatible
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Integration Preview */}
          <div className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 Next: AR QR Code Integration
            </h2>
            <p className="text-gray-700 mb-4">
              Once connected, this wallet will be used for:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">
                  🎭 Agent Deployment
                </h3>
                <p className="text-sm text-gray-600">
                  Deploy AI agents with Hedera Testnet wallet integration
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">
                  🎨 AR Visualization
                </h3>
                <p className="text-sm text-gray-600">
                  View agents in AR with wallet-connected payment QR codes
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">
                  💳 HBAR Payments
                </h3>
                <p className="text-sm text-gray-600">
                  Generate QR codes for HBAR payments to agent owners
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HederaWallet;
