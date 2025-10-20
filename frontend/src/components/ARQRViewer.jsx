import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  QrCode,
  Zap,
  Bot,
  MapPin,
  RefreshCw,
  Settings,
  Layers,
} from "lucide-react";
import ARQRCode from "./ARQRCode";
import qrCodeService from "../services/qrCodeService";

const ARQRViewer = ({
  isActive = false,
  userLocation,
  nearAgents = [],
  onQRScanned,
  className = "",
}) => {
  const [arQRCodes, setArQRCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAROverlay, setShowAROverlay] = useState(isActive);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch active QR codes from Supabase
  const fetchActiveQRCodes = async () => {
    if (!isActive) return;

    setIsLoading(true);
    setError(null);

    try {
      const qrCodes = await qrCodeService.getActiveQRCodes(userLocation, 100); // 100m radius

      // Transform for AR display
      const arQRs = qrCodes.map((qr, index) => ({
        id: qr.id,
        data: qr.qr_code_data,
        position: [qr.position_x, qr.position_y, qr.position_z],
        size: qr.scale || 1.5,
        status: qr.status,
        agent: qr.agent,
        transactionId: qr.transaction_id,
        amount: qr.amount,
        expirationTime: qr.expiration_time,
        createdAt: qr.created_at,
      }));

      setArQRCodes(arQRs);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error("Error fetching AR QR codes:", error);
      setError("Failed to load AR QR codes");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh QR codes periodically
  useEffect(() => {
    if (!isActive) return;

    fetchActiveQRCodes();

    const interval = setInterval(() => {
      fetchActiveQRCodes();
      qrCodeService.cleanupExpiredQRCodes(); // Clean up expired codes
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isActive, userLocation]);

  // Handle QR code scanning
  const handleQRScanned = async (qrCode) => {
    try {
      // Update status in Supabase
      await qrCodeService.updateQRCodeStatus(
        qrCode.id,
        qrCodeService.QR_CODE_STATUS.SCANNED,
        { scanned_at: new Date().toISOString() }
      );

      // Remove from local state
      setArQRCodes((prev) => prev.filter((qr) => qr.id !== qrCode.id));

      // Notify parent component
      if (onQRScanned) {
        onQRScanned({
          qrCode,
          scannedAt: new Date().toISOString(),
          amount: qrCode.amount,
          agent: qrCode.agent,
        });
      }

      // Show success notification
      console.log("✅ QR Code scanned successfully:", qrCode);
    } catch (error) {
      console.error("Error processing QR scan:", error);
      setError("Failed to process QR scan");
    }
  };

  // Toggle AR overlay
  const toggleAROverlay = () => {
    setShowAROverlay((prev) => !prev);
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchActiveQRCodes();
  };

  if (!isActive) return null;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* AR QR Code Overlay */}
      {showAROverlay && arQRCodes.length > 0 && (
        <ARQRCode
          qrCodes={arQRCodes}
          onQRScanned={handleQRScanned}
          className="absolute inset-0 z-20"
        />
      )}

      {/* AR Controls Panel */}
      <div className="absolute top-4 right-4 z-30">
        <Card className="bg-black/80 backdrop-blur-sm border-purple-500/30">
          <CardContent className="p-3">
            <div className="flex flex-col gap-2">
              {/* AR Toggle */}
              <Button
                onClick={toggleAROverlay}
                variant={showAROverlay ? "default" : "outline"}
                size="sm"
                className={`w-full ${
                  showAROverlay
                    ? "bg-purple-500 hover:bg-purple-600"
                    : "border-white/30 text-white hover:bg-white/20"
                }`}
              >
                {showAROverlay ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    AR QR Active
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Show AR QR
                  </>
                )}
              </Button>

              {/* QR Count Badge */}
              {arQRCodes.length > 0 && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 justify-center">
                  <QrCode className="w-3 h-3 mr-1" />
                  {arQRCodes.length} QR{arQRCodes.length !== 1 ? "s" : ""}
                </Badge>
              )}

              {/* Refresh Button */}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AR QR Code List (Debug/Info Panel) */}
      {arQRCodes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-30 max-w-xs">
          <Card className="bg-black/80 backdrop-blur-sm border-purple-500/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm font-medium">
                  Active AR QRs
                </span>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {arQRCodes.map((qr, index) => (
                  <div
                    key={qr.id}
                    className="bg-slate-800/50 rounded p-2 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-3 h-3 text-blue-400" />
                      <span className="text-white truncate">
                        {qr.agent?.name || `QR ${index + 1}`}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      Amount: {qr.amount} USBDG+
                    </div>
                    <div className="text-slate-400">
                      Position: [
                      {qr.position.map((p) => p.toFixed(1)).join(", ")}]
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <Card className="bg-red-900/80 border-red-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-red-300 text-sm">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="outline"
                size="sm"
                className="mt-2 border-red-500/30 text-red-300 hover:bg-red-500/20"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute bottom-4 right-4 z-30">
          <Card className="bg-black/80 backdrop-blur-sm border-purple-500/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-purple-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading AR QRs...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No QR Codes Message */}
      {!isLoading && arQRCodes.length === 0 && showAROverlay && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <Card className="bg-black/80 backdrop-blur-sm border-slate-500/30">
            <CardContent className="p-4 text-center">
              <QrCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No AR QR codes nearby</p>
              <p className="text-slate-500 text-xs mt-1">
                Generate payment QRs to see them here
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ARQRViewer;
