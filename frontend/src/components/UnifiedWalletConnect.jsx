import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Zap,
  Settings,
  Info,
  ExternalLink,
  Network,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import SolanaWalletConnect from "./SolanaWalletConnect";
import HederaWalletConnect from "./HederaWalletConnect";
import {
  SUPPORTED_EVM_NETWORKS,
  OTHER_NETWORKS,
  networkDetectionService,
} from "../services/networkDetectionService";

const UnifiedWalletConnect = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState("evm");
  const [connectionStates, setConnectionStates] = useState({});
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const modalRef = useRef(null);

  // Stable reference for callback data to prevent unnecessary re-renders
  const callbackDataRef = useRef({});

  // Network detection effect
  useEffect(() => {
    if (open) {
      detectCurrentNetwork();
      const cleanup = networkDetectionService.startNetworkListener(
        (networkInfo) => {
          setCurrentNetwork(networkInfo);
        }
      );

      return cleanup;
    }
  }, [open]);

  const detectCurrentNetwork = async () => {
    if (!window.ethereum) return;

    setIsDetecting(true);
    try {
      const networkInfo = await networkDetectionService.detectCurrentNetwork();
      setCurrentNetwork(networkInfo);
    } catch (error) {
      console.error("Failed to detect network:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleNetworkSwitch = async (chainId) => {
    setIsNetworkSwitching(true);
    try {
      await networkDetectionService.switchToNetwork(chainId);
      await detectCurrentNetwork();
    } catch (error) {
      console.error("Failed to switch network:", error);
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setWalletConnected(true);

        // Get balance
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        setBalance((parseInt(balance, 16) / 1e18).toFixed(4));

        await detectCurrentNetwork();

        // Notify parent component
        if (onOpenChange) {
          onOpenChange({
            evm: {
              isConnected: true,
              address: address,
              balance: (parseInt(balance, 16) / 1e18).toFixed(4),
              network: currentNetwork,
            },
            solana: connectionStates.solana, // Include Solana state
            hedera: connectionStates.hedera, // Include Hedera state
            hasAnyConnection: true,
          });
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setBalance("");
    setCurrentNetwork(null);

    // Notify parent component
    if (onOpenChange) {
      onOpenChange({
        evm: {
          isConnected: false,
          address: null,
          balance: null,
          network: null,
        },
        solana: connectionStates.solana, // Keep Solana state
        hedera: connectionStates.hedera, // Keep Hedera state
        hasAnyConnection: Object.values(connectionStates).some(
          (state) => state?.isConnected
        ),
      });
    }
  };

  const updateConnectionState = useCallback((network, state) => {
    console.log(`🔄 UnifiedWalletConnect: Updating ${network} state:`, state);

    setConnectionStates((prev) => {
      const newState = {
        ...prev,
        [network]: state,
      };

      return newState;
    });
  }, []);

  // Separate effect to handle parent notifications without dependency cycles
  useEffect(() => {
    if (onOpenChange) {
      const newCallbackData = {
        evm: {
          isConnected: walletConnected,
          address: walletAddress,
          balance: balance,
          network: currentNetwork,
        },
        solana: connectionStates.solana,
        hedera: connectionStates.hedera,
        hasAnyConnection:
          walletConnected ||
          Object.values(connectionStates).some((s) => s?.isConnected),
      };

      // Only call parent if data has actually changed
      const currentDataJson = JSON.stringify(callbackDataRef.current);
      const newDataJson = JSON.stringify(newCallbackData);

      if (currentDataJson !== newDataJson) {
        console.log(
          `📤 UnifiedWalletConnect: Sending to parent:`,
          newCallbackData
        );
        callbackDataRef.current = newCallbackData;
        onOpenChange(newCallbackData);
      }
    }
  }, [
    onOpenChange,
    walletConnected,
    walletAddress,
    balance,
    currentNetwork,
    connectionStates,
  ]);

  // Render EVM Networks Section
  const renderEVMNetworks = () => (
    <div className="space-y-4">
      {/* Current Network Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Current Network</span>
              {isDetecting && (
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              )}
            </div>
            {currentNetwork && (
              <Badge
                variant={currentNetwork.isSupported ? "default" : "destructive"}
                className="flex items-center space-x-1"
              >
                {currentNetwork.isSupported ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                <span>
                  {currentNetwork.name || `Chain ${currentNetwork.chainId}`}
                </span>
              </Badge>
            )}
          </div>
          {currentNetwork && !currentNetwork.isSupported && (
            <p className="text-sm text-orange-600 mt-2">
              Please switch to a supported network to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Wallet Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>MetaMask Wallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!walletConnected ? (
            <Button
              onClick={connectMetaMask}
              className="w-full"
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    Connected
                  </span>
                  <Button
                    onClick={disconnectWallet}
                    variant="outline"
                    size="sm"
                  >
                    Disconnect
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
                <p className="text-xs text-green-600">Balance: {balance} ETH</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Networks */}
      <Card>
        <CardHeader>
          <CardTitle>Supported EVM Networks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {Object.values(SUPPORTED_EVM_NETWORKS).map((network) => (
              <div
                key={network.chainId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Network className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{network.name}</p>
                    <p className="text-xs text-gray-500">
                      {network.currency} • Chain {network.chainId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentNetwork?.chainId === network.chainId ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleNetworkSwitch(network.chainId)}
                      variant="outline"
                      size="sm"
                      disabled={isNetworkSwitching || !walletConnected}
                    >
                      {isNetworkSwitching ? "Switching..." : "Switch"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Other Networks Section
  const renderOtherNetworks = () => {
    try {
      return (
        <div className="space-y-4">
          {/* Active Networks */}
          <Card>
            <CardHeader>
              <CardTitle>Active Networks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SolanaWalletConnect
                network="devnet"
                onConnectionChange={(state) => {
                  console.log("🟣 Solana connection change:", state);
                  updateConnectionState("solana", state);
                }}
              />
              <HederaWalletConnect
                onConnectionChange={(state) => {
                  console.log("🟢 Hedera connection change:", state);
                  updateConnectionState("hedera", state);
                }}
              />
            </CardContent>
          </Card>

          {/* Coming Soon Networks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Coming Soon</span>
                <Badge variant="secondary">In Development</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {OTHER_NETWORKS.comingSoon.map((network) => (
                  <div
                    key={network.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 opacity-60"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Network className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-600">
                          {network.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {network.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Soon
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } catch (error) {
      console.error("Error rendering Other Networks:", error);
      return (
        <div className="p-4 text-center text-red-500">
          <p>Error loading Other Networks</p>
          <p className="text-sm">Please refresh and try again</p>
        </div>
      );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Connection Status Summary */}
      {(walletConnected ||
        Object.values(connectionStates).some(
          (state) => state?.isConnected
        )) && (
        <Card className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">
                Multi-Chain Wallet Connected
              </span>
            </div>
            <div className="text-sm space-y-2">
              {walletConnected && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-blue-400 text-blue-400"
                  >
                    EVM Connected
                  </Badge>
                  <span className="text-blue-300 text-xs">
                    {currentNetwork?.name || "Unknown Network"}
                  </span>
                </div>
              )}
              {connectionStates.solana?.isConnected && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-purple-400 text-purple-400"
                  >
                    Solana Connected
                  </Badge>
                </div>
              )}
              {connectionStates.hedera?.isConnected && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-green-400 text-green-400"
                  >
                    Hedera Connected
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Wallet Interface */}
      <Card className="min-h-[500px]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3">
            <Wallet className="w-6 h-6" />
            <span>Multi-Chain Wallet Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="evm" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                EVM Networks
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Other Networks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evm" className="mt-4">
              {renderEVMNetworks()}
            </TabsContent>

            <TabsContent value="other" className="mt-4">
              {renderOtherNetworks()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedWalletConnect;
