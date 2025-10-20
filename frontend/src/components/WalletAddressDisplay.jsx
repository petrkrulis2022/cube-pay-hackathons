import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { networkDetectionService } from "../services/networkDetectionService";

const WalletAddressDisplay = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initializeWalletState();
    setupWalletListeners();
  }, []);

  const initializeWalletState = async () => {
    if (window.ethereum) {
      try {
        // Check if wallet is already connected
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);

          // Detect current network
          const network = await networkDetectionService.detectCurrentNetwork();
          setCurrentNetwork(network);
        }
      } catch (error) {
        console.error("Failed to initialize wallet state:", error);
      }
    }
  };

  const setupWalletListeners = () => {
    if (window.ethereum) {
      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setWalletAddress(null);
          setIsWalletConnected(false);
          setCurrentNetwork(null);
        } else {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
          detectNetwork();
        }
      });

      // Listen for network changes
      window.ethereum.on("chainChanged", () => {
        detectNetwork();
      });
    }
  };

  const detectNetwork = async () => {
    try {
      const network = await networkDetectionService.detectCurrentNetwork();
      setCurrentNetwork(network);
    } catch (error) {
      console.error("Failed to detect network:", error);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  const handleWalletConnect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to connect your wallet");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
        await detectNetwork();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // If wallet is connected, show network + wallet address
  if (isWalletConnected && walletAddress) {
    return (
      <div className="flex items-center space-x-3">
        {/* Network Indicator */}
        {currentNetwork && (
          <Badge
            className={`px-3 py-1 border ${
              currentNetwork.isSupported
                ? "bg-blue-500/20 text-blue-400 border-blue-400/30"
                : "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
            }`}
          >
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentNetwork.isSupported ? "bg-blue-400" : "bg-yellow-400"
                } animate-pulse`}
              ></div>
              <span className="text-sm font-medium">
                {currentNetwork.shortName || currentNetwork.name}
              </span>
            </div>
          </Badge>
        )}

        {/* Wallet Address Display */}
        <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/30 px-3 py-1 cursor-pointer hover:bg-gray-500/30 transition-colors">
          <div
            className="flex items-center space-x-2"
            onClick={copyToClipboard}
            title="Click to copy full address"
          >
            <Wallet className="w-3 h-3" />
            <span className="text-sm font-mono">
              {formatWalletAddress(walletAddress)}
            </span>
            {copied ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </div>
        </Badge>
      </div>
    );
  }

  // If wallet is not connected, show connection prompt
  return (
    <Badge
      className="bg-orange-500/20 text-orange-400 border-orange-400/30 px-3 py-1 cursor-pointer hover:bg-orange-500/30 transition-colors"
      onClick={handleWalletConnect}
    >
      <div className="flex items-center space-x-1">
        <AlertCircle className="w-3 h-3" />
        <span className="text-sm font-medium">Connect Wallet</span>
      </div>
    </Badge>
  );
};

export default WalletAddressDisplay;
