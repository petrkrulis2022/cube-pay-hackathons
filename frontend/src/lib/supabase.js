import { createClient } from "@supabase/supabase-js";

// Supabase configuration - using environment variables for web
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ncjbwzibnqrbrvicdmec.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamJ3emlibnFyYnJ2aWNkbWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODAxNTksImV4cCI6MjA2NjI1NjE1OX0.R7rx4jOPt9oOafcyJr3x-nEvGk5-e4DP7MbfCVOCHHI";

// Check if we have valid Supabase credentials
const hasValidCredentials =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "your_supabase_project_url_here" &&
  SUPABASE_ANON_KEY !== "your_supabase_anon_key_here" &&
  SUPABASE_URL.startsWith("https://");

// Create Supabase client
export const supabase = hasValidCredentials
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Test connection function
export const testConnection = async () => {
  try {
    if (!hasValidCredentials) {
      console.warn(
        "⚠️ Supabase environment variables not set or invalid, using demo mode"
      );
      return false;
    }

    if (!supabase) {
      console.warn("⚠️ Supabase client not initialized");
      return false;
    }

    console.log("🔗 Testing Supabase connection...");

    // Test actual connection to Supabase with minimal query
    const { data, error } = await supabase
      .from("deployed_objects")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection test failed:", error);
      console.error("Database connection issue details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // Check if it's a table missing error
      if (error.message && error.message.includes("does not exist")) {
        console.warn(
          "⚠️ Database table missing. Using fallback mode with mock data."
        );
        console.info(
          "📋 To fix this, create the required tables in your Supabase project:"
        );
        console.info("   1. Go to https://supabase.com/dashboard");
        console.info("   2. Open SQL Editor");
        console.info("   3. Run the scripts in the sql/ folder");
        return "table_missing";
      }
      return false;
    }

    console.log("✅ Supabase connection successful");

    // Test ar_qr_codes table specifically
    try {
      const { error: qrError } = await supabase
        .from("ar_qr_codes")
        .select("id")
        .limit(1);

      if (qrError) {
        console.warn(
          "⚠️ ar_qr_codes table missing - QR features will use local storage"
        );
        console.info(
          "💡 To enable full QR functionality, run sql/ar_qr_codes_schema.sql in Supabase"
        );
      } else {
        console.log("✅ ar_qr_codes table verified");
      }
    } catch (qrTestError) {
      console.warn(
        "⚠️ QR table test failed, continuing with basic functionality"
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Supabase connection test failed:", error);
    console.error("Full error details:", error);
    return false;
  }
};

// Get NeAR agents from Supabase
export const getNearAgentsFromSupabase = async (
  latitude,
  longitude,
  radius = 100
) => {
  try {
    if (!hasValidCredentials || !supabase) {
      console.warn("⚠️ No valid Supabase credentials, returning null");
      console.log(
        "🚨 SUPABASE DEBUG: hasValidCredentials =",
        hasValidCredentials
      );
      console.log("🚨 SUPABASE DEBUG: supabase client =", !!supabase);
      return null;
    }

    console.log(
      `🔍 Querying Supabase for NeAR agents near ${latitude.toFixed(
        6
      )}, ${longitude.toFixed(6)} within ${radius}m`
    );

    // First, let's try a simple query to see if we can get any data at all
    console.log("🔍 Step 1: Testing basic table access...");
    const { data: basicData, error: basicError } = await supabase
      .from("deployed_objects")
      .select("id, name, latitude, longitude")
      .limit(5);

    if (basicError) {
      console.error("❌ Basic query failed:", basicError);
      return null;
    }

    console.log(
      "✅ Basic query successful, found records:",
      basicData?.length || 0
    );
    if (basicData && basicData.length > 0) {
      console.log("📊 Sample records:", basicData);
    }

    // Now try the full query with enhanced field selector
    console.log(
      "🔍 Step 2: Full query with all fields including interaction_fee_amount..."
    );
    const { data, error } = await supabase
      .from("deployed_objects")
      .select(
        `
        id,
        name,
        description,
        latitude,
        longitude,
        altitude,
        object_type,
        agent_type,
        user_id,
        created_at,
        is_active,
        token_address,
        token_symbol,
        chain_id,
        deployer_wallet_address,
        payment_recipient_address,
        agent_wallet_address,
        text_chat,
        voice_chat,
        video_chat,
        interaction_fee,
        interaction_fee_amount,
        interaction_fee_usdfc,
        interaction_range,
        currency_type,
        network,
        deployment_network_name,
        deployment_chain_id,
        mcp_services,
        features
      `
      )
      .limit(100);

    if (error) {
      console.error("❌ Full query failed:", error);
      console.error("Query error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // If full query fails but basic query worked, try without problematic fields
      if (basicData && basicData.length > 0) {
        console.log("🔄 Retrying with basic fields only...");
        const { data: retryData, error: retryError } = await supabase
          .from("deployed_objects")
          .select(
            `
            id,
            name,
            description,
            latitude,
            longitude,
            altitude,
            object_type,
            agent_type,
            user_id,
            created_at
            `
          )
          .limit(100);

        if (retryError) {
          console.error("❌ Retry query also failed:", retryError);
          return null;
        } else {
          console.log("✅ Retry successful with basic fields");
          // Use the retry data and continue processing
          const processedData = retryData.map((obj) => ({
            ...obj,
            // Add default values for missing fields
            is_active: true,
            mcp_services: [],
            token_symbol: "USDT",
            chain_id: "2810",
            text_chat: true,
            voice_chat: false,
            video_chat: false,
            interaction_fee: 1.0,
            interaction_fee_amount: 1.0,
            features: [],
            deployment_network_name: "OP Sepolia",
            deployment_chain_id: 11155420,
            interaction_range: 50.0,
            currency_type: "USDC",
            network: "OP Sepolia",
            // Add wallet addresses for payment functionality
            wallet_address: "0x742d35Cc6634C0532925a3b8D32d8B2A83B6ddE2",
            payment_recipient_address:
              "0x742d35Cc6634C0532925a3b8D32d8B2A83B6ddE2",
            deployer_address: "0x742d35Cc6634C0532925a3b8D32d8B2A83B6ddE2",
            agent_wallet_address: "0x742d35Cc6634C0532925a3b8D32d8B2A83B6ddE2",
          }));

          console.log(
            `✅ Processed ${processedData.length} objects with defaults`
          );
          return processedData.length > 0 ? processedData : null;
        }
      }

      // Check if it's a table/column missing error
      if (
        error.message &&
        (error.message.includes("does not exist") ||
          error.message.includes("column") ||
          error.message.includes("relation"))
      ) {
        console.warn("📋 Database schema issue detected:");
        console.warn("   - Table or columns may be missing");
        console.warn(
          "   - Check that deployed_objects table has all required columns"
        );
        console.warn("   - Run database migration scripts if needed");
      }

      return null;
    }

    console.log(`✅ Raw data from Supabase: ${data?.length || 0} records`);

    if (!data || data.length === 0) {
      console.warn("⚠️ No agents found in database");
      console.info("💡 This could mean:");
      console.info("   - No agents deployed in this area");
      console.info("   - Database is empty");
      console.info("   - Location permissions not granted");
      console.info("   - Search radius too small");
      return [];
    }

    // Log first agent's fee data for debugging
    if (data && data.length > 0) {
      console.log("🐛 DEBUG: First agent fee data:");
      const firstAgent = data[0];
      console.log(
        "- interaction_fee_amount:",
        firstAgent.interaction_fee_amount,
        typeof firstAgent.interaction_fee_amount
      );
      console.log(
        "- interaction_fee:",
        firstAgent.interaction_fee,
        typeof firstAgent.interaction_fee
      );
      console.log(
        "- interaction_fee_usdfc:",
        firstAgent.interaction_fee_usdfc,
        typeof firstAgent.interaction_fee_usdfc
      );
      console.log("- Raw agent object:", JSON.stringify(firstAgent, null, 2));
    }

    // Calculate distances manually and filter by radius
    const objectsWithDistance =
      data
        ?.map((obj) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            obj.latitude,
            obj.longitude
          );
          return {
            ...obj,
            model_url:
              "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
            model_type: obj.object_type || "sphere",
            scale_x: 1.0,
            scale_y: 1.0,
            scale_z: 1.0,
            rotation_x: 0.0,
            rotation_y: 0.0,
            rotation_z: 0.0,
            visibility_radius: 50.0,
            updated_at: obj.created_at,
            distance_meters: distance * 1000, // Convert km to meters
          };
        })
        .filter((obj) => (obj.distance_meters || 0) <= radius)
        .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0)) ||
      [];

    console.log(
      `✅ Found ${objectsWithDistance.length} objects using direct query`
    );

    if (objectsWithDistance.length > 0) {
      console.log("📊 Sample agent data:", {
        id: objectsWithDistance[0].id,
        name: objectsWithDistance[0].name,
        distance: `${objectsWithDistance[0].distance_meters}m`,
        type: objectsWithDistance[0].agent_type,
      });
    }

    return objectsWithDistance;
  } catch (error) {
    console.error("❌ Error in getNearAgentsFromSupabase:", error);
    console.error("Full error context:", {
      error: error.message,
      stack: error.stack,
      location: `${latitude}, ${longitude}`,
      radius: radius,
    });
    return null;
  }
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Health check function
export const getConnectionStatus = async () => {
  const startTime = Date.now();

  try {
    if (!hasValidCredentials) {
      return {
        connected: false,
        error: "Supabase environment variables not configured or invalid",
      };
    }

    if (!supabase) {
      return {
        connected: false,
        error: "Supabase client not initialized",
      };
    }

    const { error } = await supabase
      .from("deployed_objects")
      .select("id")
      .limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      return {
        connected: false,
        error: error.message,
      };
    }

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message || "Connection failed",
    };
  }
};

// Export connection status for components to check
export const isSupabaseConfigured = hasValidCredentials;

// Debug function to check current configuration
export const debugSupabaseConfig = () => {
  console.log("🔧 Supabase Configuration Debug:");
  console.log("- Environment type: Browser (React Web App)");
  console.log("- VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("- Final SUPABASE_URL:", SUPABASE_URL);
  console.log("- URL configured:", !!SUPABASE_URL);
  console.log("- Key configured:", !!SUPABASE_ANON_KEY);
  console.log("- Valid credentials:", hasValidCredentials);
  console.log("- Client initialized:", !!supabase);

  if (hasValidCredentials) {
    console.log("- URL:", SUPABASE_URL);
    console.log("- Key length:", SUPABASE_ANON_KEY.length);
  }
};
