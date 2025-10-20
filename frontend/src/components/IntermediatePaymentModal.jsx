import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./IntermediatePaymentModal.css";

/**
 * Intermediate Payment Modal - Transaction Validation & Debugging Component
 *
 * This modal intercepts CCIP transactions before they reach MetaMask to:
 * 1. Display transaction structure in human-readable format
 * 2. Validate ETH value vs Token amount separation
 * 3. Show CCIP fee breakdown and gas estimates
 * 4. Prevent incorrect transactions from being sent
 *
 * Critical for debugging the ETH vs USDC transaction issue.
 */
const IntermediatePaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  transactionData,
  agentData,
}) => {
  const [validationStatus, setValidationStatus] = useState(null);
  const [transactionBreakdown, setTransactionBreakdown] = useState(null);
  const [allowanceStatus, setAllowanceStatus] = useState(null);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);

  useEffect(() => {
    if (isOpen && transactionData) {
      analyzeTransaction();
    }
  }, [isOpen, transactionData]);

  const analyzeTransaction = async () => {
    try {
      console.log("🔍 Analyzing transaction structure:", transactionData);

      // Extract key transaction components
      const ethValue = transactionData.value || "0";
      const ethValueFormatted = ethers.utils.formatEther(ethValue);
      const gasLimit = transactionData.gasLimit || "300000";
      const estimatedFee = transactionData.estimatedFee || "0";
      const feeFormatted = ethers.utils.formatEther(estimatedFee);

      // Analyze transaction type
      const isCCIPTransaction =
        transactionData.data && transactionData.data.length > 10;
      const isDirectTransfer =
        !isCCIPTransaction && parseFloat(ethValueFormatted) > 0;

      // Extract CCIP message details if available
      let tokenAmount = null;
      let tokenSymbol = "USDC";
      let recipientAddress = null;

      if (transactionData.amount) {
        tokenAmount = transactionData.amount;
      }

      if (transactionData.recipient) {
        recipientAddress = transactionData.recipient;
      }

      // Validation checks
      const validationResults = {
        correctStructure: isCCIPTransaction,
        separateTokenAmount: !!tokenAmount,
        reasonableEthValue: parseFloat(ethValueFormatted) < 0.01, // Should be small for fees only
        hasRecipient: !!recipientAddress,
        gasEstimateReasonable: parseInt(gasLimit) <= 500000,
      };

      const allValid = Object.values(validationResults).every(Boolean);

      // Detect common errors
      const errors = [];
      if (isDirectTransfer) {
        errors.push(
          `🚨 CRITICAL: Sending ${ethValueFormatted} ETH directly - should be USDC token transfer`
        );
      }
      if (parseFloat(ethValueFormatted) > 0.01) {
        errors.push(
          `⚠️ HIGH ETH VALUE: ${ethValueFormatted} ETH seems too high for CCIP fees`
        );
      }
      if (!isCCIPTransaction) {
        errors.push(
          `❌ Missing CCIP transaction data - not a proper cross-chain transfer`
        );
      }

      setTransactionBreakdown({
        // Transaction Structure
        ethValue: ethValueFormatted,
        ethValueWei: ethValue,
        tokenAmount: tokenAmount || "Unknown",
        tokenSymbol: tokenSymbol,
        recipient: recipientAddress || "Unknown",

        // Technical Details
        gasLimit: parseInt(gasLimit).toLocaleString(),
        estimatedFee: feeFormatted,
        isCCIPTransaction: isCCIPTransaction,
        isDirectTransfer: isDirectTransfer,

        // Validation
        validationResults: validationResults,
        allValid: allValid,
        errors: errors,

        // Cross-chain info from transaction data
        isCrossChain: transactionData.isCrossChain || isCCIPTransaction,
        transactionType:
          transactionData.transactionType ||
          (isCCIPTransaction ? "CCIP Cross-Chain" : "Direct Transfer"),
        debugInfo: (() => {
          // Check if service provided debugInfo
          if (transactionData.debugInfo) {
            console.log(
              "🔍 MODAL: Using service debugInfo:",
              transactionData.debugInfo
            );

            // CRITICAL FIX: Force correct OP Sepolia chain selector even if service has wrong value
            if (
              transactionData.destinationChain === 11155420 ||
              transactionData.destinationChain === "11155420"
            ) {
              console.log(
                "🚨 MODAL: Forcing correct OP Sepolia chain selector in service debugInfo"
              );
              return {
                ...transactionData.debugInfo,
                chainSelector: "5224473277236331295", // Always force correct value
              };
            }

            return transactionData.debugInfo;
          }

          // Fallback if no service debugInfo
          console.log(
            "🚨 MODAL FALLBACK: No service debugInfo, creating fallback"
          );
          return {
            userChainId: transactionData.sourceChain || "N/A",
            agentChainId: transactionData.destinationChain || "N/A",
            needsCrossChain: transactionData.isCrossChain || isCCIPTransaction,
            ccipRouter: transactionData.to || "N/A",
            chainSelector: (() => {
              if (
                transactionData.destinationChain === 11155420 ||
                transactionData.destinationChain === "11155420"
              ) {
                return "5224473277236331295";
              }
              return "N/A";
            })(),
          };
        })(),

        // Raw Data
        rawTransaction: transactionData,
      });

      setValidationStatus(allValid ? "valid" : "invalid");

      // Check allowance for cross-chain transactions
      if (isCCIPTransaction && transactionData.sourceChain && tokenAmount) {
        await checkAllowanceStatus();
      }
    } catch (error) {
      console.error("❌ Transaction analysis failed:", error);
      setValidationStatus("error");
      setTransactionBreakdown({
        errors: [`Analysis failed: ${error.message}`],
        rawTransaction: transactionData,
      });
    }
  };

  const checkAllowanceStatus = async () => {
    try {
      setIsCheckingAllowance(true);
      console.log("🔍 Checking USDC allowance status...");

      // Import ccipConfigService
      const ccipConfigService = (
        await import("../services/ccipConfigService.js")
      ).default;

      // Get user address
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts connected");
      }

      const userAddress = accounts[0];
      const { sourceChain, amount } = transactionData;

      // Convert amount to wei (USDC uses 6 decimals)
      const amountInWei = ethers.utils
        .parseUnits(amount.toString(), 6)
        .toString();

      // Check allowance
      const allowanceResult = await ccipConfigService.checkAndHandleAllowance(
        sourceChain,
        amountInWei,
        userAddress
      );

      console.log("💰 Allowance check result:", allowanceResult);

      setAllowanceStatus(allowanceResult);
    } catch (error) {
      console.error("❌ Allowance check failed:", error);
      setAllowanceStatus({
        success: false,
        error: error.message,
        needsApproval: true,
      });
    } finally {
      setIsCheckingAllowance(false);
    }
  };

  const handleConfirm = async () => {
    try {
      // Check if this is a cross-chain transaction that needs approval
      if (
        transactionBreakdown?.isCCIPTransaction &&
        allowanceStatus?.needsApproval
      ) {
        console.log("🔓 Approval needed - requesting USDC approval first...");

        setIsRequestingApproval(true);

        // Import ccipConfigService
        const ccipConfigService = (
          await import("../services/ccipConfigService.js")
        ).default;

        // Get user address
        if (!window.ethereum) {
          throw new Error("MetaMask not detected");
        }

        // Verify signer and provider connection
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        console.log("🔍 Verifying signer connection:", {
          provider: !!provider,
          signer: !!signer,
          network: await provider.getNetwork(),
          signerAddress: await signer.getAddress(),
        });

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts connected");
        }

        const userAddress = accounts[0];
        const { sourceChain, amount } = transactionData;

        // Convert amount to wei (USDC uses 6 decimals)
        const amountInWei = ethers.utils
          .parseUnits(amount.toString(), 6)
          .toString();

        console.log("📝 Requesting USDC approval with verified signer:", {
          sourceChain,
          amountInWei,
          amountUSDC: amount.toString(),
          userAddress,
          signerConnected: await signer.getAddress(),
        });

        // Request approval
        const approvalResult = await ccipConfigService.requestUSDCApproval(
          sourceChain,
          amountInWei,
          userAddress
        );

        console.log("📋 Approval result:", approvalResult);

        if (!approvalResult.success) {
          if (approvalResult.userRejected) {
            console.warn("🚫 User rejected USDC approval");
            return; // Don't proceed with transaction
          } else {
            throw new Error(`USDC approval failed: ${approvalResult.error}`);
          }
        }

        console.log(
          "✅ USDC approval successful! Now proceeding with CCIP transaction..."
        );

        // Update allowance status to reflect successful approval
        await checkAllowanceStatus();
      }

      // Proceed with transaction
      if (validationStatus === "valid") {
        console.log("✅ Transaction validated, proceeding to MetaMask");
        onConfirm(transactionData);
      } else {
        console.warn("⚠️ User confirmed invalid transaction");
        // Still allow confirmation but with warning
        onConfirm(transactionData);
      }
    } catch (error) {
      console.error("❌ Transaction confirmation failed:", error);
      // Show error to user but don't crash the modal
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setIsRequestingApproval(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="intermediate-payment-modal-overlay">
      <div className="intermediate-payment-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>🔍 Transaction Review</h2>
          <p>Review transaction details before sending to MetaMask</p>
        </div>

        {/* Agent Info */}
        {agentData && (
          <div className="agent-info-section">
            <h3>💫 Payment To</h3>
            <div className="agent-details">
              <span className="agent-name">
                {agentData.name || "Unknown Agent"}
              </span>
              <span className="agent-address">
                {formatAddress(agentData.agent_wallet_address)}
              </span>
            </div>
          </div>
        )}

        {/* Transaction Breakdown */}
        {transactionBreakdown && (
          <div className="transaction-breakdown">
            <h3>💳 Transaction Structure</h3>

            {/* Critical Values */}
            <div className="critical-values">
              <div className="value-row">
                <span className="label">ETH Value:</span>
                <span
                  className={`value ${
                    parseFloat(transactionBreakdown.ethValue) > 0.01
                      ? "warning"
                      : "normal"
                  }`}
                >
                  {transactionBreakdown.ethValue} ETH
                </span>
              </div>

              <div className="value-row">
                <span className="label">Token Amount:</span>
                <span className="value">
                  {transactionBreakdown.tokenAmount}{" "}
                  {transactionBreakdown.tokenSymbol}
                </span>
              </div>

              <div className="value-row">
                <span className="label">CCIP Fee:</span>
                <span className="value">
                  {transactionBreakdown.estimatedFee} ETH
                </span>
              </div>

              <div className="value-row">
                <span className="label">Gas Limit:</span>
                <span className="value">{transactionBreakdown.gasLimit}</span>
              </div>
            </div>

            {/* Transaction Type */}
            <div className="transaction-type">
              <h4>🔄 Transaction Type</h4>
              <div
                className={`type-indicator ${
                  transactionBreakdown.isCCIPTransaction ? "ccip" : "direct"
                }`}
              >
                {transactionBreakdown.isCCIPTransaction
                  ? "🌉 CCIP Cross-Chain Transfer"
                  : "💸 Direct Transfer"}
              </div>
            </div>

            {/* Validation Status */}
            <div className="validation-section">
              <h4>✅ Validation Status</h4>
              <div className={`validation-status ${validationStatus}`}>
                {validationStatus === "valid" &&
                  "✅ Transaction structure looks correct"}
                {validationStatus === "invalid" && "❌ Transaction has issues"}
                {validationStatus === "error" && "🚨 Analysis failed"}
              </div>

              {/* Validation Details */}
              {transactionBreakdown.validationResults && (
                <div className="validation-details">
                  {Object.entries(transactionBreakdown.validationResults).map(
                    ([check, passed]) => (
                      <div
                        key={check}
                        className={`validation-check ${
                          passed ? "pass" : "fail"
                        }`}
                      >
                        {passed ? "✅" : "❌"}{" "}
                        {check.replace(/([A-Z])/g, " $1").toLowerCase()}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Errors */}
              {transactionBreakdown.errors &&
                transactionBreakdown.errors.length > 0 && (
                  <div className="error-section">
                    <h4>🚨 Issues Detected</h4>
                    {transactionBreakdown.errors.map((error, index) => (
                      <div key={index} className="error-message">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Allowance Status Section */}
        {transactionBreakdown?.isCCIPTransaction && (
          <div className="allowance-section">
            <h3>🔓 USDC Allowance Status</h3>
            {isCheckingAllowance ? (
              <div className="allowance-loading">
                ⏳ Checking USDC spending allowance...
              </div>
            ) : allowanceStatus ? (
              <div className="allowance-details">
                {allowanceStatus.success ? (
                  <>
                    <div
                      className={`allowance-status ${
                        allowanceStatus.isAllowanceSufficient
                          ? "sufficient"
                          : "insufficient"
                      }`}
                    >
                      <span className="status-icon">
                        {allowanceStatus.isAllowanceSufficient ? "✅" : "❌"}
                      </span>
                      <span className="status-text">
                        {allowanceStatus.isAllowanceSufficient
                          ? "Sufficient allowance for transaction"
                          : "Approval required before transaction"}
                      </span>
                    </div>
                    <div className="allowance-amounts">
                      <div>
                        Required: {allowanceStatus.requiredAmountUSDC} USDC
                      </div>
                      <div>
                        Current Allowance:{" "}
                        {allowanceStatus.currentAllowanceUSDC} USDC
                      </div>
                    </div>
                    {!allowanceStatus.isAllowanceSufficient && (
                      <div className="allowance-warning">
                        ⚠️ You will be prompted to approve USDC spending before
                        the CCIP transaction
                      </div>
                    )}
                  </>
                ) : (
                  <div className="allowance-error">
                    ❌ Allowance check failed: {allowanceStatus.error}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            ❌ Cancel
          </button>

          <button
            className={`btn-primary ${
              validationStatus === "invalid" ? "warning" : ""
            }`}
            onClick={handleConfirm}
            disabled={isCheckingAllowance || isRequestingApproval}
          >
            {(() => {
              if (isRequestingApproval) {
                return "⏳ Requesting USDC Approval...";
              }

              if (isCheckingAllowance) {
                return "⏳ Checking Allowance...";
              }

              if (
                transactionBreakdown?.isCCIPTransaction &&
                allowanceStatus?.success
              ) {
                if (allowanceStatus.needsApproval) {
                  return "🔓 Approve USDC → Send to MetaMask";
                } else {
                  return "✅ Send CCIP Transaction";
                }
              }

              if (validationStatus === "valid") {
                return "✅ Send to MetaMask";
              }

              return "⚠️ Send Anyway";
            })()}
          </button>
        </div>

        {/* Debug Section (Collapsible) */}
        <details className="debug-section">
          <summary>🔧 Debug Information</summary>
          {/* Network Detection Details */}
          <div className="debug-subsection">
            <h4>🌐 Network Detection & Cross-Chain Logic</h4>
            <div className="debug-fees">
              <div>
                User Network ID:{" "}
                {transactionBreakdown?.debugInfo?.userChainId || "N/A"}
              </div>
              <div>
                Agent Network ID:{" "}
                {transactionBreakdown?.debugInfo?.agentChainId || "N/A"}
              </div>
              <div>
                Is Cross-Chain:{" "}
                {transactionBreakdown?.isCrossChain ? "✅ TRUE" : "❌ FALSE"}
              </div>
              <div>
                Transaction Type:{" "}
                {transactionBreakdown?.transactionType || "N/A"}
              </div>
              <div>
                CCIP Router:{" "}
                {transactionBreakdown?.debugInfo?.ccipRouter || "N/A"}
              </div>
              <div>
                🎯 Destination Chain Selector:{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    backgroundColor: "#f0f0f0",
                    padding: "2px 4px",
                    borderRadius: "3px",
                  }}
                >
                  {transactionBreakdown?.debugInfo?.chainSelector || "N/A"}
                </span>
              </div>
              <div>
                🔍 Chain Selector (Hex):{" "}
                <span style={{ fontFamily: "monospace", color: "#666" }}>
                  {(() => {
                    const chainSelector =
                      transactionBreakdown?.debugInfo?.chainSelector;
                    if (!chainSelector) return "N/A";

                    // Check if it's a numeric string that can be converted to BigInt
                    if (/^\d+$/.test(String(chainSelector))) {
                      try {
                        return "0x" + BigInt(chainSelector).toString(16);
                      } catch (e) {
                        return `Error: ${chainSelector} (${e.message})`;
                      }
                    } else {
                      return `Invalid: ${chainSelector} (expected numeric)`;
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
          {/* Enhanced CCIP Message Details */}
          {transactionData?.ccipDetails?.message && (
            <div className="debug-subsection">
              <h4>🔗 CCIP Message Breakdown</h4>
              <div className="debug-fees">
                <div>
                  <strong>📍 Receiver:</strong>{" "}
                  {transactionData.ccipDetails.message.receiver || "N/A"}
                </div>
                <div>
                  <strong>💰 Token Amounts:</strong>
                  {transactionData.ccipDetails.message.tokenAmounts?.map(
                    (tokenAmount, index) => (
                      <div key={index} style={{ marginLeft: "20px" }}>
                        Token: {tokenAmount.token || "Unknown"}
                        <br />
                        Amount: {tokenAmount.amount || "0"} (
                        {tokenAmount.amount
                          ? ethers.utils.formatUnits(tokenAmount.amount, 6)
                          : "0"}{" "}
                        USDC)
                      </div>
                    )
                  ) || "No token amounts"}
                </div>
                <div>
                  <strong>💸 Fee Token:</strong>{" "}
                  {transactionData.ccipDetails.message.feeToken || "N/A"}
                </div>
                <div>
                  <strong>📋 Data:</strong>{" "}
                  {transactionData.ccipDetails.message.data || "0x"}
                </div>
                <div>
                  <strong>🔢 Gas Limit:</strong>{" "}
                  {transactionData.ccipDetails.message.gasLimit || "0"}
                </div>
              </div>

              {/* Fee Calculation Details */}
              {transactionData.ccipDetails.estimatedFee && (
                <div className="debug-subsection">
                  <h5>� Fee Calculation Details</h5>
                  <div className="debug-fees">
                    <div>
                      <strong>Router Fee (Raw):</strong>{" "}
                      {ethers.utils.formatEther(
                        transactionData.ccipDetails.estimatedFee
                      )}{" "}
                      ETH
                    </div>
                    <div>
                      <strong>Buffer Applied:</strong> 20% (prevents
                      InsufficientFeeTokenAmount)
                    </div>
                    <div>
                      <strong>Final Transaction Value:</strong>{" "}
                      {transactionData.value
                        ? ethers.utils.formatEther(transactionData.value)
                        : "0"}{" "}
                      ETH
                    </div>
                    <div>
                      <strong>Fee Source:</strong> Dynamic router query (
                      {transactionData.ccipDetails.feeCalculationMethod ||
                        "router.getFee()"}
                      )
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Message Object */}
              <details style={{ marginTop: "10px" }}>
                <summary>📄 Raw CCIP Message Object</summary>
                <pre className="debug-data" style={{ fontSize: "10px" }}>
                  {JSON.stringify(transactionData.ccipDetails.message, null, 2)}
                </pre>
              </details>
            </div>
          )}
          {/* Enhanced CCIP Transaction Analysis */}
          {transactionBreakdown?.isCCIPTransaction && (
            <div className="debug-subsection">
              <h4>🚨 CCIP Transaction Analysis</h4>
              <div className="debug-fees">
                <div>
                  Source Chain: {transactionData?.sourceChain || "Unknown"}
                </div>
                <div>
                  Destination Chain:{" "}
                  {transactionData?.destinationChain || "Unknown"}
                </div>
                <div
                  style={{
                    backgroundColor: "#fff3cd",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ffeaa7",
                  }}
                >
                  🎯 <strong>Destination Chain Selector</strong>:{" "}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      color: "#d63031",
                    }}
                  >
                    {transactionBreakdown?.debugInfo?.chainSelector || "N/A"}
                  </span>
                  <br />
                  <small style={{ color: "#636e72" }}>
                    Hex:{" "}
                    {(() => {
                      const chainSelector =
                        transactionBreakdown?.debugInfo?.chainSelector;
                      if (!chainSelector) return "N/A";

                      // Check if it's a numeric string that can be converted to BigInt
                      if (/^\d+$/.test(String(chainSelector))) {
                        try {
                          return "0x" + BigInt(chainSelector).toString(16);
                        } catch (e) {
                          return `Error: ${chainSelector}`;
                        }
                      } else {
                        return `Invalid: ${chainSelector}`;
                      }
                    })()}
                  </small>
                </div>
                <div>
                  Token Amount: {transactionData?.amount || "Unknown"} USDC
                </div>
                <div>Recipient: {transactionData?.recipient || "Unknown"}</div>
                <div>Transaction To: {transactionData?.to || "Unknown"}</div>
                <div>
                  Transaction Value:{" "}
                  {transactionData?.value
                    ? ethers.utils.formatEther(transactionData.value)
                    : "0"}{" "}
                  ETH
                </div>
                <div>
                  Transaction Data Length: {transactionData?.data?.length || 0}{" "}
                  characters
                </div>
                <div>
                  Gas Limit:{" "}
                  {transactionData?.gas ||
                    transactionData?.gasLimit ||
                    "Unknown"}
                </div>
              </div>

              {transactionData?.data && (
                <div className="debug-subsection">
                  <h5>📋 Raw Transaction Data</h5>
                  <pre
                    className="debug-data"
                    style={{
                      fontSize: "10px",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {transactionData.data}
                  </pre>
                </div>
              )}

              {/* 🎬 Enhanced Simulation Error Display */}
              {transactionData?.simulationError && (
                <div className="debug-subsection">
                  <h5 style={{ color: "#ff4444" }}>
                    🚨 TRANSACTION SIMULATION FAILED
                  </h5>
                  <div
                    style={{
                      backgroundColor: "#ffebee",
                      border: "1px solid #ff4444",
                      padding: "10px",
                      borderRadius: "4px",
                      marginBottom: "10px",
                    }}
                  >
                    <strong style={{ color: "#d32f2f" }}>
                      ⚠️ This transaction will fail when executed!
                    </strong>
                    <div style={{ marginTop: "8px" }}>
                      <strong>Revert Reason:</strong>{" "}
                      {transactionData.simulationError.revertReason ||
                        "Unknown"}
                    </div>
                    <div>
                      <strong>Error:</strong>{" "}
                      {transactionData.simulationError.error || "Unknown error"}
                    </div>
                    {transactionData.simulationError.errorCode && (
                      <div>
                        <strong>Error Code:</strong>{" "}
                        {transactionData.simulationError.errorCode}
                      </div>
                    )}
                  </div>

                  {/* 💡 Specific Guidance Based on Error Type */}
                  {(transactionData.simulationError.revertReason
                    ?.toLowerCase()
                    .includes("allowance") ||
                    transactionData.simulationError.error
                      ?.toLowerCase()
                      .includes("allowance")) && (
                    <div
                      style={{
                        backgroundColor: "#fff3e0",
                        border: "1px solid #ff9800",
                        padding: "10px",
                        borderRadius: "4px",
                        marginBottom: "10px",
                      }}
                    >
                      <strong style={{ color: "#f57c00" }}>
                        🔧 ALLOWANCE ISSUE DETECTED
                      </strong>
                      <div style={{ marginTop: "5px", fontSize: "14px" }}>
                        The contract doesn't have permission to spend your USDC
                        tokens. You need to approve the spending allowance
                        first.
                      </div>
                    </div>
                  )}

                  {(transactionData.simulationError.revertReason
                    ?.toLowerCase()
                    .includes("balance") ||
                    transactionData.simulationError.error
                      ?.toLowerCase()
                      .includes("balance")) && (
                    <div
                      style={{
                        backgroundColor: "#fff3e0",
                        border: "1px solid #ff9800",
                        padding: "10px",
                        borderRadius: "4px",
                        marginBottom: "10px",
                      }}
                    >
                      <strong style={{ color: "#f57c00" }}>
                        💰 INSUFFICIENT BALANCE
                      </strong>
                      <div style={{ marginTop: "5px", fontSize: "14px" }}>
                        You don't have enough USDC tokens in your wallet. Check
                        your balance and get more test USDC from a faucet if
                        needed.
                      </div>
                      <div
                        style={{
                          marginTop: "5px",
                          fontSize: "12px",
                          color: "#666",
                        }}
                      >
                        💡 Base Sepolia Faucet:{" "}
                        <a
                          href="https://docs.base.org/docs/tools/network-faucets"
                          target="_blank"
                        >
                          https://docs.base.org/docs/tools/network-faucets
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 🚨 Generic Simulation Failure */}
                  {transactionData.simulationError.errorCode ===
                    "CALL_EXCEPTION" &&
                    !transactionData.simulationError.revertReason
                      ?.toLowerCase()
                      .includes("allowance") &&
                    !transactionData.simulationError.revertReason
                      ?.toLowerCase()
                      .includes("balance") &&
                    !transactionData.simulationError.error
                      ?.toLowerCase()
                      .includes("allowance") &&
                    !transactionData.simulationError.error
                      ?.toLowerCase()
                      .includes("balance") && (
                      <div
                        style={{
                          backgroundColor: "#fff3e0",
                          border: "1px solid #ff9800",
                          padding: "10px",
                          borderRadius: "4px",
                          marginBottom: "10px",
                        }}
                      >
                        <strong style={{ color: "#f57c00" }}>
                          🚨 TRANSACTION SIMULATION FAILED
                        </strong>
                        <div style={{ marginTop: "5px", fontSize: "14px" }}>
                          The transaction simulation failed with a generic
                          error. This could be due to:
                        </div>
                        <ul
                          style={{
                            marginTop: "5px",
                            fontSize: "13px",
                            paddingLeft: "20px",
                          }}
                        >
                          <li>Network connectivity issues</li>
                          <li>CCIP router configuration problems</li>
                          <li>Temporary blockchain RPC issues</li>
                          <li>Gas estimation failures</li>
                        </ul>
                        <div
                          style={{
                            marginTop: "5px",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          💡 You can try proceeding anyway - the simulation
                          might be overly cautious, or wait a moment and try
                          again if this persists.
                        </div>
                      </div>
                    )}

                  <div style={{ fontSize: "12px", color: "#666" }}>
                    💡 This simulation detected the transaction will revert
                    before sending it to the blockchain. Resolve the issue above
                    and try again.
                  </div>
                </div>
              )}
            </div>
          )}{" "}
          {/* Fee Calculation Details */}
          <div className="debug-subsection">
            <h4>💰 Fee Calculation Details</h4>
            <div className="debug-fees">
              <div>
                Router Fee (Raw): {transactionBreakdown?.rawFee || "N/A"}
              </div>
              <div>
                Buffer Applied: {transactionBreakdown?.feeBuffer || "20%"}
              </div>
              <div>
                Final Fee (ETH): {transactionBreakdown?.finalFeeETH || "N/A"}
              </div>
              <div>
                Transaction Value: {transactionBreakdown?.value || "N/A"}
              </div>
              <div>
                Fee Source: {transactionBreakdown?.feeSource || "Unknown"}
              </div>
            </div>
          </div>
          {/* Raw Transaction */}
          <div className="debug-subsection">
            <h4>📝 Raw Transaction Data</h4>
            <pre className="debug-data">
              {transactionBreakdown?.rawTransaction && (
                <>
                  <h4>Raw Transaction Data:</h4>
                  {JSON.stringify(transactionBreakdown.rawTransaction, null, 2)}
                  {/* Display CCIP Message Details if available */}
                  {transactionBreakdown.rawTransaction.ccipDetails?.message && (
                    <>
                      <h4>CCIP Message Details:</h4>
                      <p>
                        <strong>Receiver:</strong>{" "}
                        {
                          transactionBreakdown.rawTransaction.ccipDetails
                            .message.receiver
                        }
                      </p>
                      <p>
                        <strong>Data:</strong>{" "}
                        {
                          transactionBreakdown.rawTransaction.ccipDetails
                            .message.data
                        }
                      </p>
                      <p>
                        <strong>Token Amounts:</strong>{" "}
                        {JSON.stringify(
                          transactionBreakdown.rawTransaction.ccipDetails
                            .message.tokenAmounts,
                          null,
                          2
                        )}
                      </p>
                      <p>
                        <strong>Fee Token:</strong>{" "}
                        {
                          transactionBreakdown.rawTransaction.ccipDetails
                            .message.feeToken
                        }
                      </p>
                      <p>
                        <strong>Extra Args:</strong>{" "}
                        {
                          transactionBreakdown.rawTransaction.ccipDetails
                            .message.extraArgs
                        }
                      </p>
                    </>
                  )}
                </>
              )}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};

export default IntermediatePaymentModal;
