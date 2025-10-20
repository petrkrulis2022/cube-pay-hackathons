// src/services/revolutCardService.js

// Toggle between mock and real API
// Read from environment variable, default to true (mock mode)
export const USE_MOCK = import.meta.env.VITE_USE_MOCK_CARD !== "false";

const AGENTSPHERE_API_URL =
  import.meta.env.VITE_AGENTSPHERE_API_URL || "http://localhost:3001";

/**
 * Create virtual card
 */
export async function createVirtualCard(
  agentId,
  amount,
  currency = "USD",
  cardLabel = null
) {
  console.log("💳 Creating virtual card:", {
    agentId,
    amount,
    currency,
    cardLabel,
  });

  if (USE_MOCK) {
    return createMockVirtualCard(agentId, amount, currency, cardLabel);
  } else {
    return createRealVirtualCard(agentId, amount, currency, cardLabel);
  }
}

/**
 * Mock implementation for rapid UI testing
 */
async function createMockVirtualCard(agentId, amount, currency, cardLabel) {
  console.log("🧪 MOCK: Creating virtual card");

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const mockCard = {
    success: true,
    card: {
      card_id: `mock_card_${Date.now()}`,
      label: cardLabel || `Agent_${agentId}_Card`,
      currency: currency,
      state: "ACTIVE",
      balance: amount,
      card_number: "4111 1111 1111 1111",
      cvv: "123",
      expiry_date: "12/25",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  return mockCard;
}

/**
 * Real implementation calling Agentsphere backend
 */
async function createRealVirtualCard(agentId, amount, currency, cardLabel) {
  console.log("🌐 REAL: Creating virtual card via Agentsphere");

  try {
    const response = await fetch(
      `${AGENTSPHERE_API_URL}/api/revolut/create-virtual-card`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: agentId,
          amount: amount,
          currency: currency,
          cardLabel: cardLabel,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Virtual card created:", data);

    return data;
  } catch (error) {
    console.error("❌ Failed to create virtual card:", error);
    throw new Error(`Card creation failed: ${error.message}`);
  }
}

/**
 * Get card details
 */
export async function getCardDetails(cardId) {
  console.log("🔍 Getting card details:", cardId);

  if (USE_MOCK) {
    return getMockCardDetails(cardId);
  } else {
    return getRealCardDetails(cardId);
  }
}

/**
 * Mock card details
 */
async function getMockCardDetails(cardId) {
  console.log("🧪 MOCK: Getting card details");

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    card: {
      card_id: cardId,
      label: "Mock Agent Card",
      currency: "USD",
      state: "ACTIVE",
      balance: 5000,
      card_number: "4111 1111 1111 1111",
      cvv: "123",
      expiry_date: "12/25",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

/**
 * Real card details via Agentsphere
 */
async function getRealCardDetails(cardId) {
  console.log("🌐 REAL: Getting card details via Agentsphere");

  try {
    const response = await fetch(
      `${AGENTSPHERE_API_URL}/api/revolut/virtual-card/${cardId}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Card details retrieved");

    return data;
  } catch (error) {
    console.error("❌ Failed to get card details:", error);
    throw new Error(`Failed to get card details: ${error.message}`);
  }
}

/**
 * Top up card
 */
export async function topUpCard(cardId, amount, currency = "USD") {
  console.log("💰 Topping up card:", { cardId, amount, currency });

  if (USE_MOCK) {
    return topUpMockCard(cardId, amount, currency);
  } else {
    return topUpRealCard(cardId, amount, currency);
  }
}

/**
 * Mock top up
 */
async function topUpMockCard(cardId, amount, currency) {
  console.log("🧪 MOCK: Topping up card");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    topup: {
      card_id: cardId,
      amount: amount,
      currency: currency,
      new_balance: 5000 + amount,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Real top up via Agentsphere
 */
async function topUpRealCard(cardId, amount, currency) {
  console.log("🌐 REAL: Topping up card via Agentsphere");

  try {
    const response = await fetch(
      `${AGENTSPHERE_API_URL}/api/revolut/virtual-card/${cardId}/topup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Card topped up");

    return data;
  } catch (error) {
    console.error("❌ Failed to top up card:", error);
    throw new Error(`Top up failed: ${error.message}`);
  }
}

/**
 * Freeze/unfreeze card
 */
export async function freezeCard(cardId, freeze = true) {
  console.log(freeze ? "❄️ Freezing card:" : "🔥 Unfreezing card:", cardId);

  if (USE_MOCK) {
    return freezeMockCard(cardId, freeze);
  } else {
    return freezeRealCard(cardId, freeze);
  }
}

/**
 * Mock freeze
 */
async function freezeMockCard(cardId, freeze) {
  console.log("🧪 MOCK: Freezing/unfreezing card");

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    card_id: cardId,
    state: freeze ? "FROZEN" : "ACTIVE",
    action: freeze ? "freeze" : "unfreeze",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Real freeze via Agentsphere
 */
async function freezeRealCard(cardId, freeze) {
  console.log("🌐 REAL: Freezing/unfreezing card via Agentsphere");

  try {
    const response = await fetch(
      `${AGENTSPHERE_API_URL}/api/revolut/virtual-card/${cardId}/freeze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freeze: freeze,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Card frozen/unfrozen");

    return data;
  } catch (error) {
    console.error("❌ Failed to freeze/unfreeze card:", error);
    throw new Error(`Freeze operation failed: ${error.message}`);
  }
}

/**
 * Simulate card payment (for testing)
 */
export async function simulateCardPayment(cardId, amount, currency, merchant) {
  console.log("🧪 Simulating card payment:", {
    cardId,
    amount,
    currency,
    merchant,
  });

  if (USE_MOCK) {
    // Mock simulation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      success: true,
      message: "Payment simulation completed",
      payment: {
        card_id: cardId,
        amount: amount,
        currency: currency,
        merchant: merchant,
        remaining_balance: 5000 - amount,
        transaction_id: `mock_txn_${Date.now()}`,
        completed_at: new Date().toISOString(),
      },
    };
  } else {
    // Real simulation via Agentsphere
    try {
      const response = await fetch(
        `${AGENTSPHERE_API_URL}/api/revolut/test-card-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            card_id: cardId,
            amount: amount,
            currency: currency,
            merchant: merchant,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Failed to simulate card payment:", error);
      throw error;
    }
  }
}

/**
 * Get card transactions
 */
export async function getCardTransactions(cardId, limit = 10) {
  console.log("📊 Getting card transactions:", cardId);

  if (USE_MOCK) {
    return getMockCardTransactions(cardId, limit);
  } else {
    return getRealCardTransactions(cardId, limit);
  }
}

/**
 * Mock transactions
 */
async function getMockCardTransactions(cardId, limit) {
  console.log("🧪 MOCK: Getting card transactions");

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    transactions: [
      {
        id: "txn_1",
        card_id: cardId,
        amount: -2500,
        currency: "USD",
        merchant: "Amazon",
        status: "COMPLETED",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "txn_2",
        card_id: cardId,
        amount: 5000,
        currency: "USD",
        merchant: "Top Up",
        status: "COMPLETED",
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    total: 2,
    limit: limit,
  };
}

/**
 * Real transactions via Agentsphere
 */
async function getRealCardTransactions(cardId, limit) {
  console.log("🌐 REAL: Getting card transactions via Agentsphere");

  try {
    const response = await fetch(
      `${AGENTSPHERE_API_URL}/api/revolut/virtual-card/${cardId}/transactions?limit=${limit}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Transactions retrieved");

    return data;
  } catch (error) {
    console.error("❌ Failed to get transactions:", error);
    throw new Error(`Failed to get transactions: ${error.message}`);
  }
}
