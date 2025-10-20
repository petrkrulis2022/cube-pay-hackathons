import React, { useState } from "react";
// Force refresh after Polygon Amoy network fixes
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import ARViewer from "./components/ARViewer";
import AgentMarketplace from "./components/marketplace/AgentMarketplace";
import MainLandingScreen from "./components/MainLandingScreen";
import CameraActivationScreen from "./components/CameraActivationScreen";
import SimpleCubeTest from "./components/SimpleCubeTest";
import CameraTest from "./components/CameraTest";
import UnifiedWalletConnect from "./components/UnifiedWalletConnect";
import AgentFeeValidationDashboard from "./components/AgentFeeValidationDashboard";
import SimpleTest from "./components/SimpleTest"; // Add simple test component
import ThirdWebProviderWrapper from "./providers/ThirdWebProvider";
import NotificationProvider, {
  useNotifications,
  createGlobalNotificationFunctions,
} from "./components/NotificationProvider";
import databaseInspector from "./utils/databaseInspector";
import "./App.css";

// Make database inspector available globally for debugging
window.databaseInspector = databaseInspector;

function AppContent() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletConnection, setWalletConnection] = useState({
    isConnected: false,
    address: null,
  });

  // Create global notification functions
  React.useEffect(() => {
    createGlobalNotificationFunctions(notifications);
  }, [notifications]);

  const handleShowWallet = () => {
    setShowWalletModal(true);
  };

  const handleCloseWallet = () => {
    setShowWalletModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Routes>
        {/* Debug Route for Simple Test */}
        <Route path="/test" element={<SimpleTest />} />
        {/* New Agent Marketplace Route (Cube-Ready) */}
        <Route path="/new-marketplace" element={<AgentMarketplace />} />
        {/* Main Landing Screen Route */}
        <Route
          path="/"
          element={
            <MainLandingScreen
              onEnterAgentWorld={() => navigate("/camera-activation")}
              onShowWallet={handleShowWallet}
            />
          }
        />

        {/* Simple Cube Test Route */}
        <Route path="/test-cube" element={<SimpleCubeTest />} />

        {/* Agent Fee Validation Dashboard (Debug) */}
        <Route path="/debug-fees" element={<AgentFeeValidationDashboard />} />

        {/* Camera Debug Test Route */}
        <Route path="/camera-test" element={<CameraTest />} />

        {/* Camera Activation Screen Route */}
        <Route
          path="/camera-activation"
          element={
            <CameraActivationScreen
              onStartCamera={() => navigate("/ar-view")}
              onGoBack={() => navigate("/")}
            />
          }
        />

        {/* AR Viewer Route */}
        <Route path="/ar-view" element={<ARViewer />} />

        {/* Redirect any unknown routes to main landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
              <button
                onClick={handleCloseWallet}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <UnifiedWalletConnect
              open={showWalletModal}
              onOpenChange={(connectionData) => {
                // 🔧 CRITICAL FIX: Prioritize Solana address when connected
                console.log(
                  "🔍 App: Received connection data:",
                  connectionData
                );

                if (connectionData) {
                  let address = null;
                  let isConnected = false;
                  let networkType = "unknown";

                  // 1. Check Solana connection first (PRIORITY)
                  if (
                    connectionData.solana?.isConnected &&
                    connectionData.solana?.address
                  ) {
                    address = connectionData.solana.address;
                    isConnected = true;
                    networkType = "solana";
                    console.log("🟢 App: Using Solana address:", address);
                  }
                  // 2. Fallback to EVM if Solana not connected
                  else if (
                    connectionData.evm?.isConnected &&
                    connectionData.evm?.address
                  ) {
                    address = connectionData.evm.address;
                    isConnected = true;
                    networkType = "evm";
                    console.log("🟡 App: Using EVM address:", address);
                  }

                  console.log("🎯 App: Final wallet state:", {
                    address,
                    isConnected,
                    networkType,
                  });

                  setWalletConnection({
                    isConnected,
                    address,
                    networkType,
                    connectionData, // Store full data for debugging
                  });
                }
              }}
            />

            {walletConnection.isConnected && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                <p className="text-green-400 text-sm font-medium">
                  Wallet Connected Successfully!
                </p>
                <p className="text-green-300 text-xs mt-1">
                  {walletConnection.address &&
                    `${walletConnection.address.slice(
                      0,
                      6
                    )}...${walletConnection.address.slice(-4)}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThirdWebProviderWrapper>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </ThirdWebProviderWrapper>
  );
}

export default App;
