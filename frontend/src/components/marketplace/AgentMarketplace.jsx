import React, { useState, useEffect } from "react";
import AgentGrid from "./AgentGrid";
import NetworkFilter from "./NetworkFilter";
import AgentTypeFilter from "./AgentTypeFilter";
import SearchBar from "./SearchBar";
import LoadingStates from "./LoadingStates";
import EmptyStates from "./EmptyStates";
import AgentService from "../../services/marketplace/agentService";
import "../../styles/marketplace.css";

const AgentMarketplace = () => {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkFilter, setNetworkFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [agents, networkFilter, typeFilter, searchQuery]);

  const loadAgents = async () => {
    console.log("🔄 AgentMarketplace: Starting to load agents...");
    setLoading(true);
    setError(null);
    try {
      console.log("📞 AgentMarketplace: Calling AgentService.fetchAllAgents()");
      const agentsData = await AgentService.fetchAllAgents();
      console.log("📦 AgentMarketplace: Received data:", {
        type: typeof agentsData,
        isArray: Array.isArray(agentsData),
        length: agentsData?.length,
        data: agentsData,
      });

      if (agentsData && agentsData.length > 0) {
        console.log("🟣 AgentMarketplace: First agent data:", agentsData[0]);
        console.log("🟣 AgentMarketplace: All agents:", agentsData);
      } else {
        console.log("⚠️ AgentMarketplace: No agents received or empty array");
      }

      setAgents(agentsData || []);
    } catch (err) {
      console.error("❌ AgentMarketplace: Error loading agents:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log("✅ AgentMarketplace: Loading complete");
    }
  };

  const applyFilters = () => {
    let filtered = [...agents];
    if (networkFilter !== "all")
      filtered = filtered.filter(
        (a) => a.deployment_network_name === networkFilter
      );
    if (typeFilter !== "all")
      filtered = filtered.filter((a) => a.agent_type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }
    setFilteredAgents(filtered);
  };

  if (loading) return <LoadingStates.AgentGrid />;
  if (error)
    return (
      <div className="marketplace-error">
        <h2>❌ Error Loading Agents</h2>
        <p>{error}</p>
        <button
          onClick={loadAgents}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          🔄 Retry
        </button>
        <div
          style={{
            marginTop: "20px",
            background: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            padding: "15px",
          }}
        >
          <h3>Debug Info:</h3>
          <p>
            <strong>Total agents loaded:</strong> {agents.length}
          </p>
          <p>
            <strong>Filtered agents:</strong> {filteredAgents.length}
          </p>
          <p>
            <strong>Network filter:</strong> {networkFilter}
          </p>
          <p>
            <strong>Type filter:</strong> {typeFilter}
          </p>
          <p>
            <strong>Search query:</strong> "{searchQuery}"
          </p>
        </div>
      </div>
    );

  return (
    <div className="agent-marketplace">
      <div className="marketplace-header">
        <h1>Agent Marketplace (NEW)</h1>
        <p>
          Discover and interact with AI agents deployed across multiple
          blockchain networks
        </p>

        {/* Debug Panel */}
        <div
          style={{
            background: "#e3f2fd",
            border: "1px solid #90caf9",
            borderRadius: "8px",
            padding: "15px",
            margin: "15px 0",
            fontSize: "14px",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#1976d2" }}>
            🐛 Debug Panel
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <strong>Loading:</strong> {loading ? "Yes" : "No"}
            </div>
            <div>
              <strong>Error:</strong> {error ? "Yes" : "No"}
            </div>
            <div>
              <strong>Total Agents:</strong> {agents.length}
            </div>
            <div>
              <strong>Filtered:</strong> {filteredAgents.length}
            </div>
            <div>
              <strong>Network Filter:</strong> {networkFilter}
            </div>
            <div>
              <strong>Type Filter:</strong> {typeFilter}
            </div>
          </div>
          {agents.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Sample Agent:</strong> {agents[0]?.name || "Unknown"}
            </div>
          )}
        </div>
      </div>

      <div className="marketplace-filters">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <NetworkFilter
          value={networkFilter}
          onChange={setNetworkFilter}
          networks={[...new Set(agents.map((a) => a.deployment_network_name))]}
        />
        <AgentTypeFilter
          value={typeFilter}
          onChange={setTypeFilter}
          types={[...new Set(agents.map((a) => a.agent_type))]}
        />
        <div className="results-count">
          {filteredAgents.length} of {agents.length} agents
        </div>
      </div>

      {filteredAgents.length > 0 ? (
        <AgentGrid agents={filteredAgents} />
      ) : agents.length > 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "8px",
            margin: "20px 0",
          }}
        >
          <h3>⚠️ No agents match current filters</h3>
          <p>Try adjusting your search filters.</p>
          <button
            onClick={() => {
              setNetworkFilter("all");
              setTypeFilter("all");
              setSearchQuery("");
            }}
            style={{
              background: "#ffc107",
              color: "#000",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <EmptyStates.NoAgents />
      )}
    </div>
  );
};

export default AgentMarketplace;
