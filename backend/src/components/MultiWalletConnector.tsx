import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Power,
  Zap,
} from "lucide-react";
import { NetworkConfig } from "../config/multiChainNetworks";
import {
  multiChainWalletService,
  WalletConnection,
  WalletProvider,
} from "../services/multiChainWalletService";

interface MultiWalletConnectorProps {
  selectedNetworks: NetworkConfig[];
  onWalletConnect: (network: NetworkConfig, wallet: WalletConnection) => void;
  onWalletDisconnect: (network: NetworkConfig, walletType: string) => void;
  className?: string;
}

const MultiWalletConnector: React.FC<MultiWalletConnectorProps> = ({
  selectedNetworks,
  onWalletConnect,
  onWalletDisconnect,
  className = "",
}) => {
  const [connectedWallets, setConnectedWallets] = useState<
    Map<string, WalletConnection>
  >(new Map());
  const [connecting, setConnecting] = useState<string>("");
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState<string>("");

  useEffect(() => {
    updateWalletConnections();
    const interval = setInterval(updateWalletConnections, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [selectedNetworks]);

  const updateWalletConnections = () => {
    const wallets = multiChainWalletService.getAllConnectedWallets();
    setConnectedWallets(wallets);
  };

  const handleWalletConnect = async (
    network: NetworkConfig,
    walletType: string
  ) => {
    const connectionKey = `${network.type}_${walletType}`;
    setConnecting(connectionKey);

    try {
      const address = await multiChainWalletService.connectWallet(
        network.type,
        walletType
      );
      const wallet = multiChainWalletService.getWalletForNetwork(network.type);

      if (wallet) {
        onWalletConnect(network, wallet);
        await refreshBalance(network, wallet);
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setConnecting("");
      updateWalletConnections();
    }
  };

  const handleWalletDisconnect = async (
    network: NetworkConfig,
    walletType: string
  ) => {
    try {
      await multiChainWalletService.disconnectWallet(network.type, walletType);
      onWalletDisconnect(network, walletType);

      // Remove balance
      const balanceKey = `${network.type}_${walletType}`;
      setBalances((prev) => {
        const newBalances = { ...prev };
        delete newBalances[balanceKey];
        return newBalances;
      });
    } catch (error) {
      console.error("Wallet disconnection failed:", error);
    } finally {
      updateWalletConnections();
    }
  };

  const refreshBalance = async (
    network: NetworkConfig,
    wallet: WalletConnection
  ) => {
    const balanceKey = `${network.type}_${wallet.walletType}`;
    setLoadingBalances(balanceKey);

    try {
      // This would implement actual balance fetching
      // For now, show placeholder
      setBalances((prev) => ({
        ...prev,
        [balanceKey]: "0.0000",
      }));
    } catch (error) {
      console.error("Balance refresh failed:", error);
    } finally {
      setLoadingBalances("");
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const getWalletIcon = (walletType: string): string => {
    switch (walletType) {
      case "metamask":
        return "🦊";
      case "coinbase":
        return "🔵";
      case "walletconnect":
        return "🔗";
      case "phantom":
        return "👻";
      case "solflare":
        return "☀️";
      case "hashpack":
        return "📦";
      case "argentx":
        return "🛡️";
      case "braavos":
        return "⚔️";
      default:
        return "💼";
    }
  };

  const getNetworkIcon = (network: NetworkConfig): string => {
    switch (network.icon) {
      case "ethereum":
        return "⟠";
      case "arbitrum":
        return "🅰️";
      case "base":
        return "🔵";
      case "optimism":
        return "🔴";
      case "avalanche":
        return "🔺";
      case "solana":
        return "🌟";
      case "hedera":
        return "🌿";
      default:
        return "🌐";
    }
  };

  const getSupportedWallets = (networkType: string): string[] => {
    const walletSupport: Record<string, string[]> = {
      evm: ["metamask", "coinbase"],
      solana: ["phantom"],
      hedera: ["metamask"], // Hedera through MetaMask
      starknet: ["argentx", "braavos"],
    };
    return walletSupport[networkType] || [];
  };

  if (selectedNetworks.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Select a network to connect your wallet</p>
      </div>
    );
  }

  return (
    <div className={`multi-wallet-connector ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Wallets
        </h3>
        <p className="text-sm text-gray-600">
          Connect your wallets for the selected networks to enable agent
          deployment.
        </p>
      </div>

      <div className="space-y-6">
        {selectedNetworks.map((network) => (
          <NetworkWalletSection
            key={network.chainId}
            network={network}
            connectedWallets={connectedWallets}
            connecting={connecting}
            balances={balances}
            loadingBalances={loadingBalances}
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
            onRefreshBalance={refreshBalance}
            onCopyAddress={copyAddress}
            supportedWallets={getSupportedWallets(network.type)}
            getWalletIcon={getWalletIcon}
            getNetworkIcon={getNetworkIcon}
          />
        ))}
      </div>
    </div>
  );
};

interface NetworkWalletSectionProps {
  network: NetworkConfig;
  connectedWallets: Map<string, WalletConnection>;
  connecting: string;
  balances: Record<string, string>;
  loadingBalances: string;
  onConnect: (network: NetworkConfig, walletType: string) => void;
  onDisconnect: (network: NetworkConfig, walletType: string) => void;
  onRefreshBalance: (network: NetworkConfig, wallet: WalletConnection) => void;
  onCopyAddress: (address: string) => void;
  supportedWallets: string[];
  getWalletIcon: (walletType: string) => string;
  getNetworkIcon: (network: NetworkConfig) => string;
}

const NetworkWalletSection: React.FC<NetworkWalletSectionProps> = ({
  network,
  connectedWallets,
  connecting,
  balances,
  loadingBalances,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  onCopyAddress,
  supportedWallets,
  getWalletIcon,
  getNetworkIcon,
}) => {
  const getConnectedWallet = (): WalletConnection | null => {
    for (const [key, wallet] of connectedWallets) {
      if (key.startsWith(network.type)) {
        return wallet;
      }
    }
    return null;
  };

  const connectedWallet = getConnectedWallet();
  const isAnyWalletConnected = connectedWallet !== null;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Network Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-xl">{getNetworkIcon(network)}</div>
          <div>
            <h4 className="font-medium text-gray-900">{network.name}</h4>
            <p className="text-sm text-gray-600">
              {network.type.toUpperCase()}
            </p>
          </div>
        </div>

        {isAnyWalletConnected && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Connected
            </span>
          </div>
        )}
      </div>

      {/* Connected Wallet Display */}
      {connectedWallet && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-lg">
                {getWalletIcon(connectedWallet.walletType)}
              </div>
              <div>
                <p className="font-medium text-green-800 capitalize">
                  {connectedWallet.walletType} Wallet
                </p>
                <p className="text-sm text-green-600 font-mono">
                  {connectedWallet.address.slice(0, 8)}...
                  {connectedWallet.address.slice(-6)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onCopyAddress(connectedWallet.address)}
                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </button>

              <button
                onClick={() => onRefreshBalance(network, connectedWallet)}
                disabled={
                  loadingBalances ===
                  `${network.type}_${connectedWallet.walletType}`
                }
                className="p-1 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                title="Refresh balance"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loadingBalances ===
                    `${network.type}_${connectedWallet.walletType}`
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>

              <button
                onClick={() =>
                  onDisconnect(network, connectedWallet.walletType)
                }
                className="p-1 text-green-600 hover:text-red-600 transition-colors"
                title="Disconnect"
              >
                <Power className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Balance Display */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700">Balance:</span>
              <span className="font-mono text-green-800">
                {balances[`${network.type}_${connectedWallet.walletType}`] ||
                  "0.0000"}{" "}
                {network.symbol}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wallet Connection Options */}
      {!isAnyWalletConnected && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Choose a wallet to connect:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {supportedWallets.map((walletType) => {
              const connectionKey = `${network.type}_${walletType}`;
              const isConnecting = connecting === connectionKey;

              return (
                <motion.button
                  key={walletType}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onConnect(network, walletType)}
                  disabled={isConnecting}
                  className="flex items-center justify-center space-x-3 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-lg">{getWalletIcon(walletType)}</div>
                  <span className="font-medium capitalize">
                    {isConnecting ? "Connecting..." : walletType}
                  </span>
                  {isConnecting && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Network Information */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">Chain ID:</span> {network.chainId}
          </div>
          <div>
            <span className="font-medium">Type:</span>{" "}
            {network.type.toUpperCase()}
          </div>
        </div>

        {network.blockExplorer && (
          <div className="mt-2">
            <a
              href={network.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Block Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiWalletConnector;
