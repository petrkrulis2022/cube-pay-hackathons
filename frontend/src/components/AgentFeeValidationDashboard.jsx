import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";
import {
  formatInteractionFee,
  resolveInteractionFee,
  validateAgentData,
  testAgentDataMigration,
} from "../utils/agentDataValidator";
import { useDatabase } from "../hooks/useDatabase";

/**
 * Agent Fee Validation Dashboard
 * Tests and displays interaction fee accuracy for debugging
 */
const AgentFeeValidationDashboard = () => {
  const [validationResults, setValidationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsError, setAgentsError] = useState(null);

  // Get database hook
  const { getNearAgents, isLoading: dbLoading, error: dbError } = useDatabase();

  // Load agents
  const loadAgents = async () => {
    try {
      setAgentsError(null);
      const location = {
        latitude: 50.64,
        longitude: 13.83,
        radius_meters: 50000,
      };

      const agentsData = await getNearAgents(location);
      setAgents(agentsData || []);
    } catch (error) {
      console.error("Failed to load agents:", error);
      setAgentsError(error);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const runValidation = async () => {
    if (!agents || agents.length === 0) {
      console.warn("No agents available for validation");
      return;
    }

    setIsLoading(true);
    console.log("🔍 Running Agent Fee Validation...");

    try {
      const results = testAgentDataMigration(agents);
      setValidationResults(results);

      // Set the first agent with interesting data as selected
      const interestingAgent =
        results.results.find(
          (r) => r.feeDataSource.includes("dynamic") || r.feeAmount !== 1.0
        ) || results.results[0];

      if (interestingAgent) {
        const fullAgent = agents.find((a) => a.id === interestingAgent.agentId);
        setSelectedAgent(fullAgent);
      }
    } catch (error) {
      console.error("❌ Validation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agents && agents.length > 0 && !validationResults) {
      runValidation();
    }
  }, [agents]);

  const getSeverityColor = (dataSource) => {
    if (dataSource.includes("dynamic"))
      return "text-green-400 bg-green-500/10 border-green-500/30";
    if (dataSource.includes("fallback"))
      return "text-red-400 bg-red-500/10 border-red-500/30";
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  };

  const getSeverityIcon = (dataSource) => {
    if (dataSource.includes("dynamic"))
      return <CheckCircle className="w-4 h-4" />;
    if (dataSource.includes("fallback"))
      return <AlertCircle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  if (dbLoading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6">
        <div className="flex items-center space-x-2 text-blue-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading agents...</span>
        </div>
      </div>
    );
  }

  if (agentsError) {
    return (
      <div className="bg-gray-900 rounded-xl border border-red-500/20 p-6">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load agents: {agentsError.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          Agent Fee Validation Dashboard
        </h3>
        <button
          onClick={runValidation}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {validationResults && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {validationResults.summary.total}
              </div>
              <div className="text-sm text-gray-400">Total Agents</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {validationResults.summary.dynamicData}
              </div>
              <div className="text-sm text-gray-400">Dynamic Data</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {validationResults.summary.legacyData}
              </div>
              <div className="text-sm text-gray-400">Legacy Data</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {validationResults.summary.fallbackFees}
              </div>
              <div className="text-sm text-gray-400">Fallback Fees</div>
            </div>
          </div>

          {/* Agent List */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white">
              Individual Agent Validation
            </h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {validationResults.results.map((result, index) => (
                <div
                  key={result.agentId}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedAgent?.id === result.agentId
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                  onClick={() => {
                    const fullAgent = agents.find(
                      (a) => a.id === result.agentId
                    );
                    setSelectedAgent(fullAgent);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">
                        {result.agentName || `Agent ${result.agentId}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        ID: {result.agentId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        {result.currentFeeDisplay}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded border flex items-center space-x-1 ${getSeverityColor(
                          result.feeDataSource
                        )}`}
                      >
                        {getSeverityIcon(result.feeDataSource)}
                        <span>{result.feeDataSource}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Agent Detail */}
          {selectedAgent && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Agent Data Analysis: {selectedAgent.name || selectedAgent.id}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fee Information */}
                <div>
                  <h5 className="font-medium text-white mb-3">
                    Interaction Fee Analysis
                  </h5>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const feeInfo = formatInteractionFee(selectedAgent);
                      const resolvedFee = resolveInteractionFee(selectedAgent);
                      const validation = validateAgentData(selectedAgent);

                      return (
                        <>
                          <div className="bg-gray-700 p-3 rounded mb-3">
                            <h6 className="text-green-400 font-medium mb-2">
                              🆕 NEW Priority-Based Resolution
                            </h6>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white font-mono">
                                {resolvedFee.amount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Token:</span>
                              <span className="text-white font-mono">
                                {resolvedFee.token}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Source:</span>
                              <span className="text-blue-400">
                                {resolvedFee.source}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Full Display:
                              </span>
                              <span className="text-green-400 font-bold">
                                {resolvedFee.amount} {resolvedFee.token}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-700 p-3 rounded mb-3">
                            <h6 className="text-yellow-400 font-medium mb-2">
                              📊 Legacy Validation (for comparison)
                            </h6>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Display Amount:
                              </span>
                              <span className="text-white font-mono">
                                {feeInfo.amount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Display Token:
                              </span>
                              <span className="text-white font-mono">
                                {feeInfo.token}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Full Display:
                              </span>
                              <span className="text-green-400 font-bold">
                                {feeInfo.display}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Data Source:
                              </span>
                              <span className="text-blue-400">
                                {feeInfo.source}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Is Dynamic:</span>
                              <span
                                className={
                                  feeInfo.isDynamic
                                    ? "text-green-400"
                                    : "text-yellow-400"
                                }
                              >
                                {feeInfo.isDynamic ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Raw Data Fields */}
                <div>
                  <h5 className="font-medium text-white mb-3">
                    Raw Database Fields
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        interaction_fee_amount:
                      </span>
                      <span className="text-white font-mono">
                        {selectedAgent.interaction_fee_amount || "null"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        interaction_fee_token:
                      </span>
                      <span className="text-white font-mono">
                        {selectedAgent.interaction_fee_token || "null"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">interaction_fee:</span>
                      <span className="text-white font-mono">
                        {selectedAgent.interaction_fee || "null"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        interaction_fee_usdfc:
                      </span>
                      <span className="text-white font-mono">
                        {selectedAgent.interaction_fee_usdfc || "null"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">currency_type:</span>
                      <span className="text-white font-mono">
                        {selectedAgent.currency_type || "null"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">fee_usdt:</span>
                      <span className="text-white font-mono">
                        {selectedAgent.fee_usdt || "null"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">fee_usdc:</span>
                      <span className="text-white font-mono">
                        {selectedAgent.fee_usdc || "null"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentFeeValidationDashboard;
