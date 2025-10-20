import React from "react";
import { SUPPORTED_EVM_NETWORKS } from "../config/evmNetworks.js";

const UnsupportedNetworkModal = ({
  currentNetwork,
  onNetworkSwitch,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="network-warning-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>⚠️ Unsupported Network</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <p>
            You're currently connected to{" "}
            <strong>{currentNetwork?.name}</strong>, which is not supported by
            AgentSphere.
          </p>
          <p>
            Please switch to one of our supported networks to deploy and manage
            agents:
          </p>

          <div className="supported-networks-grid">
            {Object.values(SUPPORTED_EVM_NETWORKS).map((network) => (
              <button
                key={network.chainId}
                className="network-switch-button"
                onClick={() => onNetworkSwitch(network)}
              >
                <div className="network-icon">
                  {network.shortName.charAt(0)}
                </div>
                <span>{network.shortName}</span>
                <small>{network.symbol}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsupportedNetworkModal;
