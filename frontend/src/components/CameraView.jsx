import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CameraOff,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  AlertCircle,
} from "lucide-react";
import ARAgentOverlay from "./ARAgentOverlay";
import AgentInteractionModal from "./AgentInteractionModal";
import CubePaymentEngine from "./CubePaymentEngine";
import QRScannerOverlay from "./QRScannerOverlay";
import ARQRViewer from "./ARQRViewer";
import EnhancedPaymentQRModal from "./EnhancedPaymentQRModal";

const CameraView = ({
  isActive,
  onToggle,
  onError,
  className = "",
  showControls = true,
  agents = [],
  userLocation = null,
  onAgentInteraction = null,
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment"); // 'user' or 'environment'
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Agent interaction states
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showCubePayment, setShowCubePayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Legacy payment modal - being phased out

  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningForAgent, setScanningForAgent] = useState(null);
  const [currentQRData, setCurrentQRData] = useState(null); // Store generated QR code data

  // AR QR states
  const [showARQR, setShowARQR] = useState(true); // Enable AR QR by default
  const [arQRNotifications, setArQRNotifications] = useState([]);

  // Camera constraint levels - from simplest to most complex
  const getConstraints = (level = 0) => {
    const constraintLevels = [
      // Level 0: Most basic - just video
      { video: true, audio: false },

      // Level 1: Basic with facing mode
      {
        video: { facingMode: cameraFacing },
        audio: false,
      },

      // Level 2: Add basic resolution
      {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },

      // Level 3: Higher resolution
      {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },

      // Level 4: Full constraints (original)
      {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      },
    ];

    return constraintLevels[Math.min(level, constraintLevels.length - 1)];
  };

  // Start camera stream with retry logic
  const startCamera = async (constraintLevel = 0, attempt = 1) => {
    const maxAttempts = 3;
    const maxConstraintLevels = 5;

    try {
      setError(null);
      setIsRetrying(attempt > 1);

      // Enhanced camera availability and security checks
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg =
          "Camera not supported in this browser. Please use Chrome, Firefox, or Safari.";
        console.error("❌", errorMsg);
        setError(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return false;
      }

      // Check if we're on HTTPS or localhost (required for camera access)
      const isSecure =
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";
      if (!isSecure) {
        const errorMsg =
          "Camera access requires HTTPS. Please access the site via https:// or localhost.";
        console.error(
          "❌ Insecure context:",
          location.protocol,
          location.hostname
        );
        setError(errorMsg);
        if (onError) onError(new Error(errorMsg));
        return false;
      }

      console.log(
        `🎥 Starting camera (attempt ${attempt}/${maxAttempts}, constraint level ${constraintLevel})...`
      );
      console.log("🔍 Browser:", navigator.userAgent.substring(0, 100));
      console.log(
        "🔍 Secure context:",
        isSecure,
        "Protocol:",
        location.protocol
      );

      // Stop existing stream if any
      if (streamRef.current) {
        console.log("🛑 Stopping existing stream...");
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log("🔌 Stopped existing track:", track.kind);
        });
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Wait longer between attempts
      const delay = attempt > 1 ? 500 + attempt * 200 : 100;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Get constraints for this level
      const constraints = getConstraints(constraintLevel);
      console.log(
        "📱 Using constraints:",
        JSON.stringify(constraints, null, 2)
      );

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!stream || stream.getTracks().length === 0) {
        throw new Error("No camera stream received");
      }

      console.log(
        "✅ Camera stream acquired:",
        stream.getTracks().map((t) => `${t.kind}: ${t.label || "unnamed"}`)
      );
      streamRef.current = stream;

      // Attach stream to video element
      if (!videoRef.current) {
        throw new Error("Video element not available");
      }

      const video = videoRef.current;
      video.srcObject = stream;

      // Wait for video to load and start playing
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video load timeout"));
        }, 5000);

        const onLoadedMetadata = () => {
          console.log("📹 Video metadata loaded");
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onVideoError);
          resolve();
        };

        const onVideoError = (err) => {
          console.error("❌ Video element error:", err);
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onVideoError);
          reject(new Error("Video element failed to load stream"));
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("error", onVideoError);

        // Start playing
        video.play().catch((playErr) => {
          console.error("❌ Video play error:", playErr);
          clearTimeout(timeout);
          // Don't reject on play error, video might still work
          resolve();
        });
      });

      setIsStreaming(true);
      setRetryCount(0);
      setIsRetrying(false);
      console.log("✅ Camera stream started successfully");
    } catch (err) {
      console.error(
        `❌ Camera error (attempt ${attempt}):`,
        err.name,
        err.message
      );

      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Retry logic
      if (attempt < maxAttempts) {
        console.log(
          `🔄 Retrying camera access (${attempt + 1}/${maxAttempts})...`
        );
        setRetryCount(attempt);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return startCamera(constraintLevel, attempt + 1);
      } else if (constraintLevel < maxConstraintLevels - 1) {
        console.log(
          `🔄 Trying simpler constraints (level ${constraintLevel + 1})...`
        );
        setRetryCount(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return startCamera(constraintLevel + 1, 1);
      } else {
        // All attempts failed
        const errorMessage = getCameraErrorMessage(err);
        setError(errorMessage);
        setIsStreaming(false);
        setRetryCount(0);
        setIsRetrying(false);
        if (onError) onError(err);
      }
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    console.log("🛑 Stopping camera stream...");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🔌 Stopped track:", track.kind);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    console.log("✅ Camera stream stopped");
  };

  // Toggle camera on/off
  const toggleCamera = async () => {
    if (isStreaming) {
      stopCamera();
      if (onToggle) onToggle(false);
    } else {
      await startCamera();
      if (onToggle) onToggle(true);
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    console.log(
      "🔄 Switching camera from",
      cameraFacing,
      "to",
      cameraFacing === "environment" ? "user" : "environment"
    );

    const newFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(newFacing);

    if (isStreaming) {
      // Stop current stream
      stopCamera();

      // Wait a bit longer for cleanup
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Start with new camera
      await startCamera();
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-start camera if isActive prop is true
  useEffect(() => {
    if (isActive && !isStreaming) {
      startCamera();
    } else if (!isActive && isStreaming) {
      stopCamera();
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Debug agents prop changes
  useEffect(() => {
    console.log("📱 CameraView received agents:", {
      count: agents?.length || 0,
      agents:
        agents?.map((a) => ({ id: a.id, name: a.name, type: a.agent_type })) ||
        [],
    });
    console.log("📍 CameraView userLocation:", userLocation);
  }, [agents, userLocation]);

  // Get user-friendly error message
  const getCameraErrorMessage = (err) => {
    console.log("🔍 Camera error details:", err.name, err.message);

    if (err.name === "NotAllowedError") {
      return "Camera access denied. Please allow camera permissions and refresh the page.";
    } else if (err.name === "NotFoundError") {
      return "No camera found. Please connect a camera and try again.";
    } else if (err.name === "NotSupportedError") {
      return "Camera not supported by this browser. Try using Chrome or Firefox.";
    } else if (
      err.name === "NotReadableError" ||
      err.message?.includes("already in use")
    ) {
      return "Camera is busy. Please close other apps using the camera and try again.";
    } else if (err.name === "OverconstrainedError") {
      return "Camera settings not supported. Trying with basic settings...";
    } else if (err.message?.includes("Video element failed")) {
      return "Video display error. Please refresh the page and try again.";
    } else {
      return `Camera error: ${
        err.message || "Please refresh the page and try again."
      }`;
    }
  };

  // Handle agent click
  const handleAgentClick = (agent) => {
    console.log("🤖 Agent clicked:", agent.name);
    setSelectedAgent(agent);
    setShowAgentModal(true);

    if (onAgentInteraction) {
      onAgentInteraction(agent, "click");
    }
  };

  // Handle payment request - now launches 3D cube instead of modal
  const handlePaymentRequest = async (agent) => {
    console.log(
      "🎯 Payment requested for agent - launching 3D cube:",
      agent.name
    );

    // Stop the main camera to free up access for potential QR scanning
    if (isStreaming) {
      console.log("🛑 Stopping main camera for cube payment...");
      stopCamera();
    }

    setSelectedAgent(agent);
    setShowAgentModal(false);
    setShowCubePayment(true); // Launch revolutionary 3D cube payment system
    setShowPaymentModal(false); // Ensure old modal is closed
  };

  // Handle payment completion
  const handlePaymentComplete = (agent, paymentData) => {
    console.log("✅ Payment completed for agent:", agent.name, paymentData);
    setShowPaymentModal(false);
    setShowAgentModal(true); // Return to agent modal

    if (onAgentInteraction) {
      onAgentInteraction(agent, "payment_complete", paymentData);
    }
  };

  // Handle cube payment completion
  const handleCubePaymentComplete = (agent, paymentData) => {
    console.log(
      "✅ Cube payment completed for agent:",
      agent.name,
      paymentData
    );
    setShowCubePayment(false);
    setShowAgentModal(true); // Return to agent modal

    // Restart camera after payment
    if (!isStreaming) {
      console.log("🎥 Restarting camera after cube payment...");
      startCamera();
    }

    if (onAgentInteraction) {
      onAgentInteraction(agent, "payment_complete", paymentData);
    }
  };

  // Handle QR scan request
  const handleQRScanRequest = async (agent, paymentData = null) => {
    console.log("📷 QR scan requested for agent:", agent.name);

    // Store the QR data if provided
    if (paymentData) {
      console.log("💾 Storing QR data for scanning:", paymentData.uri);
      setCurrentQRData(paymentData.uri);
    }

    // Stop the main camera to free up access for QR scanner
    if (isStreaming) {
      console.log("🛑 Stopping main camera for QR scanner...");
      stopCamera();
    }

    setScanningForAgent(agent);
    setShowAgentModal(false);
    setShowPaymentModal(false); // Also close payment modal if open
    setShowQRScanner(true);
  };

  // Handle AR QR generation
  const handleARQRGenerated = (arQRCode) => {
    console.log("🌐 AR QR Code generated:", arQRCode);

    // Show notification
    const notification = {
      id: Date.now(),
      message: `AR QR Code created for ${arQRCode.agent?.name}`,
      type: "success",
    };

    setArQRNotifications((prev) => [...prev, notification]);

    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setArQRNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      );
    }, 3000);
  };

  // Handle AR QR scanning
  const handleARQRScanned = (scanData) => {
    console.log("🎯 AR QR Code scanned:", scanData);

    // Show success notification
    const notification = {
      id: Date.now(),
      message: `Payment of ${scanData.amount} USBDG+ processed!`,
      type: "success",
    };

    setArQRNotifications((prev) => [...prev, notification]);

    // Call parent handler if provided
    if (onAgentInteraction) {
      onAgentInteraction(scanData.agent, "ar_payment_complete", scanData);
    }

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setArQRNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      );
    }, 5000);
  };

  // Handle QR code scanned
  const handleQRScanned = async (qrData) => {
    console.log("📱 QR code scanned:", qrData);

    try {
      // Process the QR code and trigger payment
      if (qrData.contractAddress && qrData.recipient && qrData.amount) {
        // Create a payment URI that can be opened by MetaMask
        const paymentUri = qrData.rawData;

        // Try to open with MetaMask
        if (window.ethereum) {
          // Open MetaMask with the transaction
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

        // Restart the main camera after successful scan
        if (!isStreaming) {
          console.log("🎥 Restarting main camera after QR scan...");
          await startCamera();
        }

        if (onAgentInteraction) {
          onAgentInteraction(scanningForAgent, "qr_payment_initiated", qrData);
        }
      }
    } catch (error) {
      console.error("QR payment error:", error);
    }
  };

  // Handle QR scan error
  const handleQRScanError = (error) => {
    console.error("QR scan error:", error);
  };

  // Close modals
  const closeModals = async () => {
    console.log("🔄 Closing modals, restarting main camera...");
    setShowAgentModal(false);
    setShowPaymentModal(false);
    setShowCubePayment(false); // Close cube payment system
    setSelectedAgent(null);

    // Restart the main camera when closing modals
    if (!isStreaming) {
      console.log("🎥 Restarting main camera after modal close...");
      await startCamera();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="bg-black/50 border-purple-500/30 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-slate-900 overflow-hidden">
            {/* Video Element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${
                isStreaming ? "block" : "hidden"
              }`}
              autoPlay
              playsInline
              muted
            />

            {/* Placeholder when camera is off */}
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Camera View
                  </h3>
                  <p className="text-purple-200 mb-4">
                    {error
                      ? "Camera unavailable"
                      : "Press start to begin camera feed"}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display with Retry */}
            {error && (
              <div className="absolute top-4 left-4 right-4">
                <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        Camera Access Issue
                      </p>
                      <p className="text-red-100 text-xs mt-1">{error}</p>
                      {retryCount > 0 && (
                        <p className="text-red-200 text-xs mt-1">
                          Retry {retryCount}/3
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button
                      onClick={() => startCamera(0, 1)}
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      disabled={isRetrying}
                    >
                      {isRetrying ? "Retrying..." : "Try Again"}
                    </Button>
                    <Button
                      onClick={() => setError(null)}
                      size="sm"
                      variant="outline"
                      className="bg-transparent border-white/30 text-white hover:bg-white/10"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Retry Status */}
            {isRetrying && !error && (
              <div className="absolute top-4 left-4 right-4">
                <div className="bg-yellow-500/90 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      Retrying Camera Access
                    </p>
                    <p className="text-yellow-100 text-xs">
                      Attempt {retryCount + 1}/3
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Status Badge */}
            {isStreaming && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500 text-white flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>LIVE</span>
                </Badge>
              </div>
            )}

            {/* Camera Info */}
            {isStreaming && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {cameraFacing === "environment"
                    ? "Back Camera"
                    : "Front Camera"}
                </Badge>
              </div>
            )}

            {/* AR QR Notifications */}
            {arQRNotifications.length > 0 && (
              <div className="absolute top-20 right-4 space-y-2 z-50">
                {arQRNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`${
                      notification.type === "success"
                        ? "bg-green-900/80 border-green-500/30"
                        : "bg-red-900/80 border-red-500/30"
                    } backdrop-blur-sm`}
                  >
                    <CardContent className="p-3">
                      <p
                        className={`text-sm ${
                          notification.type === "success"
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {notification.message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Controls Overlay */}
            {showControls && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-center space-x-3">
                  {/* Main Toggle Button */}
                  <Button
                    onClick={toggleCamera}
                    size="lg"
                    className={`${
                      isStreaming
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white shadow-lg`}
                  >
                    {isStreaming ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Stop Camera
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>

                  {/* Switch Camera Button */}
                  {isStreaming && (
                    <Button
                      onClick={switchCamera}
                      variant="outline"
                      size="lg"
                      className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  )}

                  {/* Fullscreen Button */}
                  {isStreaming && (
                    <Button
                      onClick={toggleFullscreen}
                      variant="outline"
                      size="lg"
                      className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-5 h-5" />
                      ) : (
                        <Maximize className="w-5 h-5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* AR Agent Overlays */}
            {isStreaming && (
              <>
                {/* AR crosshair in center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-8 h-8 border-2 border-purple-400 rounded-full bg-purple-400/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  </div>
                </div>

                {/* AR Grid Lines */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="border border-purple-400/20"
                      ></div>
                    ))}
                  </div>
                </div>

                {/* AR Agent Overlay */}
                <ARAgentOverlay
                  agents={agents}
                  onAgentClick={handleAgentClick}
                  userLocation={userLocation}
                  cameraViewSize={{ width: 1280, height: 720 }}
                />

                {/* AR QR Code Viewer */}
                <ARQRViewer
                  isActive={showARQR && isStreaming}
                  userLocation={userLocation}
                  nearbyAgents={agents}
                  onQRScanned={handleARQRScanned}
                  className="absolute inset-0"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent Interaction Modal */}
      <AgentInteractionModal
        agent={selectedAgent}
        isOpen={showAgentModal}
        onClose={closeModals}
        onPayment={handlePaymentRequest}
        onQRScan={handleQRScanRequest}
      />

      {/* Payment QR Modal - Legacy (being phased out) */}
      <EnhancedPaymentQRModal
        agent={selectedAgent}
        isOpen={showPaymentModal}
        onClose={closeModals}
        onPaymentComplete={handlePaymentComplete}
        onARQRGenerated={handleARQRGenerated}
        onScanARQR={handleQRScanRequest}
        userLocation={userLocation}
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
        onClose={async () => {
          console.log("📱 Closing QR scanner, restarting main camera...");
          setShowQRScanner(false);
          setShowAgentModal(true);
          setCurrentQRData(null); // Clear stored QR data

          // Restart the main camera after closing QR scanner
          if (!isStreaming) {
            console.log("🎥 Restarting main camera...");
            await startCamera();
          }
        }}
        onQRScanned={handleQRScanned}
        onError={handleQRScanError}
        expectedAgent={scanningForAgent}
        displayQRCode={currentQRData}
      />
    </div>
  );
};

export default CameraView;
