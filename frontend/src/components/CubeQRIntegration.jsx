// Cube QR Integration Component - Enhanced User-Facing QR Display
// Connects existing cube "Crypto QR Code" button to dual-interactive QR codes

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import QRCode from "qrcode";
import { qrPaymentDataService } from "../services/qrPaymentDataService";

// Enhanced User-Facing QR Code Component with Dual Interaction
const UserFacingQRCode = ({
  qrData,
  position = [0, 0.5, -2],
  size = 1.8,
  onClicked,
  onScanned,
  onBackToCube,
  isActive = true,
}) => {
  const meshRef = useRef();
  const glowRef = useRef();
  const clickZoneRef = useRef();
  const [qrTexture, setQrTexture] = useState(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { gl } = useThree();

  // Generate high-quality QR texture optimized for scanning
  useEffect(() => {
    if (!qrData?.eip681URI) {
      console.warn("❌ CUBE QR: No QR data provided for texture generation");
      setHasError(true);
      return;
    }

    console.log("🎨 CUBE QR: Generating user-facing QR texture");
    console.log("- QR Data:", qrData.eip681URI);
    console.log(
      "- Payment Amount:",
      qrData.tokenInfo?.amount,
      qrData.tokenInfo?.symbol
    );

    const canvas = document.createElement("canvas");
    const canvasSize = 2048; // Ultra-high resolution for mobile scanning
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    QRCode.toCanvas(
      canvas,
      qrData.eip681URI,
      {
        width: canvasSize,
        margin: 6, // Larger margin for mobile camera scanning
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H", // Highest error correction for AR environment
      },
      (error) => {
        if (error) {
          console.error("❌ CUBE QR: Error generating QR texture:", error);
          setHasError(true);
          return;
        }

        console.log(
          "✅ CUBE QR: User-facing QR texture generated successfully"
        );
        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false;
        texture.minFilter = THREE.NearestFilter; // Crisp QR code edges
        texture.magFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        setQrTexture(texture);
        setHasError(false);
      }
    );
  }, [qrData]);

  // Enhanced animation loop - smooth floating and pulsing
  useFrame((state) => {
    if (!meshRef.current || !isActive) return;

    const time = state.clock.getElapsedTime();

    // Smooth floating animation - draws attention without being distracting
    const floatAmplitude = 0.08;
    const floatSpeed = 1.2;
    meshRef.current.position.y =
      position[1] + Math.sin(time * floatSpeed) * floatAmplitude;

    // Pulsing scale for attention - more pronounced when not hovered
    const pulseSpeed = 2.0;
    const pulseAmplitude = isHovered ? 0.03 : 0.06;
    const scale = size + Math.sin(time * pulseSpeed) * pulseAmplitude;
    meshRef.current.scale.setScalar(scale);

    // Enhanced glow effect animation
    if (glowRef.current) {
      const glowIntensity = 0.5 + Math.sin(time * 2.5) * 0.3;
      const glowColor = isHovered ? "#00ff88" : "#00ff00";
      glowRef.current.material.color.setHex(parseInt(glowColor.slice(1), 16));
      glowRef.current.material.opacity = glowIntensity;
    }

    setAnimationPhase(time);
  });

  // Enhanced click handler with visual feedback and dual interaction
  const handleClick = async (event) => {
    if (!isActive || hasError || isClicking) return;

    event.stopPropagation();
    console.log("🖱️ CUBE QR: QR code clicked for in-app payment");

    setIsClicking(true);

    try {
      // Visual feedback - quick scale animation
      if (meshRef.current) {
        const originalScale = meshRef.current.scale.x;
        meshRef.current.scale.setScalar(originalScale * 1.2);

        setTimeout(() => {
          if (meshRef.current) {
            meshRef.current.scale.setScalar(originalScale);
          }
        }, 200);
      }

      // Execute in-app payment using existing service
      const paymentResult = await qrPaymentDataService.handleQRClick(qrData);

      console.log("✅ CUBE QR: In-app payment completed:", paymentResult);

      // Notify parent component
      if (onClicked) {
        onClicked(paymentResult);
      }
    } catch (error) {
      console.error("❌ CUBE QR: Click payment failed:", error);
      alert(
        `Payment failed: ${error.message}\n\nTry scanning with your mobile wallet instead.`
      );
    } finally {
      setIsClicking(false);
    }
  };

  // Handle external scan tracking
  const handleScan = () => {
    console.log("📱 CUBE QR: QR scanned by external device");

    // Track scan for analytics
    const scanResult = qrPaymentDataService.handleQRScan(
      qrData,
      "mobile-camera"
    );

    // Notify parent component
    if (onScanned) {
      onScanned(scanResult);
    }
  };

  // Handle hover effects
  const handlePointerOver = () => {
    setIsHovered(true);
    gl.domElement.style.cursor = "pointer";
    console.log("👆 CUBE QR: QR code hovered - ready for click");
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    gl.domElement.style.cursor = "default";
  };

  if (hasError) {
    return (
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh position={position}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.8} />
          <Html center position={[0, 0, 0.01]}>
            <div className="bg-red-900/90 text-white px-4 py-3 rounded-lg text-center border border-red-500/50">
              <div className="text-lg font-bold mb-2">❌ QR Error</div>
              <div className="text-sm">Check console for details</div>
              <button
                onClick={onBackToCube}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
              >
                ← Back to Cube
              </button>
            </div>
          </Html>
        </mesh>
      </Billboard>
    );
  }

  if (!qrTexture) {
    return (
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh position={position}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial color="#333333" transparent opacity={0.8} />
          <Html center position={[0, 0, 0.01]}>
            <div className="bg-gray-900/90 text-white px-4 py-3 rounded-lg text-center border border-gray-500/50">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Generating QR...</span>
              </div>
            </div>
          </Html>
        </mesh>
      </Billboard>
    );
  }

  return (
    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
      <group ref={meshRef} position={position}>
        {/* Enhanced main QR Code Plane with dual interaction */}
        <mesh
          ref={clickZoneRef}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[size * 1.1, size * 1.1]} />
          <meshBasicMaterial
            map={qrTexture}
            transparent={true}
            opacity={0.98}
            toneMapped={false} // Prevent tone mapping for crisp QR codes
          />
        </mesh>

        {/* Enhanced glowing border with cube theme colors */}
        <mesh ref={glowRef} position={[0, 0, -0.001]}>
          <planeGeometry args={[size * 1.25, size * 1.25]} />
          <meshBasicMaterial
            color={isHovered ? "#00ff88" : "#00ff00"}
            transparent={true}
            opacity={0.4 + Math.sin(animationPhase * 2.5) * 0.2}
          />
        </mesh>

        {/* Outer glow effect for visibility */}
        <mesh position={[0, 0, -0.002]}>
          <planeGeometry args={[size * 1.4, size * 1.4]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent={true}
            opacity={0.2 + Math.sin(animationPhase * 1.5) * 0.1}
          />
        </mesh>

        {/* Corner alignment markers for scanning assistance */}
        {[
          [size * 0.45, size * 0.45, 0.001], // Top right
          [-size * 0.45, size * 0.45, 0.001], // Top left
          [size * 0.45, -size * 0.45, 0.001], // Bottom right
          [-size * 0.45, -size * 0.45, 0.001], // Bottom left
        ].map((pos, index) => (
          <mesh key={index} position={pos}>
            <boxGeometry args={[0.06, 0.06, 0.01]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.9} />
          </mesh>
        ))}

        {/* Dual interaction instructions */}
        <Html
          position={[0, -size / 2 - 0.5, 0]}
          center
          distanceFactor={10}
          occlude
        >
          <div
            className={`px-4 py-3 rounded-lg text-center font-medium border ${
              isHovered
                ? "bg-green-500/95 text-white border-green-400 shadow-lg"
                : "bg-gray-900/90 text-green-300 border-green-500/50"
            } transition-all duration-200`}
          >
            <div className="text-lg font-bold mb-1">
              {isClicking ? "Processing..." : "💳 Pay Now"}
            </div>
            <div className="text-sm space-y-1">
              <div>
                👆 <strong>Click to Pay</strong> (MetaMask)
              </div>
              <div>
                📱 <strong>Scan with Mobile</strong> (Any Wallet)
              </div>
            </div>
            {qrData?.tokenInfo && (
              <div className="mt-2 text-xs opacity-90">
                {qrData.tokenInfo.amount} {qrData.tokenInfo.symbol} •{" "}
                {qrData.networkInfo?.name}
              </div>
            )}
          </div>
        </Html>

        {/* Payment information display */}
        {qrData?.tokenInfo && (
          <Html
            position={[0, size / 2 + 0.4, 0]}
            center
            distanceFactor={12}
            occlude
          >
            <div className="bg-green-900/90 text-green-200 px-4 py-2 rounded-lg text-center border border-green-500/50">
              <div className="font-bold text-white">
                ${qrData.tokenInfo.amount} USD
              </div>
              <div className="text-sm">
                {qrData.tokenInfo.amount} {qrData.tokenInfo.symbol}
              </div>
              <div className="text-xs opacity-80">
                {qrData.networkInfo?.name || "Blockchain"}
              </div>
            </div>
          </Html>
        )}

        {/* Agent name display (from cube context) */}
        {qrData?.agentInfo && (
          <Html
            position={[size / 2 + 0.3, 0, 0]}
            center
            distanceFactor={15}
            occlude
          >
            <div className="bg-blue-900/90 text-blue-200 px-3 py-2 rounded-l-lg text-sm font-medium border-l border-t border-b border-blue-500/50">
              💎 {qrData.agentInfo.name}
            </div>
          </Html>
        )}

        {/* Back to Cube button */}
        <Html
          position={[0, -size / 2 - 1.3, 0]}
          center
          distanceFactor={12}
          occlude
        >
          <button
            onClick={onBackToCube}
            className="bg-gray-800/90 hover:bg-gray-700/90 text-white px-6 py-3 rounded-lg font-medium border border-gray-600/50 transition-all duration-200 hover:scale-105"
          >
            ← Back to Cube
          </button>
        </Html>
      </group>
    </Billboard>
  );
};

// AR Scene Container for User-Facing QR Display
const CubeQRScene = ({ qrData, onClicked, onScanned, onBackToCube }) => {
  return (
    <Canvas
      camera={{
        position: [0, 0, 3],
        fov: 75,
        near: 0.1,
        far: 1000,
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 30,
      }}
      gl={{
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      }}
    >
      {/* Enhanced lighting for QR visibility */}
      <ambientLight intensity={0.9} />
      <pointLight position={[0, 0, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[3, 3, 3]} intensity={0.4} color="#00ff00" />
      <pointLight position={[-3, -3, 3]} intensity={0.3} color="#0080ff" />

      {/* User-facing QR code display */}
      <UserFacingQRCode
        qrData={qrData}
        position={[0, 0.2, -2]}
        size={1.8}
        onClicked={onClicked}
        onScanned={onScanned}
        onBackToCube={onBackToCube}
        isActive={true}
      />
    </Canvas>
  );
};

// Main Cube QR Integration Component
const CubeQRIntegration = ({
  isVisible = false,
  qrData = null,
  onPaymentComplete,
  onBackToCube,
  onClose,
  className = "",
}) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsActive(isVisible && !!qrData);
  }, [isVisible, qrData]);

  // Handle successful click payment
  const handleQRClicked = async (paymentResult) => {
    console.log(
      "✅ CUBE QR INTEGRATION: Payment completed via click:",
      paymentResult
    );

    if (onPaymentComplete) {
      onPaymentComplete(paymentResult, "click");
    }
  };

  // Handle external scan tracking
  const handleQRScanned = (scanResult) => {
    console.log("📱 CUBE QR INTEGRATION: External scan tracked:", scanResult);

    if (onPaymentComplete) {
      onPaymentComplete(scanResult, "scan");
    }
  };

  // Handle back to cube
  const handleBackToCube = () => {
    console.log("🔙 CUBE QR INTEGRATION: Returning to cube view");

    // Clear QR session
    qrPaymentDataService.clearSession();

    if (onBackToCube) {
      onBackToCube();
    }
  };

  // Handle close
  const handleClose = () => {
    console.log("❌ CUBE QR INTEGRATION: Closing QR view");

    // Clear QR session
    qrPaymentDataService.clearSession();

    if (onClose) {
      onClose();
    }
  };

  if (!isActive) return null;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-40 w-10 h-10 bg-red-500/80 hover:bg-red-600/90 rounded-full flex items-center justify-center text-white text-lg font-bold backdrop-blur-sm border border-red-400/50 transition-all duration-200"
      >
        ×
      </button>

      {/* QR Integration Status */}
      <div className="absolute top-4 left-4 z-40 bg-green-500/90 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-sm font-bold border border-green-400/50">
        ✅ Dual-Interactive QR Active
      </div>

      {/* User-facing QR display */}
      <CubeQRScene
        qrData={qrData}
        onClicked={handleQRClicked}
        onScanned={handleQRScanned}
        onBackToCube={handleBackToCube}
      />

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-center border border-gray-500/50">
          <div className="text-sm font-medium">
            <div className="mb-1">
              🎯 <strong>Dual Payment Options:</strong>
            </div>
            <div className="text-xs space-y-1 opacity-90">
              <div>🖱️ Click QR → MetaMask opens → Pay instantly</div>
              <div>📱 Scan QR → Any wallet → External payment</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CubeQRIntegration;
