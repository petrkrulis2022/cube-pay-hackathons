import { useState } from "react";
import { Menu, X, Plus, Eye, Database, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const SimpleNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const location = useLocation();

  // Check if Supabase is connected
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConnected =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your_supabase_url_here" &&
    supabaseAnonKey !== "your_supabase_anon_key_here";

  const handleSupabaseSetup = () => {
    setShowSupabaseModal(true);
  };

  const closeSupabaseModal = () => {
    setShowSupabaseModal(false);
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

              {/* Wallet Connection Placeholder */}
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200">
                Connect Wallet
              </button>
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
                  ? "Database Connected"
                  : "Connect Database"}
              </button>

              {/* Mobile Wallet Connection */}
              <div className="px-3 py-2">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 py-2">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Supabase Setup Modal - Same as original but simplified */}
      {showSupabaseModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          onClick={closeSupabaseModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isSupabaseConnected
                    ? "Database Connected"
                    : "Connect Database"}
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
                        Database Successfully Connected!
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mt-2">
                      Your Supabase database is connected and ready to store
                      deployed agents.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-orange-800 font-medium">
                        Database Connection Required
                      </span>
                    </div>
                    <p className="text-orange-700 text-sm mt-2">
                      To deploy and view agents, you need to connect your
                      Supabase database.
                    </p>
                  </div>
                  <p className="text-gray-600">
                    Please set up your Supabase credentials in the .env file to
                    continue.
                  </p>
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
    </>
  );
};

export default SimpleNavbar;
