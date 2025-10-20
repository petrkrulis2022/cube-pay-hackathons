import React, { useState } from "react";
import {
  X,
  MapPin,
  Wallet,
  Activity,
  Clock,
  Star,
  Shield,
  Zap,
  Globe,
  Radio,
  Eye,
  Target,
  TrendingUp,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  resolveInteractionFee,
  getAgentNetworkInfo,
} from "../utils/agentDataValidator";

const AgentDetailModal = ({ agent, isOpen, onClose, userLocation }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    location: false,
    blockchain: false,
    capabilities: false,
    performance: false,
    technical: false,
  });

  if (!isOpen || !agent) return null;

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatCoordinate = (coord, precision = 6) => {
    return coord ? coord.toFixed(precision) : "N/A";
  };

  const formatDistance = (distance) => {
    if (distance === null) return "Unknown";
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getNetworkDisplay = (network) => {
    const networkMap = {
      "morph-holesky": "Morph Holesky Testnet",
      "avalanche-fuji": "Avalanche Fuji Testnet",
      "avalanche-mainnet": "Avalanche Mainnet",
      ethereum: "Ethereum Mainnet",
      polygon: "Polygon",
      "near-testnet": "NEAR Testnet",
      "near-mainnet": "NEAR Protocol",
      "blockdag-testnet": "BlockDAG Testnet",
    };
    return networkMap[network] || network;
  };

  const getAgentTypeIcon = (type) => {
    const iconMap = {
      // Enhanced AgentSphere types
      intelligent_assistant: "🤖",
      local_services: "🛠️",
      payment_terminal: "💳",
      content_creator: "🎨",
      tutor_teacher: "📚",
      game_agent: "🎮",
      threed_world_modelling: "🏗️",
      social_media_manager: "📱",
      data_analyst: "📊",
      customer_support: "🎧",
      marketplace_vendor: "🛒",

      // Legacy object_type compatibility
      "Intelligent Assistant": "🤖",
      "Local Services": "🛠️",
      "Content Creator": "🎨",
      "Tutor/Teacher": "📚",
      "Game Agent": "🎮",
      "3D World Modelling": "🏗️",
      study_buddy: "📖",
      tutor: "👨‍🏫",
      landmark: "🏛️",
      building: "🏢",
      ai_agent: "🤖",
    };
    return iconMap[type] || "⭐";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const Section = ({
    title,
    icon: Icon,
    children,
    sectionKey,
    className = "",
  }) => (
    <div
      className={`bg-gray-800/50 rounded-lg border border-gray-700 ${className}`}
    >
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Icon className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-4 pb-4">{children}</div>
      )}
    </div>
  );

  const CopyableField = ({ label, value, fullValue, fieldName }) => {
    const displayValue = fullValue
      ? `${fullValue.substring(0, 10)}...${fullValue.substring(
          fullValue.length - 8
        )}`
      : value;
    const copyValue = fullValue || value;

    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-gray-400 text-sm">{label}:</span>
        <div className="flex items-center space-x-2">
          <span className="text-white font-mono text-sm bg-gray-700 px-2 py-1 rounded">
            {displayValue}
          </span>
          <button
            onClick={() => copyToClipboard(copyValue, fieldName)}
            className="text-gray-400 hover:text-green-400 transition-colors"
          >
            {copiedField === fieldName ? (
              <span className="text-green-400 text-xs">Copied!</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-green-500/20 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-500/20 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-3xl">
              {getAgentTypeIcon(agent.agent_type || agent.object_type)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {agent.name || "Unnamed Agent"}
              </h2>
              <p className="text-green-400 text-lg">
                {agent.agent_type || agent.object_type || "Agent"}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center space-x-1 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Active</span>
                </span>
                {agent.distance_meters !== null && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
                    {formatDistance(agent.distance_meters)} away
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Section */}
          <Section title="Agent Overview" icon={Info} sectionKey="overview">
            <div className="space-y-3">
              <div>
                <h4 className="text-white font-medium mb-2">Description</h4>
                <p className="text-gray-300 leading-relaxed">
                  {agent.description || "No description provided"}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {(() => {
                      const resolvedFee = resolveInteractionFee(agent);
                      console.log(
                        "🔍 AgentDetailModal NEW Fee Display:",
                        resolvedFee
                      );
                      return resolvedFee.amount;
                    })()}
                  </div>
                  <div className="text-sm text-gray-400">
                    {(() => {
                      const resolvedFee = resolveInteractionFee(agent);
                      return resolvedFee.token;
                    })()}{" "}
                    Fee
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {agent.interaction_range || 15}m
                  </div>
                  <div className="text-sm text-gray-400">Range</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {agent.interaction_types?.length || 1}
                  </div>
                  <div className="text-sm text-gray-400">Interfaces</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {agent.accuracy ? `${agent.accuracy.toFixed(1)}m` : "N/A"}
                  </div>
                  <div className="text-sm text-gray-400">GPS Accuracy</div>
                </div>
              </div>
            </div>
          </Section>

          {/* Location Details */}
          <Section
            title="Location & Positioning"
            icon={MapPin}
            sectionKey="location"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">GPS Coordinates</h4>
                <div className="space-y-2">
                  <CopyableField
                    label="Latitude"
                    value={formatCoordinate(agent.latitude)}
                    fieldName="latitude"
                  />
                  <CopyableField
                    label="Longitude"
                    value={formatCoordinate(agent.longitude)}
                    fieldName="longitude"
                  />
                  <CopyableField
                    label="Altitude"
                    value={`${agent.altitude || 0}m`}
                    fieldName="altitude"
                  />
                </div>
              </div>

              {(agent.preciseLatitude || agent.preciseLongitude) && (
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <span>RTK Precise Coordinates</span>
                    {agent.correctionApplied && (
                      <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
                        Enhanced
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2">
                    <CopyableField
                      label="Precise Lat"
                      value={formatCoordinate(agent.preciseLatitude, 8)}
                      fieldName="preciseLatitude"
                    />
                    <CopyableField
                      label="Precise Lon"
                      value={formatCoordinate(agent.preciseLongitude, 8)}
                      fieldName="preciseLongitude"
                    />
                    <CopyableField
                      label="Precise Alt"
                      value={`${agent.preciseAltitude || 0}m`}
                      fieldName="preciseAltitude"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Location Type:</span>
                <span className="text-white">
                  {agent.location_type || "Not specified"}
                </span>
              </div>
            </div>
          </Section>

          {/* Blockchain Information */}
          <Section
            title="Blockchain & Payment"
            icon={Wallet}
            sectionKey="blockchain"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Network Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white">
                      {getNetworkDisplay(agent.network)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">Currency:</span>
                    <span className="text-white">
                      {(() => {
                        const resolvedFee = resolveInteractionFee(agent);
                        return resolvedFee.token;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">Interaction Fee:</span>
                    <span className="text-green-400 font-semibold">
                      {(() => {
                        const resolvedFee = resolveInteractionFee(agent);
                        console.log(
                          "🔍 AgentDetailModal Payment Section NEW Fee Display:",
                          resolvedFee
                        );
                        return `${resolvedFee.amount} ${resolvedFee.token}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">
                  Payment & Wallet Information
                </h4>
                <div className="space-y-3">
                  {/* Payment Recipient */}
                  {agent.payment_recipient_address ? (
                    <CopyableField
                      label="Payment Recipient"
                      value={agent.payment_recipient_address}
                      fullValue={agent.payment_recipient_address}
                      fieldName="payment_recipient"
                    />
                  ) : agent.deployer_wallet_address ? (
                    <CopyableField
                      label="Payment Recipient (Deployer)"
                      value={agent.deployer_wallet_address}
                      fullValue={agent.deployer_wallet_address}
                      fieldName="payment_recipient"
                    />
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No payment recipient configured
                    </p>
                  )}

                  {/* Agent Wallet */}
                  {agent.agent_wallet_address && (
                    <CopyableField
                      label="Agent Wallet"
                      value={agent.agent_wallet_address}
                      fullValue={agent.agent_wallet_address}
                      fieldName="agent_wallet"
                    />
                  )}

                  {/* Token Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Token:</span>
                      <p className="text-white">
                        {agent.token_symbol || "USDT"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Network:</span>
                      <p className="text-white">
                        {agent.chain_id === 2810
                          ? "Morph Holesky"
                          : `Chain ${agent.chain_id || 2810}`}
                      </p>
                    </div>
                  </div>

                  {/* Interaction Fee */}
                  <div>
                    <span className="text-gray-400 text-sm">
                      Interaction Fee:
                    </span>
                    <p className="text-white font-semibold">
                      {(() => {
                        const resolvedFee = resolveInteractionFee(agent);
                        console.log(
                          "🔍 AgentDetailModal Detailed NEW Fee Display:",
                          resolvedFee
                        );
                        return `${resolvedFee.amount} ${resolvedFee.token}`;
                      })()}
                    </p>
                    {(() => {
                      const resolvedFee = resolveInteractionFee(agent);
                      if (
                        resolvedFee.source &&
                        !resolvedFee.source.includes("fallback")
                      ) {
                        return (
                          <p className="text-xs text-gray-500 mt-1">
                            Source: {resolvedFee.source}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Capabilities & Features */}
          <Section
            title="Capabilities & Features"
            icon={Activity}
            sectionKey="capabilities"
          >
            <div className="space-y-4">
              {/* Enhanced Interaction Methods */}
              <div>
                <h4 className="text-white font-medium mb-3">
                  Communication Capabilities
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`p-3 rounded-lg border text-center ${
                      agent.text_chat !== false
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">💬</div>
                    <div className="text-sm">Text Chat</div>
                  </div>
                  <div
                    className={`p-3 rounded-lg border text-center ${
                      agent.voice_chat
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">🎤</div>
                    <div className="text-sm">Voice Chat</div>
                  </div>
                  <div
                    className={`p-3 rounded-lg border text-center ${
                      agent.video_chat
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">📹</div>
                    <div className="text-sm">Video Chat</div>
                  </div>
                </div>
              </div>

              {/* MCP Services */}
              {agent.mcp_services && agent.mcp_services.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">
                    MCP Server Capabilities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.mcp_services.map((service, index) => (
                      <span
                        key={index}
                        className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy Interaction Types */}
              {agent.interaction_types &&
                agent.interaction_types.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">
                      Legacy Interaction Methods
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.interaction_types.map((type, index) => (
                        <span
                          key={index}
                          className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm"
                        >
                          {type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Enhanced Features */}
              {agent.features && agent.features.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">
                    Special Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-lg text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-white font-medium mb-3">
                  Special Features
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div
                    className={`p-3 rounded-lg border ${
                      agent.trailing_agent
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <Radio className="w-5 h-5 mb-1" />
                    <div className="text-sm">Trailing Agent</div>
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${
                      agent.ar_notifications
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <Eye className="w-5 h-5 mb-1" />
                    <div className="text-sm">AR Notifications</div>
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${
                      agent.show_on_map
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <Globe className="w-5 h-5 mb-1" />
                    <div className="text-sm">Map Visible</div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Performance & Usage */}
          <Section
            title="Performance & Analytics"
            icon={TrendingUp}
            sectionKey="performance"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">-</div>
                <div className="text-sm text-gray-400">Total Interactions</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Wallet className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">-</div>
                <div className="text-sm text-gray-400">Revenue Generated</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">New</div>
                <div className="text-sm text-gray-400">Agent Status</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Performance metrics will be available after agent interactions
              begin.
            </p>
          </Section>

          {/* Technical Details */}
          <Section
            title="Technical Information"
            icon={Shield}
            sectionKey="technical"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Deployment Info</h4>
                <div className="space-y-2">
                  <CopyableField
                    label="Agent ID"
                    value={agent.id}
                    fieldName="agentId"
                  />
                  <CopyableField
                    label="Deployer Wallet"
                    value={agent.deployer_wallet_address || agent.user_id}
                    fullValue={agent.deployer_wallet_address}
                    fieldName="deployer"
                  />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white text-sm">
                      {formatDate(agent.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">Configuration</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">
                      Proximity Notifications:
                    </span>
                    <span
                      className={
                        agent.enable_proximity_notifications
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {agent.enable_proximity_notifications
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-400">RTK Correction:</span>
                    <span
                      className={
                        agent.correctionApplied
                          ? "text-green-400"
                          : "text-gray-400"
                      }
                    >
                      {agent.correctionApplied ? "Applied" : "Standard GPS"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="border-t border-green-500/20 p-4 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Agent card retrieved from AgentSphere Network
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <Zap className="w-4 h-4" />
              <span>Interact in AR Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetailModal;
