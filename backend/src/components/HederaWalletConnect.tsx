import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Globe,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  hederaWalletService,
  HederaBalanceData,
} from "../services/hederaWalletService";
import { HEDERA_NETWORKS } from "../config/hederaNetworks";

export const HederaWalletConnect: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<HederaBalanceData>({
    hbar: 0,
    loading: false,
    error: null,
  });
  const [currentNetwork] = useState("TESTNET");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!connected || !walletAddress) {
      setBalances({ hbar: 0, loading: false, error: null });
      return;
    }

    setBalances((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { hbar } = await hederaWalletService.getBalances(walletAddress);

      setBalances({
        hbar,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      setBalances((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch balances",
      }));
    }
  }, [connected, walletAddress]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setNetworkError(null);

    try {
      const address = await hederaWalletService.connectWallet();
      if (address) {
        setWalletAddress(address);
        setConnected(true);
        console.log("🎉 Connected to Hedera Testnet:", address);
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setNetworkError(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setWalletAddress(null);
    setBalances({ hbar: 0, loading: false, error: null });
    setNetworkError(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalances();
    setIsRefreshing(false);
  };

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts && accounts.length > 0) {
        const isOnHederaTestnet =
          await hederaWalletService.isConnectedToHederaTestnet();

        if (isOnHederaTestnet) {
          setWalletAddress(accounts[0]);
          setConnected(true);
        } else {
          setNetworkError("Please switch to Hedera Testnet");
          setConnected(false);
        }
      } else {
        setConnected(false);
        setWalletAddress(null);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [checkConnection]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const formatBalance = (balance: number, decimals: number = 4): string => {
    return balance.toFixed(decimals);
  };

  const getExplorerUrl = () => {
    if (!walletAddress) return "";
    return hederaWalletService.getExplorerUrl(walletAddress);
  };

  const handleSwitchNetwork = async () => {
    try {
      await hederaWalletService.switchToHederaTestnet();
      setNetworkError(null);
      checkConnection();
    } catch (error: any) {
      setNetworkError(error.message || "Failed to switch network");
    }
  };

  if (!connected) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect Hedera Wallet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your MetaMask wallet to view HBAR balance on Hedera Testnet
          </p>

          {networkError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-yellow-800">{networkError}</p>
                {networkError.includes("switch") && (
                  <button
                    onClick={handleSwitchNetwork}
                    className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
                  >
                    Switch to Hedera Testnet
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md">
      {/* Wallet Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <Wallet className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              MetaMask Connected
            </h3>
            <p className="text-xs text-gray-500">
              {walletAddress?.slice(0, 8)}...
              {walletAddress?.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || balances.loading}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Refresh balances"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          {walletAddress && (
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-600"
              title="View on HashScan"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Network Indicator */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Globe className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700">Network</span>
        </div>
        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">
              {HEDERA_NETWORKS[currentNetwork].name}
            </span>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">
              HBAR Balance
            </span>
          </div>
          <div className="text-right">
            {balances.loading ? (
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {formatBalance(balances.hbar)} HBAR
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {balances.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{balances.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleDisconnect}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Disconnect
        </button>
        <button
          onClick={handleRefresh}
          disabled={balances.loading || isRefreshing}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {balances.loading || isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Network Information */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Chain ID:</span>
            <span>{HEDERA_NETWORKS[currentNetwork].chainId}</span>
          </div>
          <div className="flex justify-between">
            <span>RPC:</span>
            <span className="truncate ml-2">testnet.hashio.io/api</span>
          </div>
          <div className="flex justify-between">
            <span>Explorer:</span>
            <span>hashscan.io/testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HederaWalletConnect;
