import React from "react";
import RevolutVirtualCard from "../components/RevolutVirtualCard";

function VirtualCardTest() {
  const [logs, setLogs] = React.useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{ textAlign: "center", color: "white", marginBottom: "30px" }}
        >
          <h1 style={{ fontSize: "36px", margin: "0 0 10px 0" }}>
            💳 Virtual Card Testing
          </h1>
          <p style={{ fontSize: "18px", opacity: 0.9 }}>
            Revolut Integration - Mock Mode
          </p>
        </div>

        {/* Configuration Status */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h2 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>
            Configuration Status
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                Environment:
              </span>
              <span style={{ fontFamily: "monospace", color: "#6b7280" }}>
                {import.meta.env.MODE}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                Mock Mode:
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  color:
                    import.meta.env.VITE_USE_MOCK_CARD !== "false"
                      ? "#10B981"
                      : "#EF4444",
                  fontWeight: "bold",
                }}
              >
                {import.meta.env.VITE_USE_MOCK_CARD !== "false"
                  ? "ENABLED ✓"
                  : "DISABLED"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                API URL:
              </span>
              <span style={{ fontFamily: "monospace", color: "#6b7280" }}>
                {import.meta.env.VITE_AGENTSPHERE_API_URL ||
                  "http://localhost:3001"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                Component Status:
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: "#10B981",
                  fontWeight: "bold",
                }}
              >
                Loaded ✓
              </span>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h2 style={{ margin: "0 0 15px 0", color: "#1f2937" }}>
            📋 Testing Checklist
          </h2>
          <div
            style={{
              background: "#f9fafb",
              borderLeft: "4px solid #0075EB",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#0075EB" }}>
              How to Test:
            </h3>
            <ol style={{ margin: 0, paddingLeft: "20px" }}>
              <li>Click "Create Virtual Card" button below</li>
              <li>Verify card displays with Revolut gradient and animations</li>
              <li>Click "Show Details" to reveal card number, CVV, expiry</li>
              <li>Try "Copy Number" (must show details first)</li>
              <li>Test "Top Up" with amount like 25.00</li>
              <li>Test "Freeze Card" - should turn gray</li>
              <li>Test "Unfreeze Card" - should return to blue</li>
              <li>Test "Simulate Payment" with amount and merchant name</li>
              <li>Click "Load Transactions" to see transaction history</li>
              <li>Check Event Log below for any errors</li>
              <li>Open browser console (F12) to see detailed logs</li>
            </ol>
          </div>
        </div>

        {/* Virtual Card Component */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#1f2937" }}>
            Virtual Card Component
          </h2>

          <RevolutVirtualCard
            agentId="test_agent_123"
            initialAmount={5000} // $50.00
            currency="USD"
            onSuccess={(data) => {
              addLog("✅ Success: " + JSON.stringify(data, null, 2), "success");
            }}
            onError={(error) => {
              addLog("❌ Error: " + error.message, "error");
            }}
          />

          {/* Event Log */}
          {logs.length > 0 && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                background: "#f9fafb",
                borderRadius: "8px",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>
                📝 Event Log
              </h3>
              {logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    padding: "5px",
                    borderBottom: "1px solid #e5e7eb",
                    color:
                      log.type === "error"
                        ? "#EF4444"
                        : log.type === "success"
                        ? "#10B981"
                        : "#6b7280",
                  }}
                >
                  [{log.timestamp}] {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VirtualCardTest;
