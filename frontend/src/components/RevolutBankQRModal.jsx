// src/components/RevolutBankQRModal.jsx
import React, { useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { cancelRevolutOrder } from "../services/revolutBankService";

const RevolutBankQRModal = ({
  isOpen = false, // Add isOpen prop
  paymentUrl,
  orderId,
  orderDetails,
  onClose,
  onPaymentComplete,
  onPaymentFailed,
  orderData, // Alternative prop name
  agentData, // Alternative prop name
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [showFullUrl, setShowFullUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  // Support both prop patterns
  const actualOrderId = orderId || orderData?.id || orderData?.order_id;
  const actualPaymentUrl =
    paymentUrl || orderData?.payment_url || orderData?.qr_code_url;
  const actualOrderDetails = orderDetails || orderData;

  // ✅ Define handler functions using useCallback BEFORE they're used in hooks
  const handlePaymentSuccess = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onPaymentComplete &&
        onPaymentComplete({
          status: "completed",
          orderId: actualOrderId,
          orderDetails: actualOrderDetails,
        });
    }, 500);
  }, [actualOrderId, actualOrderDetails, onPaymentComplete]);

  const handlePaymentFailure = useCallback(
    (status) => {
      setIsClosing(true);
      setTimeout(() => {
        onPaymentFailed &&
          onPaymentFailed({
            status,
            orderId: actualOrderId,
            orderDetails: actualOrderDetails,
            error: `Payment ${status}`,
          });
      }, 500);
    },
    [actualOrderId, actualOrderDetails, onPaymentFailed]
  );

  const handleTimeout = useCallback(async () => {
    try {
      await cancelRevolutOrder(actualOrderId);
      handlePaymentFailure("timeout");
    } catch (error) {
      console.error("Error canceling expired order:", error);
      handlePaymentFailure("timeout");
    }
  }, [actualOrderId, handlePaymentFailure]);

  // ✅ CRITICAL: Call ALL hooks BEFORE any conditional returns (Rules of Hooks)
  // Use payment status hook for real-time updates
  const { paymentStatus, isLoading, error } = usePaymentStatus(
    actualOrderId,
    (status) => {
      if (status === "completed") {
        handlePaymentSuccess();
      } else if (status === "failed" || status === "cancelled") {
        handlePaymentFailure(status);
      }
    }
  );

  // Countdown timer - must be called before conditional return
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) {
      if (timeLeft <= 0) {
        handleTimeout();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isOpen, handleTimeout]);

  // Don't render if not open (AFTER all hooks are called)
  if (!isOpen) return null;

  // QR Code click handler - opens payment in-app (like crypto QR)
  const handleQRClick = () => {
    console.log("🔥 Revolut QR Code clicked! Opening payment URL...");

    if (actualPaymentUrl) {
      try {
        // Open payment URL in new window/tab for in-app payment
        window.open(actualPaymentUrl, "_blank", "noopener,noreferrer");
        console.log("✅ Payment URL opened:", actualPaymentUrl);
      } catch (error) {
        console.error("❌ Error opening payment URL:", error);
        alert(
          "Failed to open payment link. Please try scanning the QR code instead."
        );
      }
    } else {
      console.warn("⚠️ No payment URL available");
      alert("Payment URL not available yet. Please wait...");
    }
  };

  // Copy payment link handler
  const handleCopyLink = async () => {
    if (!actualPaymentUrl) return;

    try {
      await navigator.clipboard.writeText(actualPaymentUrl);
      setCopied(true);
      console.log("✅ Payment link copied to clipboard");

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("❌ Failed to copy link:", error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = actualPaymentUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        alert("Failed to copy link. Please copy manually.");
      }
    }
  };

  // Additional handler functions
  const handleClose = async () => {
    setIsClosing(true);

    if (paymentStatus === "pending" || paymentStatus === "processing") {
      try {
        await cancelRevolutOrder(actualOrderId);
      } catch (error) {
        console.error("Error canceling order on close:", error);
      }
    }

    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case "pending":
        return "Waiting for payment...";
      case "processing":
        return "Processing payment...";
      case "completed":
        return "Payment successful!";
      case "failed":
        return "Payment failed";
      case "cancelled":
        return "Payment cancelled";
      default:
        return "Checking payment status...";
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case "completed":
        return "text-green-600";
      case "failed":
      case "cancelled":
        return "text-red-600";
      case "processing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <>
      {/* CSS Animations */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(0, 117, 235, 0.3); }
            50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.5); }
          }
          
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}
      </style>

      <div
        className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: isClosing
            ? "rgba(0, 0, 0, 0)"
            : "linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className={`relative rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-500 ${
            isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
          }}
        >
          {/* Revolut Brand Accent */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{
              background: "linear-gradient(90deg, #0075EB 0%, #00D4FF 100%)",
            }}
          />

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #0075EB 0%, #00D4FF 100%)",
                  }}
                >
                  R
                </div>
                <h2
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #0075EB 0%, #00D4FF 100%)",
                  }}
                >
                  Revolut Pay
                </h2>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {actualOrderDetails?.currency}{" "}
                {actualOrderDetails?.amount?.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-700 text-3xl transition-all duration-200 hover:rotate-90 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Close"
              disabled={isClosing}
            >
              ×
            </button>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center mb-8">
            <div
              onClick={handleQRClick}
              className="relative group cursor-pointer"
              title="Click to open payment"
            >
              <div
                className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #0075EB 0%, #00D4FF 100%)",
                  filter: "blur(10px)",
                }}
              />
              <div
                className="relative bg-white p-6 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 group-hover:border-transparent"
                style={{
                  transform: "translateZ(0)", // Enable GPU acceleration
                }}
              >
                {actualPaymentUrl && actualPaymentUrl.length > 0 ? (
                  <QRCode
                    value={actualPaymentUrl}
                    size={200}
                    style={{
                      height: "auto",
                      maxWidth: "100%",
                      width: "100%",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center text-gray-500"
                    style={{ width: "200px", height: "200px" }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3 animate-pulse">⏳</div>
                      <div className="text-sm font-medium">
                        Generating QR Code...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Copy Button */}
            {actualPaymentUrl && (
              <button
                onClick={handleCopyLink}
                className="mt-4 px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 hover:scale-105"
                style={{
                  background: copied
                    ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                    : "linear-gradient(135deg, rgba(0, 117, 235, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)",
                  color: copied ? "#fff" : "#0075EB",
                  border: copied ? "none" : "1px solid rgba(0, 117, 235, 0.3)",
                }}
              >
                {copied ? (
                  <>
                    <span>✓</span>
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy Payment Link</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center mb-6 px-4">
            <p className="text-gray-800 mb-3 font-semibold text-lg">
              Quick Payment Options
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">👆</span>
                <span>Click QR to open in browser</span>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">📱</span>
                <span>Scan with your phone camera</span>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">🔗</span>
                <span>Copy and share payment link</span>
              </p>
            </div>
          </div>

          {/* Status and Timer */}
          <div
            className="border-t pt-4 px-4"
            style={{
              borderColor: "rgba(0, 117, 235, 0.1)",
            }}
          >
            <div
              className="flex justify-between items-center mb-4 p-3 rounded-xl transition-all duration-300"
              style={{
                background:
                  paymentStatus === "completed"
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)"
                    : paymentStatus === "failed" ||
                      paymentStatus === "cancelled"
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)"
                    : "linear-gradient(135deg, rgba(0, 117, 235, 0.05) 0%, rgba(0, 212, 255, 0.05) 100%)",
                border: `1px solid ${
                  paymentStatus === "completed"
                    ? "rgba(16, 185, 129, 0.2)"
                    : paymentStatus === "failed" ||
                      paymentStatus === "cancelled"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(0, 117, 235, 0.15)"
                }`,
              }}
            >
              <div className="flex items-center space-x-3">
                {(paymentStatus === "pending" ||
                  paymentStatus === "processing") && (
                  <div
                    className="rounded-full h-5 w-5 border-2 animate-spin"
                    style={{
                      borderColor: "rgba(0, 117, 235, 0.2)",
                      borderTopColor: "#0075EB",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                )}
                {paymentStatus === "completed" && (
                  <div
                    className="text-green-500 text-xl font-bold animate-bounce"
                    style={{
                      animation: "bounce 0.5s ease-in-out",
                    }}
                  >
                    ✓
                  </div>
                )}
                {(paymentStatus === "failed" ||
                  paymentStatus === "cancelled") && (
                  <div
                    className="text-red-500 text-xl font-bold"
                    style={{
                      animation: "shake 0.5s ease-in-out",
                    }}
                  >
                    ✗
                  </div>
                )}
                <span
                  className={`text-sm font-semibold ${getStatusColor()}`}
                  style={{
                    letterSpacing: "0.3px",
                  }}
                >
                  {getStatusMessage()}
                </span>
              </div>

              {(paymentStatus === "pending" ||
                paymentStatus === "processing") && (
                <div
                  className="text-sm font-mono font-bold px-3 py-1 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0, 117, 235, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)",
                    color: "#0075EB",
                    border: "1px solid rgba(0, 117, 235, 0.2)",
                  }}
                >
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {error && (
              <div
                className="text-sm mb-4 p-3 rounded-xl flex items-center gap-2 animate-pulse"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)",
                  color: "#DC2626",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <span className="text-lg">⚠️</span>
                <span className="font-medium">Error: {error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-4">
              {paymentStatus === "completed" && (
                <button
                  onClick={() => handlePaymentSuccess()}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  Continue ✓
                </button>
              )}

              {(paymentStatus === "failed" ||
                paymentStatus === "cancelled" ||
                error) && (
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(107, 114, 128, 0.9) 0%, rgba(75, 85, 99, 0.9) 100%)",
                    color: "#fff",
                    border: "1px solid rgba(107, 114, 128, 0.3)",
                  }}
                >
                  Close
                </button>
              )}

              {(paymentStatus === "pending" ||
                paymentStatus === "processing") && (
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  disabled={isClosing}
                  style={{
                    background: isClosing
                      ? "linear-gradient(135deg, rgba(229, 231, 235, 0.5) 0%, rgba(209, 213, 219, 0.5) 100%)"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)",
                    color: isClosing ? "#9CA3AF" : "#374151",
                    border: "1px solid rgba(0, 117, 235, 0.2)",
                    cursor: isClosing ? "not-allowed" : "pointer",
                    opacity: isClosing ? 0.6 : 1,
                  }}
                >
                  {isClosing ? "Cancelling..." : "Cancel Payment"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RevolutBankQRModal;
