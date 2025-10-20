import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Plus,
  Eye,
  Database,
  LayoutDashboard,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { useAddress, useDisconnect, ConnectWallet } from "@thirdweb-dev/react";
import { Link, useLocation } from "react-router-dom";
import { networkDetectionService } from "../services/networkDetectionService.js";
import UnsupportedNetworkModal from "./UnsupportedNetworkModal.jsx";
import NetworkSelectionModal from "./NetworkSelectionModal.jsx";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showUnsupportedWarning, setShowUnsupportedWarning] = useState(false);
  const address = useAddress();
  const disconnect = useDisconnect();
  const location = useLocation();

  // Check if Supabase is connected
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConnected =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your_supabase_url_here" &&
    supabaseAnonKey !== "your_supabase_anon_key_here";

  // Network detection and management
  useEffect(() => {
    const initializeNetwork = async () => {
      if (address && window.ethereum) {
        const network = await networkDetectionService.detectCurrentNetwork();
        setCurrentNetwork(network);
        checkNetworkSupport(network);

        // Start listening for network changes
        await networkDetectionService.startNetworkListener();
      }
    };

    const handleNetworkChange = (event: any) => {
      const network = event.detail.network;
      setCurrentNetwork(network);
      checkNetworkSupport(network);
    };

    // Initialize network detection when wallet is connected
    if (address) {
      initializeNetwork();
    } else {
      // Reset network state when wallet disconnected
      setCurrentNetwork(null);
      setShowUnsupportedWarning(false);
    }

    // Listen for network changes
    document.addEventListener("networkChanged", handleNetworkChange);

    return () => {
      document.removeEventListener("networkChanged", handleNetworkChange);
      networkDetectionService.stopNetworkListener();
    };
  }, [address]);

  const checkNetworkSupport = (network: any) => {
    if (network && network.isSupported === false && address) {
      setShowUnsupportedWarning(true);
    } else {
      setShowUnsupportedWarning(false);
    }
  };

  const handleNetworkSwitch = async (targetNetwork: any) => {
    try {
      await networkDetectionService.switchToNetwork(targetNetwork);
      setShowUnsupportedWarning(false);
      setShowNetworkModal(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
      alert(
        "Failed to switch network. Please try manually switching in your wallet."
      );
    }
  };

  const handleSupabaseSetup = () => {
    setShowSupabaseModal(true);
  };

  const closeSupabaseModal = () => {
    setShowSupabaseModal(false);
  };

  // Handle escape key to close modals
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSupabaseModal();
    }
  };

  return (
    <>
      <nav className="bg-white bg-opacity-90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold mr-2">
                  A
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">
                  AgentSphere
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {location.pathname === "/" ? (
                <>
                  <a
                    href="#features"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Features
                  </a>
                  <a
                    href="#map"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Explore
                  </a>
                  <a
                    href="#auth"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Join Waitlist
                  </a>
                </>
              ) : (
                <Link
                  to="/"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
              )}

              <Link
                to="/deploy"
                className="flex items-center text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Deploy Agent
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <Link
                to="/ar"
                className="flex items-center text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Eye className="h-4 w-4 mr-1" />
                View AR
              </Link>

              {/* Supabase Connection Button */}
              <button
                onClick={handleSupabaseSetup}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isSupabaseConnected
                    ? "text-green-700 bg-green-50 hover:bg-green-100"
                    : "text-green-700 bg-green-50 hover:bg-green-100"
                }`}
              >
                <Database className="h-4 w-4 mr-1" />
                {isSupabaseConnected
                  ? "Database Connected"
                  : "Connect Database"}
              </button>

              {/* Wallet Connection */}
              <div className="flex items-center space-x-2">
                {address ? (
                  <div className="flex items-center space-x-2">
                    {/* Network Status */}
                    {currentNetwork && (
                      <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md cursor-pointer transition-colors ${
                          currentNetwork.isSupported === false
                            ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                        onClick={() => setShowNetworkModal(true)}
                        title={`Connected to ${currentNetwork.name}. Click to switch networks.`}
                      >
                        <Globe className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {currentNetwork.shortName}
                        </span>
                        {currentNetwork.isSupported === false && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                      </div>
                    )}

                    {/* Wallet Address */}
                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700 font-medium">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <ConnectWallet
                    theme="light"
                    btnTitle="Connect Wallet"
                    modalTitle="Connect Wallet to AgentSphere"
                    modalSize="compact"
                    welcomeScreen={{
                      title: "Connect Wallet",
                      subtitle:
                        "Connect your wallet to deploy and manage agents",
                    }}
                    detailsBtn={() => {
                      return (
                        <div style={{ display: "none" }} aria-hidden="true">
                          Details
                        </div>
                      );
                    }}
                    className="!bg-gradient-to-r !from-green-500 !to-emerald-600 !text-white !rounded-lg !font-medium !shadow-md hover:!shadow-lg !transition-all !duration-200 !px-4 !py-2"
                    style={{
                      background: "linear-gradient(to right, #10b981, #059669)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "500",
                      padding: "8px 16px",
                      fontSize: "14px",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg rounded-b-lg">
              {location.pathname === "/" ? (
                <>
                  <a
                    href="#features"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a
                    href="#map"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Explore
                  </a>
                  <a
                    href="#auth"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Join Waitlist
                  </a>
                </>
              ) : (
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
              )}

              <Link
                to="/deploy"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Deploy Agent
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <Link
                to="/ar"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View AR
              </Link>

              {/* Mobile Supabase Connection */}
              <button
                onClick={() => {
                  handleSupabaseSetup();
                  setIsMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isSupabaseConnected
                    ? "text-green-700 bg-green-50 hover:bg-green-100"
                    : "text-green-700 bg-green-50 hover:bg-green-100"
                }`}
              >
                <Database className="h-4 w-4 mr-1" />
                {isSupabaseConnected
                  ? "NEAR Database Connected"
                  : "Connect NEAR Database"}
              </button>

              {/* Mobile Wallet Connection */}
              {address ? (
                <div className="space-y-2">
                  <div className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  <button
                    onClick={() => {
                      disconnect();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2">
                  <ConnectWallet
                    theme="light"
                    btnTitle="Connect Wallet"
                    modalTitle="Connect Wallet to AgentSphere"
                    modalSize="compact"
                    welcomeScreen={{
                      title: "Connect Wallet",
                      subtitle:
                        "Connect your wallet to deploy and manage agents",
                    }}
                    detailsBtn={() => {
                      return (
                        <div style={{ display: "none" }} aria-hidden="true">
                          Details
                        </div>
                      );
                    }}
                    className="!w-full !bg-gradient-to-r !from-green-500 !to-emerald-600 !text-white !rounded-lg !font-medium !shadow-md hover:!shadow-lg !transition-all !duration-200"
                    style={{
                      background: "linear-gradient(to right, #10b981, #059669)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "500",
                      padding: "8px 16px",
                      fontSize: "14px",
                      width: "100%",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Supabase Setup Modal */}
      {showSupabaseModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supabase-modal-title"
          onKeyDown={handleKeyDown}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2
                  id="supabase-modal-title"
                  className="text-2xl font-bold text-gray-900"
                >
                  {isSupabaseConnected
                    ? "NEAR Database Connected"
                    : "Connect NEAR Database"}
                </h2>
                <button
                  onClick={closeSupabaseModal}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isSupabaseConnected ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        NEAR Database Successfully Connected!
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mt-2">
                      Your NEAR-powered Supabase database is connected and ready
                      to store deployed NEAR agents.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-medium text-blue-800 mb-2">
                      What you can do now:
                    </h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Deploy NEAR agents to your database</li>
                      <li>• View NEAR agents in NeAR from your database</li>
                      <li>• Use RTK-enhanced GPS for precise positioning</li>
                      <li>• Share NEAR agents with other users</li>
                      <li>• Process payments with NeAR QR Pay</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-orange-800 font-medium">
                        NEAR Database Connection Required
                      </span>
                    </div>
                    <p className="text-orange-700 text-sm mt-2">
                      To deploy and view NEAR agents, you need to connect your
                      NEAR-powered Supabase database.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Setup Instructions:
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-indigo-600 text-sm font-bold">
                            1
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-700">
                            <strong>Create a Supabase project:</strong> Go to{" "}
                            <a
                              href="https://supabase.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              supabase.com
                            </a>{" "}
                            and create a new project.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-indigo-600 text-sm font-bold">
                            2
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-700">
                            <strong>Get your credentials:</strong> In your
                            Supabase dashboard, go to Settings → API to find
                            your Project URL and anon public key.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-indigo-600 text-sm font-bold">
                            3
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-700">
                            <strong>Create a .env file:</strong> In your project
                            root, create a{" "}
                            <code className="bg-gray-100 px-1 rounded">
                              .env
                            </code>{" "}
                            file with NEAR integration:
                          </p>
                          <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                            <div>VITE_SUPABASE_URL=your_project_url_here</div>
                            <div>VITE_SUPABASE_ANON_KEY=your_anon_key_here</div>
                            <div>
                              VITE_THIRDWEB_CLIENT_ID=299516306b51bd6356fd8995ed628950
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-indigo-600 text-sm font-bold">
                            4
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-700">
                            <strong>Restart the development server:</strong>{" "}
                            Stop your dev server and run{" "}
                            <code className="bg-gray-100 px-1 rounded">
                              npm run dev
                            </code>{" "}
                            again.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Database Schema
                    </h4>
                    <p className="text-blue-700 text-sm">
                      The database schema is already configured with the{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        deployed_objects
                      </code>{" "}
                      table. Once you connect, AI agents and AR QR Pay will work
                      automatically!
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeSupabaseModal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {isSupabaseConnected ? "Got it!" : "I'll set this up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Modals */}
      {showUnsupportedWarning && currentNetwork && (
        <UnsupportedNetworkModal
          currentNetwork={currentNetwork}
          onNetworkSwitch={handleNetworkSwitch}
          onClose={() => setShowUnsupportedWarning(false)}
        />
      )}

      {showNetworkModal && (
        <NetworkSelectionModal
          currentNetwork={currentNetwork}
          onNetworkSwitch={handleNetworkSwitch}
          onClose={() => setShowNetworkModal(false)}
        />
      )}
    </>
  );
};

export default Navbar;
