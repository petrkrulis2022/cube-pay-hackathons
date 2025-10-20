// src/services/revolutVirtualCardService.js

const API_URL =
  import.meta.env.VITE_AGENTSPHERE_API_URL || "http://localhost:5174";

/**
 * Processes a Revolut virtual card payment.
 * @param {string} token - The payment token from the Revolut SDK.
 * @param {object} orderDetails - The details of the order.
 * @returns {Promise<object>} - The payment response from the backend.
 */
export const processVirtualCardPayment = async (token, orderDetails) => {
  try {
    const response = await fetch(
      `${API_URL}/api/revolut/process-virtual-card-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, ...orderDetails }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to process virtual card payment"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error processing virtual card payment:", error);
    throw error;
  }
};

/**
 * Creates a Revolut virtual card order for processing.
 * @param {object} orderDetails - The details of the order.
 * @returns {Promise<object>} - The order creation response.
 */
export const createVirtualCardOrder = async (orderDetails) => {
  try {
    const response = await fetch(
      `${API_URL}/api/revolut/create-virtual-card-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDetails),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to create virtual card order"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating virtual card order:", error);
    throw error;
  }
};

/**
 * Initializes Revolut checkout with proper error handling.
 * @param {string} clientId - The Revolut client ID.
 * @returns {Promise<object>} - The Revolut checkout instance.
 */
export const initializeRevolutCheckout = async (clientId) => {
  return new Promise((resolve, reject) => {
    // Check if Revolut script is loaded
    if (typeof window.RevolutCheckout === "undefined") {
      // Dynamically load Revolut script if not present
      const script = document.createElement("script");
      script.src = "https://merchant.revolut.com/embed.js";
      script.onload = () => {
        try {
          const revolut = window.RevolutCheckout(clientId);
          resolve(revolut);
        } catch (error) {
          reject(
            new Error(`Failed to initialize Revolut checkout: ${error.message}`)
          );
        }
      };
      script.onerror = () => {
        reject(new Error("Failed to load Revolut SDK"));
      };
      document.head.appendChild(script);
    } else {
      try {
        const revolut = window.RevolutCheckout(clientId);
        resolve(revolut);
      } catch (error) {
        reject(
          new Error(`Failed to initialize Revolut checkout: ${error.message}`)
        );
      }
    }
  });
};
