import { supabase } from "../lib/supabase";

// Local storage for QR codes when Supabase is unavailable
let localQRCodes = [];

// Create local QR code (fallback when Supabase is unavailable)
const createLocalQRCode = (qrCodeData) => {
  const localQR = {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    transaction_id: qrCodeData.transactionId,
    qr_code_data: qrCodeData.data,
    position_x: qrCodeData.position?.[0] || 0,
    position_y: qrCodeData.position?.[1] || 0,
    position_z: qrCodeData.position?.[2] || -2,
    scale: qrCodeData.size || 1.5,
    status: QR_CODE_STATUS.ACTIVE,
    agent_id: qrCodeData.agentId,
    expiration_time: new Date(Date.now() + (qrCodeData.ttl || 300000)),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localQRCodes.push(localQR);
  console.log("Created local AR QR code:", localQR);
  return localQR;
};

// QR Code data structure for Supabase
export const QR_CODE_STATUS = {
  GENERATED: "generated",
  ACTIVE: "active",
  SCANNED: "scanned",
  EXPIRED: "expired",
  PAID: "paid",
};

// Create QR code entry in Supabase with enhanced error handling
export const createQRCode = async (qrCodeData) => {
  // ALWAYS create local QR code first for immediate AR display
  const localQR = createLocalQRCode(qrCodeData);
  console.log("✅ AR QR Code created locally (always visible):", localQR);

  try {
    // Try to save to Supabase in background (non-blocking)
    if (!supabase) {
      console.warn("No Supabase connection, AR QR remains local only");
      return localQR;
    }

    console.log("🔄 Attempting to save AR QR to Supabase...");
    const { data, error } = await supabase
      .from("ar_qr_codes")
      .insert([
        {
          transaction_id: qrCodeData.transactionId,
          qr_code_data: qrCodeData.data,
          position_x: qrCodeData.position?.[0] || 0,
          position_y: qrCodeData.position?.[1] || 0,
          position_z: qrCodeData.position?.[2] || -2,
          scale: qrCodeData.size || 1.5,
          status: QR_CODE_STATUS.ACTIVE,
          agent_id: qrCodeData.agentId,
          expiration_time: new Date(Date.now() + (qrCodeData.ttl || 300000)), // 5 min default
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn(
        "Supabase save failed, but AR QR remains active locally:",
        error
      );
      // Update local QR with note about DB failure
      localQR.dbSaveStatus = "failed";
      localQR.dbError = error.message;
      return localQR;
    }

    console.log("✅ AR QR saved to Supabase successfully:", data);
    // Update local QR with Supabase ID
    localQR.id = data.id;
    localQR.dbSaveStatus = "saved";
    return localQR;
  } catch (error) {
    console.warn("AR QR Supabase save error (QR still active locally):", error);
    localQR.dbSaveStatus = "error";
    localQR.dbError = error.message;
    return localQR;
  }
};

// Get active QR codes near user location
export const getActiveQRCodes = async (userLocation, radiusMeters = 100) => {
  try {
    // If no Supabase connection, return local QR codes
    if (!supabase) {
      console.warn("No Supabase connection, returning local QR codes");
      return getLocalActiveQRCodes(userLocation, radiusMeters);
    }

    const { data, error } = await supabase
      .from("ar_qr_codes")
      .select(
        `
        *,
        agent:agents(id, name, agent_type)
      `
      )
      .eq("status", QR_CODE_STATUS.ACTIVE)
      .gt("expiration_time", new Date().toISOString());

    if (error) {
      console.warn("Supabase error, falling back to local QR codes:", error);
      return getLocalActiveQRCodes(userLocation, radiusMeters);
    }

    // Filter by location if provided
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      return (data || []).filter((qr) => {
        if (!qr.latitude || !qr.longitude) return true; // Include QRs without location

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          qr.latitude,
          qr.longitude
        );
        return distance <= radiusMeters;
      });
    }

    return data || [];
  } catch (error) {
    console.warn(
      "Error fetching QR codes from Supabase, using local fallback:",
      error
    );
    return getLocalActiveQRCodes(userLocation, radiusMeters);
  }
};

// Get local active QR codes (fallback)
const getLocalActiveQRCodes = (userLocation, radiusMeters = 100) => {
  const now = new Date();
  return localQRCodes.filter((qr) => {
    // Check if not expired
    if (new Date(qr.expiration_time) <= now) {
      return false;
    }

    // Check if active status
    if (qr.status !== QR_CODE_STATUS.ACTIVE) {
      return false;
    }

    return true;
  });
};

// Update QR code status
export const updateQRCodeStatus = async (
  qrCodeId,
  status,
  additionalData = {}
) => {
  try {
    // Handle local QR codes
    if (qrCodeId.startsWith("local_")) {
      const qrIndex = localQRCodes.findIndex((qr) => qr.id === qrCodeId);
      if (qrIndex !== -1) {
        localQRCodes[qrIndex] = {
          ...localQRCodes[qrIndex],
          status,
          updated_at: new Date().toISOString(),
          ...additionalData,
        };

        if (status === QR_CODE_STATUS.SCANNED) {
          localQRCodes[qrIndex].scanned_at = new Date().toISOString();
        }

        console.log("Updated local QR code status:", localQRCodes[qrIndex]);
        return localQRCodes[qrIndex];
      }
      return null;
    }

    // If no Supabase connection, skip update
    if (!supabase) {
      console.warn("No Supabase connection, cannot update QR code status");
      return null;
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    if (status === QR_CODE_STATUS.SCANNED) {
      updateData.scanned_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("ar_qr_codes")
      .update(updateData)
      .eq("id", qrCodeId)
      .select()
      .single();

    if (error) {
      console.warn("Error updating QR code status in Supabase:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.warn("Error updating QR code status:", error);
    return null;
  }
};

// Generate payment QR code data (EIP-681 format)
export const generatePaymentQRData = (paymentInfo) => {
  const { amount, recipient, contractAddress, chainId } = paymentInfo;

  // Convert amount to integer (no decimals for USBDG+)
  const integerAmount = Math.floor(Number(amount));

  // EIP-681 format for token transfer
  const qrData = `ethereum:${contractAddress}@${chainId}/transfer?address=${recipient}&uint256=${integerAmount}`;

  return qrData;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Create optimal AR positions for QR codes
export const generateARPosition = (agentPosition, userPosition, index = 0) => {
  // Enhanced 3D positioning system for better visibility from multiple angles
  console.log(
    `🎯 Generating AR position ${index} for agent at:`,
    agentPosition
  );

  // Create multiple positioning strategies based on index
  const strategies = [
    // Strategy 0: Forward and slightly right
    {
      distance: 2.5,
      horizontalAngle: 15 * (Math.PI / 180), // 15 degrees right
      height: 1.2,
      description: "Forward-right",
    },
    // Strategy 1: Forward and slightly left
    {
      distance: 2.8,
      horizontalAngle: -15 * (Math.PI / 180), // 15 degrees left
      height: 0.8,
      description: "Forward-left",
    },
    // Strategy 2: Closer and center
    {
      distance: 1.8,
      horizontalAngle: 0,
      height: 1.5,
      description: "Center-close",
    },
    // Strategy 3: Right side
    {
      distance: 2.2,
      horizontalAngle: 45 * (Math.PI / 180), // 45 degrees right
      height: 1.0,
      description: "Right-side",
    },
    // Strategy 4: Left side
    {
      distance: 2.2,
      horizontalAngle: -45 * (Math.PI / 180), // 45 degrees left
      height: 1.3,
      description: "Left-side",
    },
    // Strategy 5: Farther back center
    {
      distance: 3.5,
      horizontalAngle: 0,
      height: 1.1,
      description: "Back-center",
    },
    // Strategy 6: Diagonal forward-right
    {
      distance: 2.0,
      horizontalAngle: 30 * (Math.PI / 180),
      height: 0.9,
      description: "Diagonal-right",
    },
    // Strategy 7: Diagonal forward-left
    {
      distance: 2.0,
      horizontalAngle: -30 * (Math.PI / 180),
      height: 1.4,
      description: "Diagonal-left",
    },
  ];

  // Select strategy based on index, cycling through available strategies
  const strategy = strategies[index % strategies.length];

  // Calculate 3D position using the selected strategy
  const x = Math.sin(strategy.horizontalAngle) * strategy.distance;
  const y = strategy.height;
  const z = -strategy.distance * Math.cos(strategy.horizontalAngle);

  console.log(
    `📍 AR Position ${index} (${strategy.description}): [${x.toFixed(
      2
    )}, ${y.toFixed(2)}, ${z.toFixed(2)}]`
  );

  return [x, y, z];
};

// Clean up expired QR codes
export const cleanupExpiredQRCodes = async () => {
  try {
    // Clean up local QR codes
    const now = new Date();
    const beforeCount = localQRCodes.length;
    localQRCodes = localQRCodes.filter(
      (qr) => new Date(qr.expiration_time) > now
    );
    const localCleaned = beforeCount - localQRCodes.length;

    if (localCleaned > 0) {
      console.log(`Cleaned up ${localCleaned} expired local QR codes`);
    }

    // If no Supabase connection, return local cleanup count
    if (!supabase) {
      return localCleaned;
    }

    const { data, error } = await supabase
      .from("ar_qr_codes")
      .update({ status: QR_CODE_STATUS.EXPIRED })
      .lt("expiration_time", new Date().toISOString())
      .in("status", [QR_CODE_STATUS.GENERATED, QR_CODE_STATUS.ACTIVE]);

    if (error) {
      console.warn("Error cleaning up expired QR codes in Supabase:", error);
      return localCleaned;
    }

    return (data?.length || 0) + localCleaned;
  } catch (error) {
    console.warn("Error cleaning up expired QR codes:", error);
    return 0;
  }
};

export default {
  createQRCode,
  getActiveQRCodes,
  updateQRCodeStatus,
  cleanupExpiredQRCodes,
  generatePaymentQRData,
  generateARPosition,
  QR_CODE_STATUS,
};
