import React, { useState } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  Activity,
  Zap,
  Globe,
  Wallet,
  Star,
  Users,
} from "lucide-react";

// Helper functions for wallet address display
const getAgentWalletAddress = (agent) => {
  // Priority order for agent wallet address:
  // 1. agent_wallet_address (primary field for agent's wallet)
  // 2. owner_wallet (backup field)
  // 3. deployer_wallet_address (fallback)
  // 4. user_id (legacy fallback - might be wallet address)

  let walletAddress = null;

  if (agent?.agent_wallet_address) {
    walletAddress = agent.agent_wallet_address;
  } else if (agent?.owner_wallet) {
    walletAddress = agent.owner_wallet;
  } else if (agent?.deployer_wallet_address) {
    walletAddress = agent.deployer_wallet_address;
  } else if (agent?.user_id && agent.user_id.startsWith("0x")) {
    // Some legacy agents might have wallet address in user_id
    walletAddress = agent.user_id;
  }

  return walletAddress || "No wallet configured";
};

const formatWalletAddress = (address) => {
  if (!address || address === "No wallet configured") {
    return address;
  }

  // Format as shortened address: 0x1234...5678
  if (address.length > 10) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return address;
};

/**
 * Modern Agent Card Component
 * Clean, responsive design with proper data handling
 */
const ModernAgentCard = ({ agent, onSelect, distance }) => {
  const [imageError, setImageError] = useState(false);

  // Safe data extraction with fallbacks
  const agentData = {
    id: agent?.id || "",
    name: agent?.name || "Unknown Agent",
    description: agent?.description || "No description available",
    type: agent?.agent_type || agent?.object_type || "assistant",
    network: agent?.network || "unknown",
    chainId: agent?.chain_id || null,
    fee: {
      amount:
        agent?.interaction_fee_amount ||
        agent?.fee_usdc ||
        agent?.fee_usdt ||
        1,
      token: agent?.token_symbol || "USDC",
      currency: agent?.currency_type || "USD",
    },
    location: {
      lat: agent?.latitude || 0,
      lng: agent?.longitude || 0,
      distance: distance || "Unknown",
    },
    wallet: {
      deployer: agent?.deployer_wallet_address || "Not available",
      recipient:
        agent?.payment_recipient_address ||
        agent?.agent_wallet_address ||
        "Not set",
    },
    interactions: {
      text: agent?.text_chat !== false,
      voice: agent?.voice_chat === true,
      video: agent?.video_chat === true,
    },
    metadata: {
      createdAt: agent?.created_at ? new Date(agent.created_at) : null,
      isActive: agent?.is_active !== false,
      rating: 4.5 + Math.random() * 0.5, // Placeholder
      totalInteractions: Math.floor(Math.random() * 1000) + 50, // Placeholder
    },
  };

  // Network display mapping
  const getNetworkInfo = (network) => {
    const networks = {
      "ethereum-sepolia": {
        name: "Ethereum Sepolia",
        color: "bg-blue-500",
        chain: 11155111,
      },
      "arbitrum-sepolia": {
        name: "Arbitrum Sepolia",
        color: "bg-blue-600",
        chain: 421614,
      },
      "base-sepolia": {
        name: "Base Sepolia",
        color: "bg-blue-700",
        chain: 84532,
      },
      "op-sepolia": {
        name: "OP Sepolia",
        color: "bg-red-500",
        chain: 11155420,
      },
      "avalanche-fuji": {
        name: "Avalanche Fuji",
        color: "bg-red-600",
        chain: 43113,
      },
      "polygon-amoy": {
        name: "Polygon Amoy",
        color: "bg-purple-500",
        chain: 80002,
      },
      "cube-sepolia": {
        name: "Cube Sepolia",
        color: "bg-green-500",
        chain: null,
      },
      "morph-holesky": {
        name: "Morph Holesky",
        color: "bg-yellow-500",
        chain: null,
      },
    };
    return (
      networks[network] || {
        name: network || "Unknown",
        color: "bg-gray-500",
        chain: null,
      }
    );
  };

  const networkInfo = getNetworkInfo(agentData.network);

  // Agent type icon mapping
  const getAgentIcon = (type) => {
    const icons = {
      intelligent_assistant: "🤖",
      payment_terminal: "💳",
      local_services: "🏪",
      creative_assistant: "🎨",
      educational_tutor: "📚",
      gaming_companion: "🎮",
      my_ghost: "👻",
    };
    return icons[type] || "🔮";
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden group">
      {/* Header with Status */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getAgentIcon(agentData.type)}</div>
            <div>
              <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
                {agentData.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium text-white ${networkInfo.color}`}
                >
                  {networkInfo.name}
                </span>
                {agentData.metadata.isActive && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-400 text-sm">
              <Star className="w-4 h-4 mr-1 fill-current" />
              {agentData.metadata.rating.toFixed(1)}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {agentData.metadata.totalInteractions} interactions
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
          {agentData.description}
        </p>
      </div>

      {/* Interaction Capabilities */}
      <div className="px-4 pb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <Activity className="w-4 h-4" />
            <span>
              {[
                agentData.interactions.text && "Text",
                agentData.interactions.voice && "Voice",
                agentData.interactions.video && "Video",
              ]
                .filter(Boolean)
                .join(", ") || "Text"}
            </span>
          </div>
        </div>

        {/* Fee and Location */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-white font-medium">
              {agentData.fee.amount} {agentData.fee.token}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{agentData.location.distance}</span>
          </div>
        </div>

        {/* Receiving Wallet */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">Receiving:</span>
            <span
              className="text-blue-400 font-mono text-xs"
              title={getAgentWalletAddress(agent)}
            >
              {formatWalletAddress(getAgentWalletAddress(agent))}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(agentData.metadata.createdAt)}</span>
          </div>
          {networkInfo.chain && (
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Chain {networkInfo.chain}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect?.(agent)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Interact with Agent</span>
        </button>
      </div>
    </div>
  );
};

export default ModernAgentCard;
