import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  testConnection,
  debugSupabaseConfig,
  isSupabaseConfigured,
  getConnectionStatus,
} from "../lib/supabase";

export const DatabaseStatusComponent = ({ onRefresh }) => {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    error: null,
    details: null,
  });

  const checkDatabaseStatus = async () => {
    setStatus((prev) => ({ ...prev, loading: true }));

    try {
      // Debug configuration
      debugSupabaseConfig();

      // Test connection
      const connectionResult = await testConnection();
      const detailedStatus = await getConnectionStatus();

      setStatus({
        loading: false,
        connected: connectionResult === true,
        error: connectionResult === false ? "Connection failed" : null,
        details: {
          configured: isSupabaseConfigured,
          connectionResult,
          detailedStatus,
          tables: {
            deployed_objects: connectionResult === true,
            ar_qr_codes: connectionResult !== "table_missing",
          },
        },
      });
    } catch (error) {
      setStatus({
        loading: false,
        connected: false,
        error: error.message,
        details: null,
      });
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const handleRefresh = async () => {
    await checkDatabaseStatus();
    if (onRefresh) onRefresh();
  };

  if (status.loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            Checking Database...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.connected ? (
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
          ) : (
            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
          )}
          Database Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.connected ? (
          <Alert>
            <AlertDescription>
              ✅ Database connection successful
              {status.details?.tables?.deployed_objects && (
                <div className="mt-2">
                  <div className="text-sm text-green-600">
                    ✅ Agent data available
                  </div>
                  {!status.details?.tables?.ar_qr_codes && (
                    <div className="text-sm text-yellow-600">
                      ⚠️ QR codes table missing (using local storage)
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              ❌ Database connection failed
              {status.error && (
                <div className="mt-2 text-sm">Error: {status.error}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!status.connected && (
          <div className="space-y-2 text-sm">
            <div className="font-medium">Quick Fixes:</div>
            <div className="space-y-1 text-gray-600">
              <div>• Check internet connection</div>
              <div>• Verify Supabase project is running</div>
              <div>• Ensure environment variables are set</div>
              <div>• Run database migration scripts</div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Refresh Status
          </Button>

          {status.details?.configured && (
            <div className="text-xs text-gray-500">
              Configuration: ✅ Environment variables loaded
            </div>
          )}
        </div>

        {!status.connected && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">
              Using Fallback Mode
            </div>
            <div className="text-xs text-blue-600 mt-1">
              The app will work with mock data while database issues are
              resolved.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseStatusComponent;
