import React, { useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
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
} from "lucide-react";

// Import Solana wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";
import solanaPaymentService from "../services/solanaPaymentService";

// Network Configuration
const NETWORK_CONFIG = {
  testnet: {
    network: WalletAdapterNetwork.Testnet,
    rpc: "https://api.testnet.solana.com",
    name: "Solana Testnet",
    currency: "SOL",
    color: "blue",
    explorerCluster: "testnet",
  },
  devnet: {
    network: WalletAdapterNetwork.Devnet,
    rpc: "https://api.devnet.solana.com",
    name: "Solana Devnet",
    currency: "USDC",
    color: "purple",
    explorerCluster: "devnet",
  },
};

// Wallet Component that uses the Solana wallet context
const SolanaWalletContent = ({ onConnectionChange, network = "testnet" }) => {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const [balance, setBalance] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const networkConfig = NETWORK_CONFIG[network];

  // Create connection to the specified network
  const connection = useMemo(
    () => new Connection(networkConfig.rpc),
    [networkConfig.rpc]
  );

  // Fetch wallet balance (SOL for testnet, SOL + USDC for devnet)
  const fetchBalance = async () => {
    if (!publicKey || !connected) return;

    setLoading(true);
    try {
      // Always fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      setBalance(solBalance / 1e9);

      // For devnet, also fetch USDC balance
      if (network === "devnet") {
        try {
          const { getAccount, getAssociatedTokenAddress } = await import(
            "@solana/spl-token"
          );
          const usdcMint = new PublicKey(
            "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
          );
          const usdcTokenAccount = await getAssociatedTokenAddress(
            usdcMint,
            publicKey
          );

          const usdcAccountInfo = await getAccount(
            connection,
            usdcTokenAccount
          );
          setUsdcBalance(Number(usdcAccountInfo.amount) / 1e6); // USDC has 6 decimals
        } catch (usdcError) {
          console.log(
            "No USDC token account found or error fetching USDC balance"
          );
          setUsdcBalance(0);
        }
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
      setUsdcBalance(null);
    } finally {
      setLoading(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!publicKey) return;

    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Handle wallet connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange({
        isConnected: connected,
        address: publicKey?.toBase58(), // 🔧 CRITICAL: Use 'address' key for consistency with App.jsx
        publicKey: publicKey?.toBase58(), // Keep for backward compatibility
        wallet: wallet?.adapter?.name,
        network: networkConfig.name,
        networkType: network,
        balance,
        usdcBalance,
      });
    }
  }, [
    connected,
    publicKey,
    wallet,
    balance,
    usdcBalance,
    onConnectionChange,
    network,
    networkConfig.name,
  ]);

  // Fetch balance when wallet connects and switch network
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      // Switch the payment service to the correct network
      solanaPaymentService.switchSolanaNetwork(network.toUpperCase());
    } else {
      setBalance(null);
      setUsdcBalance(null);
    }
  }, [connected, publicKey, network]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setBalance(null);
      setUsdcBalance(null);
      console.log(`🔌 Solana ${networkConfig.name} wallet disconnected`);
    } catch (error) {
      console.error("❌ Disconnect error:", error);
    }
  };

  if (connected && publicKey) {
    const cardClass =
      network === "testnet"
        ? "w-full bg-gradient-to-br from-blue-900/80 to-slate-900/80 border-blue-500/30 text-white"
        : "w-full bg-gradient-to-br from-purple-900/80 to-slate-900/80 border-purple-500/30 text-white";

    const badgeClass =
      network === "testnet"
        ? "border-blue-400 text-blue-400"
        : "border-purple-400 text-purple-400";

    const containerClass =
      network === "testnet"
        ? "bg-blue-800/30 rounded-lg p-4 space-y-3"
        : "bg-purple-800/30 rounded-lg p-4 space-y-3";

    const textClass =
      network === "testnet"
        ? "text-blue-200 text-sm"
        : "text-purple-200 text-sm";

    const iconClass =
      network === "testnet"
        ? "w-5 h-5 text-blue-300"
        : "w-5 h-5 text-purple-300";

    const buttonClass =
      network === "testnet"
        ? "text-blue-300 hover:bg-blue-700/50"
        : "text-purple-300 hover:bg-purple-700/50";

    const buttonOutlineClass =
      network === "testnet"
        ? "flex-1 border-blue-400 text-blue-300 hover:bg-blue-700/50"
        : "flex-1 border-purple-400 text-purple-300 hover:bg-purple-700/50";

    const linkClass =
      network === "testnet"
        ? "text-blue-300 hover:text-blue-200"
        : "text-purple-300 hover:text-purple-200";

    const networkColorClass =
      network === "testnet" ? "text-blue-400" : "text-purple-400";

    return (
      <Card className={cardClass}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <CardTitle className="text-lg">
                {networkConfig.name} Connected
              </CardTitle>
            </div>
            <Badge variant="outline" className={badgeClass}>
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Wallet Info */}
          <div className={containerClass}>
            {/* Wallet Type */}
            <div className="flex items-center gap-2">
              <Wallet className={iconClass} />
              <span className={textClass}>
                {wallet?.adapter?.name || "Phantom Wallet"}
              </span>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <p className={textClass}>Wallet Address</p>
              <div className="flex items-center gap-2">
                <code className="text-white text-sm bg-black/30 px-2 py-1 rounded flex-1 break-all">
                  {publicKey.toBase58()}
                </code>
                <Button
                  onClick={copyAddress}
                  variant="ghost"
                  size="sm"
                  className={buttonClass}
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
            <div className="space-y-1">
              <p className={textClass}>Balance</p>
              <div className="space-y-2">
                {/* SOL Balance */}
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : balance !== null ? (
                      `${balance.toFixed(4)} SOL`
                    ) : (
                      "Unable to fetch SOL"
                    )}
                  </span>
                  <Button
                    onClick={fetchBalance}
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    className={buttonClass}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>

                {/* USDC Balance for Devnet */}
                {network === "devnet" && (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : usdcBalance !== null ? (
                        `${usdcBalance.toFixed(2)} USDC`
                      ) : (
                        "0.00 USDC"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Network */}
            <div className="space-y-1">
              <p className={textClass}>Network</p>
              <div className="flex items-center gap-2">
                <span className={networkColorClass}>{networkConfig.name}</span>
                <a
                  href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=${
                    networkConfig.explorerCluster
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={fetchBalance}
              variant="outline"
              disabled={loading}
              className={buttonOutlineClass}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Balance
            </Button>
            <Button
              onClick={handleDisconnect}
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

  const cardClass =
    network === "testnet"
      ? "w-full bg-gradient-to-br from-slate-900/80 to-blue-900/80 border-blue-500/30 text-white"
      : "w-full bg-gradient-to-br from-slate-900/80 to-purple-900/80 border-purple-500/30 text-white";

  const iconClass =
    network === "testnet" ? "w-5 h-5 text-blue-400" : "w-5 h-5 text-purple-400";

  const connectingIconClass =
    network === "testnet"
      ? "w-5 h-5 animate-spin text-blue-400"
      : "w-5 h-5 animate-spin text-purple-400";

  const connectingTextClass =
    network === "testnet" ? "text-blue-200" : "text-purple-200";

  const buttonClass =
    network === "testnet"
      ? "!bg-gradient-to-r !from-blue-500 !to-slate-500 hover:!from-blue-600 hover:!to-slate-600 !border-none !rounded-lg !px-6 !py-3 !text-white !font-medium !transition-all !duration-200"
      : "!bg-gradient-to-r !from-purple-500 !to-slate-500 hover:!from-purple-600 hover:!to-slate-600 !border-none !rounded-lg !px-6 !py-3 !text-white !font-medium !transition-all !duration-200";

  const instructionClass =
    network === "testnet"
      ? "bg-blue-900/20 border border-blue-500/30 rounded-lg p-3"
      : "bg-purple-900/20 border border-purple-500/30 rounded-lg p-3";

  const instructionTextClass =
    network === "testnet"
      ? "text-blue-200 text-sm font-medium"
      : "text-purple-200 text-sm font-medium";

  const instructionListClass =
    network === "testnet"
      ? "text-blue-300 text-sm space-y-1"
      : "text-purple-300 text-sm space-y-1";

  return (
    <Card className={cardClass}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className={iconClass} />
          <CardTitle className="text-lg">
            Connect to {networkConfig.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="bg-slate-800/50 rounded-lg p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            {connecting ? (
              <>
                <RefreshCw className={connectingIconClass} />
                <span className={connectingTextClass}>Connecting...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <span className="text-white text-sm">Wallet Not Connected</span>
              </>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            Connect your Phantom wallet to {networkConfig.name.toLowerCase()}{" "}
            for {networkConfig.currency} payments
          </p>
        </div>

        {/* Connect Button */}
        <div className="flex justify-center">
          <WalletMultiButton className={buttonClass} />
        </div>

        {/* Instructions */}
        <div className={instructionClass}>
          <div className="space-y-2">
            <p className={instructionTextClass}>
              🦄 Connect to {networkConfig.name}
            </p>
            <ul className={instructionListClass}>
              <li>• Install Phantom wallet extension</li>
              <li>• Switch to {networkConfig.name} network</li>
              {network === "devnet" && <li>• Get USDC tokens for payments</li>}
              {network === "testnet" && (
                <li>• Get testnet SOL from faucet if needed</li>
              )}
            </ul>
          </div>
        </div>

        {/* Network Info */}
        <div className="text-center space-y-1">
          <p className="text-slate-400 text-xs">
            Network: {networkConfig.name}
          </p>
          <p className="text-slate-500 text-xs">RPC: {networkConfig.rpc}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Solana Wallet Provider Component
const SolanaWalletConnect = ({ onConnectionChange, network = "testnet" }) => {
  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // Add more wallets here if needed
    ],
    []
  );

  const networkConfig = NETWORK_CONFIG[network];

  return (
    <ConnectionProvider endpoint={networkConfig.rpc}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaWalletContent
            onConnectionChange={onConnectionChange}
            network={network}
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletConnect;
