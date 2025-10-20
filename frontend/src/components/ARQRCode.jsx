import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import QRCode from "qrcode";

// 3D QR Code Object Component
const FloatingQRCode = ({
  qrData,
  position = [0, 0, -2],
  size = 1,
  onScanned,
  isActive = true,
}) => {
  const meshRef = useRef();
  const [qrTexture, setQrTexture] = useState(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Generate QR code texture
  useEffect(() => {
    if (qrData) {
      const canvas = document.createElement("canvas");
      QRCode.toCanvas(
        canvas,
        qrData,
        {
          width: 512,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (!error) {
            const texture = new THREE.CanvasTexture(canvas);
            texture.flipY = false;
            setQrTexture(texture);
          }
        }
      );
    }
  }, [qrData]);

  // Animation loop
  useFrame((state) => {
    if (meshRef.current && isActive) {
      const time = state.clock.getElapsedTime();

      // Floating animation
      meshRef.current.position.y = position[1] + Math.sin(time * 2) * 0.1;

      // Gentle rotation to show it's interactive
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;

      // Pulsing scale for attention
      const scale = size + Math.sin(time * 3) * 0.05;
      meshRef.current.scale.setScalar(scale);

      setAnimationPhase(time);
    }
  });

  if (!qrTexture) return null;

  return (
    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
      <mesh ref={meshRef} position={position} onClick={onScanned}>
        {/* QR Code Plane */}
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={qrTexture} transparent={true} opacity={0.95} />

        {/* Glowing border effect */}
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[size * 1.1, size * 1.1]} />
          <meshBasicMaterial
            color="#8B5CF6"
            transparent={true}
            opacity={0.3 + Math.sin(animationPhase * 2) * 0.1}
          />
        </mesh>

        {/* Scan instruction text */}
        <Html
          position={[0, -size / 2 - 0.3, 0]}
          center
          distanceFactor={10}
          occlude
        >
          <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            � Tap to Scan & Pay
          </div>
        </Html>
      </mesh>
    </Billboard>
  );
};

// AR Scene Container
const ARQRScene = ({
  qrCodes = [],
  onQRScanned,
  cameraPosition = [0, 0, 0],
}) => {
  return (
    <Canvas
      camera={{
        position: cameraPosition,
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
        zIndex: 10,
      }}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      {qrCodes.map((qrCode, index) => (
        <FloatingQRCode
          key={qrCode.id || index}
          qrData={qrCode.data}
          position={
            qrCode.position || [(index - qrCodes.length / 2) * 2, 0, -3]
          }
          size={qrCode.size || 1.5}
          onScanned={() => onQRScanned(qrCode)}
          isActive={qrCode.status === "active"}
        />
      ))}
    </Canvas>
  );
};

// Main AR QR Code Component
const ARQRCode = ({ qrCodes = [], onQRScanned, className = "" }) => {
  const [localQRCodes, setLocalQRCodes] = useState(qrCodes);

  useEffect(() => {
    setLocalQRCodes(qrCodes);
  }, [qrCodes]);

  const handleQRScanned = (qrCode) => {
    // Update local state to show scanning animation
    setLocalQRCodes((prev) =>
      prev.map((qr) =>
        qr.id === qrCode.id ? { ...qr, status: "scanned" } : qr
      )
    );

    // Call parent handler
    if (onQRScanned) {
      onQRScanned(qrCode);
    }

    // Remove QR code after brief delay
    setTimeout(() => {
      setLocalQRCodes((prev) => prev.filter((qr) => qr.id !== qrCode.id));
    }, 2000);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <ARQRScene qrCodes={localQRCodes} onQRScanned={handleQRScanned} />
    </div>
  );
};

export default ARQRCode;
