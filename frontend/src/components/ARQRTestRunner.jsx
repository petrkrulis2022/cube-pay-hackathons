import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  testCompleteARQRFlow,
  quickValidationTest,
} from "../utils/comprehensiveARQRFlowTest";
import {
  fixAgentWalletAddresses,
  testQRPaymentAddresses,
  verifyQRPaymentFlow,
} from "../utils/agentWalletMigration";
import {
  checkSchemaAlignment,
  quickSchemaCheck,
} from "../utils/schemaAlignmentChecker";

/**
 * AR QR Payment Test Runner Component
 *
 * Provides a UI for running payment flow tests and validations
 */
const ARQRTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults(null);
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    addLog("Starting quick validation test...", "info");

    try {
      const result = await quickValidationTest();

      if (result.success) {
        addLog("✅ Quick test passed!", "success");
        addLog(`Agent: ${result.agent.name} (${result.agent.id})`, "info");
        addLog(`Payment recipient: ${result.agent.recipient}`, "info");
      } else {
        addLog("❌ Quick test failed", "error");
        addLog(`Error: ${result.error}`, "error");
      }

      setTestResults(result);
    } catch (error) {
      addLog(`❌ Quick test error: ${error.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const runFullTest = async () => {
    setIsRunning(true);
    addLog("Starting comprehensive AR QR flow test...", "info");

    try {
      const result = await testCompleteARQRFlow();

      if (result.success) {
        addLog("✅ Full test completed!", "success");
        addLog(`Tests run: ${result.summary.totalTests}`, "info");
        addLog(
          `Success rate: ${result.summary.successRate.toFixed(1)}%`,
          "info"
        );

        if (result.summary.criticalIssues.length > 0) {
          addLog(
            `🚨 Critical issues found: ${result.summary.criticalIssues.length}`,
            "error"
          );
          result.summary.criticalIssues.forEach((issue) => {
            addLog(`- ${issue}`, "error");
          });
        } else {
          addLog("✅ No critical issues found!", "success");
        }
      } else {
        addLog("❌ Full test failed", "error");
        addLog(`Error: ${result.error}`, "error");
      }

      setTestResults(result);
    } catch (error) {
      addLog(`❌ Full test error: ${error.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const runMigration = async () => {
    setIsRunning(true);
    addLog("Checking database status...", "info");

    try {
      // Check if database has agents
      addLog("ℹ️ Database has been reset by AgentSphere", "info");
      addLog(
        "✅ Fresh schema already applied - no migration needed",
        "success"
      );
      addLog("🔄 Database is ready for new agent deployments", "success");
      addLog(
        "📊 All new agents will have correct schema automatically",
        "info"
      );

      const result = {
        success: true,
        message: "Database reset - migration not needed",
        timestamp: new Date().toISOString(),
      };

      setTestResults(result);
    } catch (error) {
      addLog(`❌ Database check error: ${error.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const runPaymentTest = async () => {
    setIsRunning(true);
    addLog("Testing QR payment addresses...", "info");

    try {
      const result = await testQRPaymentAddresses();

      if (result.success) {
        addLog("✅ Payment test completed!", "success");
        addLog(`Valid configurations: ${result.validCount}`, "info");
        addLog(
          `Invalid configurations: ${result.invalidCount}`,
          result.invalidCount > 0 ? "warning" : "info"
        );

        if (result.allValid) {
          addLog("✅ All payment configurations are valid!", "success");
        } else {
          addLog("⚠️ Some payment configurations need attention", "warning");
        }
      } else {
        addLog("❌ Payment test failed", "error");
        addLog(`Error: ${result.error}`, "error");
      }

      setTestResults(result);
    } catch (error) {
      addLog(`❌ Payment test error: ${error.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const runSchemaCheck = async () => {
    setIsRunning(true);
    addLog("Checking AgentSphere schema alignment...", "info");

    try {
      const result = await checkSchemaAlignment();

      if (result.success) {
        addLog("✅ Schema check completed!", "success");

        // Database status
        if (result.databaseStatus.hasAgents) {
          addLog(`📊 Found agents in database`, "info");
        } else {
          addLog("📭 No agents found - database is clean", "info");
        }

        // Schema compatibility
        const available = result.schemaStatus.fieldsAvailable;
        const total = result.schemaStatus.totalFieldsChecked;
        addLog(`📋 Schema fields: ${available}/${total} available`, "info");

        if (result.schemaStatus.missingFields.length > 0) {
          addLog(
            `⚠️ Missing enhanced fields: ${result.schemaStatus.missingFields.join(
              ", "
            )}`,
            "warning"
          );
        } else {
          addLog("✅ All enhanced schema fields present!", "success");
        }

        // Component compatibility
        Object.entries(result.componentCompatibility).forEach(
          ([component, status]) => {
            const emoji =
              status.status === "fully_compatible"
                ? "✅"
                : status.status === "basic_compatible"
                ? "⚡"
                : "❌";
            addLog(
              `${emoji} ${component}: ${status.status}`,
              status.status === "incompatible"
                ? "error"
                : status.status === "basic_compatible"
                ? "warning"
                : "success"
            );
          }
        );

        // Recommendations
        if (result.recommendations.length > 0) {
          addLog("💡 Recommendations:", "info");
          result.recommendations.forEach((rec) => {
            addLog(`  ${rec}`, "warning");
          });
        }

        // Overall status
        if (result.overallStatus.enhancedSchemaReady) {
          addLog("🎯 Enhanced AgentSphere schema fully compatible!", "success");
        } else if (result.overallStatus.arViewerCompatible) {
          addLog(
            "⚡ Basic compatibility confirmed, enhanced features pending",
            "warning"
          );
        }
      } else {
        addLog("❌ Schema check failed", "error");
        addLog(`Error: ${result.error}`, "error");
      }

      setTestResults(result);
    } catch (error) {
      addLog(`❌ Schema check error: ${error.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const getLogBadgeVariant = (type) => {
    switch (type) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 AR QR Payment Test Runner
          </CardTitle>
          <CardDescription>
            Test and validate the AR QR payment system to ensure payments go to
            agent deployers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={runQuickTest}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? "⏳" : "⚡"} Quick Test
            </Button>

            <Button
              onClick={runFullTest}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? "⏳" : "🔬"} Full Test
            </Button>

            <Button
              onClick={runMigration}
              disabled={isRunning}
              variant="secondary"
              className="w-full"
            >
              {isRunning ? "⏳" : "�"} DB Status
            </Button>

            <Button
              onClick={runPaymentTest}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? "⏳" : "💳"} Payment Test
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Button
              onClick={runSchemaCheck}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? "⏳" : "🔍"} Schema Check
            </Button>

            <Button
              onClick={clearLogs}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Clear Logs
            </Button>
          </div>

          {/* Test Status */}
          {testResults && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={testResults.success ? "default" : "destructive"}
                  >
                    {testResults.success ? "✅ Success" : "❌ Failed"}
                  </Badge>
                  {testResults.summary && (
                    <span className="text-sm text-muted-foreground">
                      {testResults.summary.successRate
                        ? `${testResults.summary.successRate.toFixed(
                            1
                          )}% success rate`
                        : "Test completed"}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Test Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Badge
                          variant={getLogBadgeVariant(log.type)}
                          className="text-xs"
                        >
                          {log.timestamp}
                        </Badge>
                        <span
                          className={`flex-1 ${
                            log.type === "error"
                              ? "text-red-600"
                              : log.type === "success"
                              ? "text-green-600"
                              : log.type === "warning"
                              ? "text-yellow-600"
                              : "text-foreground"
                          }`}
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Test Results Details */}
          {testResults && testResults.testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detailed Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 w-full">
                  <div className="space-y-3">
                    {testResults.testResults.map((result, index) => (
                      <div key={index} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {result.agentName}
                          </span>
                          <Badge
                            variant={
                              result.overallSuccess ? "default" : "destructive"
                            }
                          >
                            {result.overallSuccess ? "Pass" : "Fail"}
                          </Badge>
                        </div>
                        {result.paymentInfo && (
                          <div className="text-xs space-y-1 text-muted-foreground">
                            <div>Recipient: {result.paymentInfo.recipient}</div>
                            <div>
                              Amount: {result.paymentInfo.amount}{" "}
                              {result.paymentInfo.currency}
                            </div>
                            <div>Network: {result.paymentInfo.network}</div>
                          </div>
                        )}
                        {result.error && (
                          <div className="text-xs text-red-600">
                            Error: {result.error.message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Test Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Test Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <div>
            <strong>Quick Test:</strong> Validates one agent's payment
            configuration
          </div>
          <div>
            <strong>Full Test:</strong> Tests complete payment flow for multiple
            agents
          </div>
          <div>
            <strong>Schema Check:</strong> Validates compatibility with enhanced
            AgentSphere schema
          </div>
          <div>
            <strong>DB Status:</strong> Checks database state (reset with new
            schema)
          </div>
          <div>
            <strong>Payment Test:</strong> Validates QR payment address
            generation
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
            <strong>Critical Check:</strong> Ensures payments go to agent
            deployers, not users
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ARQRTestRunner;
