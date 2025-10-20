import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Wallet, Globe, RefreshCw, ExternalLink } from "lucide-react";
import { solanaWalletService } from "../services/solanaWalletService";
import { SOLANA_NETWORKS } from "../config/solanaNetworks";

interface BalanceData {
  sol: number;
  usdc: number;
  loading: boolean;
  error: string | null;
}

export const SolanaWalletConnect: React.FC = () => {
  const { connected, publicKey, wallet, disconnect } = useWallet();
  const [balances, setBalances] = useState<BalanceData>({
    sol: 0,
    usdc: 0,
    loading: false,
    error: null,
  });
  const [currentNetwork, setCurrentNetwork] = useState("DEVNET");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!connected || !publicKey) {
      setBalances({ sol: 0, usdc: 0, loading: false, error: null });
      return;
    }

    setBalances((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const walletAddress = publicKey.toString();
      const { sol, usdc } = await solanaWalletService.getBalances(
        walletAddress
      );

      setBalances({
        sol,
        usdc,
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
  }, [connected, publicKey]);

  const handleNetworkSwitch = (network: string) => {
    setCurrentNetwork(network);
    solanaWalletService.switchNetwork(network);
    if (connected) {
      fetchBalances();
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalances();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const formatBalance = (balance: number, decimals: number = 4): string => {
    return balance.toFixed(decimals);
  };

  const getWalletName = () => {
    if (!wallet) return "Unknown";
    return wallet.adapter.name;
  };

  const getExplorerUrl = () => {
    if (!publicKey) return "";
    return solanaWalletService.getExplorerUrl(publicKey.toString());
  };

  if (!connected) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect Solana Wallet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your wallet to view SOL and USDC balances
          </p>
          <WalletMultiButton className="!bg-purple-600 !hover:bg-purple-700 !border-purple-600 !text-white !font-medium !py-2 !px-4 !rounded-lg !text-sm" />
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
              {getWalletName()} Connected
            </h3>
            <p className="text-xs text-gray-500">
              {publicKey?.toString().slice(0, 8)}...
              {publicKey?.toString().slice(-8)}
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
          {publicKey && (
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-600"
              title="View on Solana Explorer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Network Selector */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Globe className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700">Network</span>
        </div>
        <select
          value={currentNetwork}
          onChange={(e) => handleNetworkSwitch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
        >
          {Object.entries(SOLANA_NETWORKS).map(([key, network]) => (
            <option key={key} value={key}>
              {network.name}
            </option>
          ))}
        </select>
      </div>

      {/* Balance Display */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">
              SOL Balance
            </span>
          </div>
          <div className="text-right">
            {balances.loading ? (
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {formatBalance(balances.sol)} SOL
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
              <span className="text-xs font-bold text-white">$</span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              USDC Balance
              {currentNetwork !== "DEVNET" && (
                <span className="text-xs text-gray-400 ml-1">
                  (Devnet only)
                </span>
              )}
            </span>
          </div>
          <div className="text-right">
            {balances.loading ? (
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {formatBalance(balances.usdc, 2)} USDC
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
          onClick={() => disconnect()}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Disconnect
        </button>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || balances.loading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
};
