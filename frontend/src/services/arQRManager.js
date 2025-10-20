// AR QR Manager - Handles AR QR code persistence independent of database operations
// This ensures QR codes always appear in AR space regardless of backend failures

class ARQRManager {
  constructor() {
    this.activeQRs = new Map();
    this.qrHistory = [];
    this.maxQRsPerAgent = 3;
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes

    console.log("🚀 AR QR Manager initialized");
  }

  // Add QR to AR scene (always succeeds)
  addQR(qrId, qrData, position, options = {}) {
    try {
      const qrObject = {
        id: qrId,
        data: qrData,
        position: position || [0, 1, -2],
        size: options.size || 1.5,
        agentId: options.agentId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (options.ttl || this.defaultTTL),
        status: "active",
        scanned: false,
        dbSaveStatus: options.dbSaveStatus || "pending",
        metadata: options.metadata || {},
      };

      this.activeQRs.set(qrId, qrObject);

      console.log(`✅ AR QR added to manager: ${qrId}`, {
        position: qrObject.position,
        agentId: qrObject.agentId,
        expiresIn: Math.round((qrObject.expiresAt - Date.now()) / 1000) + "s",
      });

      // Schedule auto-cleanup
      this.scheduleCleanup(qrId, qrObject.expiresAt - Date.now());

      // Emit event for AR components to render
      this.emitQRAdded(qrObject);

      return qrObject;
    } catch (error) {
      console.error("Error adding QR to AR manager:", error);
      return null;
    }
  }

  // Remove QR from AR scene
  removeQR(qrId, reason = "manual") {
    const qrObject = this.activeQRs.get(qrId);
    if (!qrObject) {
      console.warn(`QR ${qrId} not found for removal`);
      return false;
    }

    // Move to history
    this.qrHistory.push({
      ...qrObject,
      removedAt: Date.now(),
      removeReason: reason,
    });

    // Keep history limited
    if (this.qrHistory.length > 50) {
      this.qrHistory.splice(0, 10);
    }

    this.activeQRs.delete(qrId);

    console.log(`🗑️ AR QR removed: ${qrId} (${reason})`);

    // Emit event for AR components
    this.emitQRRemoved(qrId, reason);

    return true;
  }

  // Mark QR as scanned
  scanQR(qrId) {
    const qrObject = this.activeQRs.get(qrId);
    if (!qrObject) {
      console.warn(`QR ${qrId} not found for scanning`);
      return null;
    }

    qrObject.scanned = true;
    qrObject.scannedAt = Date.now();
    qrObject.status = "scanned";

    console.log(`📱 AR QR scanned: ${qrId}`);

    // Emit scan event
    this.emitQRScanned(qrObject);

    // Auto-remove after scan (with delay)
    setTimeout(() => {
      this.removeQR(qrId, "scanned");
    }, 2000);

    return qrObject;
  }

  // Get all active QRs
  getActiveQRs() {
    return Array.from(this.activeQRs.values()).filter(
      (qr) => qr.status === "active" && qr.expiresAt > Date.now()
    );
  }

  // Get QRs for specific agent
  getQRsForAgent(agentId) {
    return this.getActiveQRs().filter((qr) => qr.agentId === agentId);
  }

  // Clean up expired QRs
  cleanupExpired() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [qrId, qrObject] of this.activeQRs.entries()) {
      if (qrObject.expiresAt <= now) {
        this.removeQR(qrId, "expired");
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired AR QRs`);
    }

    return cleanedCount;
  }

  // Schedule automatic cleanup
  scheduleCleanup(qrId, delayMs) {
    setTimeout(() => {
      if (this.activeQRs.has(qrId)) {
        this.removeQR(qrId, "expired");
      }
    }, delayMs);
  }

  // Update QR database status (background operation)
  updateQRDBStatus(qrId, status, dbData = {}) {
    const qrObject = this.activeQRs.get(qrId);
    if (qrObject) {
      qrObject.dbSaveStatus = status;
      qrObject.dbData = dbData;
      console.log(`📊 AR QR ${qrId} DB status: ${status}`);
    }
  }

  // Get QR statistics
  getStats() {
    const active = this.getActiveQRs().length;
    const total = this.activeQRs.size;
    const history = this.qrHistory.length;

    return {
      active,
      total,
      history,
      dbSaved: Array.from(this.activeQRs.values()).filter(
        (qr) => qr.dbSaveStatus === "saved"
      ).length,
      dbFailed: Array.from(this.activeQRs.values()).filter(
        (qr) => qr.dbSaveStatus === "failed"
      ).length,
    };
  }

  // Event emitters for AR components
  emitQRAdded(qrObject) {
    window.dispatchEvent(
      new CustomEvent("arQRAdded", {
        detail: qrObject,
      })
    );
  }

  emitQRRemoved(qrId, reason) {
    window.dispatchEvent(
      new CustomEvent("arQRRemoved", {
        detail: { qrId, reason },
      })
    );
  }

  emitQRScanned(qrObject) {
    window.dispatchEvent(
      new CustomEvent("arQRScanned", {
        detail: qrObject,
      })
    );
  }

  // Clear all QRs (for testing/reset)
  clearAll() {
    const count = this.activeQRs.size;
    this.activeQRs.clear();
    console.log(`🗑️ Cleared all ${count} AR QRs`);

    window.dispatchEvent(new CustomEvent("arQRCleared"));
  }

  // Debug information
  debug() {
    const stats = this.getStats();
    console.log("🔍 AR QR Manager Debug:", {
      ...stats,
      activeQRs: Array.from(this.activeQRs.entries()).map(([id, qr]) => ({
        id,
        agentId: qr.agentId,
        status: qr.status,
        dbStatus: qr.dbSaveStatus,
        expiresIn: Math.round((qr.expiresAt - Date.now()) / 1000) + "s",
      })),
    });
  }
}

// Create singleton instance
const arQRManager = new ARQRManager();

// Auto-cleanup every 30 seconds
setInterval(() => {
  arQRManager.cleanupExpired();
}, 30000);

export default arQRManager;
