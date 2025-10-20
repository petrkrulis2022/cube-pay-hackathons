import React from "react";
import ReactDOM from "react-dom/client";

function SimpleApp() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>AgentSphere Test</h1>
      <p>If you can see this, React is working! 🚀</p>
      <p>Server is running on port 5175</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<SimpleApp />);
