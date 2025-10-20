import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Network,
  Wallet,
  DollarSign,
  Activity,
  TrendingUp,
  Eye,
  Settings,
  Trash2,
  ExternalLink,
  Users,
  Zap,
  Globe,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { EVM_NETWORKS } from "../config/multiChainNetworks";
import { multiChainWalletService } from "../services/multiChainWalletService";
import {
  AgentDataService,
  CompleteAgentData,
} from "../services/agentDataService";

// Expose Supabase and AgentDataService globally for debugging
(window as any).supabase = supabase;
(window as any).AgentDataService = AgentDataService;
console.log("🔧 GLOBAL: Supabase and AgentDataService exposed for debugging");

// Use the CompleteAgentData interface from the service
interface DeployedAgent extends CompleteAgentData {
  // Legacy fields for backward compatibility
  interaction_fee_usdfc?: number;
  token_symbol?: string;
  network?: string;
  chain_id?: number;
  latitude?: number;
  longitude?: number;
}

interface NetworkStats {
  network_name: string;
  chain_id: number;
  total_agents: number;
  primary_deployments: number;
  secondary_deployments: number;
  avg_interaction_fee: number;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Agents" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "cross-chain", label: "Cross-Chain" },
  { value: "single-chain", label: "Single Chain" },
];

const NETWORK_FILTER_OPTIONS = [
  { value: "all", label: "All Networks" },
  ...Object.entries(EVM_NETWORKS).map(([chainId, network]) => ({
    value: chainId,
    label: network.name,
  })),
];

export const MultiChainAgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<DeployedAgent[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "created_at" | "name" | "earnings" | "interactions"
  >("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DeployedAgent | null>(
    null
  );

  useEffect(() => {
    console.log(
      "🚀 MultiChainAgentDashboard mounted, starting tests and data load..."
    );

    // Run debug tests first
    testSupabaseColumns();

    // Then load the actual data
    loadAgents();
    loadStats();
  }, []);

  // Debug function to test Supabase column access
  const testSupabaseColumns = async () => {
    try {
      console.log("🧪 TESTING: Direct Supabase column access...");

      // Test 1: Basic query
      const { data: basicData, error: basicError } = await supabase
        .from("deployed_objects")
        .select("id, name")
        .limit(1);

      console.log("🧪 TEST 1 - Basic query:", { basicData, basicError });

      // Test 2: Specific column query
      const { data: feeData, error: feeError } = await supabase
        .from("deployed_objects")
        .select("id, name, interaction_fee_amount, interaction_fee_token")
        .limit(5);

      console.log("🧪 TEST 2 - Fee columns query:", { feeData, feeError });

      // Test 3: All columns
      const { data: allData, error: allError } = await supabase
        .from("deployed_objects")
        .select("*")
        .limit(1);

      console.log("🧪 TEST 3 - All columns:", {
        allData,
        allError,
        keys: allData?.[0] ? Object.keys(allData[0]) : "No data",
      });
    } catch (error) {
      console.error("🧪 TESTING ERROR:", error);
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);

      console.log("� NEW AGENT SERVICE: Loading comprehensive agent data...");

      // Use the new AgentDataService for comprehensive data
      const agents = await AgentDataService.getAllAgents({
        network: selectedNetwork !== "all" ? selectedNetwork : undefined,
        agent_type: selectedFilter !== "all" ? selectedFilter : undefined,
      });

      console.log(
        `✅ NEW AGENT SERVICE: Loaded ${agents.length} comprehensive agents`
      );
      console.log("✅ NEW AGENT SERVICE: First agent sample:", {
        id: agents[0]?.id,
        name: agents[0]?.name,
        interaction_fee_amount:
          agents[0]?.payment_config?.interaction_fee_amount,
        interaction_fee_token: agents[0]?.payment_config?.interaction_fee_token,
        deployment_network_name: agents[0]?.deployment_network_name,
        deployment_chain_id: agents[0]?.deployment_chain_id,
        payment_methods: agents[0]?.payment_config?.payment_methods,
        wallet_address: agents[0]?.wallet_config?.agent_wallet?.address,
        revenue_potential: agents[0]?.payment_config?.revenue_potential,
      });

      setAgents(agents);
    } catch (error) {
      console.error("❌ NEW AGENT SERVICE: Error loading agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkStats = async () => {
    try {
      const { data, error } = await supabase.rpc("get_cross_chain_stats");

      if (error) throw error;
      setNetworkStats(data || []);
    } catch (error) {
      console.error("Error loading network stats:", error);
    }
  };

  const filteredAndSortedAgents = agents
    .filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "cross-chain" &&
          agent.deployment_network.cross_chain_enabled) ||
        (statusFilter === "single-chain" &&
          !agent.deployment_network.cross_chain_enabled) ||
        agent.status === statusFilter;

      const matchesNetwork =
        networkFilter === "all" ||
        agent.deployment_network.primary.chainId.toString() === networkFilter ||
        agent.supported_networks.includes(networkFilter);

      return matchesSearch && matchesStatus && matchesNetwork;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "earnings":
          aValue = a.total_earnings || 0;
          bValue = b.total_earnings || 0;
          break;
        case "interactions":
          aValue = a.interactions_count || 0;
          bValue = b.interactions_count || 0;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      } else {
        return sortOrder === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

  const getNetworkIcon = (chainId: number) => {
    const network = Object.values(EVM_NETWORKS).find(
      (n) => n.chainId === chainId
    );
    return network?.icon || "🔗";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "inactive":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const AgentCard: React.FC<{ agent: DeployedAgent }> = ({ agent }) => {
    // Helper functions for dynamic data display
    const getInteractionFeeDisplay = () => {
      console.log(
        "🚨 POST-MIGRATION DEBUG: Full agent object:",
        JSON.stringify(agent, null, 2)
      );
      console.log("🚨 POST-MIGRATION DEBUG: Agent keys:", Object.keys(agent));
      console.log("🚨 POST-MIGRATION DEBUG: Agent id:", agent.id);
      console.log("🚨 POST-MIGRATION DEBUG: Agent name:", agent.name);

      // Check all possible fee-related fields
      console.log("🚨 POST-MIGRATION DEBUG: Fee fields check:");
      console.log(
        "  - interaction_fee_amount:",
        agent.interaction_fee_amount,
        typeof agent.interaction_fee_amount
      );
      console.log(
        "  - interaction_fee_token:",
        agent.interaction_fee_token,
        typeof agent.interaction_fee_token
      );
      console.log(
        "  - interaction_fee_usdfc:",
        agent.interaction_fee_usdfc,
        typeof agent.interaction_fee_usdfc
      );
      console.log(
        "  - token_symbol:",
        agent.token_symbol,
        typeof agent.token_symbol
      );

      // Use new dynamic fields first, but handle 0 values correctly
      const amount =
        agent.interaction_fee_amount !== null &&
        agent.interaction_fee_amount !== undefined
          ? agent.interaction_fee_amount
          : agent.interaction_fee_usdfc !== null &&
            agent.interaction_fee_usdfc !== undefined
          ? agent.interaction_fee_usdfc
          : 10;

      const token = agent.interaction_fee_token || agent.token_symbol || "USDC";

      console.log("🚨 POST-MIGRATION DEBUG: Final calculation:", {
        finalAmount: amount,
        finalToken: token,
        condition1:
          agent.interaction_fee_amount !== null &&
          agent.interaction_fee_amount !== undefined,
        condition2:
          agent.interaction_fee_usdfc !== null &&
          agent.interaction_fee_usdfc !== undefined,
      });

      return `💎 ${
        agent.payment_config?.interaction_fee_amount ||
        agent.interaction_fee_amount ||
        agent.interaction_fee_usdfc ||
        amount ||
        1
      } ${
        agent.payment_config?.interaction_fee_token ||
        agent.interaction_fee_token ||
        agent.token_symbol ||
        token ||
        "USDC"
      }`;
    };

    const getNetworkDisplay = () => {
      // Use new dynamic fields first, fallback to legacy
      const networkName =
        agent.deployment_network_name || agent.network || "Unknown Network";
      const chainId = agent.deployment_chain_id || agent.chain_id || "Unknown";
      return { name: networkName, chainId };
    };

    const networkInfo = getNetworkDisplay();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
          </div>
          <div className="flex space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                agent.status || "active"
              )}`}
            >
              {agent.status || "active"}
            </span>
            {agent.deployment_network?.cross_chain_enabled && (
              <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
                Cross-Chain
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {agent.location?.address ||
                `${agent.latitude?.toFixed(4) || "0"}, ${
                  agent.longitude?.toFixed(4) || "0"
                }`}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              {getInteractionFeeDisplay()}
            </span>
          </div>
        </div>

        {/* UPDATED NETWORK DISPLAY - Shows actual deployment network */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {networkInfo.name}
              </span>
              <span className="text-xs text-gray-500">
                Chain ID: {networkInfo.chainId}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {agent.interactions_count || 0} interactions
            </span>
          </div>
        </div>

        {/* PAYMENT & WALLET SECTION - Shows dynamic payment config */}
        <div className="border-t pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            🔗 Blockchain & Payment
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Network:</span>
              <span className="ml-1 font-medium">{networkInfo.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Currency:</span>
              <span className="ml-1 font-medium">
                {agent.interaction_fee_token || agent.token_symbol || "USDC"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fee:</span>
              <span className="ml-1 font-medium text-green-600">
                {getInteractionFeeDisplay()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Chain:</span>
              <span className="ml-1 font-medium">{networkInfo.chainId}</span>
            </div>
          </div>

          {/* Agent Wallet Address */}
          {(agent.agent_wallet_address || agent.owner_wallet) && (
            <div className="mt-2">
              <span className="text-xs text-gray-600">Agent Wallet:</span>
              <span className="ml-1 text-xs font-mono text-blue-600">
                {(agent.agent_wallet_address || agent.owner_wallet)?.slice(
                  0,
                  8
                )}
                ...
                {(agent.agent_wallet_address || agent.owner_wallet)?.slice(-6)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">
              ${(agent.total_earnings || 0).toFixed(2)} earned
            </span>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAgent(agent)}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  const NetworkStatsCard: React.FC<{ stats: NetworkStats }> = ({ stats }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getNetworkIcon(stats.chain_id)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {stats.network_name}
            </h3>
            <p className="text-sm text-gray-600">Chain ID: {stats.chain_id}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {stats.total_agents}
          </div>
          <div className="text-sm text-gray-600">Total Agents</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.primary_deployments}
          </div>
          <div className="text-sm text-gray-600">Primary</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.secondary_deployments}
          </div>
          <div className="text-sm text-gray-600">Secondary</div>
        </div>
        <div className="col-span-2">
          <div className="text-lg font-semibold text-green-600">
            ${stats.avg_interaction_fee.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Avg. Fee</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Chain Agent Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage your deployed AI agents across multiple
            blockchain networks
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {agents.length}
                </div>
                <div className="text-sm text-gray-600">Total Agents</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {agents.filter((a) => a.status === "active").length}
                </div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Network className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {networkStats.length}
                </div>
                <div className="text-sm text-gray-600">Networks</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  $
                  {agents
                    .reduce(
                      (sum, agent) => sum + (agent.total_earnings || 0),
                      0
                    )
                    .toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Network Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networkStats.map((stats) => (
              <NetworkStatsCard key={stats.chain_id} stats={stats} />
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  loadAgents();
                  loadNetworkStats();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </motion.button>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="earnings">Sort by Earnings</option>
                <option value="interactions">Sort by Interactions</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network
                    </label>
                    <select
                      value={networkFilter}
                      onChange={(e) => setNetworkFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {NETWORK_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {loading
              ? // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-6 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                ))
              : filteredAndSortedAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && filteredAndSortedAgents.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No agents found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or deploy your first agent.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Deploy New Agent
            </motion.button>
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedAgent.name}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selectedAgent.description}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAgent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Network Deployments
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">
                              {getNetworkIcon(
                                selectedAgent.deployment_network.primary.chainId
                              )}
                            </span>
                            <div>
                              <div className="font-medium">
                                {selectedAgent.deployment_network.primary.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                Primary Network
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Primary
                          </span>
                        </div>
                      </div>

                      {selectedAgent.deployment_network.additional.map(
                        (network, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl">
                                  {getNetworkIcon(network.chainId)}
                                </span>
                                <div>
                                  <div className="font-medium">
                                    {network.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Additional Network
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                Secondary
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Statistics
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interactions:</span>
                          <span className="font-medium">
                            {selectedAgent.interactions_count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Earnings:</span>
                          <span className="font-medium text-green-600">
                            ${(selectedAgent.total_earnings || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Interaction Fee:
                          </span>
                          <span className="font-medium">
                            ${selectedAgent.interaction_fee_usdfc} USDC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Location
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Latitude:</span>
                          <span className="font-medium">
                            {selectedAgent.location.latitude.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Longitude:</span>
                          <span className="font-medium">
                            {selectedAgent.location.longitude.toFixed(6)}
                          </span>
                        </div>
                        {selectedAgent.location.address && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-medium">
                              {selectedAgent.location.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Payment Methods
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.payment_methods.map((method, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {method.replace("_", " ").toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
