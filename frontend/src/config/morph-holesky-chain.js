// Morph Holesky Testnet Configuration
export const MorphHoleskyTestnet = {
  chainId: 2810,
  name: "Morph Holesky",
  chain: "Morph",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpc: ["https://rpc-quicknode-holesky.morphl2.io"],
  faucets: [],
  explorers: [
    {
      name: "Morph Holesky Explorer",
      url: "https://explorer-holesky.morphl2.io",
      standard: "EIP3091",
    },
  ],
  infoURL: "https://morphl2.io",
  shortName: "morph-holesky",
  networkId: 2810,
  icon: {
    url: "https://via.placeholder.com/64x64/4ade80/ffffff?text=MH",
    width: 64,
    height: 64,
    format: "png",
  },
  testnet: true,
  slug: "morph-holesky-testnet",
};

// USDT Token Configuration for Morph Holesky
export const MorphUSDTToken = {
  address: "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98",
  name: "USDT",
  symbol: "USDT",
  decimals: 18, // This USDT contract on Morph Holesky uses 18 decimals (confirmed from wallet)
  chainId: 2810,
  logoURI: "https://via.placeholder.com/64x64/26a17b/ffffff?text=USDT",
};

// Contract addresses for Morph Holesky
export const MorphContractAddresses = {
  // USDT token contract
  USDT: "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98",

  // Future contract addresses can be added here
  AgentRegistry: "0x...", // Replace with actual contract address when deployed
  PaymentProcessor: "0x...", // Replace with actual contract address when deployed
};

// Network configuration helper
export const getMorphNetworkConfig = () => {
  return {
    chain: MorphHoleskyTestnet,
    tokens: {
      USDT: MorphUSDTToken,
    },
    contracts: MorphContractAddresses,
    features: {
      evm: true,
      metamaskSupport: true,
      eip681Support: true,
    },
  };
};

// Chain switching helper for Morph Holesky
export const switchToMorphHolesky = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      // Try to switch to Morph Holesky network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${MorphHoleskyTestnet.chainId.toString(16)}` }],
      });

      console.log("✅ Switched to Morph Holesky Testnet");
      return true;
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${MorphHoleskyTestnet.chainId.toString(16)}`,
                chainName: MorphHoleskyTestnet.name,
                nativeCurrency: MorphHoleskyTestnet.nativeCurrency,
                rpcUrls: MorphHoleskyTestnet.rpc,
                blockExplorerUrls: MorphHoleskyTestnet.explorers.map(
                  (e) => e.url
                ),
              },
            ],
          });

          console.log("✅ Added and switched to Morph Holesky Testnet");
          return true;
        } catch (addError) {
          console.error("❌ Failed to add Morph Holesky network:", addError);
          return false;
        }
      } else {
        console.error(
          "❌ Failed to switch to Morph Holesky network:",
          switchError
        );
        return false;
      }
    }
  } else {
    console.error("❌ MetaMask not detected");
    return false;
  }
};

// Generate EIP-681 payment URI for Morph Holesky USDT payments
export const generateMorphPaymentURI = (recipient, amount, memo = null) => {
  // Convert amount to smallest unit (This USDT contract uses 18 decimals)
  const amountInTokenUnits = Math.floor(
    amount * Math.pow(10, MorphUSDTToken.decimals)
  );

  // Use proper EIP-681 format for token transfers
  // For token transfers, the contract address should be first, not the recipient
  const uri = `ethereum:${MorphUSDTToken.address}@${MorphHoleskyTestnet.chainId}/transfer?address=${recipient}&uint256=${amountInTokenUnits}`;

  console.log("📱 Generated USDT token transfer URI:");
  console.log("- Format: EIP-681 token transfer");
  console.log("- Chain ID:", MorphHoleskyTestnet.chainId);
  console.log("- Token Contract:", MorphUSDTToken.address);
  console.log("- Recipient:", recipient);
  console.log("- Amount:", amount, "USDT");
  console.log("- Amount in token units:", amountInTokenUnits);
  console.log("- URI:", uri);

  return uri;
};

export default MorphHoleskyTestnet;
