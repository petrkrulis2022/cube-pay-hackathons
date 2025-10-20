import React, { useState, useRef, useEffect } from "react";

const CameraTest = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // Test camera access
  const testCamera = async () => {
    setError(null);

    try {
      console.log("🎥 Testing camera access...");

      // Check basic support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }

      // Check security context
      const isSecure =
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";
      console.log(
        "🔒 Secure context:",
        isSecure,
        "Protocol:",
        location.protocol
      );

      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      console.log("📹 Available cameras:", videoDevices.length);

      setCameraInfo({
        totalDevices: devices.length,
        videoDevices: videoDevices.length,
        isSecure,
        protocol: location.protocol,
        hostname: location.hostname,
      });

      // Try to get camera stream
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      console.log(
        "✅ Camera stream obtained:",
        testStream.getTracks().length,
        "tracks"
      );
      setStream(testStream);
      setIsActive(true);

      // Display in video element
      if (videoRef.current) {
        videoRef.current.srcObject = testStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("❌ Camera test failed:", err);
      setError(err.message);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Camera Debug Test
        </h1>

        {/* Info Panel */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            System Information
          </h2>

          {cameraInfo && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Total Devices:</span>
                <span className="text-white ml-2">
                  {cameraInfo.totalDevices}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Video Devices:</span>
                <span className="text-white ml-2">
                  {cameraInfo.videoDevices}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Secure Context:</span>
                <span
                  className={`ml-2 ${
                    cameraInfo.isSecure ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {cameraInfo.isSecure ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Protocol:</span>
                <span className="text-white ml-2">{cameraInfo.protocol}</span>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-slate-400">
            <p>
              <strong>Browser:</strong> {navigator.userAgent.substring(0, 80)}
              ...
            </p>
            <p>
              <strong>Current URL:</strong> {window.location.href}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={testCamera}
              disabled={isActive}
              className="bg-green-500 hover:bg-green-600 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {isActive ? "Camera Active" : "Test Camera"}
            </button>

            <button
              onClick={stopCamera}
              disabled={!isActive}
              className="bg-red-500 hover:bg-red-600 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Stop Camera
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-bold mb-2">Camera Error:</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Video Preview */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Camera Preview</h2>

          <div
            className="relative bg-black rounded-lg overflow-hidden"
            style={{ aspectRatio: "16/9" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-slate-400">
                    Click "Test Camera" to start preview
                  </p>
                </div>
              </div>
            )}

            {isActive && (
              <div className="absolute top-4 left-4">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>LIVE</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraTest;
