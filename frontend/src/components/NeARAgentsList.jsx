import React from "react";
import {
  MapPin,
  Zap,
  Clock,
  Star,
  Wallet,
  Users,
  Activity,
} from "lucide-react";
import { resolveInteractionFee } from "../utils/agentDataValidator";

const NeARAgentsList = ({
  agents,
  loading,
  onAgentSelect,
  userLocation,
  formatDistance,
}) => {
  const getAgentTypeIcon = (type) => {
    const iconMap = {
      // AgentSphere New Types (from deployments)
      intelligent_assistant: "🤖",
      local_services: "🏪",
      payment_terminal: "💳",
      trailing_payment_terminal: "📱",
      my_ghost: "👻",
      game_agent: "🎮",
      world_builder_3d: "🏗️",
      home_security: "🔒",
      content_creator: "🎨",
      real_estate_broker: "🏠",
      bus_stop_agent: "🚌",
      tutor_teacher: "👨‍🏫",
      study_buddy: "📖",
      social_media_manager: "📱",
      data_analyst: "📊",
      customer_support: "🎧",
      marketplace_vendor: "🛒",

      // Legacy types for backward compatibility
      "Intelligent Assistant": "🤖",
      "Local Services": "🛠️",
      "Content Creator": "🎨",
      "Tutor/Teacher": "📚",
      "Game Agent": "🎮",
      "3D World Modelling": "🏗️",
      "Study Buddy": "📖",
      "Bus Stop Agent": "🚌",
      "Home Security": "🔒",
      "Real Estate Broker": "🏠",
      "Payment Terminal": "💳",
      "World Builder 3D": "🏗️",
      "My Ghost": "👻",

      // Generic fallbacks
      tutor: "👨‍🏫",
      landmark: "🏛️",
      building: "🏢",
      ai_agent: "🤖",
    };
    return iconMap[type] || "⭐";
  };

  const getNetworkDisplay = (network) => {
    const networkMap = {
      "morph-holesky": "Morph Holesky",
      "avalanche-fuji": "Avalanche Fuji",
      "avalanche-mainnet": "Avalanche",
      ethereum: "Ethereum",
      "ethereum-sepolia": "Ethereum Sepolia",
      "arbitrum-sepolia": "Arbitrum Sepolia",
      "base-sepolia": "Base Sepolia",
      "op-sepolia": "OP Sepolia",
      polygon: "Polygon",
      "near-testnet": "NEAR Testnet",
      "near-mainnet": "NEAR",
      "blockdag-testnet": "BlockDAG",
      "cube-sepolia": "Cube Sepolia",
      cube: "Cube Network",
    };
    console.log(
      `🔍 Network mapping for '${network}':`,
      networkMap[network] || network
    );
    return networkMap[network] || network;
  };

  const getInteractionTypesDisplay = (types) => {
    if (!types || !Array.isArray(types)) return ["Chat"];

    const typeMap = {
      text_chat: "Chat",
      voice_interface: "Voice",
      video_interface: "Video",
      defi_features: "DeFi",
    };

    return types.map((type) => typeMap[type] || type);
  };

  const formatCreatedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
            <div className="w-16 h-6 bg-gray-700 rounded"></div>
          </div>
          <div className="h-6 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No Agents Found
        </h3>
        <p className="text-gray-400 max-w-md">
          No agents match your current search criteria. Try adjusting your
          filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 group"
          >
            <div className="p-6">
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-2xl">
                    {getAgentTypeIcon(agent.agent_type || agent.object_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg leading-tight">
                      {agent.name || "Unnamed Agent"}
                    </h3>
                    <p className="text-green-400 text-sm">
                      {agent.agent_type || agent.object_type || "Agent"}
                    </p>
                  </div>
                </div>

                {/* Distance Badge */}
                {agent.distance_meters !== null && (
                  <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs font-medium">
                    {formatDistance(agent.distance_meters)}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-4">
                {agent.description || "No description available"}
              </p>

              {/* Agent Details */}
              <div className="space-y-2 mb-4">
                {/* Location */}
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {agent.location_type || "Unknown location"} • Range:{" "}
                    {agent.interaction_range || 15}m
                  </span>
                </div>

                {/* Payment Info */}
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Wallet className="w-4 h-4" />
                  <span>
                    {(() => {
                      console.log(
                        "🔍 NeARAgentsList FULL Agent Data for:",
                        agent.name,
                        {
                          network: agent.network,
                          chain_id: agent.chain_id,
                          interaction_fee_amount: agent.interaction_fee_amount,
                          fee_usdc: agent.fee_usdc,
                          fee_usdt: agent.fee_usdt,
                          interaction_fee_usdfc: agent.interaction_fee_usdfc,
                          interaction_fee: agent.interaction_fee,
                        }
                      );
                      const resolvedFee = resolveInteractionFee(agent);
                      console.log(
                        "🔍 NeARAgentsList NEW Fee Display:",
                        resolvedFee
                      );
                      return `${resolvedFee.amount} ${resolvedFee.token}`;
                    })()}{" "}
                    • {getNetworkDisplay(agent.network)}
                  </span>
                </div>

                {/* Interaction Types */}
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>
                    {getInteractionTypesDisplay(agent.interaction_types).join(
                      ", "
                    )}
                  </span>
                </div>

                {/* Created Date */}
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Deployed {formatCreatedDate(agent.created_at)}</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-4">
                {agent.trailing_agent && (
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                    Trailing
                  </span>
                )}
                {agent.ar_notifications && (
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                    AR Notifications
                  </span>
                )}
                {agent.correctionApplied && (
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
                    RTK Enhanced
                  </span>
                )}
              </div>

              {/* Retrieve Card Button */}
              <button
                onClick={() => onAgentSelect(agent)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-black font-semibold py-3 px-4 rounded-lg hover:from-green-400 hover:to-green-500 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-green-500/20"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Retrieve Agent's Card</span>
                </div>
              </button>
            </div>

            {/* Status Indicator */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400">Active</span>
                </div>
                <span className="text-gray-500">
                  ID: {agent.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeARAgentsList;
