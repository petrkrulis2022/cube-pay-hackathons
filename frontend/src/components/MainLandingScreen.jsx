import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Wallet,
  Camera,
  MapPin,
  Users,
  Settings,
  Info,
  ChevronRight,
  CheckCircle,
  Zap,
  Satellite,
  Database,
} from "lucide-react";
import { useDatabase } from "../hooks/useDatabase";
import NewNeARAgentsMarketplace from "./NewNeARAgentsMarketplace";
import ARQRTestRunner from "./ARQRTestRunner";
import DatabaseStatusComponent from "./DatabaseStatusComponent";
import NetworkDisplay from "./NetworkDisplay";
import WalletAddressDisplay from "./WalletAddressDisplay";

const MainLandingScreen = ({ onEnterAgentWorld, onShowWallet }) => {
  const { getNearAgents, getCurrentLocation, isLoading, refreshConnection } =
    useDatabase();
  const [agents, setAgents] = useState([]);
  const [activeAgentCount, setActiveAgentCount] = useState(0);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [showDatabaseStatus, setShowDatabaseStatus] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Get current device location and fetch agents on component mount
  useEffect(() => {
    const fetchAgentsForCurrentLocation = async () => {
      try {
        console.log("📍 Getting device location and fetching agents...");
        const deviceLocation = await getCurrentLocation();
        setCurrentLocation(deviceLocation);

        console.log("🔍 Fetching agents for location:", deviceLocation);
        const agentsData = await getNearAgents(deviceLocation);

        if (agentsData && agentsData.length > 0) {
          setAgents(agentsData);
          setActiveAgentCount(agentsData.length);
          console.log(
            `✅ Found ${agentsData.length} agents near current location`
          );
        } else {
          console.log("⚠️ No agents found near current location");
          setAgents([]);
          setActiveAgentCount(0);
        }
      } catch (error) {
        console.error("❌ Error fetching agents for current location:", error);
        setAgents([]);
        setActiveAgentCount(0);
      }
    };

    fetchAgentsForCurrentLocation();
  }, [getNearAgents, getCurrentLocation]);

  // Update active agent count when agents data changes (keep legacy behavior)
  useEffect(() => {
    // Update active agent count when agents data changes
    if (agents && agents.length > 0) {
      setActiveAgentCount(agents.length);
    }
  }, [agents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Camera className="w-6 h-6 text-green-400" />
            <div>
              <h1 className="text-xl font-bold text-green-400">NeAR Viewer</h1>
              <p className="text-xs text-slate-400">
                Discover NeAR Agents in Your NeAR World
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
          </button>

          {/* Wallet Address Display (replaces NeAR Protocol badge) */}
          <WalletAddressDisplay />

          {/* Wallet Button */}
          <Button
            onClick={onShowWallet}
            className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-500/50 px-4 py-2"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Wallet
          </Button>

          {/* Network Status Display */}
          <NetworkDisplay />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* NeAR Viewer Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="p-3 bg-green-500/20 rounded-lg border border-green-400/30">
              <Camera className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-400">NeAR Viewer</h2>
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Intelligent NeAR Agent
              <br />
              <span className="text-green-400">Augmented Reality</span>
            </h1>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Chat, interact, and collaborate with NeAR-powered AI agents
              positioned at precise real-world locations using GEODNET RTK
              precision
            </p>
          </div>

          {/* Primary CTA Button */}
          <div className="space-y-4">
            <Button
              onClick={onEnterAgentWorld}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 py-4 text-lg rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/25"
            >
              <ChevronRight className="w-5 h-5 mr-2" />
              Enter Agent World
              <span className="text-xs ml-2 opacity-75">powered by NeAR</span>
            </Button>

            {/* 3D Cube Payment Demo Button */}
            <Button
              onClick={() => (window.location.href = "/cube-demo")}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 w-full"
            >
              🎯 3D Cube Payment Demo
              <span className="text-xs ml-2 opacity-75">
                revolutionary interface
              </span>
            </Button>

            {/* Camera Debug Test Button */}
            <Button
              onClick={() => (window.location.href = "/camera-test")}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/25 w-full"
            >
              📹 Camera Debug Test
              <span className="text-xs ml-2 opacity-75">
                troubleshoot camera
              </span>
            </Button>

            {/* Secondary Link */}
            <div>
              <button className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium group">
                View Agent Network Status
                <ChevronRight className="w-4 h-4 ml-1 inline-block group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Network Status Panel */}
      <div className="px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 text-center">
              NeAR Agent Network Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* RTK Precision Status */}
              <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Satellite className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      RTK Precision: Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">GEODNET Enhanced GPS</p>
                </div>
              </div>

              {/* NeAR Network Status */}
              <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      NeAR Network: Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">BlockDAG Testnet</p>
                </div>
              </div>

              {/* Active Agents Count */}
              <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      Active NeAR Agents: {isLoading ? "..." : activeAgentCount}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Available in network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <footer className="border-t border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-center space-x-8">
            <button className="flex flex-col items-center space-y-1 p-2 text-green-400 hover:text-green-300 transition-colors">
              <Camera className="w-5 h-5" />
              <span className="text-xs font-medium">NeAR Viewer</span>
            </button>

            <button
              onClick={() => setShowMarketplace(true)}
              className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-white transition-colors group"
            >
              <Users className="w-5 h-5 group-hover:text-green-400 transition-colors" />
              <span className="text-xs font-medium">
                NeAR Agents Marketplace
              </span>
              <span className="text-xs text-green-400 opacity-75">
                {activeAgentCount}
              </span>
            </button>

            <button className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-white transition-colors">
              <MapPin className="w-5 h-5" />
              <span className="text-xs font-medium">NeAR Map</span>
            </button>

            <button
              onClick={() => setShowDatabaseStatus(true)}
              className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Database className="w-5 h-5" />
              <span className="text-xs font-medium">Database</span>
            </button>

            <button className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-white transition-colors">
              <Wallet className="w-5 h-5" />
              <span className="text-xs font-medium">NEAR Wallet</span>
            </button>

            <button className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Settings</span>
            </button>

            <button className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-white transition-colors">
              <Info className="w-5 h-5" />
              <span className="text-xs font-medium">About</span>
            </button>

            {/* Test Runner Button (Development Only) */}
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={() => setShowTestRunner(true)}
                className="flex flex-col items-center space-y-1 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Zap className="w-5 h-5" />
                <span className="text-xs font-medium">QR Tests</span>
              </button>
            )}
          </nav>
        </div>
      </footer>

      {/* New NeAR Agents Marketplace Modal with correct data */}
      <NewNeARAgentsMarketplace
        isOpen={showMarketplace}
        onClose={() => setShowMarketplace(false)}
        userLocation={currentLocation}
      />

      {/* Database Status Modal */}
      <div
        className={`fixed inset-0 z-50 ${
          showDatabaseStatus ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-black/80"
          onClick={() => setShowDatabaseStatus(false)}
        />
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Database Connection</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDatabaseStatus(false)}
            >
              ✕
            </Button>
          </div>
          <DatabaseStatusComponent
            onRefresh={async () => {
              await refreshConnection();
              // Re-fetch agents after refresh
              try {
                if (currentLocation) {
                  const refreshedAgents = await getNearAgents(currentLocation);
                  setAgents(refreshedAgents || []);
                  setActiveAgentCount(refreshedAgents?.length || 0);
                }
              } catch (error) {
                console.error("Error refreshing agents:", error);
              }
            }}
          />
        </div>
      </div>

      {/* AR QR Test Runner Modal (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div
          className={`fixed inset-0 z-50 ${
            showTestRunner ? "block" : "hidden"
          }`}
        >
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setShowTestRunner(false)}
          />
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                AR QR Payment Test Runner
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestRunner(false)}
              >
                ✕
              </Button>
            </div>
            <ARQRTestRunner />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLandingScreen;
