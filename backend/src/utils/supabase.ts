import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("deployed_objects")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase connection error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Supabase connection successful!");
    console.log("Sample data:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Supabase connection failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Database types (based on your migrations)
export interface DeployedObject {
  id: string;
  user_id: string;
  object_type: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  created_at: string;
  trailing_agent?: boolean;
  interaction_range?: number;
  ar_notifications?: boolean;
  location_type?: string;
  currency_type?: string;
  network?: string;
}
