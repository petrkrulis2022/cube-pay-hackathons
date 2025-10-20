import React from "react";
import AgentCard from "./AgentCard";

const AgentGrid = ({ agents }) => (
  <div className="agent-grid">
    {agents.map((agent) => (
      <AgentCard key={agent.id} agent={agent} />
    ))}
  </div>
);

export default AgentGrid;
