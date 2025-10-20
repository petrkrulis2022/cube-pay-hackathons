import React from "react";
import {
  ConnectWallet,
  useAddress,
  useConnectionStatus,
  useDisconnect,
  useUser,
  lightTheme,
  darkTheme,
} from "@thirdweb-dev/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  User,
  LogOut,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Mail,
  MessageCircle,
} from "lucide-react";

const ThirdWebWalletConnect = ({ onConnectionChange }) => {
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const disconnect = useDisconnect();
  const { user, isLoggedIn } = useUser();

  // Notify parent component of connection changes
  React.useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange({
        isConnected: !!address,
        address,
        connectionStatus,
        user,
        isLoggedIn,
      });
    }
  }, [address, connectionStatus, user, isLoggedIn]); // Removed onConnectionChange from dependencies

  const handleDisconnect = async () => {
    try {
      await disconnect();
      console.log("🔌 Wallet disconnected");
    } catch (error) {
      console.error("❌ Disconnect error:", error);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  if (address) {
    // Connected state - show wallet info and disconnect option
    return (
      <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Wallet Connected</span>
            <Badge
              variant="outline"
              className={`text-xs ${getConnectionStatusColor()} border-none text-white`}
            >
              {getConnectionStatusText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-3 p-3 bg-purple-500/20 rounded-lg">
              <User className="w-8 h-8 text-purple-300" />
              <div>
                <p className="text-white font-medium">
                  {user.email || user.phoneNumber || "Anonymous User"}
                </p>
                <p className="text-purple-200 text-sm">
                  {user.email && <Mail className="w-3 h-3 inline mr-1" />}
                  {user.phoneNumber && (
                    <Smartphone className="w-3 h-3 inline mr-1" />
                  )}
                  Social Login Active
                </p>
              </div>
            </div>
          )}

          {/* Wallet Address */}
          <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
            <Wallet className="w-6 h-6 text-purple-300" />
            <div>
              <p className="text-purple-200 text-sm">Wallet Address</p>
              <p className="text-white font-mono text-sm">
                {formatAddress(address)}
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
          </div>

          {/* Network Info */}
          <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Network</p>
              <p className="text-white text-sm">BlockDAG Testnet</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="flex-1 bg-red-500/20 border-red-500 text-red-300 hover:bg-red-500/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected state - show connection options
  return (
    <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
          <Badge
            variant="outline"
            className="text-xs bg-red-500/20 border-red-500 text-red-300"
          >
            {getConnectionStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
          <AlertCircle className="w-6 h-6 text-yellow-400" />
          <div>
            <p className="text-white text-sm">Wallet Not Connected</p>
            <p className="text-purple-200 text-xs">
              Connect your wallet to interact with agents and make payments
            </p>
          </div>
        </div>

        {/* Social Login Options */}
        <div className="space-y-3">
          <p className="text-purple-200 text-sm font-medium">Connect with:</p>

          {/* ThirdWeb Connect Button with Social Options */}
          <div className="space-y-2">
            <ConnectWallet
              theme={darkTheme({
                colors: {
                  primaryButtonBg: "#8b5cf6",
                  primaryButtonText: "#ffffff",
                  borderColor: "#8b5cf6",
                  separatorLine: "#374151",
                  modalBg: "#1f2937",
                  dropdownBg: "#374151",
                  tertiaryBg: "#4b5563",
                  secondaryText: "#d1d5db",
                  primaryText: "#ffffff",
                  accentText: "#8b5cf6",
                  connectedButtonBg: "#059669",
                  connectedButtonBgHover: "#047857",
                },
              })}
              modalTitle="Connect to NeAR Viewer"
              modalSize="wide"
              welcomeScreen={{
                title: "Welcome to NeAR Viewer",
                subtitle:
                  "Connect your wallet to interact with AR agents and access premium features",
                img: {
                  src: "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=NeAR+Viewer",
                  width: 300,
                  height: 200,
                },
              }}
              btnTitle="Connect Wallet"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                width: "100%",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            />
          </div>

          {/* Alternative: Custom Connect Wallet Button */}
          <div className="pt-2">
            <ConnectWallet
              theme={darkTheme({
                colors: {
                  primaryButtonBg: "#8b5cf6",
                  primaryButtonText: "#ffffff",
                  borderColor: "#8b5cf6",
                  separatorLine: "#374151",
                  modalBg: "#1f2937",
                  dropdownBg: "#374151",
                  tertiaryBg: "#4b5563",
                  secondaryText: "#d1d5db",
                  primaryText: "#ffffff",
                  accentText: "#8b5cf6",
                },
              })}
              btnTitle="Connect with MetaMask"
              modalTitle="Connect to NeAR Viewer"
              modalSize="wide"
              welcomeScreen={{
                title: "Welcome to NeAR Viewer",
                subtitle: "Connect your wallet to interact with AR agents",
                img: {
                  src: "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=NeAR+AR",
                  width: 300,
                  height: 200,
                },
              }}
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                width: "100%",
                cursor: "pointer",
                marginTop: "8px",
              }}
            />
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <p className="text-purple-200 text-xs">
            🔐 Secure wallet connection with social login options
            <br />
            💰 Make payments to agents using USDFC tokens
            <br />
            🎯 Access premium AR features and interactions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThirdWebWalletConnect;
