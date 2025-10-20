// Simple test to debug the chain ID issue
import { useState, useEffect } from "react";

const ChainIDDebugger = () => {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    // Simulate loading agents from database
    const mockAgents = [
      {
        id: "test-1",
        name: "Ethereum Sepolia Agent",
        deployment_network_name: "Ethereum Sepolia",
        deployment_chain_id: 11155111,
        chain_id: 11155111,
        network: "Ethereum Sepolia",
      },
      {
        id: "test-2",
        name: "Base Sepolia Agent",
        deployment_network_name: "Base Sepolia",
        deployment_chain_id: 84532,
        chain_id: 84532,
        network: "Base Sepolia",
      },
      {
        id: "test-3",
        name: "OP Sepolia Agent",
        deployment_network_name: "OP Sepolia",
        deployment_chain_id: 11155420,
        chain_id: 11155420,
        network: "OP Sepolia",
      },
    ];

    console.log("🧪 Testing agent chain IDs:");
    mockAgents.forEach((agent) => {
      const chainId = agent?.deployment_chain_id || agent?.chain_id;
      console.log(`Agent: ${agent.name}`);
      console.log(`  deployment_chain_id: ${agent.deployment_chain_id}`);
      console.log(`  chain_id: ${agent.chain_id}`);
      console.log(`  Final chainId: ${chainId}`);
      console.log(`  Expected: Should NOT be 11155420 (OP Sepolia) for all`);
      console.log("---");
    });

    setAgents(mockAgents);
  }, []);

  return (
    <div
      style={{ padding: "20px", backgroundColor: "#1a1a1a", color: "white" }}
    >
      <h2>🔍 Chain ID Debug Test</h2>
      <p>Open browser console to see debug output</p>
      {agents.map((agent) => (
        <div
          key={agent.id}
          style={{
            margin: "10px 0",
            padding: "10px",
            border: "1px solid #333",
          }}
        >
          <h3>{agent.name}</h3>
          <p>Network: {agent.deployment_network_name}</p>
          <p>Chain ID: {agent.deployment_chain_id}</p>
        </div>
      ))}
    </div>
  );
};

export default ChainIDDebugger;
