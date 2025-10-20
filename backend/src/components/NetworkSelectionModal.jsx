import React from "react";
import { SUPPORTED_EVM_NETWORKS } from "../config/evmNetworks.js";

const NetworkSelectionModal = ({
  currentNetwork,
  onNetworkSwitch,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="network-selection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Select Network</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="current-network-display">
            <h4>Current Network:</h4>
            <div
              className={`network-card ${
                currentNetwork?.isSupported === false
                  ? "unsupported"
                  : "supported"
              }`}
            >
              <div className="network-icon">
                {currentNetwork?.shortName?.charAt(0) || "U"}
              </div>
              <div className="network-info">
                <span className="network-name">
                  {currentNetwork?.name || "Unknown"}
                </span>
                <span className="network-id">
                  Chain ID: {currentNetwork?.chainId}
                </span>
              </div>
              {currentNetwork?.isSupported === false && (
                <span className="unsupported-badge">Unsupported</span>
              )}
            </div>
          </div>

          <div className="available-networks">
            <h4>Available Networks:</h4>
            <div className="networks-grid">
              {Object.values(SUPPORTED_EVM_NETWORKS).map((network) => (
                <button
                  key={network.chainId}
                  className={`network-option ${
                    currentNetwork?.chainId === network.chainId ? "current" : ""
                  }`}
                  onClick={() => onNetworkSwitch(network)}
                  disabled={currentNetwork?.chainId === network.chainId}
                >
                  <div className="network-icon">
                    {network.shortName.charAt(0)}
                  </div>
                  <div className="network-info">
                    <span className="network-name">{network.shortName}</span>
                    <span className="network-currency">
                      {network.nativeCurrency}
                    </span>
                  </div>
                  {currentNetwork?.chainId === network.chainId && (
                    <span className="current-badge">Current</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkSelectionModal;
