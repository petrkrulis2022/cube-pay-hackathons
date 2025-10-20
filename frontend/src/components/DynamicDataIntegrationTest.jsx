// Dynamic Data Integration Test Component
// Tests the integration between AR Viewer and AgentSphere dynamic deployment data

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  validateAgentData,
  getAgentPaymentConfig,
  analyzeAgentDataMigration,
  testDynamicQRGeneration,
  logAgentDataAnalysis,
} from "../utils/agentDataValidator";
import { dynamicQRService } from "../services/dynamicQRService";

const DynamicDataIntegrationTest = () => {
  const [agents, setAgents] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Fetch agents and analyze data
  const fetchAndAnalyzeAgents = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching agents for dynamic data analysis...");

      const { data, error } = await supabase
        .from("deployed_objects")
        .select(
          `
          id, name, description, agent_type,
          chain_id, network, interaction_fee, currency_type,
          wallet_address, token_address,
          deployment_network_name, deployment_chain_id, deployment_network_id,
          interaction_fee_amount, interaction_fee_token,
          payment_config, deployer_address, deployed_at, deployment_status,
          created_at, is_active
        `
        )
        .eq("is_active", true)
        .limit(10);

      if (error) {
        console.error("❌ Error fetching agents:", error);
        return;
      }

      console.log(`✅ Fetched ${data.length} agents`);
      setAgents(data);

      // Analyze the data
      const migrationAnalysis = analyzeAgentDataMigration(data);
      setAnalysis(migrationAnalysis);

      // Log detailed analysis
      logAgentDataAnalysis(data);
    } catch (error) {
      console.error("❌ Failed to fetch and analyze agents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test QR generation for selected agent
  const testAgentQR = async (agent) => {
    setLoading(true);
    try {
      console.log(`🧪 Testing QR generation for agent: ${agent.name}`);

      const testResult = await testDynamicQRGeneration(agent);

      setTestResults((prev) => [
        ...prev.filter((r) => r.agentId !== agent.id),
        testResult,
      ]);

      console.log("🎯 QR Test Result:", testResult);
    } catch (error) {
      console.error(`❌ QR test failed for agent ${agent.name}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Test all agents
  const testAllAgents = async () => {
    setLoading(true);
    const results = [];

    for (const agent of agents) {
      try {
        const result = await testDynamicQRGeneration(agent);
        results.push(result);
        console.log(`✅ Tested agent: ${agent.name}`);
      } catch (error) {
        console.error(`❌ Failed to test agent ${agent.name}:`, error);
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          error: error.message,
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchAndAnalyzeAgents();
  }, []);

  const getDataSourceBadge = (agent) => {
    const validation = validateAgentData(agent);
    const colors = {
      dynamic: "bg-green-500/20 text-green-400 border-green-400/30",
      legacy: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
      unknown: "bg-red-500/20 text-red-400 border-red-400/30",
    };

    return (
      <span
        className={`px-2 py-1 rounded border text-xs ${
          colors[validation.dataSource]
        }`}
      >
        {validation.dataSource.toUpperCase()}
      </span>
    );
  };

  const getPaymentConfigDisplay = (agent) => {
    const config = getAgentPaymentConfig(agent);

    return (
      <div className="text-sm space-y-1">
        <div>
          Network: {config.networkName || "Unknown"} (ID:{" "}
          {config.chainId || "N/A"})
        </div>
        <div>
          Fee: {config.interactionFee || "N/A"} {config.feeToken}
        </div>
        <div>
          Wallet:{" "}
          {config.walletAddress
            ? `${config.walletAddress.slice(
                0,
                6
              )}...${config.walletAddress.slice(-4)}`
            : "N/A"}
        </div>
        <div>
          Data Source: {config.dataSource}{" "}
          {config.needsUpgrade && "(needs upgrade)"}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          AgentSphere Dynamic Data Integration Test
        </h1>

        {/* Analysis Summary */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Data Analysis</h3>
              <div className="space-y-2 text-sm">
                <div>Total Agents: {analysis.totalAgents}</div>
                <div className="text-green-400">
                  Dynamic Data: {analysis.withDynamicData}
                </div>
                <div className="text-yellow-400">
                  Legacy Data: {analysis.withLegacyData}
                </div>
                <div className="text-red-400">
                  Incomplete: {analysis.withIncompleteData}
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Networks & Tokens</h3>
              <div className="space-y-2 text-sm">
                <div>Networks: {analysis.uniqueNetworks.length}</div>
                <div className="text-xs text-slate-400">
                  {analysis.uniqueNetworks.join(", ")}
                </div>
                <div>Tokens: {analysis.uniqueTokens.length}</div>
                <div className="text-xs text-slate-400">
                  {analysis.uniqueTokens.join(", ")}
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={fetchAndAnalyzeAgents}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
                >
                  Refresh Analysis
                </button>
                <button
                  onClick={testAllAgents}
                  disabled={loading || agents.length === 0}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50"
                >
                  Test All QR Generation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-slate-800 p-4 rounded-lg mb-8">
            <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-slate-300">
                  {index + 1}. {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Agents List */}
        <div className="bg-slate-800 p-4 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Agents ({agents.length})
          </h3>

          {loading && (
            <div className="text-center py-4 text-slate-400">Loading...</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-slate-700 p-4 rounded border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{agent.name}</h4>
                    <div className="text-sm text-slate-400">
                      {agent.agent_type}
                    </div>
                  </div>
                  {getDataSourceBadge(agent)}
                </div>

                {getPaymentConfigDisplay(agent)}

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => testAgentQR(agent)}
                    disabled={loading}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs disabled:opacity-50"
                  >
                    Test QR
                  </button>
                  <button
                    onClick={() =>
                      setSelectedAgent(
                        selectedAgent?.id === agent.id ? null : agent
                      )
                    }
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
                  >
                    {selectedAgent?.id === agent.id
                      ? "Hide Details"
                      : "Show Details"}
                  </button>
                </div>

                {/* Detailed view */}
                {selectedAgent?.id === agent.id && (
                  <div className="mt-4 p-3 bg-slate-600 rounded text-xs">
                    <pre className="overflow-auto text-slate-300">
                      {JSON.stringify(validateAgentData(agent), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              QR Generation Test Results
            </h3>

            <div className="space-y-4">
              {testResults.map((result) => (
                <div key={result.agentId} className="bg-slate-700 p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{result.agentName}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        result.qrGenerationTest?.success
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {result.qrGenerationTest?.success ? "SUCCESS" : "FAILED"}
                    </span>
                  </div>

                  {result.qrGenerationTest?.success ? (
                    <div className="text-sm space-y-1 text-slate-300">
                      <div>
                        ✅ QR Code Generated:{" "}
                        {result.qrGenerationTest.qrCodeGenerated ? "Yes" : "No"}
                      </div>
                      <div>
                        🌐 Network: {result.qrGenerationTest.networkDetected}
                      </div>
                      <div>
                        💰 Amount: {result.qrGenerationTest.paymentAmount}{" "}
                        {result.qrGenerationTest.paymentToken}
                      </div>
                      <div>
                        📧 Recipient:{" "}
                        {result.qrGenerationTest.recipientAddress?.slice(0, 10)}
                        ...
                      </div>
                      <div>
                        🔄 Using Dynamic Data:{" "}
                        {result.qrGenerationTest.usingDynamicData
                          ? "Yes"
                          : "No"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-400">
                      ❌ Error:{" "}
                      {result.qrGenerationTest?.error ||
                        result.error ||
                        "Unknown error"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicDataIntegrationTest;
