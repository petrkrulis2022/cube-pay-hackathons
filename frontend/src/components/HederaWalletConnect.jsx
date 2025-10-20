import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Globe,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { hederaWalletService } from "../services/hederaWalletService";

const HederaWalletConnect = ({ onConnectionChange }) => {
  const [connected, setConnected] = useState(false);
  const [hbarBalance, setHbarBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [networkId, setNetworkId] = useState(null);

  const fetchHBARBalance = useCallback(async () => {
    if (!connected || !accountId) return;

    try {
      setLoading(true);
      const balance = await hederaWalletService.getHBARBalance(accountId);
      setHbarBalance(balance);
    } catch (err) {
      console.error("Error fetching HBAR balance:", err);
      setError("Failed to fetch HBAR balance");
    } finally {
      setLoading(false);
    }
  }, [connected, accountId]);

  useEffect(() => {
    if (connected) {
      fetchHBARBalance();
      const interval = setInterval(fetchHBARBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, fetchHBARBalance]);

  const handleConnect = async () => {
    try {
      setError(null);
      setLoading(true);

      const connectedAccount = await hederaWalletService.connectHederaWallet();
      const isOnHederaTestnet =
        await hederaWalletService.isConnectedToHederaTestnet();

      if (connectedAccount && isOnHederaTestnet) {
        setConnected(true);
        setAccountId(connectedAccount);
        setNetworkId("296"); // Hedera Testnet

        if (onConnectionChange) {
          onConnectionChange({
            connected: true,
            accountId: connectedAccount,
            networkId: "296",
          });
        }

        await fetchHBARBalance();
      } else {
        setError("Failed to connect to Hedera Testnet");
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect to Hedera wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setConnected(false);
      setAccountId(null);
      setNetworkId(null);
      setHbarBalance(null);
      setError(null);

      if (onConnectionChange) {
        onConnectionChange({ connected: false });
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Hedera Network
        </h2>
        <p className="text-gray-600">Connect your Hedera wallet via MetaMask</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Connection Error
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!connected ? (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Hedera Wallet
          </h3>
          <p className="text-gray-600 mb-6">
            Connect your MetaMask wallet to interact with the Hedera Network
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">
                  Wallet Connected
                </h3>
                <p className="text-sm text-green-700">Account: {accountId}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-sm text-green-700 hover:text-green-800 underline"
            >
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  HBAR Balance
                </span>
                <button
                  onClick={fetchHBARBalance}
                  disabled={loading}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {hbarBalance !== null ? `${hbarBalance} HBAR` : "---"}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">
                  Network
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {networkId === "296"
                  ? "Hedera Testnet"
                  : `Network ${networkId}`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">
                Connected to Hedera Network
              </span>
              <a
                href={`https://hashscan.io/testnet/account/${accountId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800"
              >
                <span>View on HashScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HederaWalletConnect;
