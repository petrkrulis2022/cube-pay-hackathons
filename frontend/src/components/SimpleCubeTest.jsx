import React, { useState } from "react";

const SimpleCubeTest = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-4xl mb-8">Simple Cube Test</h1>
        <div
          className="w-64 h-64 bg-green-500 rounded-lg mx-auto flex items-center justify-center text-white text-2xl font-bold"
          style={{
            background: "linear-gradient(135deg, #00ff00, #00cc00)",
            boxShadow: "0 0 50px rgba(0, 255, 0, 0.3)",
          }}
        >
          🎯 Test Cube
        </div>
        <p className="text-white mt-4">
          If you see this, basic components work!
        </p>
      </div>
    </div>
  );
};

export default SimpleCubeTest;
