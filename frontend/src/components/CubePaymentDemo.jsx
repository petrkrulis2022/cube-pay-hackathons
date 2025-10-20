import React, { useState } from "react";
import CubePaymentEngine from "./CubePaymentEngine";
import CubePaymentHandler from "./CubePaymentHandler-minimal"; // Using minimal version for testing

const CubePaymentDemo = () => {
  const [showCube, setShowCube] = useState(false);

  // Mock agent data for testing - Updated for EVM testnets
  const mockAgent = {
    id: "demo-agent-001",
    name: "Demo AR Agent",
    description: "Revolutionary 3D payment demo agent with EVM support",
    interaction_fee: 1.0, // 1 USDC
    agent_wallet_address: "0x742D35Cc6634C0532925a3b8d1C02e4e61b3F9b0",
    payment_recipient_address: "0x742D35Cc6634C0532925a3b8d1C02e4e61b3F9b0",
    token_symbol: "USDC",
    currency_type: "USDC",
    network: "Ethereum Sepolia", // Updated to use EVM testnet
  };

  const handlePaymentComplete = (agent, paymentData) => {
    console.log("✅ Demo payment completed:", {
      agent: agent.name,
      paymentData,
    });
    alert(
      `🎉 Payment completed successfully!\n\nAgent: ${agent.name}\nAmount: $${agent.interaction_fee} USD`
    );
    setShowCube(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          🎯 Payment System Demo
        </h1>
        <h2 className="text-2xl text-green-400 mb-2">
          Revolutionary AR Payment Interface
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl">
          Experience the future of payments with our interactive system. Select
          and pay with 6 different payment methods.
        </p>
      </div>

      {/* Demo Info Card */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-600/50 rounded-2xl p-6 mb-8 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          Demo Agent
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Name:</span>
            <span className="text-white font-semibold">{mockAgent.name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300">Interaction Fee:</span>
            <span className="text-green-400 font-bold">
              ${mockAgent.interaction_fee} USD
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300">Network:</span>
            <span className="text-blue-400 font-semibold">
              {mockAgent.network}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300">Currency:</span>
            <span className="text-yellow-400 font-semibold">
              {mockAgent.currency_type}
            </span>
          </div>
        </div>
      </div>

      {/* Launch Button */}
      <button
        onClick={() => setShowCube(true)}
        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-green-400/30"
      >
        🚀 Launch Payment System
      </button>

      {/* Features List */}
      <div className="mt-12 max-w-4xl w-full">
        <h3 className="text-2xl font-bold text-white text-center mb-6">
          ✨ Revolutionary Features
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "🎮",
              title: "3D Interactive Cube",
              description: "Revolutionary floating 3D payment interface",
            },
            {
              icon: "📱",
              title: "Crypto QR Payments",
              description: "Instant blockchain payments with QR scanning",
            },
            {
              icon: "💳",
              title: "Virtual Card Support",
              description: "Apple Pay, Google Pay integration (coming soon)",
            },
            {
              icon: "🏦",
              title: "Bank QR System",
              description: "Traditional banking with modern interface",
            },
            {
              icon: "🔊",
              title: "Voice Payment",
              description: "Pay with voice commands (coming soon)",
            },
            {
              icon: "🚀",
              title: "Crypto Onboarding",
              description: "Help new users get started",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl p-4 text-center hover:bg-slate-700/40 transition-all duration-300"
            >
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
              <p className="text-slate-300 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 max-w-2xl w-full">
        <h4 className="text-blue-400 font-bold mb-2">🎯 How to Use:</h4>
        <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
          <li>Click "Launch Payment System" to open the 3D cube interface</li>
          <li>Drag the floating cube to rotate and explore payment methods</li>
          <li>Click on the cube when your preferred method faces you</li>
          <li>For Crypto QR: scan the generated QR code with your wallet</li>
          <li>Other methods will show "Coming Soon" notifications</li>
          <li>Complete the payment flow as directed</li>
        </ol>
      </div>

      {/* Navigation */}
      <div className="mt-8 space-x-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg transition-colors"
        >
          ← Back to Home
        </button>
        <button
          onClick={() => (window.location.href = "/ar-view")}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Full AR Experience →
        </button>
      </div>

      {/* Revolutionary 3D Cube Payment Engine */}
      <CubePaymentEngine
        agent={mockAgent}
        isOpen={showCube}
        onClose={() => setShowCube(false)}
        onPaymentComplete={handlePaymentComplete}
        paymentAmount={mockAgent.interaction_fee}
      />

      {/* Cube Payment Handler - Minimal test version */}
      <CubePaymentHandler
        agentData={[mockAgent]}
        selectedAgent={mockAgent.id}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default CubePaymentDemo;
