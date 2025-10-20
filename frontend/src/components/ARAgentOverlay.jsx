import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  MessageCircle,
  Zap,
  MapPin,
  User,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Wrench,
} from "lucide-react";

const ARAgentOverlay = ({
  agents = [],
  onAgentClick,
  userLocation,
  cameraViewSize = { width: 1280, height: 720 },
}) => {
  const [visibleAgents, setVisibleAgents] = useState([]);

  // Agent type icons
  const getAgentIcon = (agentType) => {
    const icons = {
      // Enhanced AgentSphere types
      intelligent_assistant: Bot,
      local_services: Wrench,
      payment_terminal: Bot,
      content_creator: User,
      tutor_teacher: GraduationCap,
      game_agent: Gamepad2,
      threed_world_modelling: Briefcase,
      social_media_manager: User,
      data_analyst: Bot,
      customer_support: MessageCircle,
      marketplace_vendor: Briefcase,

      // Legacy object_type compatibility
      "Intelligent Assistant": Bot,
      "Content Creator": User,
      "Local Services": Wrench,
      "Tutor/Teacher": GraduationCap,
      "Game Agent": Gamepad2,
    };
    return icons[agentType] || Bot;
  };

  // Agent type colors
  const getAgentColor = (agentType) => {
    const colors = {
      // Enhanced AgentSphere types
      intelligent_assistant: "from-blue-500 to-purple-500",
      local_services: "from-green-500 to-teal-500",
      payment_terminal: "from-yellow-500 to-orange-500",
      content_creator: "from-pink-500 to-red-500",
      tutor_teacher: "from-yellow-500 to-orange-500",
      game_agent: "from-purple-500 to-indigo-500",
      threed_world_modelling: "from-cyan-500 to-blue-500",
      social_media_manager: "from-pink-500 to-purple-500",
      data_analyst: "from-indigo-500 to-blue-500",
      customer_support: "from-green-500 to-emerald-500",
      marketplace_vendor: "from-orange-500 to-red-500",

      // Legacy object_type compatibility
      "Intelligent Assistant": "from-blue-500 to-purple-500",
      "Content Creator": "from-pink-500 to-red-500",
      "Local Services": "from-green-500 to-teal-500",
      "Tutor/Teacher": "from-yellow-500 to-orange-500",
      "Game Agent": "from-purple-500 to-indigo-500",
    };
    return colors[agentType] || "from-blue-500 to-purple-500";
  };

  // Calculate agent position on screen based on GPS coordinates
  const calculateAgentPosition = (agent, userLoc) => {
    const index = agents.indexOf(agent);
    const totalAgents = agents.length;

    if (!userLoc || !agent.latitude || !agent.longitude) {
      // Enhanced distributed positioning for better coverage
      console.log(
        `🎯 Using fallback positioning for agent ${index + 1}/${totalAgents}: ${
          agent.name
        }`
      );

      // Use circular distribution for better spread
      const angle = (index / totalAgents) * 2 * Math.PI; // Full circle distribution
      const radiusVariation = index % 4; // 0, 1, 2, 3 pattern
      const radius = 15 + radiusVariation * 15; // Rings at 15%, 30%, 45%, 60% from center

      // Create multiple layers to avoid clustering
      const layerAngleOffset = Math.floor(index / 4) * 30 * (Math.PI / 180); // Rotate each layer by 30°
      const adjustedAngle = angle + layerAngleOffset;

      // Calculate position in a circle pattern
      const baseX = 50 + Math.cos(adjustedAngle) * radius;
      const baseY = 50 + Math.sin(adjustedAngle) * radius;

      // Add some vertical layering for better 3D effect
      const layerOffset = (index % 3) * 8 - 8; // -8, 0, +8 vertical spread

      return {
        x: Math.max(5, Math.min(95, baseX)),
        y: Math.max(5, Math.min(95, baseY + layerOffset)),
        distance: agent.distance_meters || 50 + (index % 10) * 20, // Vary distances
        angle: angle * (180 / Math.PI), // Store angle for debugging
        strategy: "fallback-circular",
        debugInfo: `Agent ${index + 1}/${totalAgents}: angle=${(
          (angle * 180) /
          Math.PI
        ).toFixed(1)}°, radius=${radius}%, basePos=(${baseX.toFixed(
          1
        )}, ${baseY.toFixed(1)})`,
      };
    }

    // GPS-based positioning with much more conservative scaling
    const latDiff = agent.latitude - userLoc.latitude;
    const lonDiff = agent.longitude - userLoc.longitude;

    // Calculate actual distance first
    const distanceKm = Math.sqrt(
      Math.pow(latDiff * 111000, 2) + Math.pow(lonDiff * 111000, 2)
    );

    console.log(
      `📡 GPS positioning for ${agent.name}: distance=${distanceKm.toFixed(
        0
      )}m, lat=${latDiff.toFixed(6)}, lon=${lonDiff.toFixed(6)}`
    );

    // Use a much smaller scale factor and normalize the distance
    const maxDisplayDistance = 1000; // meters
    const normalizedDistance =
      Math.min(distanceKm, maxDisplayDistance) / maxDisplayDistance;

    // Create a circular pattern based on bearing and distance
    const bearing = Math.atan2(lonDiff, latDiff); // Calculate bearing to agent
    const displayRadius = 20 + normalizedDistance * 25; // 20-45% from center

    let x = 50 + Math.sin(bearing) * displayRadius;
    let y = 50 - Math.cos(bearing) * displayRadius; // North is up

    // Add small random offset to prevent exact overlap
    const randomOffset = 3;
    x += (Math.random() - 0.5) * randomOffset;
    y += (Math.random() - 0.5) * randomOffset;

    // Ensure agents stay within safe bounds
    x = Math.max(8, Math.min(92, x));
    y = Math.max(8, Math.min(92, y));

    console.log(
      `📍 Final position for ${agent.name}: (${x.toFixed(1)}%, ${y.toFixed(
        1
      )}%)`
    );

    return {
      x,
      y,
      distance: distanceKm,
      bearing: bearing * (180 / Math.PI),
      normalizedDistance,
      strategy: "gps-based",
      debugInfo: `GPS: bearing=${((bearing * 180) / Math.PI).toFixed(
        1
      )}°, dist=${distanceKm.toFixed(0)}m, display=(${x.toFixed(
        1
      )}, ${y.toFixed(1)})`,
    };
  };

  // Update visible agents with positions
  useEffect(() => {
    console.log("🤖 ARAgentOverlay received agents:", agents.length, "agents");
    console.log("📍 User location:", userLocation);

    if (agents.length === 0) {
      console.log("❌ No agents to display");
      setVisibleAgents([]);
      return;
    }

    const agentsWithPositions = agents.map((agent, index) => {
      const position = calculateAgentPosition(agent, userLocation);
      console.log(
        `🎯 Agent ${index + 1}: ${
          agent.name
        } -> Position: (${position.x.toFixed(1)}%, ${position.y.toFixed(
          1
        )}%) Distance: ${position.distance.toFixed(0)}m`
      );

      return {
        ...agent,
        position,
      };
    });

    console.log(
      "🎯 All agents with positions calculated:",
      agentsWithPositions.length
    );

    // Sort by distance (closest first) but keep all agents within reasonable range
    agentsWithPositions.sort(
      (a, b) => a.position.distance - b.position.distance
    );

    // Show more agents and ensure better distribution
    const maxVisibleAgents = Math.min(20, agentsWithPositions.length); // Increased from 15
    const limitedAgents = agentsWithPositions.slice(0, maxVisibleAgents);

    console.log(
      `👁️ Setting ${limitedAgents.length} visible agents out of ${agents.length} total`
    );
    console.log(
      "� Visible agents summary:",
      limitedAgents.map((a) => ({
        name: a.name,
        position: `(${a.position.x.toFixed(1)}%, ${a.position.y.toFixed(1)}%)`,
        distance: `${a.position.distance.toFixed(0)}m`,
      }))
    );

    setVisibleAgents(limitedAgents);
  }, [agents, userLocation]);

  // Handle agent click
  const handleAgentClick = (agent) => {
    if (onAgentClick) {
      onAgentClick(agent);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {visibleAgents.map((agent, index) => {
        const IconComponent = getAgentIcon(
          agent.agent_type || agent.object_type
        );
        const colorClass = getAgentColor(agent.agent_type || agent.object_type);

        return (
          <div
            key={agent.id}
            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{
              left: `${agent.position.x}%`,
              top: `${agent.position.y}%`,
              animationDelay: `${index * 0.2}s`,
            }}
          >
            {/* Agent Marker */}
            <div
              onClick={() => handleAgentClick(agent)}
              className="relative cursor-pointer group"
            >
              {/* Pulsing Ring */}
              <div
                className={`absolute inset-0 w-16 h-16 bg-gradient-to-r ${colorClass} rounded-full opacity-30 animate-ping`}
              ></div>

              {/* Main Agent Circle */}
              <div
                className={`relative w-12 h-12 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 hover:scale-110 transition-transform duration-200`}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>

              {/* Distance Badge */}
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-black/70 text-white text-xs px-1 py-0.5">
                  {agent.position.distance < 1000
                    ? `${Math.round(agent.position.distance)}m`
                    : `${(agent.position.distance / 1000).toFixed(1)}km`}
                </Badge>
              </div>

              {/* Agent Info Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 min-w-48 shadow-xl border border-white/20">
                  <div className="text-center">
                    <h4 className="text-white font-semibold text-sm mb-1">
                      {agent.name}
                    </h4>
                    <p className="text-purple-200 text-xs mb-2">
                      {agent.agent_type || agent.object_type}
                    </p>
                    <p className="text-slate-300 text-xs mb-3 line-clamp-2">
                      {agent.description}
                    </p>

                    <div className="flex items-center justify-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Online</span>
                      </div>
                      <div className="flex items-center space-x-1 text-blue-400">
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat</span>
                      </div>
                    </div>
                  </div>

                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                </div>
              </div>

              {/* Interaction Hint */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-purple-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-medium">
                    Tap to chat
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Agent Counter */}
      {visibleAgents.length > 0 && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Badge className="bg-black/70 text-white flex items-center space-x-2 px-3 py-2">
            <Bot className="w-4 h-4" />
            <span>
              {visibleAgents.length} agent
              {visibleAgents.length !== 1 ? "s" : ""} nearby
            </span>
          </Badge>
        </div>
      )}

      {/* No Agents Message */}
      {visibleAgents.length === 0 && agents.length === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-center">
            <Bot className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-white text-sm font-medium">No agents nearby</p>
            <p className="text-slate-400 text-xs">
              Move around to discover NeAR agents
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {agents.length === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-white text-sm font-medium">
              Scanning for agents...
            </p>
            <p className="text-slate-400 text-xs">Connecting to NeAR network</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARAgentOverlay;
