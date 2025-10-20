// React Component for Hedera QR Code Display
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  HederaQRCodeGenerator,
  HederaPaymentData,
} from "./HederaQRCodeGenerator";
import { hederaWalletService } from "../../services/hederaWalletService";

interface HederaQRDisplayProps {
  agent: any;
  interactionType: "chat" | "voice" | "video";
  onPaymentComplete?: (transactionId: string) => void;
  onClose?: () => void;
  userWalletAddress?: string;
}

export const HederaQRDisplay: React.FC<HederaQRDisplayProps> = ({
  agent,
  interactionType,
  onPaymentComplete,
  onClose,
  userWalletAddress,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [paymentData, setPaymentData] = useState<HederaPaymentData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "scanning" | "processing" | "complete" | "expired"
  >("pending");

  // Generate QR code on component mount
  useEffect(() => {
    generateHederaQR();
  }, [agent, interactionType, userWalletAddress]);

  // Payment timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setPaymentStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const generateHederaQR = async () => {
    try {
      setLoading(true);
      setError("");

      // Create payment data
      const paymentData = await HederaQRCodeGenerator.createAgentPaymentData(
        agent,
        userWalletAddress,
        interactionType
      );
      setPaymentData(paymentData);

      // Generate QR code
      const qrGenerator = new HederaQRCodeGenerator(null);
      const qrUrl = await qrGenerator.generateStyledHBARQR(paymentData, {
        size: 300,
        color: "#7c3aed",
      });

      setQrCodeUrl(qrUrl);
      console.log("✅ Generated Hedera QR code for agent payment");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("❌ Failed to generate Hedera QR:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handlePaymentDetected = () => {
    setPaymentStatus("processing");

    // Simulate payment processing (in real app, this would be blockchain monitoring)
    setTimeout(() => {
      setPaymentStatus("complete");
      onPaymentComplete?.(
        paymentData?.transactionId || "hedera_payment_success"
      );
    }, 3000);
  };

  const getInteractionFeeDisplay = () => {
    const fees = { chat: "1", voice: "2", video: "3" };
    return fees[interactionType];
  };

  const getInteractionIcon = () => {
    switch (interactionType) {
      case "chat":
        return "💬";
      case "voice":
        return "🎤";
      case "video":
        return "📹";
      default:
        return "💬";
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
      >
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Payment Generation Failed
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={generateHederaQR}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  if (paymentStatus === "expired") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center"
      >
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-orange-800 mb-2">
          Payment Expired
        </h3>
        <p className="text-orange-600 mb-4">
          The payment session has expired. Please try again.
        </p>
        <button
          onClick={generateHederaQR}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Generate New QR
        </button>
      </motion.div>
    );
  }

  if (paymentStatus === "complete") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
      >
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Payment Complete!
        </h3>
        <p className="text-green-600 mb-4">
          Successfully paid {getInteractionFeeDisplay()} HBAR for{" "}
          {interactionType} interaction with {agent.name || agent.agent_name}
        </p>
        <button
          onClick={onClose}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Continue to Chat
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-magenta-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{getInteractionIcon()}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Pay with HBAR
          </h3>
          <p className="text-gray-600 text-sm">
            Scan QR with MetaMask to pay for {interactionType} interaction
          </p>
        </div>

        {/* Agent Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 text-sm font-medium">Agent:</span>
            <span className="text-gray-900 font-semibold">
              {agent.name || agent.agent_name}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 text-sm font-medium">Service:</span>
            <span className="text-gray-900 capitalize">
              {interactionType} Chat
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm font-medium">Amount:</span>
            <span className="text-purple-600 font-bold">
              {getInteractionFeeDisplay()} HBAR
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center mb-6">
          {loading ? (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="relative">
              <img
                src={qrCodeUrl}
                alt="Hedera Payment QR Code"
                className="w-64 h-64 mx-auto rounded-lg border-2 border-purple-200"
              />
              {paymentStatus === "processing" && (
                <div className="absolute inset-0 bg-purple-500/80 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p className="font-medium">Processing Payment...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Network Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700 font-medium">Network:</span>
            <span className="text-purple-900">Hedera Testnet (296)</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-purple-700 font-medium">Currency:</span>
            <span className="text-purple-900">HBAR</span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center mb-4">
          <div
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              timeRemaining < 60
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            ⏱️ Expires in {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handlePaymentDetected}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            disabled={paymentStatus === "processing"}
          >
            {paymentStatus === "processing" ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                I've Paid with MetaMask
              </>
            )}
          </button>

          {paymentData && (
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(paymentData.to)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Address
                  </>
                )}
              </button>

              <a
                href={`https://hashscan.io/testnet/account/${paymentData.to}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                HashScan
              </a>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-xs">
            💡 <strong>Instructions:</strong> Open MetaMask mobile app, tap scan
            QR, and confirm the {getInteractionFeeDisplay()} HBAR payment to{" "}
            {agent.name || agent.agent_name}.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HederaQRDisplay;
