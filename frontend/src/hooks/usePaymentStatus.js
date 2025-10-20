// src/hooks/usePaymentStatus.js
import { useEffect, useState } from "react";

/**
 * Custom hook to track payment status with real-time updates
 * @param {string} orderId - The order ID to track
 * @param {function} onStatusChange - Callback function called when status changes
 * @returns {object} - Payment status and loading state
 */
export const usePaymentStatus = (orderId, onStatusChange) => {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    let ws = null;
    let pollInterval = null;
    let isActive = true;

    const API_URL =
      import.meta.env.VITE_AGENTSPHERE_API_URL || "http://localhost:5174";

    // Function to update status
    const updateStatus = (newStatus) => {
      if (!isActive) return;

      setPaymentStatus(newStatus);
      setIsLoading(false);

      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      // Stop polling/websocket on final states
      if (
        newStatus === "completed" ||
        newStatus === "failed" ||
        newStatus === "cancelled"
      ) {
        cleanup();
      }
    };

    // WebSocket connection (Option 1 - preferred)
    const tryWebSocket = () => {
      try {
        const wsUrl =
          API_URL.replace(/^http/, "ws") + `/ws/payment-status/${orderId}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected for payment status");
          setIsLoading(false);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            updateStatus(data.status);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.warn("WebSocket error, falling back to polling:", error);
          startPolling();
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          if (
            isActive &&
            (paymentStatus === "pending" || paymentStatus === "processing")
          ) {
            // Reconnect if payment is still pending
            setTimeout(tryWebSocket, 3000);
          }
        };
      } catch (error) {
        console.warn("WebSocket not supported, using polling:", error);
        startPolling();
      }
    };

    // Polling fallback (Option 2)
    const startPolling = () => {
      if (pollInterval) return; // Already polling

      pollInterval = setInterval(async () => {
        if (!isActive) return;

        try {
          const response = await fetch(
            `${API_URL}/api/revolut/order-status/${orderId}`
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          updateStatus(data.status);
        } catch (error) {
          console.error("Error polling payment status:", error);
          setError(error.message);

          // Stop polling on persistent errors
          if (error.message.includes("404") || error.message.includes("401")) {
            cleanup();
          }
        }
      }, 3000);
    };

    // Cleanup function
    const cleanup = () => {
      isActive = false;

      if (ws) {
        ws.close();
        ws = null;
      }

      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Start with WebSocket, fallback to polling
    tryWebSocket();

    // Cleanup on unmount
    return cleanup;
  }, [orderId, onStatusChange]);

  return {
    paymentStatus,
    isLoading,
    error,
  };
};
