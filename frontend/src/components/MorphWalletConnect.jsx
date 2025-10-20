import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  LogOut,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Network,
} from "lucide-react";
import {
  MorphHoleskyTestnet,
  MorphUSDTToken,
  switchToMorphHolesky,
  getMorphNetworkConfig,
} from "../config/morph-holesky-chain";

const MorphWalletConnect = ({ onConnectionChange }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [balance, setBalance] = useState(null);
  const [usdtBalance, setUsdtBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum;
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert("Please install MetaMask to connect your wallet");
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);

        // Switch to Morph Holesky network
        await switchToMorphHolesky();

        // Check network and fetch balances
        await checkNetwork();
        await fetchBalances();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setBalance(null);
    setUsdtBalance(null);
    setChainId(null);
  };

  // Check current network
  const checkNetwork = async () => {
    try {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      const chainIdDecimal = parseInt(currentChainId, 16);
      setChainId(chainIdDecimal);
      setIsCorrectNetwork(chainIdDecimal === MorphHoleskyTestnet.chainId);
    } catch (error) {
      console.error("Failed to check network:", error);
    }
  };

  // Fetch ETH and USDT balances
  const fetchBalances = async () => {
    if (!account || !isCorrectNetwork) return;

    try {
      setLoading(true);

      // Fetch ETH balance
      const ethBalance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [account, "latest"],
      });
      const ethBalanceInEth = parseInt(ethBalance, 16) / Math.pow(10, 18);
      setBalance(ethBalanceInEth);

      // Fetch USDT balance (simplified - in production you'd use a proper contract call)
      // For now, we'll set a placeholder as we'd need to implement contract calls
      setUsdtBalance(null); // Will be implemented with proper contract integration
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    } finally {
      setLoading(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!account) return;

    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        fetchBalances();
      }
    };

    const handleChainChanged = (chainId) => {
      const chainIdDecimal = parseInt(chainId, 16);
      setChainId(chainIdDecimal);
      setIsCorrectNetwork(chainIdDecimal === MorphHoleskyTestnet.chainId);
      if (chainIdDecimal === MorphHoleskyTestnet.chainId) {
        fetchBalances();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, isCorrectNetwork]);

  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await checkNetwork();
          await fetchBalances();
        }
      } catch (error) {
        console.error("Failed to check connection:", error);
      }
    };

    checkConnection();
  }, []);

  // Notify parent component of connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange({
        isConnected: isConnected && isCorrectNetwork,
        address: account,
        network: isCorrectNetwork ? "Morph Holesky" : null,
        chainId: chainId,
        balance: balance,
        usdtBalance: usdtBalance,
      });
    }
  }, [
    isConnected,
    isCorrectNetwork,
    account,
    chainId,
    balance,
    usdtBalance,
    onConnectionChange,
  ]);

  if (isConnected && account) {
    return (
      <Card className="w-full bg-gradient-to-br from-green-900/80 to-emerald-900/80 border-green-500/30 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <CardTitle className="text-lg">Morph Holesky Connected</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={`${
                isCorrectNetwork
                  ? "border-green-400 text-green-400"
                  : "border-orange-400 text-orange-400"
              }`}
            >
              {isCorrectNetwork ? "Correct Network" : "Wrong Network"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isCorrectNetwork && (
            <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <p className="text-orange-200 text-sm">
                  Please switch to Morph Holesky network
                </p>
              </div>
              <Button
                onClick={switchToMorphHolesky}
                size="sm"
                className="mt-2 bg-orange-600 hover:bg-orange-700"
              >
                Switch Network
              </Button>
            </div>
          )}

          {/* Wallet Info */}
          <div className="bg-green-800/30 rounded-lg p-4 space-y-3">
            {/* Address */}
            <div className="space-y-1">
              <p className="text-green-200 text-sm">Wallet Address</p>
              <div className="flex items-center gap-2">
                <code className="text-white text-sm bg-black/30 px-2 py-1 rounded flex-1 break-all">
                  {account}
                </code>
                <Button
                  onClick={copyAddress}
                  variant="ghost"
                  size="sm"
                  className="text-green-300 hover:bg-green-700/50"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-green-200 text-sm">ETH Balance</p>
                <span className="text-white font-mono text-sm">
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : balance !== null ? (
                    `${balance.toFixed(4)} ETH`
                  ) : (
                    "Unable to fetch"
                  )}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-green-200 text-sm">USDT Balance</p>
                <span className="text-white font-mono text-sm">
                  {usdtBalance !== null ? `${usdtBalance} USDT` : "Not fetched"}
                </span>
              </div>
            </div>

            {/* Network Info */}
            <div className="space-y-1">
              <p className="text-green-200 text-sm">Network</p>
              <div className="flex items-center gap-2">
                <span className="text-green-400">
                  {isCorrectNetwork ? "Morph Holesky" : `Chain ${chainId}`}
                </span>
                <a
                  href="https://explorer-holesky.morphl2.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-300 hover:text-green-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={fetchBalances}
              variant="outline"
              disabled={loading}
              className="flex-1 border-green-400 text-green-300 hover:bg-green-700/50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              onClick={disconnectWallet}
              variant="outline"
              className="border-red-400 text-red-300 hover:bg-red-700/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900/80 to-green-900/80 border-green-500/30 text-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-green-400" />
          <CardTitle className="text-lg">Connect Morph Holesky</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="bg-slate-800/50 rounded-lg p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-green-400" />
                <span className="text-green-200">Connecting...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <span className="text-white text-sm">Wallet Not Connected</span>
              </>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            Connect your MetaMask wallet to Morph Holesky testnet
          </p>
        </div>

        {/* Connect Button */}
        <div className="flex justify-center">
          <Button
            onClick={connectWallet}
            disabled={loading || !isMetaMaskInstalled()}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium px-6 py-3"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4 mr-2" />
            )}
            {loading ? "Connecting..." : "Connect MetaMask"}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <div className="space-y-2">
            <p className="text-green-200 text-sm font-medium">
              🦊 Connect with MetaMask
            </p>
            <ul className="text-green-300 text-sm space-y-1">
              <li>• Install MetaMask browser extension</li>
              <li>• Add Morph Holesky network (Chain ID: 2810)</li>
              <li>• Get testnet ETH for transaction fees</li>
              <li>• Acquire USDT tokens for payments</li>
            </ul>
          </div>
        </div>

        {/* Network Info */}
        <div className="text-center space-y-1">
          <p className="text-slate-400 text-xs">
            Network: Morph Holesky Testnet
          </p>
          <p className="text-slate-500 text-xs">
            RPC: rpc-quicknode-holesky.morphl2.io
          </p>
          <p className="text-slate-500 text-xs">Chain ID: 2810</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MorphWalletConnect;
