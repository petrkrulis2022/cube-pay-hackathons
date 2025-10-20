import { useState, useEffect } from "react";
import { testSupabaseConnection } from "../utils/supabase";

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<{
    loading: boolean;
    success: boolean;
    error?: string;
    data?: any;
  }>({ loading: true, success: false });

  useEffect(() => {
    const testConnection = async () => {
      const result = await testSupabaseConnection();
      setConnectionStatus({
        loading: false,
        success: result.success,
        error: result.error,
        data: result.data,
      });
    };

    testConnection();
  }, []);

  if (connectionStatus.loading) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <p className="text-yellow-800">🔄 Testing Supabase connection...</p>
      </div>
    );
  }

  if (!connectionStatus.success) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
        <p className="text-red-800">❌ Supabase connection failed:</p>
        <p className="text-red-600 text-sm mt-1">{connectionStatus.error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
      <p className="text-green-800">✅ Supabase connection successful!</p>
      <p className="text-green-600 text-sm mt-1">
        Database is accessible and ready to use.
      </p>
      {connectionStatus.data && (
        <details className="mt-2">
          <summary className="cursor-pointer text-green-700 text-sm">
            View test data
          </summary>
          <pre className="mt-1 text-xs bg-green-50 p-2 rounded overflow-auto">
            {JSON.stringify(connectionStatus.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
