import React from "react";
import {
  getUSDCContractForChain,
  getNetworkInfo,
} from "../../services/evmNetworkService";
// TODO: Import helper components as needed

const AgentCard = ({ agent }) => {
  // Extract all payment, wallet, network, and bank data from agent
  const {
    name,
    description,
    agent_type,
    deployment_network_name,
    deployment_chain_id,
    deployer_address,
    deployed_at,
    location,
    ar_config,
    interaction_methods,
    mcp_server_interactions,
    wallet_config,
    payment_config,
    bank_account_details,
    performance_metrics,
    configuration_status,
  } = agent;

  // Helper function to display location properly
  const getLocationDisplay = (agent) => {
    if (agent.location?.address) {
      return agent.location.address;
    }
    if (agent.location?.latitude && agent.location?.longitude) {
      return `${agent.location.latitude.toFixed(
        4
      )}, ${agent.location.longitude.toFixed(4)}`;
    }
    return "Location not set";
  };

  // Helper function to get USDC contract address for the deployment network
  const getTokenContractDisplay = (agent) => {
    const chainId = agent.deployment_chain_id;
    const usdcContract = getUSDCContractForChain(chainId);

    if (usdcContract) {
      return `${usdcContract.substring(0, 6)}...${usdcContract.substring(38)}`;
    }
    return "Contract not found";
  };

  // Helper function to display agent wallet address (same as deployer for now)
  const getAgentWalletDisplay = (agent) => {
    // For now, agent wallet = deployer wallet (same address)
    const walletAddress =
      agent.deployer_address || agent.wallet_config?.agent_wallet?.address;

    if (walletAddress) {
      return `${walletAddress.substring(0, 6)}...${walletAddress.substring(
        38
      )}`;
    }
    return "Wallet not configured";
  };

  // Helper function to display configured payment methods
  const getPaymentMethodsDisplay = (agent) => {
    const paymentConfig = agent.payment_config || {};
    const configuredMethods = [];

    // Check which payment methods are enabled
    if (paymentConfig.crypto_qr_enabled) {
      configuredMethods.push("Crypto QR ✅");
    }
    if (paymentConfig.bank_virtual_card_enabled) {
      configuredMethods.push("Bank Card ✅");
    }
    if (paymentConfig.bank_qr_enabled) {
      configuredMethods.push("Bank QR ✅");
    }
    if (paymentConfig.voice_pay_enabled) {
      configuredMethods.push("Voice Pay ✅");
    }
    if (paymentConfig.sound_pay_enabled) {
      configuredMethods.push("Sound Pay ✅");
    }
    if (paymentConfig.onboard_education_enabled) {
      configuredMethods.push("Education ✅");
    }

    if (configuredMethods.length > 0) {
      return configuredMethods.join(", ");
    }

    return "No payment methods configured";
  };

  // Payment details with flat field fallback
  const feeAmount =
    payment_config?.interaction_fee_amount ??
    agent.interaction_fee_amount ??
    agent.fee_usdc ??
    agent.fee_usdt ??
    agent.interaction_fee;

  const feeToken =
    payment_config?.interaction_fee_token ||
    payment_config?.payment_token ||
    agent.interaction_fee_token ||
    agent.currency_type ||
    (agent.fee_usdc ? "USDC" : agent.fee_usdt ? "USDT" : "");

  const paymentMethods = payment_config?.payment_methods || {};
  const tokenContracts =
    payment_config?.token_contracts || agent.token_contracts || {};
  const networkInfo = payment_config?.network_info || {
    network_name: agent.deployment_network_name,
    chain_id: agent.deployment_chain_id,
  };

  // Wallets
  const agentWallet = wallet_config?.agent_wallet?.address || "N/A";
  const deployerWallet =
    wallet_config?.deployer_wallet?.address || deployer_address || "N/A";

  // Bank
  const bankConfigured = bank_account_details?.account_verified;
  const bankHolder = bank_account_details?.account_holder_name || "N/A";
  const bankName = bank_account_details?.bank_name || "N/A";
  const bankEncryption = bank_account_details?.encryption_status || "N/A";

  // Config status
  const isConfigured = configuration_status?.configuration_complete;

  // Payment methods display
  const enabledMethods = Object.entries(paymentMethods)
    .filter(([k, v]) => v)
    .map(([k]) => k);

  return (
    <div className={`agent-card${isConfigured ? " fully-configured" : ""}`}>
      <h3>{name}</h3>
      <div className="agent-description">{description}</div>
      <div>Type: {agent_type}</div>
      <div>
        Network: {deployment_network_name} (Chain {deployment_chain_id})
      </div>
      <div>Deployer: {deployerWallet}</div>
      <div>
        Deployed: {deployed_at ? new Date(deployed_at).toLocaleString() : "N/A"}
      </div>
      <div>Location: {getLocationDisplay(agent)}</div>
      <div>
        AR Config: Range {ar_config?.interaction_range}m, Visibility{" "}
        {ar_config?.visibility_range}m
      </div>
      <div>
        Fee:{" "}
        <b>
          {feeAmount} {feeToken}
        </b>
      </div>
      <div>USDC Contract: {getTokenContractDisplay(agent)}</div>
      <div>
        Network Info: {networkInfo.network_name} (Chain {networkInfo.chain_id})
      </div>
      <div>Agent Wallet: {getAgentWalletDisplay(agent)}</div>
      <div>Deployer Wallet: {deployerWallet}</div>
      <div>Payment Methods: {getPaymentMethodsDisplay(agent)}</div>
      <div>
        Bank: {bankName} ({bankHolder}){" "}
        {bankConfigured ? "✅ Verified" : "❌ Not Verified"} | Encryption:{" "}
        {bankEncryption}
      </div>
      <div>
        Performance: {performance_metrics?.interaction_count || 0} interactions,{" "}
        {performance_metrics?.total_revenue || 0} revenue
      </div>
      <div>Config Status: {isConfigured ? "✅ Complete" : "❌ Incomplete"}</div>
    </div>
  );
};

export default AgentCard;
