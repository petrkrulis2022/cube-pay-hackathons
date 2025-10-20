import React, { useState } from "react";
import QRCode from "react-qr-code";

// Minimal Cube Payment Engine for testing
const MinimalCubePaymentEngine = ({
  agent,
  isOpen,
  onClose,
  onPaymentComplete,
  paymentAmount = 10.0,
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const paymentMethods = [
    { key: "crypto_qr", icon: "📱", text: "Crypto QR", color: "#00ff00" },
    { key: "virtual_card", icon: "💳", text: "Virtual Card", color: "#0080ff" },
    { key: "bank_qr", icon: "🏦", text: "Bank QR", color: "#004080" },
    { key: "voice_pay", icon: "🔊", text: "Voice Pay", color: "#8000ff" },
    { key: "sound_pay", icon: "🎵", text: "Sound Pay", color: "#ff8000" },
    {
      key: "onboard_crypto",
      icon: "🚀",
      text: "Get Started",
      color: "#ffff00",
    },
  ];

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    if (method.key === "crypto_qr") {
      setShowQR(true);
    } else {
      alert(`${method.text} - Coming Soon!`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-red-400"
      >
        ×
      </button>

      <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-center text-green-400 mb-2">
          💎 Pay With
        </h2>

        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-white">
            ${agent?.interaction_fee || paymentAmount} USD
          </div>
          <div className="text-slate-400">
            Agent: {agent?.name || "Demo Agent"}
          </div>
        </div>

        {!showQR ? (
          <>
            <h3 className="text-xl text-white text-center mb-6">
              Select Payment Method:
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.key}
                  onClick={() => handleMethodSelect(method)}
                  className="bg-slate-800 hover:bg-slate-700 rounded-xl p-6 text-center transition-all duration-200 hover:scale-105 border border-slate-600"
                  style={{
                    borderColor: method.color + "40",
                    boxShadow: `0 0 20px ${method.color}20`,
                  }}
                >
                  <div className="text-4xl mb-2">{method.icon}</div>
                  <div className="text-white font-semibold text-sm">
                    {method.text}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center">
            <h3 className="text-xl text-white mb-6">Scan QR Code to Pay</h3>

            <div className="bg-white p-4 rounded-xl inline-block mb-6">
              <QRCode
                value={`ethereum:0x742D35Cc6634C0532925a3b8d1C02e4e61b3F9b0?value=${paymentAmount}&token=USDT`}
                size={200}
              />
            </div>

            <div className="space-y-2 text-slate-300 text-sm">
              <div>Amount: ${paymentAmount} USD</div>
              <div>Network: Morph Testnet</div>
              <div>Token: USDT</div>
            </div>

            <button
              onClick={() => setShowQR(false)}
              className="mt-6 bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-2 rounded-lg"
            >
              ← Back to Methods
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalCubePaymentEngine;
