import React from "react";
import { SolanaWalletConnect } from "../components/SolanaWalletConnect";

const SolanaWallet: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Solana Wallet Integration
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your Solana wallet to view SOL and USDC balances, and
            interact with the AgentSphere ecosystem on Solana Devnet.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Connection */}
          <div className="lg:col-span-1">
            <SolanaWalletConnect />
          </div>

          {/* Information Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Solana Integration Features
              </h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Multi-Wallet Support
                    </h3>
                    <p className="text-sm text-gray-600">
                      Connect with Phantom, Solflare, or Torus wallets
                      seamlessly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Real-time Balances
                    </h3>
                    <p className="text-sm text-gray-600">
                      View your SOL and USDC balances with automatic updates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Network Switching
                    </h3>
                    <p className="text-sm text-gray-600">
                      Switch between Solana Testnet and Devnet networks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">USDC Support</h3>
                    <p className="text-sm text-gray-600">
                      Full SPL token support for USDC on Solana Devnet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Getting Started
                </h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Install a Solana wallet (Phantom recommended)</li>
                  <li>2. Switch to Solana Devnet in your wallet settings</li>
                  <li>
                    3. Get some SOL from the{" "}
                    <a
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-600"
                    >
                      Solana faucet
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
              <h3 className="font-medium text-gray-900 mb-2">Solana Devnet</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>RPC:</strong> https://api.devnet.solana.com
                </p>
                <p>
                  <strong>Explorer:</strong> explorer.solana.com
                </p>
                <p>
                  <strong>USDC Mint:</strong>{" "}
                  4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Solana Testnet</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>RPC:</strong> https://api.testnet.solana.com
                </p>
                <p>
                  <strong>Explorer:</strong> explorer.solana.com
                </p>
                <p>
                  <strong>Purpose:</strong> SOL balance testing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolanaWallet;
