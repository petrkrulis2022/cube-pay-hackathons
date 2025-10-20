import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  MapPin,
  Wifi,
  WifiOff,
  Users,
  Zap,
  Globe,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Satellite,
  Wallet,
  ArrowLeft,
  Home,
  Box,
  Layers,
} from "lucide-react";
import { useDatabase } from "../hooks/useDatabase";
import CameraView from "./CameraView";
import AR3DScene from "./AR3DScene";
import ARQRCodeFixed from "./ARQRCodeFixed";
import ThirdWebWalletConnect from "./ThirdWebWalletConnect";
import UnifiedWalletConnect from "./UnifiedWalletConnect";
import rtkLocationService from "../services/rtkLocation";

const ARViewer = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [initializationStep, setInitializationStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [nearAgents, setNearAgents] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedTab, setSelectedTab] = useState("viewer");
  const [viewMode, setViewMode] = useState("3d"); // "2d" or "3d" - Default to 3D for immersive experience
  const [rtkStatus, setRtkStatus] = useState({
    isRTKEnhanced: false,
    source: "Standard GPS",
  });
  const [walletConnection, setWalletConnection] = useState({
    isConnected: false,
    address: null,
    user: null,
  });

  const {
    isLoading,
    error: dbError,
    connectionStatus,
    getNearAgents,
    refreshConnection,
  } = useDatabase();

  const isMountedRef = useRef(true);

  // Initialize RTK-enhanced location services
  const initializeLocation = async () => {
    try {
      setInitializationStep(1);
      console.log("📍 Requesting RTK-enhanced location...");

      // Use RTK location service for enhanced accuracy
      const location = await rtkLocationService.getEnhancedLocation();

      setCurrentLocation(location);
      setLocationError(null);
      setRtkStatus({
        isRTKEnhanced: location.isRTKEnhanced || false,
        source: location.source || "Standard GPS",
        accuracy: location.accuracy,
        altitude: location.altitude,
      });

      console.log("✅ RTK Location acquired:", location);
      return location;
    } catch (error) {
      console.error("❌ RTK Location error:", error);
      setLocationError(error.message);

      // Use fallback location (San Francisco) as last resort
      const fallbackLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 52.0,
        accuracy: 1000,
        timestamp: Date.now(),
        isFallback: true,
        source: "Fallback Location",
      };

      setCurrentLocation(fallbackLocation);
      setRtkStatus({
        isRTKEnhanced: false,
        source: "Fallback Location",
        accuracy: 1000,
        altitude: 52.0,
      });

      console.log("🔄 Using fallback location:", fallbackLocation);
      return fallbackLocation;
    }
  };

  // Initialize camera
  const initializeCamera = async () => {
    try {
      setInitializationStep(2);
      console.log("📷 Initializing camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach((track) => track.stop());

      setCameraActive(true);
      console.log("✅ Camera permission granted");
      return true;
    } catch (error) {
      console.error("❌ Camera error:", error);
      setCameraActive(false);
      return false;
    }
  };

  // Load NeAR agents
  const loadNearAgents = async (location) => {
    try {
      setInitializationStep(3);
      console.log("🔍 Loading NeAR agents for location:", location);

      const objects = await getNearAgents({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_meters: 200, // Increased search radius
        limit: 20, // Increased limit
      });

      console.log(`📊 Raw objects received:`, objects);
      console.log(`📊 Objects length: ${objects?.length || 0}`);

      if (objects && objects.length > 0) {
        console.log(`📊 First object details:`, objects[0]);
        console.log(
          `📊 Object types:`,
          objects.map((o) => o.agent_type || o.object_type).join(", ")
        );
      }

      setNearAgents(objects || []);
      console.log(
        `✅ Set nearAgents state with ${objects?.length || 0} agents`
      );
      console.log("🎯 Setting nearAgents to:", objects);

      // Additional debug for 3D rendering
      if (objects && objects.length > 0) {
        console.log("🔍 Object properties check:");
        objects.forEach((obj, i) => {
          console.log(`Agent ${i + 1}:`, {
            id: obj.id,
            name: obj.name,
            type: obj.agent_type || obj.object_type,
            lat: obj.latitude,
            lng: obj.longitude,
            distance: obj.distance_meters,
          });
        });
      }

      return objects;
    } catch (error) {
      console.error("❌ Error loading objects:", error);
      setNearAgents([]);
      return [];
    }
  };

  // Full initialization sequence
  const initializeApp = async () => {
    try {
      if (!isMountedRef.current) return;

      console.log("🚀 Starting AR Viewer initialization...");

      // Step 1: Location
      const location = await initializeLocation();
      if (!isMountedRef.current) return;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Camera
      if (isMountedRef.current) {
        await initializeCamera();
      }
      if (!isMountedRef.current) return;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Database and objects
      if (isMountedRef.current) {
        await refreshConnection();
        await loadNearAgents(location);
      }
      if (!isMountedRef.current) return;

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 4: Complete
      if (isMountedRef.current) {
        setInitializationStep(4);
        setIsInitialized(true);
        console.log("🎉 AR Viewer initialization complete!");
      }
    } catch (error) {
      console.error("❌ Initialization error:", error);
      if (isMountedRef.current) {
        setIsInitialized(true); // Allow app to continue with fallbacks
      }
    }
  };

  // Initialize on mount
  useEffect(() => {
    isMountedRef.current = true;
    initializeApp();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Render initialization screen
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              NeAR Viewer
            </CardTitle>
            <CardDescription className="text-purple-200">
              Initializing AR Experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  initializationStep >= 1
                    ? "bg-green-500/20 text-green-300"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span>Location Services</span>
                {initializationStep >= 1 && (
                  <Badge variant="secondary" className="ml-auto">
                    ✓
                  </Badge>
                )}
              </div>

              <div
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  initializationStep >= 2
                    ? "bg-green-500/20 text-green-300"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                <Camera className="w-5 h-5" />
                <span>Camera Access</span>
                {initializationStep >= 2 && (
                  <Badge variant="secondary" className="ml-auto">
                    ✓
                  </Badge>
                )}
              </div>

              <div
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  initializationStep >= 3
                    ? "bg-green-500/20 text-green-300"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                <Globe className="w-5 h-5" />
                <span>Database Connection</span>
                {initializationStep >= 3 && (
                  <Badge variant="secondary" className="ml-auto">
                    ✓
                  </Badge>
                )}
              </div>

              <div
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  initializationStep >= 4
                    ? "bg-green-500/20 text-green-300"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>AR Ready</span>
                {initializationStep >= 4 && (
                  <Badge variant="secondary" className="ml-auto">
                    ✓
                  </Badge>
                )}
              </div>
            </div>

            {locationError && (
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  Location: {locationError}
                </p>
                <p className="text-yellow-300 text-xs mt-1">
                  Using fallback location for demo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main AR Viewer interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
              title="Back to Main"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">NeAR Viewer</h1>
              <p className="text-sm text-purple-200">AR Agent Network</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant={
                connectionStatus === "connected" ? "default" : "destructive"
              }
              className="flex items-center space-x-1"
            >
              {connectionStatus === "connected" ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              <span>
                {connectionStatus === "connected" ? "Connected" : "Offline"}
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="flex">
          {[
            { id: "viewer", label: "NeAR Viewer", icon: Camera },
            { id: "agents", label: "NEAR Agents", icon: Users },
            { id: "map", label: "NEAR Map", icon: MapPin },
            { id: "wallet", label: "Wallet", icon: Wallet },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 p-4 transition-colors ${
                selectedTab === tab.id
                  ? "bg-purple-500/30 text-white border-b-2 border-purple-400"
                  : "text-purple-200 hover:bg-purple-500/10"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {selectedTab === "viewer" && (
          <div className="space-y-4">
            {/* 3D/2D Mode Toggle */}
            <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg border border-purple-500/30">
              <div>
                <h2 className="text-xl font-bold text-white">AR Experience</h2>
                <p className="text-sm text-purple-200">
                  {viewMode === "3d"
                    ? "🚀 Immersive 3D mode with spinning & floating agents"
                    : "📱 Traditional 2D overlay mode"}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge
                  variant={viewMode === "2d" ? "default" : "outline"}
                  className={`text-xs transition-all ${
                    viewMode === "2d"
                      ? "bg-blue-500"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  2D Overlay
                </Badge>
                <button
                  onClick={() => {
                    const newMode = viewMode === "2d" ? "3d" : "2d";
                    console.log(
                      `🔄 Switching AR view mode from ${viewMode} to ${newMode}`
                    );
                    setViewMode(newMode);
                  }}
                  className={`p-3 rounded-lg transition-all shadow-lg ${
                    viewMode === "3d"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                  title={`Switch to ${viewMode === "2d" ? "3D" : "2D"} mode`}
                >
                  {viewMode === "2d" ? (
                    <Box className="w-6 h-6 text-white" />
                  ) : (
                    <Layers className="w-6 h-6 text-white" />
                  )}
                </button>
                <Badge
                  variant={viewMode === "3d" ? "default" : "outline"}
                  className={`text-xs transition-all ${
                    viewMode === "3d"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  🚀 3D Immersive
                </Badge>
              </div>
            </div>

            {/* Status Cards - Moved to top for better camera view */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-8 h-8 text-purple-400" />
                      {rtkStatus.isRTKEnhanced && (
                        <Satellite className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-purple-200">Location</p>
                        {rtkStatus.isRTKEnhanced && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-500/20 border-green-500 text-green-300"
                          >
                            RTK Enhanced
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-white">
                        {currentLocation
                          ? `${currentLocation.latitude.toFixed(
                              6
                            )}, ${currentLocation.longitude.toFixed(6)}`
                          : "Unknown"}
                      </p>
                      {currentLocation && (
                        <div className="text-xs text-purple-300 mt-1">
                          <div>
                            Alt: {(currentLocation.altitude || 0).toFixed(1)}m
                          </div>
                          <div>
                            ±{(rtkStatus.accuracy || 10).toFixed(2)}m •{" "}
                            {rtkStatus.source}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-sm text-purple-200">NeAR Agents</p>
                      <p className="font-semibold text-white">
                        {nearAgents.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-sm text-purple-200">Database</p>
                      <p className="font-semibold text-white">
                        {connectionStatus === "connected"
                          ? "Connected"
                          : "Offline"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AR View Container */}
            <div className="relative">
              {viewMode === "2d" ? (
                /* Traditional 2D Camera View */
                <CameraView
                  isActive={cameraActive}
                  onToggle={setCameraActive}
                  onError={(err) => console.error("Camera error:", err)}
                  agents={nearAgents}
                  userLocation={currentLocation}
                  onAgentInteraction={(agent, action, data) => {
                    console.log("Agent interaction:", agent.name, action, data);
                    // Handle agent interactions here
                  }}
                  showControls={true}
                  connectedWallet={walletConnection.address}
                />
              ) : (
                /* New 3D Immersive View */
                <div className="relative" style={{ minHeight: "500px" }}>
                  {/* Background Camera Feed for 3D AR - Lower priority */}
                  <div className="absolute inset-0 z-0">
                    <CameraView
                      isActive={cameraActive}
                      onToggle={setCameraActive}
                      onError={(err) => console.error("Camera error:", err)}
                      agents={[]} // Don't show 2D agents in 3D mode
                      userLocation={currentLocation}
                      onAgentInteraction={() => {}} // Disable 2D interactions
                      showControls={false} // Hide 2D controls
                      connectedWallet={walletConnection.address}
                    />
                  </div>
                  {/* 3D Scene Overlay - Higher priority */}
                  <div
                    className="absolute inset-0 z-20"
                    style={{ pointerEvents: "auto" }}
                  >
                    <AR3DScene
                      agents={nearAgents}
                      onAgentClick={(agent) => {
                        console.log("3D Agent clicked:", agent.name);
                        // Handle 3D agent interactions - same as 2D
                        // This maintains all existing interaction functionality
                      }}
                      userLocation={currentLocation}
                      cameraViewSize={{ width: 1280, height: 720 }}
                      connectedWallet={walletConnection.address}
                    />
                  </div>
                  {/* 3D Mode Controls - Highest priority */}
                  <div className="absolute top-4 right-4 z-30">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
                      <p className="text-sm font-medium mb-1">
                        🚀 3D AR Mode ACTIVE
                      </p>
                      <p className="text-xs text-gray-300">
                        {nearAgents.length} spinning agents loaded • Tap to
                        interact
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        ✅ Enhanced3DAgent components rendering
                      </p>
                    </div>
                  </div>{" "}
                  {/* Camera Toggle for 3D Mode */}
                  <div className="absolute bottom-4 right-4 z-30">
                    <button
                      onClick={() => setCameraActive(!cameraActive)}
                      className={`p-3 rounded-full ${
                        cameraActive
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      } transition-colors shadow-lg`}
                      title={cameraActive ? "Stop Camera" : "Start Camera"}
                    >
                      {cameraActive ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "agents" && (
          <div className="space-y-4">
            <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>NEAR Agents</span>
                </CardTitle>
                <CardDescription className="text-purple-200">
                  NeAR AI agents available for interaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nearAgents.length > 0 ? (
                  nearAgents.map((obj, index) => (
                    <div
                      key={obj.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">
                            {obj.name}
                          </h4>
                          <p className="text-sm text-purple-200">
                            {obj.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {obj.distance_meters?.toFixed(1)}m away •{" "}
                            {obj.agent_type || obj.object_type}
                          </p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No agents found nearby</p>
                    <Button
                      onClick={() => loadNearAgents(currentLocation)}
                      variant="outline"
                      className="mt-4"
                      disabled={isLoading}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === "map" && (
          <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>NEAR Map</span>
              </CardTitle>
              <CardDescription className="text-purple-200">
                Interactive map view of NeAR agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Interactive Map
                  </h3>
                  <p className="text-purple-200">
                    Map view would be implemented here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === "wallet" && (
          <div className="space-y-4">
            <UnifiedWalletConnect onConnectionChange={setWalletConnection} />

            {/* Wallet Status Summary */}
            {walletConnection.hasAnyConnection && (
              <Card className="bg-black/50 border-green-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-green-400" />
                    <span>Wallet Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <p className="text-green-300 text-sm font-medium">
                        Agent Payments
                      </p>
                      <p className="text-white text-xs">
                        Pay agents with USDFC tokens
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-sm font-medium">
                        Premium Features
                      </p>
                      <p className="text-white text-xs">
                        Access exclusive AR content
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <p className="text-purple-300 text-sm font-medium">
                        NFT Agents
                      </p>
                      <p className="text-white text-xs">
                        Own and trade agent NFTs
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <p className="text-yellow-300 text-sm font-medium">
                        DAO Voting
                      </p>
                      <p className="text-white text-xs">
                        Participate in governance
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {selectedTab === "settings" && (
          <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </CardTitle>
              <CardDescription className="text-purple-200">
                Configure your AR experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-white">Database Connection</span>
                  <Button
                    onClick={refreshConnection}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-white">Camera Permission</span>
                  <Badge variant={cameraActive ? "default" : "destructive"}>
                    {cameraActive ? "Granted" : "Denied"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-white">Location Services</span>
                  <Badge variant={currentLocation ? "default" : "destructive"}>
                    {currentLocation ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {dbError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-200 text-sm font-medium">
                    Database Error
                  </p>
                  <p className="text-red-300 text-xs mt-1">{dbError.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ARViewer;
