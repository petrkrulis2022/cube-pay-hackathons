import React, { useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import morphPaymentService from "../services/morphPaymentService";
import solanaPaymentService from "../services/solanaPaymentService";
import { dynamicQRService } from "../services/dynamicQRService"; // Add dynamic QR service
import ccipConfigService from "../services/ccipConfigService"; // CCIP transaction building (default export)
import { hederaWalletService } from "../services/hederaWalletService";
import * as revolutBankService from "../services/revolutBankService"; // Revolut Bank QR service
import * as revolutVirtualCardService from "../services/revolutVirtualCardService"; // Revolut Virtual Card service
import { supabase } from "../lib/supabase";
import QRCode from "react-qr-code";
import IntermediatePaymentModal from "./IntermediatePaymentModal"; // Transaction validation modal
import RevolutBankQRModal from "./RevolutBankQRModal"; // Revolut Bank QR modal
import { RevolutVirtualCard } from "./RevolutVirtualCard"; // Revolut Virtual Card component
import { usePaymentStatus } from "../hooks/usePaymentStatus"; // Real-time payment status hook

// AgentSphere Payment Configuration Reader
const getAgentPaymentConfig = async (agentId) => {
  try {
    console.log("🔍 Reading payment configuration for agent:", agentId);

    if (!supabase) {
      console.warn("⚠️ Supabase not configured, using default payment methods");
      return {
        enabledMethods: ["crypto_qr"],
        config: {},
      };
    }

    // Query AgentSphere database for payment configuration
    const { data, error } = await supabase
      .from("deployed_objects")
      .select(
        "payment_methods, payment_config, agent_wallet_address, payment_recipient_address"
      )
      .eq("id", agentId)
      .single();

    if (error) {
      console.warn(
        "⚠️ Failed to read payment config from AgentSphere:",
        error.message
      );
      return {
        enabledMethods: ["crypto_qr"], // Fallback to crypto QR only
        config: {},
      };
    }

    if (!data) {
      console.warn("⚠️ No payment configuration found for agent");
      return {
        enabledMethods: ["crypto_qr"],
        config: {},
      };
    }

    console.log("✅ Payment configuration loaded:", data);

    // Parse payment methods configuration
    const paymentMethods = data.payment_methods || {};
    const enabledMethods = [];

    // Check each payment method
    if (paymentMethods.crypto_qr?.enabled || !paymentMethods.crypto_qr) {
      enabledMethods.push("crypto_qr"); // Always enable crypto QR as fallback
    }

    if (paymentMethods.virtual_card?.enabled) {
      enabledMethods.push("virtual_card");
    }

    if (paymentMethods.bank_qr?.enabled) {
      enabledMethods.push("bank_qr");
    }

    if (paymentMethods.voice_pay?.enabled) {
      enabledMethods.push("voice_pay");
    }

    if (paymentMethods.sound_pay?.enabled) {
      enabledMethods.push("sound_pay");
    }

    // Always show BTC payments for users
    enabledMethods.push("btc_payments");

    return {
      enabledMethods,
      config: {
        paymentMethods,
        paymentConfig: data.payment_config || {},
        walletAddress: data.agent_wallet_address,
        recipientAddress: data.payment_recipient_address,
      },
    };
  } catch (error) {
    console.error("❌ Error reading payment configuration:", error);
    return {
      enabledMethods: ["crypto_qr"], // Safe fallback
      config: {},
    };
  }
};

// 3D Cube Component with Interactive Faces
const PaymentCube = ({
  agent,
  onFaceSelected,
  handleFaceClick,
  actualEnabledMethods = ["crypto_qr"],
  cubeRef,
  isVisible = true,
  isInitializing = false,
}) => {
  const meshRef = useRef();
  const [hoveredFace, setHoveredFace] = useState(null);
  const [selectedFace, setSelectedFace] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [rotationVelocity, setRotationVelocity] = useState({ x: 0, y: 0 });
  const { camera, viewport, gl } = useThree();

  // Payment method configuration
  const paymentMethods = {
    crypto_qr: {
      icon: "📱", // QR code icon will be added in text
      text: "Crypto QR",
      color: "#00ff66",
      description: "",
    },
    virtual_card: {
      icon: "💳",
      text: "Virtual Card",
      color: "#0088ff",
      description: "",
    },
    bank_qr: {
      icon: "🔲", // QR code icon instead of bank
      text: "Bank QR",
      color: "#0066cc",
      description: "",
    },
    voice_pay: {
      icon: "🎤", // Microphone icon for voice
      text: "Voice Pay",
      color: "#9900ff",
      description: "",
    },
    sound_pay: {
      icon: "🎵",
      text: "Sound Pay",
      color: "#ff6600",
      description: "",
    },
    btc_payments: {
      icon: "🪙", // Changed from ₿ to 🪙 for better visibility
      text: "BTC Payments",
      color: "#f7931a",
      description: "",
    },
  };

  // Get enabled payment methods
  const enabledFaces = Object.keys(paymentMethods).filter((method) =>
    actualEnabledMethods.includes(method)
  );

  // Debug logging for BTC payments visibility
  React.useEffect(() => {
    console.log("🔍 Cube Debug - actualEnabledMethods:", actualEnabledMethods);
    console.log("🔍 Cube Debug - enabledFaces:", enabledFaces);
    console.log(
      "🔍 Cube Debug - paymentMethods keys:",
      Object.keys(paymentMethods)
    );
    console.log(
      "🔍 Cube Debug - BTC payments included:",
      enabledFaces.includes("btc_payments")
    );
    console.log(
      "🔍 Cube Debug - Number of faces to render:",
      enabledFaces.length
    );
  }, [actualEnabledMethods, enabledFaces]);

  // Add immediate logging on every render
  console.log("🖼️ Rendering cube with methods:", actualEnabledMethods);
  console.log("🖼️ Enabled faces for rendering:", enabledFaces);

  // Calculate which face is most visible to camera
  const getFrontFace = () => {
    if (!meshRef.current) return 0;

    const rotation = meshRef.current.rotation;
    const normalizedY =
      ((rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const faceIndex = Math.round(normalizedY / (Math.PI / 3)) % 6;
    return Math.max(0, Math.min(enabledFaces.length - 1, faceIndex));
  };

  // Enhanced auto-rotation and pulsing animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isRotating && !isDragging) {
        // Gentle auto-rotation with slight variation
        meshRef.current.rotation.y += delta * 0.25;
        meshRef.current.rotation.x += delta * 0.08;

        // Add subtle pulsing scale effect
        const time = state.clock.getElapsedTime();
        const scale = 1 + Math.sin(time * 2) * 0.02;
        meshRef.current.scale.setScalar(scale);
      } else if (
        !isDragging &&
        (Math.abs(rotationVelocity.x) > 0.01 ||
          Math.abs(rotationVelocity.y) > 0.01)
      ) {
        // Apply momentum after drag
        meshRef.current.rotation.y += rotationVelocity.y * delta * 2;
        meshRef.current.rotation.x += rotationVelocity.x * delta * 2;

        // Decay velocity
        setRotationVelocity({
          x: rotationVelocity.x * 0.95,
          y: rotationVelocity.y * 0.95,
        });
      }

      // Always apply subtle floating animation
      if (!isDragging) {
        const time = state.clock.getElapsedTime();
        meshRef.current.position.y = Math.sin(time * 1.5) * 0.1;
      }
    }
  });

  // Handle cube click - select front-facing payment method
  const handleCubeClick = (event) => {
    event.stopPropagation();

    // Prevent clicks during initialization or dragging
    if (isInitializing) {
      console.log("⏳ Cube initializing, ignoring cube click");
      return;
    }

    if (isDragging) return; // Don't select if we're dragging

    const frontFaceIndex = getFrontFace();
    const activeFace = enabledFaces[frontFaceIndex];

    console.log(
      "🎯 Cube clicked! Active face:",
      activeFace,
      "Index:",
      frontFaceIndex
    );

    setSelectedFace(frontFaceIndex);
    setIsRotating(false);

    // Dispatch events for CubePaymentHandler
    if (activeFace) {
      switch (activeFace) {
        case "crypto_qr":
          console.log("📱 Dispatching crypto-qr-selected event");
          document.dispatchEvent(
            new CustomEvent("crypto-qr-selected", {
              detail: {
                method: "crypto_qr",
                agent: agent,
                face: activeFace,
                config: paymentMethods[activeFace],
              },
            })
          );
          break;

        case "virtual_card":
          console.log("💳 Dispatching virtual-card-selected event");
          document.dispatchEvent(
            new CustomEvent("virtual-card-selected", {
              detail: {
                method: "virtual_card",
                agent: agent,
                face: activeFace,
                config: paymentMethods[activeFace],
              },
            })
          );
          break;

        case "bank_qr":
          console.log("🔲 Dispatching bank-qr-selected event");
          document.dispatchEvent(
            new CustomEvent("bank-qr-selected", {
              detail: {
                method: "bank_qr",
                agent: agent,
                face: activeFace,
                config: paymentMethods[activeFace],
              },
            })
          );
          break;

        case "voice_pay":
          console.log("🎤 Dispatching voice-pay-selected event");
          document.dispatchEvent(
            new CustomEvent("voice-pay-selected", {
              detail: {
                method: "voice_pay",
                agent: agent,
                face: activeFace,
                config: paymentMethods[activeFace],
              },
            })
          );
          break;

        case "sound_pay":
          console.log("🎵 Dispatching sound-pay-selected event");
          document.dispatchEvent(
            new CustomEvent("sound-pay-selected", {
              detail: {
                method: "sound_pay",
                agent: agent,
                face: activeFace,
                config: paymentMethods[activeFace],
              },
            })
          );
          break;

        case "btc_payments":
          console.log("₿ Dispatching btc-payments-selected event");
          document.dispatchEvent(
            new CustomEvent("btc-payments-selected", {
              detail: {
                method: "btc_payments",
                agent: agent,
                face: activeFace,
                config: paymentMethods[activeFace],
              },
            })
          );
          break;

        default:
          console.log("❓ Unknown payment method:", activeFace);
      }
    }

    // Call existing onFaceSelected callback for backward compatibility
    if (onFaceSelected && activeFace) {
      onFaceSelected(activeFace, paymentMethods[activeFace]);
    }
  };

  // Enhanced mouse controls with useCallback to prevent re-creation
  const handlePointerDown = useCallback(
    (event) => {
      setIsDragging(true);
      setIsRotating(false);
      setLastMousePos({ x: event.clientX, y: event.clientY });
      gl.domElement.style.cursor = "grabbing";
    },
    [gl]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;

      // Apply rotation
      if (meshRef.current) {
        meshRef.current.rotation.y += deltaX * 0.01;
        meshRef.current.rotation.x += deltaY * 0.01;

        // Allow full 360-degree rotation on both axes to access all 6 faces
        // No rotation limits - full freedom to view top and bottom faces
      }

      // Store velocity for momentum
      setRotationVelocity({
        x: deltaY * 0.01,
        y: deltaX * 0.01,
      });

      setLastMousePos({ x: event.clientX, y: event.clientY });
    },
    [isDragging, lastMousePos]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    gl.domElement.style.cursor = "grab";

    // Resume auto-rotation after a delay
    setTimeout(() => {
      setIsRotating(true);
    }, 3000);
  }, [gl]);

  // Touch controls for mobile with useCallback
  const handleTouchStart = useCallback((event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      setIsDragging(true);
      setIsRotating(false);
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
    }
  }, []);

  const handleTouchMove = useCallback(
    (event) => {
      if (!isDragging || event.touches.length !== 1) return;

      event.preventDefault();
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastMousePos.x;
      const deltaY = touch.clientY - lastMousePos.y;

      if (meshRef.current) {
        meshRef.current.rotation.y += deltaX * 0.008;
        meshRef.current.rotation.x += deltaY * 0.008;

        // Allow full 360-degree rotation on both axes to access all 6 faces
        // No rotation limits - full freedom to view top and bottom faces
      }

      setRotationVelocity({
        x: deltaY * 0.008,
        y: deltaX * 0.008,
      });

      setLastMousePos({ x: touch.clientX, y: touch.clientY });
    },
    [isDragging, lastMousePos]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTimeout(() => {
      setIsRotating(true);
    }, 3000);
  }, []);

  // Add global event listeners for drag
  useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    canvas.style.cursor = "grab";

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.style.cursor = "default";
    };
  }, [gl, handlePointerMove, handlePointerUp, handleTouchMove, handleTouchEnd]);

  if (!isVisible) return null;

  return (
    <group>
      {/* Main Payment Cube */}
      <mesh
        ref={meshRef}
        position={[0, 0, -3]}
        onClick={handleCubeClick}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onPointerOver={() => {
          setHoveredFace(true);
          gl.domElement.style.cursor = "grab";
        }}
        onPointerOut={() => {
          setHoveredFace(false);
          if (!isDragging) gl.domElement.style.cursor = "default";
        }}
      >
        <boxGeometry args={[2.5, 2.5, 2.5]} />
        <meshStandardMaterial
          color={hoveredFace ? "#00ff88" : "#22ff44"}
          transparent
          opacity={0.95}
          emissive={hoveredFace ? "#00aa44" : "#004422"}
          emissiveIntensity={hoveredFace ? 1.2 : 0.9}
          roughness={0.05}
          metalness={0.7}
          envMapIntensity={1.5}
        />

        {/* Face Textures - Create faces with payment methods using Text */}
        {enabledFaces.map((method, index) => {
          const config = paymentMethods[method];
          const faceIndex = index % 6;

          const facePositions = [
            [1.24, 0, 0], // Right face
            [-1.24, 0, 0], // Left face
            [0, 1.24, 0], // Top face
            [0, -1.24, 0], // Bottom face
            [0, 0, 1.24], // Front face
            [0, 0, -1.24], // Back face
          ];

          const faceRotations = [
            [0, Math.PI / 2, 0], // Right
            [0, -Math.PI / 2, 0], // Left
            [-Math.PI / 2, 0, 0], // Top
            [Math.PI / 2, 0, 0], // Bottom
            [0, 0, 0], // Front
            [0, Math.PI, 0], // Back
          ];

          // Text positions - slightly offset from face to float in front
          const textOffsets = [
            [0.1, 0, 0], // Right face - offset in +X
            [-0.1, 0, 0], // Left face - offset in -X
            [0, 0.1, 0], // Top face - offset in +Y
            [0, -0.1, 0], // Bottom face - offset in -Y
            [0, 0, 0.1], // Front face - offset in +Z
            [0, 0, -0.1], // Back face - offset in -Z
          ];

          const basePosition = facePositions[faceIndex];
          const textOffset = textOffsets[faceIndex];
          const textPosition = [
            basePosition[0] + textOffset[0],
            basePosition[1] + textOffset[1],
            basePosition[2] + textOffset[2],
          ];
          const isActiveFace = getFrontFace() === index;

          return (
            <group key={`face-${method}`}>
              {/* 3D Extruded Button - sticks out from cube face */}
              <mesh
                position={[
                  facePositions[faceIndex][0] + textOffsets[faceIndex][0] * 2,
                  facePositions[faceIndex][1] + textOffsets[faceIndex][1] * 2,
                  facePositions[faceIndex][2] + textOffsets[faceIndex][2] * 2,
                ]}
                rotation={faceRotations[faceIndex]}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`🔥 3D Face button clicked: ${method}`);
                  handleFaceClick(method, faceIndex);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  gl.domElement.style.cursor = "pointer";
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  gl.domElement.style.cursor = "grab";
                }}
              >
                <boxGeometry args={[2.4, 2.4, 0.15]} />
                <meshStandardMaterial
                  color={method === "btc_payments" ? "#f7931a" : config.color}
                  transparent
                  opacity={isActiveFace ? 1.0 : 0.9}
                  emissive={
                    method === "btc_payments"
                      ? "#803d00"
                      : isActiveFace
                      ? "#003300"
                      : "#001100"
                  }
                  emissiveIntensity={method === "btc_payments" ? 0.5 : 0.3}
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>

              {/* Button face surface for better text contrast */}
              <mesh
                position={[
                  facePositions[faceIndex][0] + textOffsets[faceIndex][0] * 2.1,
                  facePositions[faceIndex][1] + textOffsets[faceIndex][1] * 2.1,
                  facePositions[faceIndex][2] + textOffsets[faceIndex][2] * 2.1,
                ]}
                rotation={faceRotations[faceIndex]}
              >
                <planeGeometry args={[2.3, 2.3]} />
                <meshBasicMaterial
                  color={
                    method === "btc_payments"
                      ? "#fff5e6"
                      : isActiveFace
                      ? "#ffffff"
                      : "#f8f8f8"
                  }
                  transparent
                  opacity={0.95}
                />
              </mesh>

              {/* Icon text - positioned on the 3D button */}
              <Text
                position={[
                  facePositions[faceIndex][0] + textOffsets[faceIndex][0] * 2.2,
                  facePositions[faceIndex][1] +
                    textOffsets[faceIndex][1] * 2.2 +
                    0.4,
                  facePositions[faceIndex][2] + textOffsets[faceIndex][2] * 2.2,
                ]}
                rotation={faceRotations[faceIndex]}
                fontSize={0.6}
                color="#000000"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                outlineWidth={0.1}
                outlineColor="#ffffff"
              >
                {config.icon}
              </Text>

              {/* Method name - with multi-line support for long text */}
              {config.text.length > 15 ? (
                // Multi-line text for long payment method names
                <>
                  <Text
                    position={[
                      textPosition[0],
                      textPosition[1] + 0.1,
                      textPosition[2],
                    ]}
                    rotation={faceRotations[faceIndex]}
                    fontSize={0.28}
                    color="#000000"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.1}
                    outlineColor="#ffffff"
                    fontWeight="bold"
                  >
                    {config.text.split(" - ")[0]}
                  </Text>
                  <Text
                    position={[
                      textPosition[0],
                      textPosition[1] - 0.2,
                      textPosition[2],
                    ]}
                    rotation={faceRotations[faceIndex]}
                    fontSize={0.28}
                    color="#000000"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.1}
                    outlineColor="#ffffff"
                    fontWeight="bold"
                  >
                    {config.text.split(" - ")[1] || ""}
                  </Text>
                </>
              ) : (
                // Single line text for short payment method names
                <Text
                  position={[
                    textPosition[0],
                    textPosition[1] + 0.1,
                    textPosition[2],
                  ]}
                  rotation={faceRotations[faceIndex]}
                  fontSize={0.26}
                  color="#000000"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.1}
                  outlineColor="#ffffff"
                  fontWeight="bold"
                >
                  {config.text}
                </Text>
              )}

              {/* Method-specific action text with larger font and better contrast */}
              <Text
                position={[
                  textPosition[0],
                  textPosition[1] - 0.7,
                  textPosition[2],
                ]}
                rotation={faceRotations[faceIndex]}
                fontSize={0.18}
                color="#000000"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.08}
                outlineColor="#ffffff"
                fontWeight="bold"
              >
                {method === "virtual_card"
                  ? "Tap To Pay"
                  : method === "voice_pay"
                  ? "Tap To Speak"
                  : method === "sound_pay"
                  ? "Tap To Pay"
                  : method.includes("qr")
                  ? "Tap To Scan"
                  : method === "btc_payments"
                  ? "Tap To Select"
                  : "Tap To Select"}
              </Text>
            </group>
          );
        })}
      </mesh>

      {/* Floating "Pay With" Text - moved right above cube */}
      <Html position={[2, 2, -3]} transform>
        <div
          style={{
            color: "#00ff00",
            fontSize: "28px",
            fontWeight: "bold",
            textAlign: "center",
            textShadow: "0 0 25px #00ff00a0, 0 0 40px #00ff0060",
            animation: "float 3s ease-in-out infinite",
            transform: "translate(-50%, -50%)",
            fontFamily: "'Segoe UI', Arial, sans-serif",
          }}
        >
          💎 Pay With
        </div>
      </Html>

      {/* Amount Display - moved further down to avoid overlaying cube */}
      {/* Enhanced Dramatic Lighting */}
      <pointLight
        position={[0, 0, -1]}
        color="#00ff66"
        intensity={1.5}
        distance={15}
      />
      <pointLight
        position={[3, 3, -3]}
        color="#44ff88"
        intensity={0.8}
        distance={10}
      />
      <pointLight
        position={[-3, -3, -3]}
        color="#88ffaa"
        intensity={0.6}
        distance={10}
      />
      <pointLight
        position={[0, 5, 0]}
        color="#66ff99"
        intensity={0.7}
        distance={12}
      />
      <pointLight
        position={[0, -5, 0]}
        color="#22dd55"
        intensity={0.5}
        distance={12}
      />
    </group>
  );
};

// QR Code Display Component (replaces cube when crypto QR is selected)
const ARQRDisplay = ({ qrData, onBack, agent, position = [0, 0, -3] }) => {
  const [selectedNetwork, setSelectedNetwork] = useState("11155111"); // Default to Ethereum Sepolia
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [currentQRData, setCurrentQRData] = useState(qrData);
  const [walletBalance, setWalletBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // CCIP Cross-Chain State
  const [userNetwork, setUserNetwork] = useState(null);
  const [agentNetwork, setAgentNetwork] = useState(null);
  const [crossChainOptions, setCrossChainOptions] = useState([]);
  const [showCrossChainUI, setShowCrossChainUI] = useState(false);
  const [crossChainFeeEstimate, setCrossChainFeeEstimate] = useState(null);
  const [paymentMode, setPaymentMode] = useState("same-chain"); // 'same-chain', 'cross-chain', 'switch-network'  // Network configuration for dropdown
  const supportedNetworks = {
    11155111: { name: "Ethereum Sepolia", color: "#627EEA", symbol: "USDC" },
    421614: { name: "Arbitrum Sepolia", color: "#28A0F0", symbol: "USDC" },
    84532: { name: "Base Sepolia", color: "#0052FF", symbol: "USDC" },
    11155420: { name: "OP Sepolia", color: "#FF0420", symbol: "USDC" },
    43113: { name: "Avalanche Fuji", color: "#E84142", symbol: "USDC" },
    80002: { name: "Polygon Amoy", color: "#8247E5", symbol: "USDC" },
    "solana-devnet": {
      name: "Solana Devnet",
      color: "#9945FF",
      symbol: "USDC",
    },
  };

  // Initialize network based on agent deployment and detect cross-chain needs
  useEffect(() => {
    const initializeNetworkAndCrossChain = async () => {
      if (!agent) return;

      let detectedNetwork = "11155111"; // Default fallback

      // Debug: Log agent data
      console.log("🔍 Agent data for network detection:", agent);

      // Network detection logic based on agent name or properties
      const agentName = (agent.name || "").toLowerCase();
      console.log("🔍 Agent name for detection:", agentName);

      if (agentName.includes("amoy") || agentName.includes("polygon")) {
        detectedNetwork = "80002"; // Polygon Amoy
        console.log("🌐 Detected Polygon Amoy network for agent:", agent.name);
      } else if (agentName.includes("arbitrum")) {
        detectedNetwork = "421614"; // Arbitrum Sepolia
      } else if (agentName.includes("base")) {
        detectedNetwork = "84532"; // Base Sepolia
      } else if (agentName.includes("optimism") || agentName.includes("op")) {
        detectedNetwork = "11155420"; // OP Sepolia
      } else if (
        agentName.includes("avalanche") ||
        agentName.includes("fuji")
      ) {
        detectedNetwork = "43113"; // Avalanche Fuji
      } else if (agentName.includes("solana")) {
        detectedNetwork = "solana-devnet"; // Solana Devnet
      }

      // Check agent's chain_id property if available
      if (agent.chain_id) {
        const chainId = String(agent.chain_id);
        if (supportedNetworks[chainId]) {
          detectedNetwork = chainId;
          console.log("🌐 Using agent's chain_id for network:", chainId);
        }
      }

      setAgentNetwork(detectedNetwork);

      // Detect user's current network
      let currentUserNetwork = null;
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          currentUserNetwork = parseInt(chainId, 16).toString();
          console.log("🌐 Detected user network:", currentUserNetwork);
        }
      } catch (error) {
        console.warn("⚠️ Could not detect user network:", error);
      }

      setUserNetwork(currentUserNetwork);

      // Check for cross-chain opportunities
      if (currentUserNetwork && dynamicQRService.getCCIPService) {
        try {
          const ccipService = dynamicQRService.getCCIPService();
          const crossChainDetection =
            await dynamicQRService.detectCrossChainNeed(
              agent,
              currentUserNetwork
            );

          console.log("🌉 Cross-chain detection result:", crossChainDetection);

          if (crossChainDetection.needsCrossChain) {
            setShowCrossChainUI(true);
            const paymentOptions = dynamicQRService.getAvailablePaymentOptions(
              agent,
              currentUserNetwork
            );
            setCrossChainOptions(paymentOptions.options || []);
            console.log("💳 Available payment options:", paymentOptions);

            // Set default payment mode
            if (crossChainDetection.supportedRoute) {
              setPaymentMode("cross-chain");
            } else {
              setPaymentMode("switch-network");
            }
          } else {
            setShowCrossChainUI(false);
            setPaymentMode("same-chain");
          }
        } catch (error) {
          console.error("❌ Cross-chain detection failed:", error);
          setShowCrossChainUI(false);
        }
      }

      // Update selected network if different from current
      console.log(
        `🔍 Current network: ${selectedNetwork}, Detected: ${detectedNetwork}`
      );
      if (detectedNetwork !== selectedNetwork) {
        console.log(
          `🔄 Auto-switching from ${supportedNetworks[selectedNetwork]?.name} to ${supportedNetworks[detectedNetwork]?.name}`
        );
        setSelectedNetwork(detectedNetwork);
      }
    };

    initializeNetworkAndCrossChain();
  }, [agent]); // Removed selectedNetwork dependency to prevent infinite loop

  // Load wallet balance when network changes
  useEffect(() => {
    const loadBalance = async () => {
      setIsLoadingBalance(true);
      try {
        // For cross-chain payments, use user's current network for balance check
        const networkForBalance = showCrossChainUI
          ? userNetwork
          : selectedNetwork;
        console.log(
          `💰 Loading balance for network: ${networkForBalance} (cross-chain: ${showCrossChainUI})`
        );

        const balance = await dynamicQRService.getCurrentWalletBalance(
          networkForBalance
        );
        setWalletBalance(balance);
      } catch (error) {
        console.error("Balance load error:", error);
        setWalletBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadBalance();
  }, [selectedNetwork, showCrossChainUI, userNetwork]);

  // Handle network change
  const handleNetworkChange = async (newNetwork) => {
    setSelectedNetwork(newNetwork);
    setIsGeneratingQR(true);

    try {
      console.log(`🔄 Switching to ${supportedNetworks[newNetwork].name}...`);

      // Generate new QR for selected network
      const result = await dynamicQRService.generateDynamicQR(
        { ...agent, preferred_network: newNetwork },
        agent?.interaction_fee_amount || "1.00"
      );

      if (result.success) {
        setCurrentQRData(result.eip681URI || result.qrData);
        console.log(
          `✅ QR generated for ${supportedNetworks[newNetwork].name}`
        );
      } else {
        console.error("❌ QR generation failed:", result.error);
        alert(
          `Failed to generate QR for ${supportedNetworks[newNetwork].name}: ${result.error}`
        );
      }
    } catch (error) {
      console.error("❌ Network switch error:", error);
      alert(
        `Error switching to ${supportedNetworks[newNetwork].name}: ${error.message}`
      );
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // CCIP Cross-Chain Payment Mode Handlers
  const handlePaymentModeChange = async (newMode) => {
    setPaymentMode(newMode);
    setIsGeneratingQR(true);

    try {
      console.log(`🌉 Switching to payment mode: ${newMode}`);

      switch (newMode) {
        case "same-chain":
          await handleSameChainMode();
          break;
        case "cross-chain":
          await handleCrossChainMode();
          break;
        case "switch-network":
          await handleNetworkSwitchMode();
          break;
        default:
          throw new Error(`Unknown payment mode: ${newMode}`);
      }
    } catch (error) {
      console.error(`❌ Payment mode switch error:`, error);
      alert(`Error switching to ${newMode} mode: ${error.message}`);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleSameChainMode = async () => {
    console.log("📱 Generating same-chain payment QR");
    const result = await dynamicQRService.generateDynamicQR(
      agent,
      agent?.interaction_fee_amount || "1.00"
    );

    if (result.success) {
      setCurrentQRData(result.eip681URI || result.qrData);
      setCrossChainFeeEstimate(null);
      console.log("✅ Same-chain QR generated");
    } else {
      throw new Error(result.error);
    }
  };

  const handleNetworkSwitchMode = async () => {
    console.log("🔄 Suggesting network switch to agent network");
    // This mode just shows a message to switch networks
    // The actual QR will be generated once user switches
    setCurrentQRData(null);
    setCrossChainFeeEstimate(null);
  };

  const handleCrossChainFeeEstimate = async () => {
    if (!userNetwork || !agentNetwork || !dynamicQRService.getCCIPService) {
      return;
    }

    try {
      const ccipService = dynamicQRService.getCCIPService();
      const feeEstimate = await ccipService.estimateCCIPFees(
        userNetwork,
        agentNetwork,
        agent?.interaction_fee_amount || "1.00",
        agent.agent_wallet_address || agent.payment_recipient_address,
        "native"
      );

      if (feeEstimate.success) {
        setCrossChainFeeEstimate(feeEstimate.estimatedFee);
      }
    } catch (error) {
      console.error("❌ Fee estimation failed:", error);
    }
  };

  const handleQRClick = async () => {
    console.log("🔥 QR Code clicked! Triggering transaction...");

    try {
      // Check if this is a cross-chain transaction
      if (
        paymentMode === "cross-chain" &&
        currentQRData?.type === "ccip-cross-chain"
      ) {
        console.log("🌉 Handling cross-chain CCIP transaction");

        const transactionResult =
          await dynamicQRService.handleCrossChainQRClick(currentQRData);

        if (transactionResult.success) {
          console.log(
            "✅ Cross-chain transaction successful:",
            transactionResult.transactionHash
          );
          alert(
            `✅ Cross-chain payment initiated!\n\n` +
              `Transaction: ${transactionResult.transactionHash}\n` +
              `From: ${transactionResult.sourceChain}\n` +
              `To: ${transactionResult.destinationChain}\n\n` +
              `The transaction will be processed across chains. Please check the destination network for completion.`
          );
        } else {
          throw new Error(transactionResult.error);
        }
        return;
      }

      // For switch-network mode, show instructions
      if (paymentMode === "switch-network") {
        alert(
          `🔄 Network Switch Required\n\n` +
            `Please switch your wallet to ${supportedNetworks[agentNetwork]?.name} ` +
            `to complete this payment.\n\n` +
            `Once switched, the QR code will be generated automatically.`
        );
        return;
      }

      // Continue with existing Phase 1 logic for same-chain transactions
      let transactionData;

      if (
        typeof currentQRData === "string" &&
        currentQRData.startsWith("data:image")
      ) {
        // Data URL format - regenerate transaction data
        console.log(
          "📱 QR data URL detected, regenerating transaction data..."
        );
        const qrResult = await dynamicQRService.generateDynamicQR({
          ...agent,
          preferred_network: selectedNetwork,
        });
        if (!qrResult.success) {
          throw new Error(qrResult.error);
        }
        transactionData = qrResult.transactionData;
      } else if (typeof currentQRData === "string") {
        // Legacy string format
        transactionData = {
          to: agent.agent_wallet_address || agent.payment_recipient_address,
          value: "0",
          data: "0x",
          amount: agent.interaction_fee_amount || "1.00",
          token: agent.interaction_fee_token || "USDC",
          chainId: selectedNetwork,
        };
      } else {
        // Already parsed transaction data
        transactionData = currentQRData;
      }

      console.log("📤 Transaction data:", transactionData);

      // Use the click handler from dynamic service
      const transactionResult = await dynamicQRService.handleQRClick(
        { ...agent, preferred_network: selectedNetwork },
        transactionData
      );

      if (transactionResult.success) {
        console.log(
          "✅ Transaction successful:",
          transactionResult.transactionHash
        );
        alert(
          `🎉 Payment Sent Successfully!\n\n💳 Transaction Hash:\n${transactionResult.transactionHash}\n\n🔗 Network: ${supportedNetworks[selectedNetwork].name}\n\nYou can view this transaction on the blockchain explorer.`
        );

        // Refresh balance after successful transaction
        setTimeout(async () => {
          const newBalance = await dynamicQRService.getCurrentWalletBalance(
            selectedNetwork
          );
          setWalletBalance(newBalance);
        }, 2000);
      } else {
        console.error("❌ Transaction failed:", transactionResult.error);
        alert(
          `❌ Transaction Failed:\n${transactionResult.error}\n\nPlease check your wallet connection and try again.`
        );
      }
    } catch (error) {
      console.error("❌ QR click error:", error);
      alert(
        `⚠️ Payment Error:\n${error.message}\n\nPlease ensure your wallet is installed and connected.`
      );
    }
  };

  // Determine QR display value
  const qrDisplayValue = (() => {
    if (!currentQRData) return "https://example.com"; // Fallback to valid URL instead of empty string

    // Handle cross-chain CCIP QR data
    if (
      typeof currentQRData === "object" &&
      currentQRData.type === "ccip-cross-chain"
    ) {
      return currentQRData.uri || JSON.stringify(currentQRData);
    }

    // Handle data URL images
    if (
      typeof currentQRData === "string" &&
      currentQRData.startsWith("data:image")
    ) {
      return currentQRData;
    }

    // Handle string URIs
    if (typeof currentQRData === "string") {
      return currentQRData;
    }

    // Fallback to JSON representation
    return JSON.stringify(currentQRData);
  })();

  return (
    <group>
      {/* QR Code Background Plane */}
      <mesh position={position}>
        <planeGeometry args={[4.5, 4.5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.95}
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Network Selection & QR Code */}
      <Html position={position} transform>
        <div
          style={{
            width: "400px",
            height: "500px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            borderRadius: "20px",
            padding: "20px",
            border: "3px solid #00ff00",
            boxShadow: "0 0 30px #00ff0080",
            transform: "translate(-50%, -50%)",
            cursor: "pointer",
          }}
        >
          {/* Network Selection Dropdown */}
          <div style={{ marginBottom: "15px", width: "100%" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: "#333",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              🌐 Select Network:
            </label>
            <select
              value={selectedNetwork}
              onChange={(e) => handleNetworkChange(e.target.value)}
              disabled={isGeneratingQR}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "2px solid #00ff00",
                backgroundColor: "#f8f9fa",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#333",
                cursor: isGeneratingQR ? "wait" : "pointer",
              }}
            >
              {Object.entries(supportedNetworks).map(([chainId, network]) => (
                <option key={chainId} value={chainId}>
                  {network.name} ({network.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* CCIP Cross-Chain Payment Options */}
          {showCrossChainUI && (
            <div style={{ marginBottom: "15px", width: "100%" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  color: "#333",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                🌉 Payment Mode:
              </label>

              {/* Payment Mode Selection */}
              <div style={{ marginBottom: "10px" }}>
                {Array.isArray(crossChainOptions) &&
                  crossChainOptions.map((option, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "6px",
                        padding: "8px",
                        backgroundColor:
                          paymentMode === option.type ? "#e8f5e8" : "#f8f9fa",
                        borderRadius: "6px",
                        border:
                          paymentMode === option.type
                            ? "2px solid #00ff00"
                            : "1px solid #ddd",
                        cursor: "pointer",
                      }}
                      onClick={() => handlePaymentModeChange(option.type)}
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        value={option.type}
                        checked={paymentMode === option.type}
                        onChange={() => handlePaymentModeChange(option.type)}
                        style={{ marginRight: "8px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          {option.type === "same-chain" && "📱 Same Network"}
                          {option.type === "cross-chain" && "🌉 Cross-Chain"}
                          {option.type === "switch-network" &&
                            "🔄 Switch Network"}
                          {option.recommended && (
                            <span
                              style={{ color: "#00aa00", fontSize: "11px" }}
                            >
                              {" "}
                              (Recommended)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          {option.description}
                        </div>
                        <div style={{ fontSize: "10px", color: "#888" }}>
                          Fee: {option.fee}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Cross-Chain Route Info */}
              {paymentMode === "cross-chain" && userNetwork && agentNetwork && (
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#fff3cd",
                    borderRadius: "6px",
                    border: "1px solid #ffc107",
                    fontSize: "12px",
                    color: "#856404",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    🌉 Cross-Chain Route:
                  </div>
                  <div>
                    {supportedNetworks[userNetwork]?.name} →{" "}
                    {supportedNetworks[agentNetwork]?.name}
                  </div>
                  {crossChainFeeEstimate && (
                    <div style={{ marginTop: "4px", fontSize: "11px" }}>
                      Estimated Fee: {parseFloat(crossChainFeeEstimate) / 1e18}{" "}
                      ETH
                    </div>
                  )}
                </div>
              )}

              {/* Network Switch Prompt */}
              {paymentMode === "switch-network" && agentNetwork && (
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#d1ecf1",
                    borderRadius: "6px",
                    border: "1px solid #bee5eb",
                    fontSize: "12px",
                    color: "#0c5460",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    🔄 Network Switch Required:
                  </div>
                  <div>
                    Please switch to {supportedNetworks[agentNetwork]?.name} in
                    your wallet to continue.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wallet Balance Display */}
          <div
            style={{
              marginBottom: "10px",
              width: "100%",
              textAlign: "center",
              padding: "8px",
              backgroundColor: "#f0f8ff",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            <div
              style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
            >
              💰 Your Wallet Balance:
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: isLoadingBalance
                  ? "#999"
                  : walletBalance?.success
                  ? "#007c00"
                  : "#cc0000",
              }}
            >
              {isLoadingBalance
                ? "🔄 Loading..."
                : walletBalance?.success
                ? walletBalance.formatted
                : "❌ Unable to fetch balance"}
            </div>
            {walletBalance?.note && (
              <div
                style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}
              >
                {walletBalance.note}
              </div>
            )}
          </div>

          {/* Agent Payment Info */}
          <div
            style={{
              marginBottom: "15px",
              fontSize: "16px",
              color: "#333",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            💳 Pay {agent?.name || "Agent"}
          </div>

          <div
            style={{
              marginBottom: "15px",
              fontSize: "14px",
              color: "#666",
              textAlign: "center",
            }}
          >
            {agent?.interaction_fee_amount || "1.00"}{" "}
            {supportedNetworks[selectedNetwork]?.symbol || "USDC"}
            <br />
            <span
              style={{
                fontSize: "12px",
                color: supportedNetworks[selectedNetwork]?.color,
              }}
            >
              on {supportedNetworks[selectedNetwork]?.name}
            </span>
          </div>

          {/* QR Code Display */}
          {isGeneratingQR ? (
            <div
              style={{
                width: "200px",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f0f0f0",
                borderRadius: "10px",
                fontSize: "14px",
                color: "#666",
              }}
            >
              🔄 Generating QR...
            </div>
          ) : paymentMode === "switch-network" ? (
            <div
              style={{
                width: "200px",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: "10px",
                border: "2px dashed #007bff",
                fontSize: "14px",
                color: "#007bff",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>🔄</div>
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Switch Network
              </div>
              <div style={{ fontSize: "12px" }}>
                Please switch to {supportedNetworks[agentNetwork]?.name} in your
                wallet
              </div>
            </div>
          ) : currentQRData ? (
            <div onClick={handleQRClick}>
              {typeof currentQRData === "string" &&
              currentQRData.startsWith("data:image") ? (
                <img
                  src={currentQRData}
                  alt="Payment QR Code"
                  style={{
                    width: "200px",
                    height: "200px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    border:
                      paymentMode === "cross-chain"
                        ? "2px solid #ff9500"
                        : "2px solid #00ff00",
                  }}
                />
              ) : (
                <div style={{ position: "relative" }}>
                  {qrDisplayValue && qrDisplayValue.length > 0 ? (
                    <QRCode
                      value={qrDisplayValue}
                      size={200}
                      style={{
                        background: "white",
                        padding: "10px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border:
                          paymentMode === "cross-chain"
                            ? "2px solid #ff9500"
                            : "2px solid #00ff00",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "200px",
                        height: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "10px",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      No QR Data Available
                    </div>
                  )}
                  {paymentMode === "cross-chain" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        backgroundColor: "#ff9500",
                        color: "white",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      🌉
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: "200px",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f0f0f0",
                borderRadius: "10px",
                fontSize: "14px",
                color: "#666",
              }}
            >
              No QR Code Available
            </div>
          )}

          {/* Payment Instructions */}
          <div
            style={{
              marginTop: "15px",
              fontSize: "12px",
              color: "#333",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {paymentMode === "cross-chain" ? (
              <>
                🌉 CROSS-CHAIN PAYMENT
                <br />
                🖱️ CLICK to Pay from {supportedNetworks[userNetwork]?.name}
                <br />
                📱 SCAN with Mobile Wallet
                {crossChainFeeEstimate && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#ff9500",
                      marginTop: "4px",
                    }}
                  >
                    Additional cross-chain fee applies
                  </div>
                )}
              </>
            ) : paymentMode === "switch-network" ? (
              <>
                🔄 NETWORK SWITCH REQUIRED
                <br />
                Switch to {supportedNetworks[agentNetwork]?.name} first
              </>
            ) : (
              <>
                🖱️ CLICK to Pay with{" "}
                {selectedNetwork === "solana-devnet" ? "Phantom" : "MetaMask"}
                <br />
                📱 SCAN with Mobile Wallet
              </>
            )}
          </div>
        </div>
      </Html>

      {/* Back Button */}
      <Html position={[0, position[1] - 3.0, position[2]]} transform>
        <button
          onClick={onBack}
          style={{
            background: "linear-gradient(135deg, #00ff00, #00cc00)",
            border: "none",
            borderRadius: "25px",
            padding: "10px 20px",
            color: "black",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
            boxShadow: "0 5px 15px rgba(0, 255, 0, 0.3)",
            transform: "translate(-50%, -50%)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translate(-50%, -50%) scale(1.1)";
            e.target.style.boxShadow = "0 8px 25px rgba(0, 255, 0, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translate(-50%, -50%) scale(1)";
            e.target.style.boxShadow = "0 5px 15px rgba(0, 255, 0, 0.3)";
          }}
        >
          ← Back to Cube
        </button>
      </Html>

      {/* QR Code Lighting */}
      <pointLight
        position={[position[0], position[1], position[2] + 1]}
        color="#ffffff"
        intensity={0.8}
        distance={5}
      />
    </group>
  );
};

// Main Cube Payment Engine Component
const CubePaymentEngine = ({
  agent,
  isOpen,
  onClose,
  onPaymentComplete,
  paymentAmount = 10.0,
  enabledMethods = [
    "crypto_qr", // Front face
    "virtual_card", // Right face
    "btc_payments", // Top face (switched with bank_qr)
    "sound_pay", // Bottom face (switched with voice_pay)
    "voice_pay", // Back face (switched with sound_pay)
    "bank_qr", // Left face (switched with btc_payments)
  ],
}) => {
  const [currentView, setCurrentView] = useState("cube"); // 'cube' or 'qr'
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentPaymentConfig, setAgentPaymentConfig] = useState(null);
  const [actualEnabledMethods, setActualEnabledMethods] =
    useState(enabledMethods);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const cubeRef = useRef();

  // Intermediate Payment Modal State
  const [showIntermediateModal, setShowIntermediateModal] = useState(false);
  const [intermediateTransactionData, setIntermediateTransactionData] =
    useState(null);

  // Revolut Payment State
  const [showRevolutBankModal, setShowRevolutBankModal] = useState(false);
  const [revolutOrderData, setRevolutOrderData] = useState(null);
  const [revolutPaymentStatus, setRevolutPaymentStatus] = useState("idle"); // 'idle', 'processing', 'completed', 'failed', 'cancelled'

  // Revolut Virtual Card State
  const [showVirtualCardModal, setShowVirtualCardModal] = useState(false);
  const [virtualCardAgentId, setVirtualCardAgentId] = useState(null);

  const [isInitializing, setIsInitializing] = useState(true); // Prevent auto-clicks on load

  // Prevent immediate face selection when cube loads
  useEffect(() => {
    if (isOpen) {
      setIsInitializing(true);
      console.log(
        "🔒 Cube initializing - blocking all interactions for 1500ms"
      );
      const timer = setTimeout(() => {
        setIsInitializing(false);
        console.log("✅ Cube ready - interactions enabled");
      }, 1500); // Increased to 1500ms delay before allowing face selection

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Load payment configuration from AgentSphere when component opens
  useEffect(() => {
    const loadPaymentConfig = async () => {
      if (!isOpen || !agent?.id) {
        setIsLoadingConfig(false);
        return;
      }

      console.log("🔄 Loading payment configuration for agent:", agent.id);
      setIsLoadingConfig(true);

      try {
        const config = await getAgentPaymentConfig(agent.id);
        setAgentPaymentConfig(config);
        // Use the passed enabledMethods prop instead of database config
        setActualEnabledMethods(enabledMethods);

        console.log("✅ Payment configuration loaded:", {
          enabledMethods: enabledMethods,
          hasWallet: !!config.config.walletAddress,
        });
      } catch (error) {
        console.error("❌ Failed to load payment configuration:", error);
        // Use passed enabledMethods as fallback instead of limited subset
        setActualEnabledMethods(enabledMethods);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadPaymentConfig();
  }, [isOpen, agent?.id]);

  // Handle face selection
  const handleFaceSelected = async (methodKey, methodConfig) => {
    // Prevent auto-selection during initialization
    if (isInitializing) {
      console.log("⏳ Cube initializing, ignoring face selection");
      return;
    }

    console.log("🎯 Payment method selected:", methodKey, methodConfig);
    setSelectedMethod({ key: methodKey, config: methodConfig });

    if (methodKey === "crypto_qr") {
      await handleCryptoQRSelection();
    } else if (methodKey === "btc_payments") {
      handleBTCPayments();
    } else if (methodKey === "bank_qr") {
      await handleBankQRSelection();
    } else if (methodKey === "virtual_card") {
      await handleVirtualCardSelection();
    } else {
      // Show "Coming Soon" for other methods (voice_pay, sound_pay)
      alert(
        `${methodConfig.text} - Coming Soon!\n\nThis payment method will be available in the next update.\n\nFor now, please use Crypto QR, Bank QR, or Virtual Card payments.`
      );
    }
  };

  // Handle Crypto QR selection - integrate with existing system
  const handleCryptoQRSelection = async () => {
    // Prevent execution during initialization
    if (isInitializing) {
      console.log("⏳ Cube initializing, ignoring crypto QR selection");
      return;
    }

    setIsGenerating(true);

    try {
      console.log("🔄 Generating crypto QR payment...");
      console.log("📊 Agent data for QR generation:", agent);

      // STEP 1: Detect network configuration for cross-chain vs same-chain
      const userNetwork = window.ethereum?.chainId
        ? parseInt(window.ethereum.chainId, 16)
        : null;

      const agentNetwork = agent?.network_id || agent?.chain_id;

      console.log("🌐 Network Detection:", {
        userNetwork,
        agentNetwork,
        needsCrossChain:
          userNetwork && agentNetwork && userNetwork !== agentNetwork,
      });

      // STEP 2: Route to appropriate flow
      if (userNetwork && agentNetwork && userNetwork !== agentNetwork) {
        // 🌉 CROSS-CHAIN: Show intermediate modal first
        console.log("🌉 Cross-chain detected → Triggering intermediate modal");
        await handleCrossChainMode();
        return; // Exit here - modal will handle QR generation after confirmation
      } else {
        // 📱 SAME-CHAIN: Direct QR generation
        console.log("📱 Same-chain detected → Direct QR generation");

        const result = await dynamicQRService.generateDynamicQR(
          agent,
          paymentAmount ||
            agent?.interaction_fee_amount ||
            agent?.interaction_fee ||
            1
        );

        console.log("✅ Same-chain QR generated:", result);

        // Use the EIP-681 URI for QR display
        setQrData(result.eip681URI);
        setCurrentView("qr");
      }
    } catch (error) {
      console.error("❌ Error generating QR:", error);
      alert("Error generating payment QR. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle BTC Payments
  const handleBTCPayments = () => {
    console.log("₿ Launching BTC payments...");

    // Create BTC payment information
    const btcPaymentInfo = {
      title: "Bitcoin Payments Coming Soon",
      features: [
        "1. Direct Bitcoin network transactions",
        "2. Lightning Network support for instant payments",
        "3. Cross-chain Bitcoin bridge integration",
        "4. Native SegWit and Taproot compatibility",
      ],
      networks: [
        "Bitcoin Mainnet",
        "Lightning Network",
        "Bitcoin Testnet (for development)",
        "Cross-chain bridges (BTC → EVM)",
      ],
    };

    alert(
      `₿ ${btcPaymentInfo.title}\n\n` +
        `Upcoming Features:\n${btcPaymentInfo.features.join("\n")}\n\n` +
        `Supported Networks:\n${btcPaymentInfo.networks.join("\n")}\n\n` +
        `For now, please use "Crypto QR" for USDC payments. Bitcoin integration is in active development!`
    );
  };

  // Handle Revolut Bank QR Selection
  const handleBankQRSelection = async () => {
    console.log("🚨 handleBankQRSelection called!");
    console.log("🚨 isInitializing value:", isInitializing);
    console.log("🚨 Call stack:", new Error().stack);

    // Prevent execution during initialization
    if (isInitializing) {
      console.log("⏳ Cube initializing, ignoring bank QR selection");
      return;
    }

    console.log("🔲 Handling Revolut Bank QR payment...");
    setIsGenerating(true);

    try {
      // Calculate payment amount
      const amount =
        paymentAmount ||
        agent?.interaction_fee_amount ||
        agent?.interaction_fee ||
        10.0;

      console.log("💰 Creating Revolut Bank QR order for amount:", amount);

      // Create Revolut Bank QR order
      const orderResult = await revolutBankService.createRevolutBankOrder({
        agentId: agent?.id,
        agentName: agent?.name,
        amount: amount,
        currency: "EUR", // Revolut Bank QR typically uses EUR
        description: `Payment to ${agent?.name || "AgentSphere Agent"}`,
      });

      if (orderResult.success) {
        console.log("✅ Revolut Bank QR order created:", orderResult.order);
        setRevolutOrderData(orderResult.order);
        setShowRevolutBankModal(true);
        setRevolutPaymentStatus("processing");
      } else {
        throw new Error(orderResult.error);
      }
    } catch (error) {
      console.error("❌ Error creating Revolut Bank QR order:", error);
      alert(`Error creating Bank QR payment: ${error.message}`);
      setRevolutPaymentStatus("failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Revolut Virtual Card Selection
  const handleVirtualCardSelection = async () => {
    // Prevent execution during initialization
    if (isInitializing) {
      console.log("⏳ Cube initializing, ignoring virtual card selection");
      return;
    }

    console.log("💳 Opening Revolut Virtual Card modal...");

    try {
      // Set the agent ID for the Virtual Card component
      setVirtualCardAgentId(agent?.id || "unknown_agent");

      // Calculate initial amount from agent configuration
      const initialAmount =
        (paymentAmount ||
          agent?.interaction_fee_amount ||
          agent?.interaction_fee ||
          10.0) * 100; // Convert to cents for Virtual Card

      console.log(
        "💰 Virtual Card initial amount:",
        initialAmount / 100,
        "USD"
      );

      // Open the Virtual Card modal
      setShowVirtualCardModal(true);
      setRevolutPaymentStatus("processing");
    } catch (error) {
      console.error("❌ Error opening Revolut Virtual Card modal:", error);
      alert(`Error opening Virtual Card: ${error.message}`);
      setRevolutPaymentStatus("failed");
    }
  };

  // Intermediate Payment Modal Handlers
  const handleModalConfirm = async (validatedTransactionData) => {
    try {
      console.log(
        "✅ User confirmed transaction, proceeding with QR generation..."
      );
      setShowIntermediateModal(false);

      // Generate final cross-chain QR using the validated transaction data
      const result = await dynamicQRService.generateCrossChainQR(
        agent,
        validatedTransactionData.sourceChain,
        validatedTransactionData.destinationChain,
        validatedTransactionData.amount,
        "native" // Fee token
      );

      if (result.success) {
        setQrData(result.qrData);
        console.log(
          "✅ Cross-chain QR generated after modal confirmation",
          result
        );
        setCurrentView("qr");
        setSelectedMethod("crypto_qr");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(
        "❌ Failed to generate QR after modal confirmation:",
        error
      );
      alert(`Error generating payment QR: ${error.message}`);
    }
  };

  const handleModalCancel = () => {
    console.log("❌ User cancelled transaction in intermediate modal");
    setShowIntermediateModal(false);
    setIntermediateTransactionData(null);
  };

  // Revolut Bank QR Modal Handlers
  const handleRevolutBankQRClose = () => {
    console.log("🔲 Closing Revolut Bank QR modal");
    setShowRevolutBankModal(false);
    setRevolutOrderData(null);
    setRevolutPaymentStatus("idle");
  };

  const handleRevolutBankQRCancel = async () => {
    console.log("❌ User cancelled Revolut Bank QR payment");

    if (revolutOrderData?.orderId) {
      try {
        const cancelResult = await revolutBankService.cancelRevolutOrder(
          revolutOrderData.orderId
        );
        if (cancelResult.success) {
          console.log("✅ Revolut order cancelled successfully");
        } else {
          console.warn(
            "⚠️ Failed to cancel Revolut order:",
            cancelResult.error
          );
        }
      } catch (error) {
        console.error("❌ Error cancelling Revolut order:", error);
      }
    }

    setRevolutPaymentStatus("cancelled");
    handleRevolutBankQRClose();
  };

  const handleRevolutBankQRSuccess = (paymentData) => {
    console.log("✅ Revolut Bank QR payment successful:", paymentData);
    setRevolutPaymentStatus("completed");

    alert(
      `✅ Bank QR Payment Successful!\n\n` +
        `💳 Payment ID: ${paymentData.paymentId}\n` +
        `💰 Amount: ${paymentData.amount} ${paymentData.currency}\n` +
        `🏪 Merchant: ${agent?.name}\n\n` +
        `Payment has been processed successfully via Revolut Bank QR.`
    );

    // Call onPaymentComplete callback if provided
    if (onPaymentComplete) {
      onPaymentComplete({
        method: "bank_qr",
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentId: paymentData.paymentId,
        status: "completed",
      });
    }

    handleRevolutBankQRClose();
  };

  // Revolut Virtual Card Modal Handlers
  const handleVirtualCardClose = () => {
    console.log("💳 Closing Revolut Virtual Card modal");
    setShowVirtualCardModal(false);
    setVirtualCardAgentId(null);
    setRevolutPaymentStatus("idle");
  };

  const handleVirtualCardSuccess = (cardData) => {
    console.log("✅ Virtual Card action successful:", cardData);

    // If this was a payment, mark as completed
    if (cardData.action === "payment") {
      setRevolutPaymentStatus("completed");

      alert(
        `✅ Virtual Card Payment Successful!\n\n` +
          `💳 Card: ****${cardData.cardNumber?.slice(-4) || "****"}\n` +
          `💰 Amount: $${cardData.amount}\n` +
          `🏪 Merchant: ${cardData.merchant || agent?.name}\n\n` +
          `Payment has been processed successfully via Revolut Virtual Card.`
      );

      // Call onPaymentComplete callback if provided
      if (onPaymentComplete) {
        onPaymentComplete({
          method: "virtual_card",
          amount: cardData.amount,
          currency: "USD",
          cardId: cardData.cardId,
          status: "completed",
        });
      }
    }

    // Keep modal open for other actions (card created, topped up, etc.)
    // User can manually close it when done
  };

  const handleVirtualCardError = (error) => {
    console.error("❌ Virtual Card error:", error);
    setRevolutPaymentStatus("failed");
    alert(`❌ Virtual Card Error: ${error.message || "Unknown error"}`);
  };

  // Handle Cross-Chain Mode - Shows intermediate modal for transaction review
  const handleCrossChainMode = async () => {
    // Get current network info from crypto QR selection context
    const userNetwork = window.ethereum?.chainId
      ? parseInt(window.ethereum.chainId, 16)
      : null;

    const agentNetwork = agent?.network_id || agent?.chain_id;

    if (!userNetwork || !agentNetwork) {
      throw new Error("Network information not available");
    }

    console.log(
      `🌉 Cross-chain transaction detected: ${userNetwork} → ${agentNetwork}`
    );

    // STEP 1: Build CCIP transaction data for inspection
    try {
      console.log("🔧 Building CCIP transaction for intermediate modal...");

      const ccipTransactionData = await ccipConfigService.buildCCIPTransaction(
        userNetwork, // Source chain
        agentNetwork, // Destination chain
        agent?.interaction_fee_amount || "1.00", // USDC amount
        agent?.agent_wallet_address || agent?.payment_recipient_address, // Recipient
        "native" // Fee token (ETH)
      );

      if (!ccipTransactionData.success) {
        // Check if it's an allowance issue that can be fixed in the modal
        const isAllowanceIssue =
          ccipTransactionData.simulationError &&
          (ccipTransactionData.simulationError.revertReason
            ?.toLowerCase()
            .includes("allowance") ||
            ccipTransactionData.simulationError.error
              ?.toLowerCase()
              .includes("allowance"));

        const isBalanceIssue =
          ccipTransactionData.simulationError &&
          (ccipTransactionData.simulationError.revertReason
            ?.toLowerCase()
            .includes("balance") ||
            ccipTransactionData.simulationError.error
              ?.toLowerCase()
              .includes("balance"));

        const isGenericSimulationFailure =
          ccipTransactionData.simulationError &&
          ccipTransactionData.simulationError.errorCode === "CALL_EXCEPTION";

        if (isAllowanceIssue) {
          console.log(
            "🔧 Allowance issue detected - showing modal for user to approve:",
            ccipTransactionData.simulationError
          );
          // Continue to show modal for allowance approval
        } else if (isBalanceIssue) {
          console.log(
            "💰 Insufficient balance detected - showing modal with balance error:",
            ccipTransactionData.simulationError
          );
          // Continue to show modal with balance information
        } else if (isGenericSimulationFailure) {
          console.log(
            "🚨 Generic simulation failure detected - showing modal with detailed error info:",
            ccipTransactionData.simulationError
          );
          // Continue to show modal with generic simulation error details
        } else {
          throw new Error(
            `CCIP transaction build failed: ${ccipTransactionData.error}`
          );
        }
      }

      console.log(
        ccipTransactionData.success
          ? "✅ CCIP transaction built successfully:"
          : "⚠️ CCIP transaction has simulation issues (showing modal for review):",
        ccipTransactionData
      );

      // STEP 2: Show Intermediate Payment Modal for Cross-Chain Review
      setIntermediateTransactionData({
        ...ccipTransactionData,
        // Add cross-chain specific metadata for the modal
        sourceChain: userNetwork,
        destinationChain: agentNetwork,
        amount: agent?.interaction_fee_amount || "1.00",
        recipient:
          agent?.agent_wallet_address || agent?.payment_recipient_address,
        isCrossChain: true,
        transactionType: "CCIP Cross-Chain",
        // Enhanced debugging information
        ccipMessage: ccipTransactionData.message,
        rawFee: ccipTransactionData.estimatedFee,
        rawFeeETH: ccipTransactionData.estimatedFeeETH,
        feeBuffer: "20%",
        finalFeeETH: ccipTransactionData.valueETH,
        feeSource: "CCIP Router Contract",
        debugInfo: {
          userChainId: userNetwork,
          agentChainId: agentNetwork,
          needsCrossChain: true,
          ccipRouter: ccipTransactionData.to,
          chainSelector: ccipTransactionData.destinationChain,
          extraArgs: ccipTransactionData.data
            ? ccipTransactionData.data.substring(0, 100) + "..."
            : "N/A",
          transactionValue: ccipTransactionData.value,
          gasLimit: ccipTransactionData.gasLimit,
        },
      });

      setShowIntermediateModal(true);
      console.log(
        "🔍 Intermediate modal opened for cross-chain transaction review"
      );
    } catch (error) {
      console.error("❌ Failed to build CCIP transaction for modal:", error);
      throw error;
    }
  };

  // Handle back to cube
  const handleBackToCube = () => {
    setCurrentView("cube");
    setSelectedMethod(null);
    setQrData(null);
  };

  // Handle individual face clicks - for button-style interactions
  const handleFaceClick = async (method, faceIndex) => {
    // Prevent auto-selection during initialization
    if (isInitializing) {
      console.log(`⏳ Cube initializing, ignoring face click: ${method}`);
      return;
    }

    console.log(`🎯 Face clicked directly: ${method} (face ${faceIndex})`);

    // Handle QR generation for crypto_qr method with cross-chain detection
    if (method === "crypto_qr") {
      console.log("🔗 Generating QR code for crypto payment");

      // Use our updated crypto QR selection logic that includes modal
      await handleCryptoQRSelection();
      return;
    }

    // For other methods, use existing handleFaceSelected logic
    await handleFaceSelected(method, { text: method });
  };

  // Handle close
  const handleClose = () => {
    setCurrentView("cube");
    setSelectedMethod(null);
    setQrData(null);
    setAgentPaymentConfig(null);
    setActualEnabledMethods(enabledMethods);
    setIsLoadingConfig(false);

    // Reset Revolut state
    setShowRevolutBankModal(false);
    setRevolutOrderData(null);
    setRevolutPaymentStatus("idle");

    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at center, rgba(0, 30, 15, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-8 right-8 z-60 w-12 h-12 bg-red-500/80 hover:bg-red-600/90 rounded-full flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm border-2 border-red-400/50 shadow-lg transition-all duration-200"
      >
        ×
      </button>

      {/* AgentSphere Integration Status */}
      {agentPaymentConfig && (
        <div className="absolute top-8 left-8 z-60 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm font-bold border border-green-400/50">
          ✅ AgentSphere Connected
        </div>
      )}

      {/* 3D Canvas for the cube */}
      <div className="w-full h-full relative">
        <Canvas
          camera={{
            position: [0, 0, 5],
            fov: 75,
            near: 0.1,
            far: 100,
          }}
          style={{
            background: "transparent",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Enhanced Dramatic Scene Lighting */}
          <ambientLight intensity={0.3} color="#002200" />
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.8}
            color="#88ff88"
            castShadow
          />
          <pointLight
            position={[0, 0, 10]}
            intensity={1.2}
            color="#00ff44"
            distance={20}
          />
          <pointLight
            position={[5, 0, 0]}
            intensity={0.6}
            color="#44ff88"
            distance={15}
          />
          <pointLight
            position={[-5, 0, 0]}
            intensity={0.6}
            color="#66ffaa"
            distance={15}
          />

          {/* Render current view */}
          {currentView === "cube" && !isLoadingConfig && (
            <PaymentCube
              agent={agent}
              onFaceSelected={handleFaceSelected}
              handleFaceClick={handleFaceClick}
              actualEnabledMethods={actualEnabledMethods}
              cubeRef={cubeRef}
              isVisible={true}
              isInitializing={isInitializing}
            />
          )}

          {currentView === "qr" && qrData && (
            <ARQRDisplay
              qrData={qrData}
              agent={agent}
              onBack={handleBackToCube}
              position={[0, 0, -3]}
            />
          )}

          {/* Loading indicator */}
          {(isGenerating || isLoadingConfig) && (
            <Html center>
              <div
                style={{
                  color: "#00ff00",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center",
                  background: "rgba(0, 0, 0, 0.8)",
                  padding: "20px",
                  borderRadius: "10px",
                  border: "2px solid #00ff00",
                  animation: "pulse 2s infinite",
                }}
              >
                {isLoadingConfig
                  ? "Loading AgentSphere Config..."
                  : "Generating Payment QR..."}
              </div>
            </Html>
          )}
        </Canvas>

        {/* CSS for animations */}
        <style>{`
          @keyframes float {
            0%,
            100% {
              transform: translate(-50%, -50%) translateY(0px);
            }
            50% {
              transform: translate(-50%, -50%) translateY(-10px);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.05);
            }
          }

          @keyframes glow {
            0%,
            100% {
              box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            }
            50% {
              box-shadow: 0 0 40px rgba(0, 255, 0, 0.6);
            }
          }
        `}</style>

        {/* Intermediate Payment Modal - For Cross-Chain Transaction Review */}
        <IntermediatePaymentModal
          isOpen={showIntermediateModal}
          onClose={handleModalCancel}
          onConfirm={handleModalConfirm}
          transactionData={intermediateTransactionData}
          agentData={agent}
        />

        {/* Revolut Bank QR Modal - For Bank QR Payments */}
        <RevolutBankQRModal
          isOpen={showRevolutBankModal}
          onClose={handleRevolutBankQRClose}
          onCancel={handleRevolutBankQRCancel}
          onSuccess={handleRevolutBankQRSuccess}
          orderData={revolutOrderData}
          agentData={agent}
        />

        {/* Revolut Virtual Card Modal - For Virtual Card Management & Payments */}
        {showVirtualCardModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "20px",
            }}
            onClick={(e) => {
              // Close on backdrop click
              if (e.target === e.currentTarget) {
                handleVirtualCardClose();
              }
            }}
          >
            <div
              style={{
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                position: "relative",
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleVirtualCardClose}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10001,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                ✕
              </button>

              {/* Virtual Card Component */}
              <RevolutVirtualCard
                agentId={virtualCardAgentId}
                initialAmount={
                  (paymentAmount ||
                    agent?.interaction_fee_amount ||
                    agent?.interaction_fee ||
                    10.0) * 100
                }
                currency="USD"
                onSuccess={handleVirtualCardSuccess}
                onError={handleVirtualCardError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CubePaymentEngine;
