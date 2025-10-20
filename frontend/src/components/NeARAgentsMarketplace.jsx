import React, { useState, useEffect } from "react";
import { Search, Filter, MapPin, Zap, Clock, Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useDatabase } from "../hooks/useDatabase";
import NeARAgentsList from "./NeARAgentsList";
import AgentDetailModal from "./AgentDetailModal";

const NeARAgentsMarketplace = ({ isOpen, onClose, userLocation }) => {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Use the enhanced database hook that includes mock data fallback
  const {
    getNearAgents,
    getCurrentLocation,
    isLoading: dbLoading,
    error: dbError,
  } = useDatabase();

  // Enhanced agent type filters matching AgentSphere deployment types
  const agentFilters = [
    { id: "all", label: "All Agents", count: 0 },
    // Enhanced AgentSphere Agent Types (Phase 1)
    {
      id: "intelligent_assistant",
      label: "🤖 Intelligent Assistant",
      count: 0,
    },
    { id: "local_services", label: "🏪 Local Services", count: 0 },
    { id: "payment_terminal", label: "💳 Payment Terminal", count: 0 },
    {
      id: "trailing_payment_terminal",
      label: "📱 Trailing Payment Terminal",
      count: 0,
    },
    { id: "my_ghost", label: "👻 My Ghost", count: 0 },
    { id: "game_agent", label: "🎮 Game Agent", count: 0 },
    { id: "world_builder_3d", label: "🏗️ 3D World Builder", count: 0 },
    { id: "home_security", label: "🔒 Home Security", count: 0 },
    { id: "content_creator", label: "🎨 Content Creator", count: 0 },
    { id: "real_estate_broker", label: "🏠 Real Estate Broker", count: 0 },
    { id: "bus_stop_agent", label: "🚌 Bus Stop Agent", count: 0 },
    // Legacy types for backward compatibility
    { id: "tutor", label: "📚 Tutor", count: 0 },
    { id: "study_buddy", label: "👥 Study Buddy", count: 0 },
    { id: "landmark", label: "📍 Landmark", count: 0 },
    { id: "building", label: "🏢 Building", count: 0 },
  ];

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Convert to meters
  };

  // Fetch agents using the enhanced database hook (includes mock data fallback)
  const fetchAgents = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching agents using enhanced database hook...");

      // Use userLocation or get current device location
      let location = userLocation;
      if (!location) {
        try {
          location = await getCurrentLocation();
          console.log("📍 Got device location:", location);
        } catch (error) {
          console.warn(
            "⚠️ Could not get device location, using default:",
            error.message
          );
          // Fallback to default location with wide radius for global coverage
          location = {
            latitude: 50.64, // Central Europe
            longitude: 13.83,
            radius_meters: 50000, // 50km radius for wide coverage
          };
        }
      }

      console.log("📍 Using location:", location);

      // Get agents from database hook (includes Supabase + mock data fallback)
      const agentsData = await getNearAgents(location);

      console.log("🛒 MARKETPLACE DEBUG: Raw agents data:", agentsData);
      console.log("🛒 MARKETPLACE DEBUG: Data length:", agentsData?.length);
      console.log("🛒 MARKETPLACE DEBUG: First agent:", agentsData?.[0]);

      if (!agentsData || agentsData.length === 0) {
        console.log("⚠️ No agents returned from database hook");
        setAgents([]);
        setFilteredAgents([]);
        return;
      }

      console.log(`✅ Received ${agentsData.length} agents from database hook`);
      console.log("🎯 Sample agent:", agentsData[0]);

      // Process agents and ensure all fields are present
      const processedAgents = agentsData.map((agent) => {
        return {
          ...agent,
          agent_type:
            agent.agent_type || agent.object_type || "intelligent_assistant",
          // Ensure all enhanced schema fields are present
          fee_usdt: agent.fee_usdt,
          fee_usdc: agent.fee_usdc,
          fee_usds: agent.fee_usds,
          interaction_fee_usdfc: agent.interaction_fee_usdfc || 1.0,
          interaction_range: agent.interaction_range || 15.0,
          currency_type: agent.currency_type || "USDFC",
          network: agent.network || "morph-holesky",
          interaction_types: agent.interaction_types || ["text_chat"],
        };
      });

      // Sort by distance if available, otherwise by creation date
      processedAgents.sort((a, b) => {
        if (a.distance_meters !== null && b.distance_meters !== null) {
          return a.distance_meters - b.distance_meters;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setAgents(processedAgents);
      setFilteredAgents(processedAgents);
      console.log("📊 Agents processed and sorted:", processedAgents.length);
    } catch (error) {
      console.error("❌ Error in fetchAgents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search agents
  useEffect(() => {
    let filtered = agents;

    // Apply type filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (agent) =>
          agent.agent_type === selectedFilter || // Enhanced AgentSphere field
          agent.object_type === selectedFilter // Legacy field
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.name?.toLowerCase().includes(searchLower) ||
          agent.description?.toLowerCase().includes(searchLower) ||
          agent.agent_type?.toLowerCase().includes(searchLower) ||
          agent.object_type?.toLowerCase().includes(searchLower) ||
          agent.location_type?.toLowerCase().includes(searchLower) ||
          agent.capabilities?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAgents(filtered);
  }, [agents, selectedFilter, searchTerm]);

  // Update filter counts for enhanced agent types
  const filtersWithCounts = agentFilters.map((filter) => ({
    ...filter,
    count:
      filter.id === "all"
        ? agents.length
        : agents.filter(
            (agent) =>
              agent.agent_type === filter.id || // Enhanced AgentSphere field
              agent.object_type === filter.id // Legacy field
          ).length,
  }));

  // Setup agent fetching
  useEffect(() => {
    fetchAgents();
  }, [userLocation]);

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    setShowDetailModal(true);
  };

  const formatDistance = (distance) => {
    if (distance === null) return "Unknown";
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-green-500/20 w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                NeAR Agents Marketplace
              </h2>
              <p className="text-green-400">
                {loading
                  ? "Loading..."
                  : `${filteredAgents.length} agents available`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-green-500/20">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search agents by name, type, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filtersWithCounts.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? "bg-green-500 text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Agents List */}
        <div className="flex-1 overflow-hidden">
          <NeARAgentsList
            agents={filteredAgents}
            loading={loading}
            onAgentSelect={handleAgentSelect}
            userLocation={userLocation}
            formatDistance={formatDistance}
          />
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t border-green-500/20 bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Location-based discovery</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Real-time updates</span>
              </span>
            </div>
            <div className="text-green-400">Powered by AgentSphere Network</div>
          </div>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {showDetailModal && selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAgent(null);
          }}
          userLocation={userLocation}
        />
      )}
    </div>
  );
};

export default NeARAgentsMarketplace;
