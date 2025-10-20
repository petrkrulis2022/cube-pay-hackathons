import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { morphPaymentService } from "../services/morphPaymentService.js";
import { dynamicQRService } from "../services/dynamicQRService.js";
import { evmPaymentService } from "../services/evmPaymentService.js";
import { qrPaymentDataService } from "../services/qrPaymentDataService.js";

// Animation hook for rotating cube
function useRotatingCube(ref, isActive) {
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
      if (isActive) {
        ref.current.rotation.x += delta * 0.3;
      }
    }
  });
}

// Face component for interactive cube faces
function CubeFace({ position, rotation, color, onClick, text, isActive }) {
  const meshRef = useRef();

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
        scale={isActive ? [1.1, 1.1, 1.1] : [1, 1, 1]}
      >
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial
          color={isActive ? "#4CAF50" : color}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
}

// QR Display component for user-facing QR codes
function QRDisplay({ qrData, position, onClose, onQRClick }) {
  if (!qrData) return null;

  const handleQRClick = async () => {
    console.log("🎯 QR Display clicked!");
    if (onQRClick) {
      await onQRClick();
    }
  };

  return (
    <Billboard position={position}>
      <group>
        {/* QR Code Background */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.2, 1.2]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* QR Code Image - CLICKABLE */}
        <mesh
          onClick={handleQRClick}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "default")}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial map={qrData.texture} transparent={true} />
        </mesh>

        {/* Close Button */}
        <mesh
          position={[0.6, 0.6, 0.01]}
          onClick={onClose}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "default")}
        >
          <circleGeometry args={[0.1]} />
          <meshStandardMaterial color="red" />
        </mesh>

        {/* Close X */}
        <Text
          position={[0.6, 0.6, 0.02]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          X
        </Text>

        {/* Instructions */}
        <Text
          position={[0, -0.7, 0]}
          fontSize={0.06}
          color="black"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
        >
          {"CLICK QR to Pay Now | Scan with Mobile"}
        </Text>
      </group>
    </Billboard>
  );
}

// Main Cube Payment Handler Component
function CubePaymentHandler({
  agentData,
  selectedAgent,
  onPaymentComplete,
  className = "",
}) {
  const [activeFace, setActiveFace] = useState(null);
  const [qrData, setQRData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const cubeRef = useRef();

  // Use the rotating cube animation
  useRotatingCube(cubeRef, activeFace !== null);

  // Handle face click events
  const handleFaceClick = async (method) => {
    console.log("CUBE CLICK: Face clicked -", method);

    try {
      setIsLoading(true);
      setError(null);
      setActiveFace(method);

      if (!selectedAgent || !agentData) {
        throw new Error("No agent selected for payment");
      }

      // Get agent data for payment
      const agent = agentData.find((a) => a.id === selectedAgent);
      if (!agent) {
        throw new Error("Selected agent not found in data");
      }

      let result;
      const successCheck = "\u2713"; // Unicode check mark

      switch (method) {
        case "morph":
          console.log(
            successCheck + " CUBE QR INTEGRATION: Generating Morph QR..."
          );
          result = await morphPaymentService.generateQR(agent);
          break;

        case "dynamic":
          console.log(
            successCheck + " CUBE QR INTEGRATION: Generating Dynamic QR..."
          );
          result = await dynamicQRService.generateQR(agent);
          break;

        case "evm":
          console.log(
            successCheck + " CUBE QR INTEGRATION: Generating EVM QR..."
          );
          result = await evmPaymentService.generateQR(agent);
          break;

        case "qr":
          console.log(
            successCheck + " CUBE QR INTEGRATION: Generating Crypto QR..."
          );
          result = await qrPaymentDataService.generateCubeQRPayment(agent);
          break;

        default:
          throw new Error("Unknown payment method: " + method);
      }

      if (result && result.qrCodeUrl) {
        // Create texture from QR code
        const texture = new THREE.TextureLoader().load(result.qrCodeUrl);

        // Get user-facing position
        const userPosition = qrPaymentDataService.getUserFacingPosition();

        setQRData({
          texture,
          position: userPosition,
          scannable: result.scannable || false,
          clickable: result.clickable || false,
          paymentData: result,
        });

        console.log(
          successCheck +
            " CUBE QR INTEGRATION: QR generated successfully for " +
            method
        );
      } else {
        throw new Error("Failed to generate QR code");
      }
    } catch (err) {
      console.error("CUBE QR ERROR:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR code interaction
  const handleQRClick = async () => {
    if (!qrData || !qrData.paymentData) return;

    try {
      console.log("🔥 QR CLICK: Processing payment...");
      setIsLoading(true);

      // Use the dynamicQRService's handleQRClick method for direct transactions
      const result = await dynamicQRService.handleQRClick(qrData.paymentData);

      if (result.success) {
        console.log(
          "✅ PAYMENT SUCCESS: Completed via " + activeFace + ":",
          result
        );

        // Show success message
        setError(null);

        // Close QR display after delay
        setTimeout(() => {
          setQRData(null);
          setActiveFace(null);
        }, 2000);

        // Notify parent component
        if (onPaymentComplete) {
          onPaymentComplete(result);
        }
      } else {
        throw new Error(result.error || "Payment failed");
      }
    } catch (err) {
      console.error("❌ QR PAYMENT ERROR:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Close QR display
  const closeQR = () => {
    setQRData(null);
    setActiveFace(null);
    setError(null);
  };

  // Reset error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className={className} style={{ width: "100%", height: "400px" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />

        <group ref={cubeRef}>
          {/* Front Face - Morph */}
          <CubeFace
            position={[0, 0, 0.5]}
            rotation={[0, 0, 0]}
            color="#FF6B6B"
            text="Morph Chain"
            onClick={() => handleFaceClick("morph")}
            isActive={activeFace === "morph"}
          />

          {/* Back Face - Dynamic */}
          <CubeFace
            position={[0, 0, -0.5]}
            rotation={[0, Math.PI, 0]}
            color="#4ECDC4"
            text="Dynamic QR"
            onClick={() => handleFaceClick("dynamic")}
            isActive={activeFace === "dynamic"}
          />

          {/* Right Face - EVM */}
          <CubeFace
            position={[0.5, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            color="#45B7D1"
            text="EVM Payment"
            onClick={() => handleFaceClick("evm")}
            isActive={activeFace === "evm"}
          />

          {/* Left Face - QR Crypto */}
          <CubeFace
            position={[-0.5, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            color="#96CEB4"
            text="Crypto QR Code"
            onClick={() => handleFaceClick("qr")}
            isActive={activeFace === "qr"}
          />

          {/* Top Face - Info */}
          <CubeFace
            position={[0, 0.5, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            color="#FFEAA7"
            text="Payment Cube"
            onClick={() => {}}
            isActive={false}
          />

          {/* Bottom Face - Logo */}
          <CubeFace
            position={[0, -0.5, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            color="#DDA0DD"
            text="AgentSphere"
            onClick={() => {}}
            isActive={false}
          />
        </group>

        {/* QR Display */}
        {qrData && (
          <QRDisplay
            qrData={qrData}
            position={qrData.position}
            onClose={closeQR}
            onQRClick={handleQRClick}
          />
        )}

        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "18px",
          }}
        >
          Generating QR Code...
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            right: "10px",
            background: "rgba(255, 0, 0, 0.9)",
            color: "white",
            padding: "10px",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default CubePaymentHandler;
