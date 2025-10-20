import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  ArrowLeft,
  Zap,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const CameraActivationScreen = ({ onStartCamera, onGoBack }) => {
  const [isActivating, setIsActivating] = useState(false);

  const handleStartCamera = async () => {
    setIsActivating(true);
    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onStartCamera();
    } catch (error) {
      console.error("Failed to start camera:", error);
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-white/10">
        <button
          onClick={onGoBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Main</span>
        </button>
        <div className="flex items-center space-x-2">
          <Camera className="w-6 h-6 text-green-400" />
          <h1 className="text-xl font-bold text-green-400">NeAR Viewer</h1>
        </div>
        <div className="w-20"></div> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Camera Icon */}
          <div className="flex justify-center">
            <div className="p-8 bg-green-500/20 rounded-full border border-green-400/30">
              <Camera className="w-16 h-16 text-green-400" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Enter the
              <br />
              <span className="text-green-400">Agent World</span>
            </h1>

            <p className="text-xl text-slate-300 max-w-xl mx-auto">
              Activate your camera to discover and interact with NeAR agents in
              augmented reality
            </p>
          </div>

          {/* Permissions Notice */}
          <div className="bg-slate-800/50 border border-yellow-500/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center space-x-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Camera Permission Required</span>
            </div>
            <p className="text-sm text-slate-300">
              This app needs camera access to display AR agents in your
              environment. Your camera data is processed locally and never
              shared.
            </p>
          </div>

          {/* Camera Activation Button */}
          <div className="space-y-4">
            <Button
              onClick={handleStartCamera}
              disabled={isActivating}
              size="lg"
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black font-semibold px-12 py-4 text-lg rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/25"
            >
              {isActivating ? (
                <>
                  <div className="w-5 h-5 mr-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Starting Camera...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-3" />
                  Start Camera
                </>
              )}
            </Button>

            <p className="text-sm text-slate-400">
              Once activated, you'll see NeAR agents positioned around you
            </p>
          </div>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Discover Agents</span>
              </div>
              <p className="text-xs text-slate-400">
                Find AI agents positioned in your area
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Interact & Chat</span>
              </div>
              <p className="text-xs text-slate-400">
                Engage with agents through conversations
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Precise Location</span>
              </div>
              <p className="text-xs text-slate-400">
                RTK-enhanced GPS for accuracy
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with System Status */}
      <footer className="p-6 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">NeAR Network Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">RTK Precision Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">Agents Available</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CameraActivationScreen;
