import React, { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Box, Sphere, Cylinder, Torus } from "@react-three/drei";
import * as THREE from "three";

const Enhanced3DAgent = ({
  agent,
  position,
  distance,
  onAgentClick,
  scale = 1,
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Animation state
  const animationTime = useRef(0);
  const floatOffset = useRef(Math.random() * Math.PI * 2);
  const spinSpeed = useRef(0.3 + Math.random() * 0.2);

  // Animate the 3D model
  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;

    animationTime.current += delta;

    // Slow spinning animation around Y axis
    groupRef.current.rotation.y += delta * spinSpeed.current;

    // Floating animation (gentle up/down movement)
    const floatIntensity = 0.15 * scale;
    const floatY =
      Math.sin(animationTime.current * 1.5 + floatOffset.current) *
      floatIntensity;
    groupRef.current.position.y = position[1] + floatY;

    // Subtle pulse effect when hovered
    if (hovered) {
      const pulse = 1 + Math.sin(animationTime.current * 8) * 0.08;
      meshRef.current.scale.setScalar(pulse);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  // Get agent color based on type
  const getAgentColor = (agentType) => {
    const colors = {
      // AgentSphere New Types (from deployments)
      intelligent_assistant: "#1e90ff", // Modern shining blue (DodgerBlue)
      local_services: "#32cd32", // Lime green
      payment_terminal: "#ffa500", // Orange
      trailing_payment_terminal: "#ffa500", // Orange
      my_ghost: "#9370db", // Medium purple
      game_agent: "#9370db", // Medium purple
      world_builder_3d: "#00ced1", // Dark turquoise
      home_security: "#dc143c", // Crimson
      content_creator: "#ff1493", // Deep pink
      real_estate_broker: "#32cd32", // Lime green
      bus_stop_agent: "#00ff00", // Pure green
      tutor_teacher: "#ffa500", // Orange
      study_buddy: "#ffd700", // Gold
      social_media_manager: "#da70d6", // Orchid
      data_analyst: "#4169e1", // Royal blue
      customer_support: "#20b2aa", // Light sea green
      marketplace_vendor: "#dc143c", // Crimson

      // Legacy object_type compatibility
      "Intelligent Assistant": "#1e90ff", // Modern shining blue (DodgerBlue)
      "Content Creator": "#ff1493", // Deep pink
      "Local Services": "#32cd32", // Lime green
      "Tutor/Teacher": "#ffa500", // Orange
      "Game Agent": "#9370db", // Medium purple
      "Bus Stop Agent": "#00ff00", // Pure green
      "Study Buddy": "#ffd700", // Gold
      "Home Security": "#dc143c", // Crimson
      "Real Estate Broker": "#32cd32", // Lime green
      "Payment Terminal": "#ffa500", // Orange
      "World Builder 3D": "#00ced1", // Dark turquoise
      "My Ghost": "#9370db", // Medium purple

      // Fallback
      default: "#ffffff", // White fallback
    };
    return colors[agentType] || colors.default;
  };

  // Get agent geometry based on type
  const getAgentGeometry = (agentType) => {
    const baseSize = 0.4; // Increased base size for better visibility

    switch (agentType) {
      case "Intelligent Assistant":
        return <Box args={[baseSize, baseSize, baseSize]} />;
      case "Content Creator":
        return <Sphere args={[baseSize * 0.8]} />;
      case "Local Services":
        return (
          <Cylinder args={[baseSize * 0.6, baseSize * 0.6, baseSize * 1.2]} />
        );
      case "Tutor/Teacher":
        return <Torus args={[baseSize * 0.6, baseSize * 0.3]} />;
      case "Game Agent":
        return <Box args={[baseSize * 1.2, baseSize * 0.6, baseSize * 0.8]} />;
      default:
        return <Box args={[baseSize, baseSize, baseSize]} />;
    }
  };

  // Enhanced 3D models with complex animations
  const getEnhanced3DModel = useCallback(() => {
    const baseColor = getAgentColor(agent.agent_type);
    const emissiveColor = new THREE.Color(baseColor).multiplyScalar(0.35);

    const commonMaterial = {
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: hovered ? 0.6 : 0.3,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: hovered ? 1.0 : 0.95,
    };

    const time = animationTime.current;

    switch (agent.agent_type) {
      case "intelligent_assistant":
      case "Intelligent Assistant":
        return (
          <group>
            {/* Core cube with animated rotation */}
            <Box ref={meshRef} args={[1.0, 1.0, 1.0]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Animated ring system */}
            <Torus
              args={[0.8, 0.12, 8, 24]}
              position={[0, 0, 0]}
              rotation={[Math.PI / 4, time * 0.3, 0]}
            >
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.6}
              />
            </Torus>

            <Torus
              args={[0.6, 0.08, 6, 16]}
              position={[0, 0, 0]}
              rotation={[Math.PI / 3, -time * 0.4, Math.PI / 4]}
            >
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.5}
              />
            </Torus>

            {/* Data particles orbiting */}
            {[...Array(6)].map((_, i) => {
              const orbitAngle = (i / 6) * Math.PI * 2 + time * 0.5;
              const orbitRadius = 1.2;
              return (
                <Sphere
                  key={i}
                  args={[0.08]}
                  position={[
                    Math.cos(orbitAngle) * orbitRadius,
                    Math.sin(orbitAngle * 2) * 0.3,
                    Math.sin(orbitAngle) * orbitRadius,
                  ]}
                >
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={0.8}
                  />
                </Sphere>
              );
            })}
          </group>
        );

      case "content_creator":
      case "Content Creator":
        return (
          <group>
            {/* Dynamic crystal formation */}
            <Box ref={meshRef} args={[0.9, 1.6, 0.9]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Rotating crystal segments */}
            <Box
              args={[1.6, 0.9, 0.9]}
              position={[0, 0, 0]}
              rotation={[0, 0, Math.PI / 4 + time * 0.2]}
            >
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.7}
              />
            </Box>

            <Box
              args={[0.9, 0.9, 1.6]}
              position={[0, 0, 0]}
              rotation={[Math.PI / 4 + time * 0.3, 0, 0]}
            >
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.5}
              />
            </Box>

            {/* Creative sparks */}
            {[...Array(8)].map((_, i) => (
              <Sphere
                key={i}
                args={[0.06]}
                position={[
                  Math.cos(time * 2 + i) * 1.8,
                  Math.sin(time * 1.5 + i) * 0.8,
                  Math.sin(time * 2 + i) * 1.8,
                ]}
              >
                <meshStandardMaterial
                  color={
                    ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"][
                      i % 5
                    ]
                  }
                  emissiveIntensity={1.2}
                />
              </Sphere>
            ))}
          </group>
        );

      case "local_services":
      case "Local Services":
        return (
          <group>
            {/* Multi-tier service tower */}
            <Cylinder
              ref={meshRef}
              args={[0.6, 0.8, 1.6, 12]}
              position={[0, 0, 0]}
            >
              <meshStandardMaterial {...commonMaterial} />
            </Cylinder>

            <Cylinder args={[0.4, 0.6, 0.8, 10]} position={[0, 1.0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Cylinder>

            <Cylinder args={[0.2, 0.4, 0.4, 8]} position={[0, 1.6, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Cylinder>

            {/* Communication array */}
            <Torus
              args={[0.5, 0.06, 8, 16]}
              position={[0, 2.0, 0]}
              rotation={[Math.PI / 2, 0, time]}
            >
              <meshStandardMaterial
                {...commonMaterial}
                emissiveIntensity={0.8}
              />
            </Torus>

            {/* Service status lights */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const blinkOffset = i * 0.5;
              const isActive = Math.sin(time * 3 + blinkOffset) > 0;
              return (
                <Sphere
                  key={i}
                  args={[0.06]}
                  position={[
                    Math.cos(angle) * 0.7,
                    -0.4,
                    Math.sin(angle) * 0.7,
                  ]}
                >
                  <meshStandardMaterial
                    color={isActive ? "#00ff00" : baseColor}
                    emissive={isActive ? "#00ff00" : baseColor}
                    emissiveIntensity={isActive ? 1.5 : 0.3}
                  />
                </Sphere>
              );
            })}
          </group>
        );

      case "tutor_teacher":
      case "study_buddy":
      case "Tutor/Teacher":
      case "Study Buddy":
        return (
          <group>
            {/* Knowledge repository base */}
            <Box ref={meshRef} args={[1.4, 0.4, 1.1]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Floating knowledge pages */}
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                args={[1.2, 0.08, 0.9]}
                position={[0, 0.5 + i * 0.25, 0]}
                rotation={[
                  0,
                  Math.sin(time * 0.8 + i) * 0.15,
                  Math.sin(time * 0.6 + i) * 0.08,
                ]}
              >
                <meshStandardMaterial
                  {...commonMaterial}
                  transparent
                  opacity={0.8 - i * 0.12}
                />
              </Box>
            ))}

            {/* Wisdom symbols */}
            <Sphere args={[0.08]} position={[1.0, 0.8, 0.4]}>
              <meshStandardMaterial color="#ffffff" emissiveIntensity={1.0} />
            </Sphere>
            <Box
              args={[0.1, 0.1, 0.1]}
              position={[-0.9, 0.6, -0.3]}
              rotation={[Math.PI / 4, Math.PI / 4, 0]}
            >
              <meshStandardMaterial color="#ffff00" emissiveIntensity={0.8} />
            </Box>
            <Torus
              args={[0.08, 0.02, 6, 12]}
              position={[0.7, 1.2, -0.5]}
              rotation={[Math.PI / 2, time, 0]}
            >
              <meshStandardMaterial color="#00ffff" emissiveIntensity={0.9} />
            </Torus>
          </group>
        );

      case "game_agent":
      case "Game Agent":
        return (
          <group>
            {/* Core gaming polyhedron */}
            <Box
              ref={meshRef}
              args={[1.2, 1.2, 1.2]}
              position={[0, 0, 0]}
              rotation={[
                Math.PI / 4 + time * 0.1,
                Math.PI / 4 + time * 0.15,
                time * 0.05,
              ]}
            >
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Game element satellites */}
            {[...Array(6)].map((_, i) => {
              const gameColors = [
                "#ff4757",
                "#2ed573",
                "#1e90ff",
                "#ffa502",
                "#ff6b81",
                "#a4b0be",
              ];
              const orbitAngle = (i / 6) * Math.PI * 2 + time * (0.8 + i * 0.1);
              const orbitRadius = 1.8;
              const heightOffset = Math.sin(time * 2 + i) * 0.5;

              return (
                <group key={i} rotation={[0, orbitAngle, 0]}>
                  <Sphere
                    args={[0.15]}
                    position={[orbitRadius, heightOffset, 0]}
                  >
                    <meshStandardMaterial
                      color={gameColors[i]}
                      emissive={gameColors[i]}
                      emissiveIntensity={0.9}
                    />
                  </Sphere>

                  {/* Trail effect */}
                  <Sphere
                    args={[0.08]}
                    position={[orbitRadius * 0.8, heightOffset * 0.8, 0]}
                  >
                    <meshStandardMaterial
                      color={gameColors[i]}
                      transparent
                      opacity={0.4}
                      emissiveIntensity={0.5}
                    />
                  </Sphere>
                </group>
              );
            })}

            {/* Central energy core */}
            <Sphere args={[0.4]} position={[0, 0, 0]}>
              <meshStandardMaterial
                {...commonMaterial}
                emissiveIntensity={1.2 + Math.sin(time * 4) * 0.3}
              />
            </Sphere>
          </group>
        );

      case "payment_terminal":
      case "trailing_payment_terminal":
      case "Payment Terminal":
        return (
          <group>
            {/* Payment kiosk structure */}
            <Box ref={meshRef} args={[0.8, 1.4, 0.6]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Screen */}
            <Box args={[0.6, 0.4, 0.1]} position={[0, 0.3, 0.35]}>
              <meshStandardMaterial
                color="#000000"
                emissive="#00ff00"
                emissiveIntensity={0.5}
              />
            </Box>

            {/* Payment indicator lights */}
            {[...Array(4)].map((_, i) => (
              <Sphere
                key={i}
                args={[0.05]}
                position={[0.3 - i * 0.2, -0.5, 0.35]}
              >
                <meshStandardMaterial
                  color="#00ff00"
                  emissive="#00ff00"
                  emissiveIntensity={Math.sin(time * 3 + i) > 0 ? 1.0 : 0.2}
                />
              </Sphere>
            ))}
          </group>
        );

      case "bus_stop_agent":
      case "Bus Stop Agent":
        return (
          <group>
            {/* Bus stop pole */}
            <Cylinder
              ref={meshRef}
              args={[0.1, 0.1, 2.0, 8]}
              position={[0, 0, 0]}
            >
              <meshStandardMaterial {...commonMaterial} />
            </Cylinder>

            {/* Sign board */}
            <Box args={[1.2, 0.6, 0.1]} position={[0, 0.8, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Bus arrival indicator */}
            <Sphere args={[0.1]} position={[0, 0.8, 0.15]}>
              <meshStandardMaterial
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={Math.sin(time * 4) > 0 ? 1.0 : 0.3}
              />
            </Sphere>
          </group>
        );

      case "home_security":
      case "Home Security":
        return (
          <group>
            {/* Security camera dome */}
            <Sphere ref={meshRef} args={[0.6]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Sphere>

            {/* Camera lens */}
            <Cylinder args={[0.2, 0.25, 0.4, 12]} position={[0, 0, 0.5]}>
              <meshStandardMaterial color="#000000" />
            </Cylinder>

            {/* Security lights */}
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <Sphere
                  key={i}
                  args={[0.06]}
                  position={[Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7]}
                >
                  <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff0000"
                    emissiveIntensity={Math.sin(time * 2 + i) > 0 ? 0.8 : 0.1}
                  />
                </Sphere>
              );
            })}
          </group>
        );

      case "world_builder_3d":
      case "World Builder 3D":
        return (
          <group>
            {/* 3D construction blocks */}
            <Box ref={meshRef} args={[0.8, 0.8, 0.8]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            <Box args={[0.6, 0.6, 0.6]} position={[0.7, 0.7, 0.7]}>
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.8}
              />
            </Box>

            <Box args={[0.4, 0.4, 0.4]} position={[-0.6, 0.6, -0.6]}>
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.6}
              />
            </Box>

            {/* Construction grid */}
            {[...Array(3)].map((_, i) => (
              <Box
                key={i}
                args={[0.05, 2.0, 0.05]}
                position={[i * 0.5 - 0.5, 0, 0]}
                rotation={[0, 0, Math.sin(time + i) * 0.1]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.3}
                />
              </Box>
            ))}
          </group>
        );

      case "my_ghost":
      case "My Ghost":
        return (
          <group>
            {/* Ghost body */}
            <Sphere ref={meshRef} args={[0.7]} position={[0, 0, 0]}>
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.6}
              />
            </Sphere>

            {/* Ghostly tail */}
            <Sphere args={[0.4]} position={[0, -0.8, 0]}>
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.4}
              />
            </Sphere>

            <Sphere args={[0.2]} position={[0, -1.2, 0]}>
              <meshStandardMaterial
                {...commonMaterial}
                transparent
                opacity={0.2}
              />
            </Sphere>

            {/* Ethereal particles */}
            {[...Array(10)].map((_, i) => (
              <Sphere
                key={i}
                args={[0.04]}
                position={[
                  Math.cos(time * 2 + i) * 1.2,
                  Math.sin(time * 1.5 + i) * 0.8,
                  Math.sin(time * 2 + i) * 1.2,
                ]}
              >
                <meshStandardMaterial
                  color={baseColor}
                  transparent
                  opacity={0.8}
                  emissiveIntensity={0.8}
                />
              </Sphere>
            ))}
          </group>
        );

      case "real_estate_broker":
      case "Real Estate Broker":
        return (
          <group>
            {/* House structure */}
            <Box ref={meshRef} args={[1.0, 0.8, 1.0]} position={[0, -0.2, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Roof */}
            <Box
              args={[1.2, 0.4, 1.2]}
              position={[0, 0.4, 0]}
              rotation={[0, Math.PI / 4, 0]}
            >
              <meshStandardMaterial {...commonMaterial} />
            </Box>

            {/* Property markers */}
            {[...Array(4)].map((_, i) => {
              const angle = (i / 4) * Math.PI * 2;
              return (
                <Cylinder
                  key={i}
                  args={[0.05, 0.05, 0.8, 6]}
                  position={[Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5]}
                >
                  <meshStandardMaterial
                    color="#ffff00"
                    emissive="#ffff00"
                    emissiveIntensity={0.5}
                  />
                </Cylinder>
              );
            })}
          </group>
        );

      default:
        return (
          <Box ref={meshRef} args={[1.0, 1.0, 1.0]} position={[0, 0, 0]}>
            <meshStandardMaterial {...commonMaterial} />
          </Box>
        );
    }
  }, [agent.agent_type, hovered, animationTime.current]);

  // Handle click event
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onAgentClick) {
        onAgentClick(agent);
      }
    },
    [agent, onAgentClick]
  );

  // Distance-based scaling
  const distanceScale =
    Math.max(0.4, Math.min(2.0, 60 / Math.max(distance, 15))) * scale;

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      scale={[distanceScale, distanceScale, distanceScale]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Enhanced 3D Model */}
      {getEnhanced3DModel()}

      {/* Distance label */}
      <Text
        position={[0, 1.8, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="black"
      >
        {distance < 1000
          ? `${Math.round(distance)}m`
          : `${(distance / 1000).toFixed(1)}km`}
      </Text>

      {/* Agent name and type on hover */}
      {hovered && (
        <group>
          <Text
            position={[0, -1.2, 0]}
            fontSize={0.18}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="black"
            maxWidth={3}
          >
            {agent.name}
          </Text>
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.12}
            color="#a855f7"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="black"
            maxWidth={3}
          >
            {agent.agent_type}
          </Text>
        </group>
      )}

      {/* Enhanced glow effect */}
      <pointLight
        position={[0, 0, 0]}
        color={getAgentColor(agent.agent_type)}
        intensity={hovered ? 1.0 : 0.4}
        distance={4}
        decay={2}
      />

      {/* Ambient particle effect when hovered */}
      {hovered && (
        <group>
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2 + animationTime.current * 2;
            const radius = 2.5;
            return (
              <Sphere
                key={i}
                args={[0.03]}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(animationTime.current * 3 + i) * 0.5,
                  Math.sin(angle) * radius,
                ]}
              >
                <meshStandardMaterial
                  color={getAgentColor(agent.agent_type)}
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.7}
                />
              </Sphere>
            );
          })}
        </group>
      )}
    </group>
  );
};

export default Enhanced3DAgent;
