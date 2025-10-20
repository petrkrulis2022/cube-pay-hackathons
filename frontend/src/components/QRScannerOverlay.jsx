import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  QrCode,
  AlertCircle,
  CheckCircle,
  Camera,
  Loader,
} from "lucide-react";
import QrScanner from "react-qr-barcode-scanner";
import QRCode from "react-qr-code";

const QRScannerOverlay = ({
  isOpen,
  onClose,
  onQRScanned,
  expectedAgent = null,
  onError = null,
  displayQRCode = null, // QR code to display for scanning
}) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState("prompt");
  const [cameraReady, setCameraReady] = useState(false);

  // Camera permission handling
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Stop the stream immediately as we just needed to test permission
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
      setCameraReady(true);
      setScanning(true);
      setError(null);
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermission("denied");
      setError(
        "Camera access denied. Please allow camera permissions and try again."
      );
    }
  };

  // Reset states when overlay opens/closes
  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setError(null);
      setProcessing(false);
      setCameraReady(false);

      // Check current permission status
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: "camera" })
          .then((permission) => {
            setCameraPermission(permission.state);
            if (permission.state === "granted") {
              setCameraReady(true);
              setScanning(true);
            } else if (permission.state === "denied") {
              setError(
                "Camera access denied. Please allow camera permissions in your browser settings."
              );
            }
          })
          .catch(() => {
            // Fallback: try to request permission directly
            requestCameraPermission();
          });
      } else {
        // Fallback for browsers without permissions API
        requestCameraPermission();
      }
    } else {
      setScanning(false);
      setCameraReady(false);
    }
  }, [isOpen]);

  // Handle QR code scan
  const handleScan = async (result) => {
    if (!result || processing) return;

    setProcessing(true);
    setScanning(false);

    try {
      // Parse QR code data
      const qrData = parseQRCode(result);

      if (!qrData) {
        throw new Error("Invalid QR code format");
      }

      // Validate QR code if agent is specified
      if (expectedAgent && !validateAgentQR(qrData, expectedAgent)) {
        throw new Error("QR code does not match selected agent");
      }

      setScanResult(qrData);

      // Call parent callback with QR data
      if (onQRScanned) {
        await onQRScanned(qrData);
      }

      // Auto-close after successful scan
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("QR Scan Error:", err);
      setError(err.message);
      if (onError) {
        onError(err);
      }

      // Reset to scanning mode after error
      setTimeout(() => {
        setError(null);
        setScanning(true);
        setProcessing(false);
      }, 3000);
    }
  };

  // Handle scan error
  const handleScanError = (err) => {
    console.error("Scanner Error:", err);
    setError("Camera access denied or not available");
    if (onError) {
      onError(err);
    }
  };

  // Parse QR code data (EIP-681 format)
  const parseQRCode = (data) => {
    try {
      // Check if it's an ethereum payment URI
      if (!data.startsWith("ethereum:")) {
        return null;
      }

      // Parse EIP-681 format: ethereum:{address}@{chainId}/transfer?address={recipient}&uint256={amount}
      const uriPattern =
        /ethereum:([^@]+)@(\d+)\/transfer\?address=([^&]+)&uint256=([^&]+)/;
      const match = data.match(uriPattern);

      if (!match) {
        return null;
      }

      return {
        contractAddress: match[1],
        chainId: match[2],
        recipient: match[3],
        amount: match[4],
        rawData: data,
        token: "USBDG+",
        network: "BlockDAG Primordial Testnet",
      };
    } catch (err) {
      console.error("QR Parse Error:", err);
      return null;
    }
  };

  // Validate QR code matches expected agent
  const validateAgentQR = (qrData, agent) => {
    if (!qrData || !agent) return false;

    // Check if recipient matches agent's wallet address
    if (agent.wallet_address && qrData.recipient !== agent.wallet_address) {
      return false;
    }

    // Check if it's using the correct token contract
    const expectedContract = "0xFAD0070d0388FB3F18F1100A5FFc67dF8834D9db";
    if (
      qrData.contractAddress.toLowerCase() !== expectedContract.toLowerCase()
    ) {
      return false;
    }

    // Check if it's the correct network
    if (qrData.chainId !== "1043") {
      return false;
    }

    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full h-full relative">
        {/* Camera Permission Prompt */}
        {cameraPermission === "prompt" && !cameraReady && !error && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <Card className="bg-slate-900 border-purple-500/30 text-white max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">
                  Camera Access Required
                </h3>
                <p className="text-purple-200 mb-6">
                  We need access to your camera to scan QR codes for payments.
                </p>
                <Button
                  onClick={requestCameraPermission}
                  className="bg-purple-500 hover:bg-purple-600 w-full mb-3"
                >
                  Allow Camera Access
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/20 w-full"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scanner View */}
        {scanning && cameraReady && (
          <div className="relative w-full h-full">
            <QrScanner
              onUpdate={(err, result) => {
                if (result) {
                  handleScan(result.text);
                } else if (err) {
                  handleScanError(err);
                }
              }}
              style={{ width: "100%", height: "100%" }}
              constraints={{
                video: {
                  facingMode: "environment",
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
              }}
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Scanning Frame */}
              <div className="relative">
                <div className="w-64 h-64 border-2 border-purple-500 rounded-lg relative">
                  {/* Corner guides */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>

                  {/* Scanning animation */}
                  <div className="absolute inset-0 border border-purple-300 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-32 left-0 right-0 text-center px-6">
              <Card className="bg-black/70 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <QrCode className="w-6 h-6 text-purple-400" />
                    <h3 className="text-white font-semibold">
                      Scan Payment QR Code
                    </h3>
                  </div>
                  <p className="text-purple-200 text-sm">
                    {displayQRCode
                      ? "Point your camera at the QR code below to complete payment"
                      : "Point your camera at the agent's QR code to complete payment"}
                  </p>
                  {expectedAgent && (
                    <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Paying {expectedAgent.name}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* QR Code Display Area - Centered for better scanning */}
            {displayQRCode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Card className="bg-white/95 border-purple-500/30 p-4 shadow-2xl pointer-events-auto">
                  <div className="bg-white rounded">
                    <QRCode
                      value={displayQRCode}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-center text-slate-600 mt-2 font-medium">
                    Scan This Code
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <Card className="bg-slate-900 border-purple-500/30 text-white">
              <CardContent className="p-8 text-center">
                <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Processing QR Code
                </h3>
                <p className="text-purple-200">
                  Validating payment information...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success State */}
        {scanResult && !processing && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <Card className="bg-slate-900 border-green-500/30 text-white max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">QR Code Scanned!</h3>
                <p className="text-green-300 mb-4">
                  Payment information detected
                </p>

                <div className="bg-slate-800 rounded-lg p-4 mb-4 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-white">
                        {scanResult.amount} {scanResult.token}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Network:</span>
                      <span className="text-purple-300">
                        {scanResult.network}
                      </span>
                    </div>
                    {expectedAgent && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Agent:</span>
                        <span className="text-white">{expectedAgent.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-slate-400 text-sm">
                  Opening wallet for payment...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <Card className="bg-slate-900 border-red-500/30 text-white max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {cameraPermission === "denied"
                    ? "Camera Access Denied"
                    : "Scan Error"}
                </h3>
                <p className="text-red-300 mb-4">{error}</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setError(null);
                      if (cameraPermission === "denied") {
                        requestCameraPermission();
                      } else {
                        setScanning(true);
                        setProcessing(false);
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 w-full"
                  >
                    {cameraPermission === "denied"
                      ? "Try Camera Again"
                      : "Try Again"}
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20 w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-6 right-6 text-white hover:bg-white/20 z-10"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Cancel Button */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-black/50 border-white/30 text-white hover:bg-white/20"
          >
            Cancel Scan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerOverlay;
