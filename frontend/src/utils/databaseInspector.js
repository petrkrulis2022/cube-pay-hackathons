// Database inspection utility to check available tables and chains
import { supabase } from "../lib/supabase.js";

export const inspectDatabase = async () => {
  console.log("🔍 Inspecting Supabase database...");

  try {
    // Check if ar_qr_codes table exists and get its structure
    console.log("📋 Checking ar_qr_codes table...");
    const { data: qrCodesData, error: qrCodesError } = await supabase
      .from("ar_qr_codes")
      .select("*")
      .limit(5);

    if (qrCodesError) {
      console.error("❌ ar_qr_codes table error:", qrCodesError);
    } else {
      console.log("✅ ar_qr_codes table exists, sample data:", qrCodesData);
      if (qrCodesData.length > 0) {
        console.log("📊 ar_qr_codes columns:", Object.keys(qrCodesData[0]));
      }
    }

    // Check chains/networks in the database
    console.log("🔗 Checking for chain information...");
    const { data: chainData, error: chainError } = await supabase
      .from("ar_qr_codes")
      .select("chain_id, protocol, network_name")
      .not("chain_id", "is", null);

    if (chainError) {
      console.error("❌ Chain data error:", chainError);
    } else {
      console.log("🔗 Chain data found:", chainData);

      // Get unique chains
      const uniqueChains = [...new Set(chainData.map((item) => item.chain_id))];
      const uniqueProtocols = [
        ...new Set(chainData.map((item) => item.protocol)),
      ];
      const uniqueNetworks = [
        ...new Set(chainData.map((item) => item.network_name)),
      ];

      console.log("📊 Unique chain IDs:", uniqueChains);
      console.log("📊 Unique protocols:", uniqueProtocols);
      console.log("📊 Unique networks:", uniqueNetworks);
    }

    // Check if agents table exists
    console.log("👥 Checking agents table...");
    const { data: agentsData, error: agentsError } = await supabase
      .from("agents")
      .select("id, name, agent_type")
      .limit(3);

    if (agentsError) {
      console.error("❌ agents table error:", agentsError);
    } else {
      console.log("✅ agents table exists, sample data:", agentsData);
      if (agentsData.length > 0) {
        console.log("📊 agents columns:", Object.keys(agentsData[0]));
      }
    }

    // Try to get table schema information
    console.log("📋 Checking database schema...");
    const { data: schemaData, error: schemaError } = await supabase.rpc(
      "get_table_info",
      { table_name: "ar_qr_codes" }
    );

    if (schemaError) {
      console.log(
        "ℹ️ Custom schema function not available:",
        schemaError.message
      );
    } else {
      console.log("📋 Table schema:", schemaData);
    }

    return {
      success: true,
      qrCodesExists: !qrCodesError,
      agentsExists: !agentsError,
      qrCodesData,
      agentsData,
      chainData,
    };
  } catch (error) {
    console.error("💥 Database inspection failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to create missing tables
export const createMissingTables = async () => {
  console.log("🏗️ Attempting to create missing tables...");

  try {
    // Create ar_qr_codes table with multi-blockchain support
    const createQRCodesTable = `
      CREATE TABLE IF NOT EXISTS ar_qr_codes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        transaction_id TEXT NOT NULL UNIQUE,
        qr_code_data TEXT NOT NULL,
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0, 
        position_z REAL DEFAULT -2,
        scale REAL DEFAULT 1.5,
        status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'active', 'scanned', 'expired', 'paid', 'failed')),
        agent_id TEXT,
        amount INTEGER,
        recipient_address TEXT,
        contract_address TEXT DEFAULT '0xFAD0070d0388FB3F18F1100A5FFc67dF8834D9db',
        chain_id TEXT DEFAULT '1043',
        protocol TEXT DEFAULT 'ethereum' CHECK (protocol IN ('ethereum', 'solana', 'bitcoin', 'other')),
        network_name TEXT,
        token_address TEXT,
        token_symbol TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expiration_time TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
        metadata JSONB DEFAULT '{}'
      );
    `;

    const { error: createError } = await supabase.rpc("execute_sql", {
      sql: createQRCodesTable,
    });

    if (createError) {
      console.error("❌ Failed to create table:", createError);
      return false;
    }

    console.log("✅ Tables created successfully");
    return true;
  } catch (error) {
    console.error("💥 Table creation failed:", error);
    return false;
  }
};

// Function to get supported chains list
export const getSupportedChains = () => {
  return {
    ethereum: {
      1: { name: "Ethereum Mainnet", currency: "ETH" },
      1043: { name: "BlockDAG Primordial Testnet", currency: "USBDG+" },
      11155111: { name: "Ethereum Sepolia", currency: "ETH" },
      2648: { name: "Morph Holesky", currency: "ETH" },
    },
    solana: {
      "mainnet-beta": { name: "Solana Mainnet", currency: "SOL" },
      testnet: { name: "Solana Testnet", currency: "SOL" },
      devnet: { name: "Solana Devnet", currency: "SOL/USDC" },
    },
  };
};

// Export inspection results for console debugging
window.inspectDatabase = inspectDatabase;
window.createMissingTables = createMissingTables;
window.getSupportedChains = getSupportedChains;

export default {
  inspectDatabase,
  createMissingTables,
  getSupportedChains,
};
