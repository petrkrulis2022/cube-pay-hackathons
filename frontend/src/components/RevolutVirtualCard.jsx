// src/components/RevolutVirtualCard.jsx
import React, { useState, useEffect } from "react";
import {
  createVirtualCard,
  getCardDetails,
  topUpCard,
  freezeCard,
  simulateCardPayment,
  getCardTransactions,
} from "../services/revolutCardService";

export function RevolutVirtualCard({
  agentId,
  initialAmount = 5000,
  currency = "USD",
  onSuccess,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, creating, active, frozen, paying
  const [error, setError] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  /**
   * Create virtual card
   */
  const handleCreateCard = async () => {
    try {
      setLoading(true);
      setStatus("creating");
      setError(null);

      console.log("💳 Creating virtual card...");

      const result = await createVirtualCard(
        agentId,
        initialAmount,
        currency,
        `Agent_${agentId}_Card`
      );

      console.log("✅ Card created:", result);

      setCardData(result.card);
      setStatus("active");
      onSuccess?.(result);
    } catch (err) {
      console.error("❌ Card creation failed:", err);
      setError(err.message);
      setStatus("idle");
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh card details
   */
  const handleRefreshCard = async () => {
    if (!cardData) return;

    try {
      setLoading(true);

      const result = await getCardDetails(cardData.card_id);
      setCardData(result.card);

      console.log("✅ Card refreshed");
    } catch (err) {
      console.error("❌ Failed to refresh card:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Top up card
   */
  const handleTopUp = async () => {
    if (!cardData || !topUpAmount) return;

    try {
      setLoading(true);
      setError(null);

      const amount = Math.round(parseFloat(topUpAmount) * 100); // Convert to cents

      console.log("💰 Topping up card:", amount);

      const result = await topUpCard(cardData.card_id, amount, currency);

      console.log("✅ Card topped up:", result);

      // Update card balance
      setCardData((prev) => ({
        ...prev,
        balance: result.topup.new_balance || prev.balance + amount,
      }));

      setTopUpAmount("");
    } catch (err) {
      console.error("❌ Top up failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Freeze/unfreeze card
   */
  const handleFreeze = async (freeze) => {
    if (!cardData) return;

    try {
      setLoading(true);
      setError(null);

      console.log(freeze ? "❄️ Freezing card" : "🔥 Unfreezing card");

      const result = await freezeCard(cardData.card_id, freeze);

      console.log("✅ Card frozen/unfrozen:", result);

      setStatus(freeze ? "frozen" : "active");
      setCardData((prev) => ({
        ...prev,
        state: result.state,
      }));
    } catch (err) {
      console.error("❌ Freeze operation failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Simulate payment
   */
  const handleSimulatePayment = async () => {
    if (!cardData || !paymentAmount || !merchant) return;

    try {
      setLoading(true);
      setStatus("paying");
      setError(null);

      const amount = Math.round(parseFloat(paymentAmount) * 100); // Convert to cents

      console.log("💳 Simulating payment:", { amount, merchant });

      const result = await simulateCardPayment(
        cardData.card_id,
        amount,
        currency,
        merchant
      );

      console.log("✅ Payment completed:", result);

      // Update card balance
      setCardData((prev) => ({
        ...prev,
        balance: result.payment?.remaining_balance || prev.balance - amount,
      }));

      setStatus("active");
      setPaymentAmount("");
      setMerchant("");

      // Refresh transactions
      if (showTransactions) {
        handleLoadTransactions();
      }
    } catch (err) {
      console.error("❌ Payment failed:", err);
      setError(err.message);
      setStatus("active");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load transactions
   */
  const handleLoadTransactions = async () => {
    if (!cardData) return;

    try {
      const result = await getCardTransactions(cardData.card_id, 10);
      setTransactions(result.transactions || []);
      setShowTransactions(true);
    } catch (err) {
      console.error("❌ Failed to load transactions:", err);
      setError(err.message);
    }
  };

  /**
   * Copy card number to clipboard
   */
  const handleCopyCardNumber = async () => {
    if (!cardData?.card_number) return;

    try {
      await navigator.clipboard.writeText(
        cardData.card_number.replace(/\s/g, "")
      );
      alert("Card number copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  /**
   * Mask card number for display
   */
  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return "XXXX XXXX XXXX XXXX";
    const last4 = cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  /**
   * Format currency
   */
  const formatAmount = (amount, curr = currency) => {
    return `${(amount / 100).toFixed(2)} ${curr}`;
  };

  return (
    <>
      {/* CSS Styles */}
      <style>
        {`
          .virtual-card-container {
            padding: 20px;
            max-width: 500px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .virtual-card-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            background: linear-gradient(135deg, #0075EB 0%, #00D4FF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .card-display {
            background: linear-gradient(135deg, #0075EB 0%, #00D4FF 100%);
            border-radius: 20px;
            padding: 30px;
            color: white;
            margin: 20px 0;
            box-shadow: 0 15px 35px rgba(0, 117, 235, 0.4);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .card-display::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            pointer-events: none;
          }
          
          .card-display:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 45px rgba(0, 117, 235, 0.5);
          }
          
          .card-display.frozen {
            background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
            opacity: 0.8;
            filter: grayscale(30%);
          }
          
          .card-display.frozen::after {
            content: '❄️';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 80px;
            opacity: 0.2;
          }
          
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
          }
          
          .card-label {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            opacity: 0.9;
          }
          
          .card-status {
            font-size: 12px;
            padding: 6px 12px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            font-weight: 600;
          }
          
          .card-status.paying {
            animation: pulse-card 1s infinite;
          }
          
          @keyframes pulse-card {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
          }
          
          .card-chip {
            width: 50px;
            height: 40px;
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
          }
          
          .card-number {
            font-size: 22px;
            font-family: 'Courier New', monospace;
            letter-spacing: 3px;
            margin: 25px 0;
            font-weight: 500;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .card-details-row {
            display: flex;
            gap: 40px;
            margin: 20px 0;
            position: relative;
            z-index: 1;
          }
          
          .card-detail-item {
            display: flex;
            flex-direction: column;
          }
          
          .card-detail-label {
            font-size: 10px;
            opacity: 0.7;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          
          .card-detail-value {
            font-size: 16px;
            font-family: 'Courier New', monospace;
            font-weight: 500;
          }
          
          .card-balance {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
          }
          
          .card-balance-label {
            font-size: 12px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .card-balance-amount {
            font-size: 32px;
            font-weight: bold;
            text-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          
          .card-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
          }
          
          .btn {
            padding: 12px 20px;
            border-radius: 12px;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            flex: 1;
            min-width: 120px;
            text-align: center;
          }
          
          .btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .btn:active:not(:disabled) {
            transform: translateY(0);
          }
          
          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #0075EB 0%, #00D4FF 100%);
            color: white;
          }
          
          .btn-secondary {
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%);
            color: #374151;
            border: 1px solid rgba(0, 117, 235, 0.2);
          }
          
          .btn-warning {
            background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
            color: white;
          }
          
          .btn-success {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
          }
          
          .btn-test {
            background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
            color: white;
          }
          
          .section-box {
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%);
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid rgba(0, 117, 235, 0.1);
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 15px 0;
            color: #1f2937;
          }
          
          .input-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .input-field {
            padding: 14px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s;
            background: white;
          }
          
          .input-field:focus {
            outline: none;
            border-color: #0075EB;
            box-shadow: 0 0 0 3px rgba(0, 117, 235, 0.1);
          }
          
          .card-info {
            margin-top: 20px;
            padding: 15px;
            background: linear-gradient(135deg, rgba(0, 117, 235, 0.05) 0%, rgba(0, 212, 255, 0.05) 100%);
            border-radius: 12px;
            border: 1px solid rgba(0, 117, 235, 0.1);
          }
          
          .card-info p {
            margin: 5px 0;
            font-size: 12px;
            color: #6b7280;
            word-break: break-all;
          }
          
          .error-message {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
            color: #dc2626;
            padding: 15px;
            border-radius: 12px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid rgba(239, 68, 68, 0.2);
          }
          
          .error-icon {
            font-size: 24px;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0075EB;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .creating-state, .idle-state {
            text-align: center;
            padding: 40px 20px;
          }
          
          .idle-state p {
            font-size: 18px;
            margin-bottom: 20px;
            color: #6b7280;
          }
          
          .transactions-list {
            margin-top: 15px;
            max-height: 300px;
            overflow-y: auto;
          }
          
          .transaction-item {
            padding: 12px;
            background: white;
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #e5e7eb;
          }
          
          .transaction-merchant {
            font-weight: 600;
            color: #1f2937;
          }
          
          .transaction-amount {
            font-weight: bold;
          }
          
          .transaction-amount.positive {
            color: #10B981;
          }
          
          .transaction-amount.negative {
            color: #ef4444;
          }
        `}
      </style>

      <div className="virtual-card-container">
        <h2 className="virtual-card-title">Revolut Virtual Card 💳</h2>

        {/* Idle State */}
        {status === "idle" && (
          <div className="idle-state">
            <p>
              Initial Balance: ${(initialAmount / 100).toFixed(2)} {currency}
            </p>
            <button
              onClick={handleCreateCard}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Creating..." : "✨ Create Virtual Card"}
            </button>
          </div>
        )}

        {/* Creating State */}
        {status === "creating" && (
          <div className="creating-state">
            <div className="spinner"></div>
            <p>Creating your virtual card...</p>
          </div>
        )}

        {/* Active/Frozen/Paying State */}
        {(status === "active" || status === "frozen" || status === "paying") &&
          cardData && (
            <div className="card-active-state">
              {/* Card Display */}
              <div
                className={`card-display ${
                  status === "frozen" ? "frozen" : ""
                }`}
              >
                <div className="card-header">
                  <span className="card-label">{cardData.label}</span>
                  <span className={`card-status ${status}`}>
                    {status === "frozen"
                      ? "❄️ FROZEN"
                      : status === "paying"
                      ? "💳 PAYING"
                      : "✅ ACTIVE"}
                  </span>
                </div>

                <div className="card-chip"></div>

                <div className="card-number">
                  {showCardDetails
                    ? cardData.card_number
                    : maskCardNumber(cardData.card_number)}
                </div>

                <div className="card-details-row">
                  <div className="card-detail-item">
                    <span className="card-detail-label">VALID THRU</span>
                    <span className="card-detail-value">
                      {showCardDetails ? cardData.expiry_date : "XX/XX"}
                    </span>
                  </div>
                  <div className="card-detail-item">
                    <span className="card-detail-label">CVV</span>
                    <span className="card-detail-value">
                      {showCardDetails ? cardData.cvv : "XXX"}
                    </span>
                  </div>
                </div>

                <div className="card-balance">
                  <span className="card-balance-label">Available Balance</span>
                  <span className="card-balance-amount">
                    ${(cardData.balance / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="card-actions">
                <button
                  onClick={() => setShowCardDetails(!showCardDetails)}
                  className="btn btn-secondary"
                >
                  {showCardDetails ? "🙈 Hide Details" : "👁️ Show Details"}
                </button>

                <button
                  onClick={handleCopyCardNumber}
                  className="btn btn-secondary"
                  disabled={!showCardDetails}
                >
                  📋 Copy Number
                </button>

                <button
                  onClick={handleRefreshCard}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  🔄 Refresh
                </button>

                {status === "active" && (
                  <button
                    onClick={() => handleFreeze(true)}
                    disabled={loading}
                    className="btn btn-warning"
                  >
                    ❄️ Freeze Card
                  </button>
                )}

                {status === "frozen" && (
                  <button
                    onClick={() => handleFreeze(false)}
                    disabled={loading}
                    className="btn btn-success"
                  >
                    🔥 Unfreeze Card
                  </button>
                )}
              </div>

              {/* Top Up Section */}
              {status === "active" && (
                <div className="section-box">
                  <h3 className="section-title">💰 Top Up Card</h3>
                  <div className="input-group">
                    <input
                      type="number"
                      placeholder="Amount (USD)"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      disabled={loading}
                      className="input-field"
                      step="0.01"
                      min="0"
                    />
                    <button
                      onClick={handleTopUp}
                      disabled={
                        loading || !topUpAmount || parseFloat(topUpAmount) <= 0
                      }
                      className="btn btn-primary"
                    >
                      {loading ? "⏳ Processing..." : "💰 Add Funds"}
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Simulation Section */}
              {status === "active" && (
                <div className="section-box">
                  <h3 className="section-title">🧪 Simulate Payment</h3>
                  <div className="input-group">
                    <input
                      type="number"
                      placeholder="Amount (USD)"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      disabled={loading}
                      className="input-field"
                      step="0.01"
                      min="0"
                    />
                    <input
                      type="text"
                      placeholder="Merchant name (e.g., Amazon)"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      disabled={loading}
                      className="input-field"
                    />
                    <button
                      onClick={handleSimulatePayment}
                      disabled={
                        loading ||
                        !paymentAmount ||
                        !merchant ||
                        parseFloat(paymentAmount) <= 0
                      }
                      className="btn btn-test"
                    >
                      {loading ? "⏳ Processing..." : "🧪 Make Test Payment"}
                    </button>
                  </div>
                </div>
              )}

              {/* Transactions Section */}
              {status === "active" && (
                <div className="section-box">
                  <h3 className="section-title">📊 Recent Transactions</h3>
                  {!showTransactions ? (
                    <button
                      onClick={handleLoadTransactions}
                      className="btn btn-secondary"
                      style={{ width: "100%" }}
                    >
                      📜 Load Transactions
                    </button>
                  ) : (
                    <div className="transactions-list">
                      {transactions.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#9ca3af" }}>
                          No transactions yet
                        </p>
                      ) : (
                        transactions.map((txn) => (
                          <div key={txn.id} className="transaction-item">
                            <div>
                              <div className="transaction-merchant">
                                {txn.merchant}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                {new Date(txn.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div
                              className={`transaction-amount ${
                                txn.amount > 0 ? "positive" : "negative"
                              }`}
                            >
                              {txn.amount > 0 ? "+" : ""}
                              {formatAmount(txn.amount)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Card Info */}
              <div className="card-info">
                <p>
                  <strong>Card ID:</strong> {cardData.card_id}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(cardData.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Currency:</strong> {cardData.currency}
                </p>
              </div>
            </div>
          )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default RevolutVirtualCard;
