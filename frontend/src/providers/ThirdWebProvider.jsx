import React from "react";
import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  localWallet,
  embeddedWallet,
  smartWallet,
  en,
} from "@thirdweb-dev/react";
import { BlockDAGTestnet } from "../config/blockdag-chain";

// ThirdWeb configuration
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;
const secretKey = import.meta.env.VITE_THIRDWEB_SECRET_KEY;

// Supported wallets configuration
const supportedWallets = [
  metamaskWallet(),
  coinbaseWallet(),
  walletConnect(),
  embeddedWallet({
    auth: {
      options: ["email", "phone", "google", "discord", "telegram", "passkey"],
    },
  }),
  localWallet(),
];

// Smart wallet configuration for gasless transactions
const smartWalletConfig = smartWallet(embeddedWallet(), {
  factoryAddress: "0x...", // Replace with actual factory address
  gasless: true,
});

const ThirdWebProviderWrapper = ({ children }) => {
  console.log("🔧 ThirdWeb Provider initializing with:", {
    clientId: clientId ? "Set" : "Missing",
    secretKey: secretKey ? "Set" : "Missing",
    chain: "BlockDAG Testnet (1043)",
  });

  if (!clientId) {
    console.error(
      "❌ VITE_THIRDWEB_CLIENT_ID is not set in environment variables"
    );
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Configuration Error</h2>
          <p className="text-purple-200">
            ThirdWeb client ID is not configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThirdwebProvider
      clientId={clientId}
      secretKey={secretKey}
      activeChain={BlockDAGTestnet}
      supportedWallets={supportedWallets}
      locale={en()}
      dAppMeta={{
        name: "NeAR Viewer",
        description:
          "Augmented Reality viewer for NeAR agents with blockchain integration",
        logoUrl: "https://via.placeholder.com/200x200/8b5cf6/ffffff?text=NeAR",
        url: "https://NeAR-viewer.app",
        isDarkMode: true,
      }}
      authConfig={{
        authUrl: "/api/auth",
        domain: window.location.origin,
        loginRedirect: "/",
      }}
      sdkOptions={{
        gasless: {
          openzeppelin: {
            relayerUrl: "https://api.defender.openzeppelin.com/autotasks/...",
          },
        },
      }}
      storageInterface={{
        // Custom storage interface for better UX
        download: (url) => fetch(url).then((res) => res.blob()),
        upload: (file) => {
          // Implement file upload logic
          console.log("📁 File upload requested:", file);
          return Promise.resolve("https://example.com/uploaded-file");
        },
        uploadBatch: (files) => {
          // Implement batch upload logic
          console.log("📁 Batch upload requested:", files);
          return Promise.resolve(
            files.map(() => "https://example.com/uploaded-file")
          );
        },
      }}
    >
      {children}
    </ThirdwebProvider>
  );
};

export default ThirdWebProviderWrapper;
