// Network detection utility for multi-testnet support
export interface NetworkConfig {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string;
  explorer: string;
  tokenContracts?: {
    [symbol: string]: string;
  };
}

export const SUPPORTED_NETWORKS: { [chainId: number]: NetworkConfig } = {
  // Hedera Testnet
  296: {
    chainId: 296,
    name: "Hedera Testnet",
    nativeCurrency: {
      name: "HBAR",
      symbol: "HBAR",
      decimals: 18,
    },
    rpc: "https://testnet.hashio.io/api",
    explorer: "https://hashscan.io/testnet",
  },

  // BlockDAG Primordial Testnet
  1043: {
    chainId: 1043,
    name: "BlockDAG Primordial Testnet",
    nativeCurrency: {
      name: "BDAG",
      symbol: "BDAG",
      decimals: 18,
    },
    rpc: "https://test-rpc.primordial.bdagscan.com/",
    explorer: "https://explorer.primordial.bdagscan.com",
    tokenContracts: {
      BDAG: "0x6533fe2Ebb66CcE28FDdBA9663Fe433A308137e9",
    },
  },

  // Morph Holesky
  2810: {
    chainId: 2810,
    name: "Morph Holesky",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpc: "https://rpc-quicknode-holesky.morphl2.io",
    explorer: "https://explorer-holesky.morphl2.io",
    tokenContracts: {
      USDT: "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98",
    },
  },
};

export class NetworkDetector {
  public static async getCurrentNetwork(): Promise<NetworkConfig | null> {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        return null;
      }

      const chainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      });

      const chainId = parseInt(chainIdHex, 16);
      console.log("🌐 Detected network chain ID:", chainId);

      return SUPPORTED_NETWORKS[chainId] || null;
    } catch (error) {
      console.error("Error detecting network:", error);
      return null;
    }
  }

  public static async getCurrentChainId(): Promise<number | null> {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        return null;
      }

      const chainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      });

      return parseInt(chainIdHex, 16);
    } catch (error) {
      console.error("Error getting chain ID:", error);
      return null;
    }
  }

  public static getNetworkByChainId(chainId: number): NetworkConfig | null {
    return SUPPORTED_NETWORKS[chainId] || null;
  }

  public static isHederaTestnet(chainId: number): boolean {
    return chainId === 296;
  }

  public static isBlockDAGTestnet(chainId: number): boolean {
    return chainId === 1043;
  }

  public static isMorphHolesky(chainId: number): boolean {
    return chainId === 2810;
  }

  public static async getNativeBalance(address: string): Promise<number> {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      const balanceHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      // Convert from hex wei to native token (18 decimals)
      const balanceWei = BigInt(balanceHex);
      return Number(balanceWei) / Math.pow(10, 18);
    } catch (error) {
      console.error("Error fetching native balance:", error);
      throw error;
    }
  }
}

export default NetworkDetector;
