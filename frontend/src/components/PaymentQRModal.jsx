import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  Wallet,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import QRCode from "react-qr-code";
import { USBDGToken, ContractAddresses } from "../config/blockdag-chain";

// Helper functions for wallet address display
const getAgentWalletAddress = (agent) => {
  console.log("🔍 PaymentQRModal: Wallet info for agent:", {
    name: agent?.name,
    agent_wallet_address: agent?.agent_wallet_address,
    owner_wallet: agent?.owner_wallet,
    deployer_wallet_address: agent?.deployer_wallet_address,
    user_id: agent?.user_id,
  });

  // Priority order for agent wallet address:
  // 1. agent_wallet_address (primary field for agent's wallet)
  // 2. owner_wallet (backup field)
  // 3. deployer_wallet_address (fallback)
  // 4. user_id (legacy fallback - might be wallet address)

  let walletAddress = null;
  let source = "fallback";

  if (agent?.agent_wallet_address) {
    walletAddress = agent.agent_wallet_address;
    source = "agent_wallet_address";
  } else if (agent?.owner_wallet) {
    walletAddress = agent.owner_wallet;
    source = "owner_wallet";
  } else if (agent?.deployer_wallet_address) {
    walletAddress = agent.deployer_wallet_address;
    source = "deployer_wallet_address";
  } else if (agent?.user_id && agent.user_id.startsWith("0x")) {
    // Some legacy agents might have wallet address in user_id
    walletAddress = agent.user_id;
    source = "user_id (legacy)";
  }

  console.log("🔍 PaymentQRModal: Agent wallet resolved:", {
    walletAddress,
    source,
    agent: agent?.name,
    note: "Currently same as deployer's wallet - will change when agents get individual wallets",
  });

  return walletAddress || "No wallet configured";
};

const formatWalletAddress = (address) => {
  if (!address || address === "No wallet configured") {
    return address;
  }

  // Format as shortened address: 0x1234...5678
  if (address.length > 10) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return address;
};

const PaymentQRModal = ({
  agent,
  isOpen,
  onClose,
  onPaymentComplete,
  onQRScan,
}) => {
  const [paymentData, setPaymentData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, completed, expired

  // Generate payment QR code data
  useEffect(() => {
    if (isOpen && agent) {
      const payment = generatePaymentData(agent);
      setPaymentData(payment);
      setTimeLeft(300);
      setPaymentStatus("pending");
    }
  }, [isOpen, agent]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Generate EIP-681 compliant payment data
  const generatePaymentData = (agent) => {
    const amount = "10"; // 10 USBDG+
    const contractAddress = ContractAddresses.USBDG; // Use correct USBDG+ contract address
    const chainId = "1043"; // BlockDAG Primordial Testnet

    // EIP-681 format for MetaMask compatibility
    const eip681Uri = `ethereum:${contractAddress}@${chainId}/transfer?address=${
      agent.wallet_address || contractAddress
    }&uint256=${amount}`;

    return {
      uri: eip681Uri,
      amount,
      token: "USBDG+",
      recipient: agent.wallet_address || contractAddress,
      chainId,
      network: "BlockDAG Primordial Testnet",
      agentName: agent.name,
      description: `Payment for ${agent.name} interaction`,
      contractAddress,
    };
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Simulate payment completion (in real app, this would be detected via blockchain)
  const simulatePayment = () => {
    setPaymentStatus("completed");
    setTimeout(() => {
      if (onPaymentComplete) {
        onPaymentComplete(agent, paymentData);
      }
      onClose();
    }, 2000);
  };

  if (!isOpen || !agent || !paymentData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-purple-500/30 text-white">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white">
                Payment QR Code
              </CardTitle>
              <CardDescription className="text-purple-100">
                Pay {paymentData.amount} {paymentData.token} to {agent.name}
              </CardDescription>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {paymentStatus === "pending" && (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode
                    value={paymentData.uri}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Timer */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-mono text-lg">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">QR code expires in</p>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white font-semibold">
                    {paymentData.amount} {paymentData.token}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Network:</span>
                  <span className="text-purple-400">{paymentData.network}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Receiving Wallet:</span>
                  <span
                    className="text-blue-400 font-mono text-sm"
                    title={getAgentWalletAddress(agent)}
                  >
                    {formatWalletAddress(getAgentWalletAddress(agent))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Agent:</span>
                  <span className="text-white">{agent.name}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">How to Pay:</h4>
                <ol className="text-blue-100 text-sm space-y-1">
                  <li>1. Open MetaMask or compatible wallet</li>
                  <li>2. Scan this QR code with your wallet</li>
                  <li>3. Confirm the transaction</li>
                  <li>4. Wait for confirmation</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => copyToClipboard(paymentData.uri)}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Payment URI
                    </>
                  )}
                </Button>

                <Button
                  onClick={() =>
                    window.open(
                      `https://explorer-testnet.blockdag.org`,
                      "_blank"
                    )
                  }
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>

                {/* Scan QR to Pay Button */}
                {onQRScan && (
                  <Button
                    onClick={() => onQRScan(agent, paymentData)}
                    variant="outline"
                    className="w-full border-green-600 text-green-400 hover:bg-green-500/20 hover:border-green-500"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan QR to Pay
                  </Button>
                )}

                {/* Demo Payment Button */}
                <Button
                  onClick={simulatePayment}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Simulate Payment (Demo)
                </Button>
              </div>
            </>
          )}

          {paymentStatus === "completed" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Payment Successful!
                </h3>
                <p className="text-green-400">
                  {paymentData.amount} {paymentData.token} sent to {agent.name}
                </p>
              </div>
              <Badge className="bg-green-500 text-white">
                Transaction Confirmed
              </Badge>
            </div>
          )}

          {paymentStatus === "expired" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  QR Code Expired
                </h3>
                <p className="text-red-400">
                  This payment QR code has expired for security reasons.
                </p>
              </div>
              <Button
                onClick={() => {
                  const newPayment = generatePaymentData(agent);
                  setPaymentData(newPayment);
                  setTimeLeft(300);
                  setPaymentStatus("pending");
                }}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentQRModal;
