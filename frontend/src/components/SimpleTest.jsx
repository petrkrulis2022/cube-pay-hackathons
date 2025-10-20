import React from "react";

function SimpleTest() {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#1a1a2e",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>🎯 AR Viewer - Simple Test</h1>
      <p>If you can see this, React is working!</p>
      <div
        style={{
          backgroundColor: "#16213e",
          padding: "15px",
          borderRadius: "8px",
          margin: "20px 0",
        }}
      >
        <h2>Environment Info:</h2>
        <ul>
          <li>React: {React.version}</li>
          <li>Environment: {import.meta.env.MODE}</li>
          <li>Base URL: {import.meta.env.BASE_URL}</li>
        </ul>
      </div>
      <div
        style={{
          backgroundColor: "#16213e",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <h2>Service Status:</h2>
        <p>✅ React component rendered successfully</p>
        <p>✅ JavaScript execution working</p>
        <p>✅ CSS styling applied</p>
      </div>
    </div>
  );
}

export default SimpleTest;
