import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import Enhanced3DAgent from "./Enhanced3DAgent";
import AgentInteractionModal from "./AgentInteractionModal";
import CubePaymentEngine from "./CubePaymentEngine";
import QRScannerOverlay from "./QRScannerOverlay";
import ARQRCodeFixed from "./ARQRCodeFixed";
import arQRManager from "../services/arQRManager";

// Unique ID generator to avoid React key collisions
let notificationIdCounter = 0;
const generateUniqueId = () => {
  return `${Date.now()}_${++notificationIdCounter}`;
};

const AR3DScene = ({
  agents = [],
  onAgentClick,
  userLocation,
  cameraViewSize = { width: 1280, height: 720 },
  connectedWallet = null,
}) => {
  const [agents3D, setAgents3D] = useState([]);

  // Agent interaction states
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showCubePayment, setShowCubePayment] = useState(false);

  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningForAgent, setScanningForAgent] = useState(null);
  const [currentQRData, setCurrentQRData] = useState(null);

  // AR QR states for notifications and display
  const [arQRNotifications, setArQRNotifications] = useState([]);
  const [persistentQRs, setPersistentQRs] = useState([]);

  // Enhanced QR scanning detection states
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("idle"); // idle, scanning, found, error
  const [qrDetectionTimeout, setQrDetectionTimeout] = useState(null);

  // Handle agent click
  const handleAgentClick = (agent) => {
    console.log("🤖 3D Agent clicked:", agent.name);
    console.log("🤖 Agent data:", agent);

    // DEBUG: Log all payment-related fields for debugging payment modal
    console.log("💰 PAYMENT DEBUG - Agent Payment Fields:", {
      name: agent?.name,
      id: agent?.id,
      interaction_fee_amount: agent?.interaction_fee_amount,
      interaction_fee: agent?.interaction_fee,
      fee_amount: agent?.fee_amount,
      payment_config: agent?.payment_config,
      deployment_network_name: agent?.deployment_network_name,
      deployment_chain_id: agent?.deployment_chain_id,
      network: agent?.network,
      chain_id: agent?.chain_id,
      ALERT:
        agent?.name === "Cube Dynamic 1"
          ? "THIS IS CUBE DYNAMIC 1 - EXPECTED ID: f911cc7d-244c-4916-9612-71b3904e9424"
          : "Other agent",
      allKeys: agent
        ? Object.keys(agent).filter(
            (k) =>
              k.includes("fee") ||
              k.includes("network") ||
              k.includes("chain") ||
              k.includes("amount")
          )
        : [],
    });

    setSelectedAgent(agent);
    setShowAgentModal(true);

    if (onAgentClick) {
      onAgentClick(agent);
    }
  };

  // Handle payment request - now launches 3D cube instead of modal
  const handlePaymentRequest = async (agent) => {
    console.log(
      "🎯 Payment requested for 3D agent - launching cube:",
      agent.name
    );

    setSelectedAgent(agent);
    setShowAgentModal(false);
    setShowCubePayment(true);
  };

  // Handle cube payment completion
  const handleCubePaymentComplete = (agent, paymentData) => {
    console.log(
      "✅ Cube payment completed for 3D agent:",
      agent.name,
      paymentData
    );
    setShowCubePayment(false);
    setShowAgentModal(true); // Return to agent modal
  };

  // Handle QR scan request
  const handleQRScanRequest = async (agent, paymentData = null) => {
    console.log("📷 QR scan requested for 3D agent:", agent.name);

    // Store the QR data if provided
    if (paymentData) {
      console.log("💾 Storing QR data for scanning:", paymentData.uri);
      setCurrentQRData(paymentData.uri);
    }

    setScanningForAgent(agent);
    setShowAgentModal(false);
    setShowPaymentModal(false);
    setShowQRScanner(true);
  };

  // Enhanced AR QR generation with persistent display
  const handleARQRGenerated = (arQRCode) => {
    console.log("🌐 AR QR Code generated for 3D agent:", arQRCode);

    // Add to persistent QRs for display in 3D scene
    setPersistentQRs((prev) => {
      const exists = prev.find((qr) => qr.id === arQRCode.id);
      if (exists) return prev;
      return [...prev, arQRCode];
    });

    // Show notification
    const notification = {
      id: generateUniqueId(),
      message: `AR QR Code created for ${arQRCode.agent?.name}`,
      type: "success",
      timestamp: new Date().toISOString(),
    };

    setArQRNotifications((prev) => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setArQRNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      );
    }, 5000);

    console.log("✅ AR QR Code added to 3D scene display");

    // Start enhanced QR detection
    startQRDetection();
  };

  // Enhanced QR Detection System
  const startQRDetection = () => {
    console.log("🔍 Starting enhanced QR detection...");
    setIsScanning(true);
    setScanningStatus("scanning");

    // Clear any existing timeout
    if (qrDetectionTimeout) {
      clearTimeout(qrDetectionTimeout);
    }

    // Check for active QRs immediately
    checkForActiveQRs();

    // Set up periodic checking
    const checkInterval = setInterval(checkForActiveQRs, 1000);

    // Set timeout to stop scanning after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (scanningStatus === "scanning") {
        setScanningStatus("error");
        setIsScanning(false);
        console.log("⏰ QR detection timeout - no QRs found");
      }
    }, 10000);

    setQrDetectionTimeout(timeout);
  };

  const checkForActiveQRs = () => {
    const activeQRs = arQRManager.getActiveQRs();
    console.log(`🔍 Checking for QRs... Found: ${activeQRs.length}`);

    if (activeQRs.length > 0) {
      setScanningStatus("found");
      setIsScanning(false);

      // Clear timeout
      if (qrDetectionTimeout) {
        clearTimeout(qrDetectionTimeout);
      }

      console.log("✅ QR codes detected! Ready for scanning.");

      // Update UI to show scan interface
      showQRScanInterface(activeQRs);
    }
  };

  const showQRScanInterface = (qrCodes) => {
    console.log("📱 Showing QR scan interface for", qrCodes.length, "QR codes");

    // Add notification about scannable QRs
    const scanNotification = {
      id: generateUniqueId(),
      message: `${qrCodes.length} QR Code${
        qrCodes.length > 1 ? "s" : ""
      } ready to scan!`,
      type: "scan-ready",
      qrCodes: qrCodes,
      timestamp: new Date().toISOString(),
    };

    setArQRNotifications((prev) => [...prev, scanNotification]);

    // Auto-remove scan notification after 8 seconds
    setTimeout(() => {
      setArQRNotifications((prev) =>
        prev.filter((n) => n.id !== scanNotification.id)
      );
    }, 8000);
  };

  // Handle QR code scanned
  const handleQRScanned = async (qrData) => {
    console.log("📱 QR code scanned in 3D mode:", qrData);

    try {
      // Process the QR code and trigger payment
      if (qrData.contractAddress && qrData.recipient && qrData.amount) {
        // Create a payment URI that can be opened by MetaMask
        const paymentUri = qrData.rawData;

        // Try to open with MetaMask
        if (window.ethereum) {
          window.open(paymentUri, "_blank");
        } else {
          // Fallback: show the URI for manual copying
          await navigator.clipboard.writeText(paymentUri);
          alert(
            "Payment URI copied to clipboard. Open MetaMask and paste the URI."
          );
        }

        // Close scanner and return to agent modal
        setShowQRScanner(false);
        setShowAgentModal(true);
      }
    } catch (error) {
      console.error("QR payment error in 3D mode:", error);
    }
  };

  // Handle QR scan error
  const handleQRScanError = (error) => {
    console.error("QR scan error in 3D mode:", error);
  };

  // Close modals
  const closeModals = () => {
    console.log("🔄 Closing 3D modals...");
    setShowAgentModal(false);
    setShowCubePayment(false);
    setShowQRScanner(false);
    setSelectedAgent(null);
  };

  // Convert 2D positions to 3D world coordinates
  const convertTo3DPosition = (agent, userLoc) => {
    const index = agents.indexOf(agent);
    const totalAgents = agents.length;

    if (!userLoc || !agent.latitude || !agent.longitude) {
      // Enhanced distributed positioning for better coverage
      console.log(
        `🎯 Using fallback 3D positioning for agent ${
          index + 1
        }/${totalAgents}: ${agent.name}`
      );

      // Use circular distribution for better spread - closer to camera
      const angle = (index / totalAgents) * 2 * Math.PI;
      const radiusVariation = index % 4;
      const radius = 2 + radiusVariation * 1.5; // Closer: 2-6.5 units instead of 3-9

      // Create multiple layers to avoid clustering
      const layerAngleOffset = Math.floor(index / 4) * 30 * (Math.PI / 180);
      const adjustedAngle = angle + layerAngleOffset;

      // Calculate position in 3D space - at eye level initially
      const x = Math.cos(adjustedAngle) * radius;
      const z = Math.sin(adjustedAngle) * radius;
      const y = 0.5 + (index % 3) * 0.8; // Eye level: 0.5 to 2.1 meters

      const distance = agent.distance_meters || 25 + (index % 5) * 15; // Closer distances

      console.log(
        `📍 Agent ${agent.name} positioned at (${x.toFixed(1)}, ${y.toFixed(
          1
        )}, ${z.toFixed(1)})`
      );

      return {
        position: [x, y, z],
        distance,
        strategy: "fallback-circular-3d",
      };
    }

    // GPS-based 3D positioning
    const latDiff = agent.latitude - userLoc.latitude;
    const lonDiff = agent.longitude - userLoc.longitude;

    // Calculate actual distance
    const distanceKm = Math.sqrt(
      Math.pow(latDiff * 111000, 2) + Math.pow(lonDiff * 111000, 2)
    );

    console.log(
      `📡 GPS 3D positioning for ${agent.name}: distance=${distanceKm.toFixed(
        0
      )}m`
    );

    // Convert to 3D world coordinates
    const maxDisplayDistance = 1000; // meters
    const normalizedDistance =
      Math.min(distanceKm, maxDisplayDistance) / maxDisplayDistance;

    // Create 3D position based on bearing and distance
    const bearing = Math.atan2(lonDiff, latDiff);
    const displayRadius = 2 + normalizedDistance * 8; // 2-10 world units

    const x = Math.sin(bearing) * displayRadius;
    const z = -Math.cos(bearing) * displayRadius; // North is negative Z
    const y = (Math.random() - 0.5) * 2; // Random height variation

    return {
      position: [x, y, z],
      distance: distanceKm,
      bearing: bearing * (180 / Math.PI),
      strategy: "gps-based-3d",
    };
  };

  // Update 3D agents with positions
  useEffect(() => {
    console.log("🤖 AR3DScene received agents:", agents.length, "agents");
    console.log("🤖 Full agents data:", agents);

    if (agents.length === 0) {
      console.log("🤖 No agents to render - setting empty array");
      setAgents3D([]);
      return;
    }

    const agentsWith3DPositions = agents.map((agent) => {
      const position3D = convertTo3DPosition(agent, userLocation);
      console.log(
        `🎯 3D Agent ${agent.name} -> Position: (${position3D.position
          .map((p) => p.toFixed(1))
          .join(", ")}) Distance: ${position3D.distance.toFixed(0)}m`
      );

      return {
        ...agent,
        position3D,
      };
    });

    // Sort by distance (closest first)
    agentsWith3DPositions.sort(
      (a, b) => a.position3D.distance - b.position3D.distance
    );

    // Limit visible agents for performance
    const maxVisibleAgents = Math.min(15, agentsWith3DPositions.length);
    const limitedAgents = agentsWith3DPositions.slice(0, maxVisibleAgents);

    console.log(
      `👁️ Setting ${limitedAgents.length} 3D agents visible out of ${agents.length} total`
    );

    setAgents3D(limitedAgents);
  }, [agents, userLocation]);

  // Loading component
  const LoadingFallback = () => (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#444444" transparent opacity={0.5} />
    </mesh>
  );

  return (
    <div
      className="absolute inset-0 pointer-events-auto"
      style={{
        backgroundColor: "transparent", // Transparent for true AR overlay
        zIndex: 15,
      }}
    >
      {/* AR Debug indicator - Less intrusive */}
      <div
        className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm border border-green-500/30"
        style={{ minWidth: "220px" }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>🎯 3D AR Scene Active</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Raw agents: {agents.length} • 3D ready: {agents3D.length}
        </div>
        <div className="text-xs text-blue-300 mt-1">
          ✨ Enhanced3DAgent components rendering
        </div>
        <div className="text-xs text-yellow-300 mt-1 animate-pulse">
          � Click spinning agents for payment & QR codes
        </div>
      </div>

      <Canvas
        camera={{
          position: [0, 1.6, 5], // Camera at human eye level (1.6m)
          fov: 75,
          near: 0.1,
          far: 100,
        }}
        style={{
          background: "transparent", // True AR transparency
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        onCreated={({ gl, camera, scene }) => {
          console.log("🎥 Three.js AR Canvas created!");
          console.log("Camera position:", camera.position);
          gl.alpha = true; // Enable transparency for AR overlay
          gl.setClearColor(0x000000, 0); // Transparent background
        }}
      >
        {/* AR-appropriate lighting for realistic appearance */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />

        {/* Enhanced 3D Agents using proper positioning */}
        <Suspense fallback={<LoadingFallback />}>
          {agents3D.map((agent, index) => {
            // Use the calculated 3D position from convertTo3DPosition
            const position = agent.position3D
              ? agent.position3D.position
              : [
                  (index % 5) * 2 - 4, // Fallback positioning
                  Math.floor(index / 5) * 2 - 2,
                  -3,
                ];

            console.log(
              `🤖 Rendering Enhanced3DAgent ${index}:`,
              agent.name,
              "at position:",
              position
            );

            return (
              <Enhanced3DAgent
                key={agent.id}
                agent={agent}
                position={position}
                onAgentClick={() => {
                  console.log("3D Agent clicked:", agent.name);
                  handleAgentClick(agent);
                }}
                distance={agent.position3D ? agent.position3D.distance : 50}
                isVisible={true}
                animationSpeed={1.0}
              />
            );
          })}
        </Suspense>

        {/* Optional: Keep one test cube for reference while we verify Enhanced3DAgent works */}
        {agents3D.length === 0 && (
          <mesh position={[0, 0, -2]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff6b6b" opacity={0.5} transparent />
          </mesh>
        )}
      </Canvas>

      {/* Agent Interaction Modal */}
      <AgentInteractionModal
        agent={selectedAgent}
        isOpen={showAgentModal}
        onClose={closeModals}
        onPayment={handlePaymentRequest}
        onQRScan={handleQRScanRequest}
      />

      {/* 3D Cube Payment Engine - Revolutionary AR Payment Interface */}
      <CubePaymentEngine
        agent={selectedAgent}
        isOpen={showCubePayment}
        onClose={closeModals}
        onPaymentComplete={handleCubePaymentComplete}
        paymentAmount={selectedAgent?.interaction_fee || 10.0}
        enabledMethods={[
          "crypto_qr",
          "virtual_card",
          "bank_qr",
          "voice_pay",
          "sound_pay",
          "btc_payments",
        ]}
      />

      {/* QR Scanner Overlay */}
      <QRScannerOverlay
        isOpen={showQRScanner}
        onClose={closeModals}
        onQRScanned={handleQRScanned}
        onError={handleQRScanError}
        expectedAgent={scanningForAgent}
        displayQRCode={currentQRData}
      />

      {/* Enhanced AR QR Notifications with scan status */}
      {arQRNotifications.length > 0 && (
        <div className="absolute top-20 right-4 z-50 space-y-2">
          {arQRNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm border ${
                notification.type === "payment"
                  ? "border-green-500/30 bg-green-500/20"
                  : notification.type === "scan-ready"
                  ? "border-purple-500/30 bg-purple-500/20 animate-pulse"
                  : "border-blue-500/30 bg-blue-500/20"
              } animate-fade-in`}
              style={{ minWidth: "250px" }}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    notification.type === "payment"
                      ? "bg-green-400"
                      : notification.type === "scan-ready"
                      ? "bg-purple-400 animate-pulse"
                      : "bg-blue-400"
                  }`}
                ></div>
                <span>{notification.message}</span>
              </div>
              {notification.scanData && (
                <div className="text-xs text-gray-300 mt-1">
                  {notification.scanData.amount} {notification.scanData.token}{" "}
                  to {notification.scanData.agent?.name}
                </div>
              )}
              {notification.type === "scan-ready" && (
                <div className="text-xs text-purple-300 mt-1 animate-pulse">
                  👆 Tap the floating QR code to pay
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enhanced QR Scanning Status Indicator */}
      {(isScanning || scanningStatus === "found") && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`bg-black/90 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm border ${
              scanningStatus === "scanning"
                ? "border-yellow-500/50 bg-yellow-500/10"
                : scanningStatus === "found"
                ? "border-green-500/50 bg-green-500/10"
                : "border-red-500/50 bg-red-500/10"
            }`}
          >
            <div className="flex items-center space-x-3">
              {scanningStatus === "scanning" && (
                <>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                  <span>Scanning for QR codes...</span>
                </>
              )}
              {scanningStatus === "found" && (
                <>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>📱 Tap to Scan & Pay</span>
                </>
              )}
              {scanningStatus === "error" && (
                <>
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>No QR codes found</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistent AR QR Code Overlay */}
      {persistentQRs.length > 0 && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <ARQRCodeFixed
            qrCodes={persistentQRs}
            onQRScanned={(scanData) => {
              console.log("🎯 Persistent AR QR scanned in 3D:", scanData);

              // Remove from persistent QRs
              setPersistentQRs((prev) =>
                prev.filter((qr) => qr.id !== scanData.id)
              );

              // Handle payment
              if (scanData.qrObject?.agent) {
                const paymentNotification = {
                  id: generateUniqueId(),
                  message: `Payment QR scanned for ${scanData.qrObject.agent.name}`,
                  type: "payment",
                  scanData: scanData,
                  timestamp: Date.now(),
                };

                setArQRNotifications((prev) => [...prev, paymentNotification]);

                setTimeout(() => {
                  setArQRNotifications((prev) =>
                    prev.filter((n) => n.id !== paymentNotification.id)
                  );
                }, 5000);
              }
            }}
            className="pointer-events-auto"
          />
        </div>
      )}
    </div>
  );
};

export default AR3DScene;
