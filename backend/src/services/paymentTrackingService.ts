/**
 * Cross-Chain Payment Tracking for AgentSphere
 * Optional enhancement for tracking CCIP payments with message IDs
 */

export interface CrossChainPaymentRecord {
  id: string; // Unique payment ID
  timestamp: number;
  agentId: string;
  agentName: string;

  // Payment Details
  amount: number; // Agent fee amount
  ccipFee: number; // Cross-chain transfer fee
  totalCost: number; // Total cost to user

  // Network Information
  sourceNetwork: string;
  sourceChainId: number | string;
  destinationNetwork: string;
  destinationChainId: number | string;

  // Addresses
  fromAddress: string; // User wallet
  toAddress: string; // Agent wallet

  // Transaction Details
  paymentType: "same_chain" | "cross_chain";
  transactionHash?: string; // Source chain transaction
  ccipMessageId?: string; // CCIP message ID for cross-chain
  destinationTxHash?: string; // Destination chain transaction (when completed)

  // Status Tracking
  status: "pending" | "ccip_sent" | "ccip_delivered" | "completed" | "failed";
  errorMessage?: string;

  // Timing Information
  initiatedAt: number;
  ccipSentAt?: number;
  completedAt?: number;
  estimatedDeliveryTime?: number;

  // Metadata
  interactionType?: string;
  metadata?: Record<string, any>;
}

export interface PaymentTrackingService {
  /**
   * Record a new cross-chain payment
   */
  recordPayment(
    payment: Omit<CrossChainPaymentRecord, "id" | "timestamp" | "initiatedAt">
  ): Promise<string>;

  /**
   * Update payment status
   */
  updatePaymentStatus(
    paymentId: string,
    status: CrossChainPaymentRecord["status"],
    additionalData?: Partial<CrossChainPaymentRecord>
  ): Promise<void>;

  /**
   * Get payment by ID
   */
  getPayment(paymentId: string): Promise<CrossChainPaymentRecord | null>;

  /**
   * Get payments by user address
   */
  getPaymentsByUser(
    userAddress: string,
    limit?: number
  ): Promise<CrossChainPaymentRecord[]>;

  /**
   * Get payments by agent
   */
  getPaymentsByAgent(
    agentId: string,
    limit?: number
  ): Promise<CrossChainPaymentRecord[]>;

  /**
   * Get payment statistics
   */
  getPaymentStats(timeframe?: "day" | "week" | "month"): Promise<{
    totalPayments: number;
    totalVolume: number;
    crossChainPayments: number;
    sameChainPayments: number;
    averageFee: number;
    popularRoutes: Array<{
      source: string;
      destination: string;
      count: number;
    }>;
  }>;
}

/**
 * In-memory implementation for development/testing
 * In production, this would integrate with your database
 */
export class InMemoryPaymentTracker implements PaymentTrackingService {
  private payments: Map<string, CrossChainPaymentRecord> = new Map();
  private userPayments: Map<string, string[]> = new Map();
  private agentPayments: Map<string, string[]> = new Map();

  async recordPayment(
    payment: Omit<CrossChainPaymentRecord, "id" | "timestamp" | "initiatedAt">
  ): Promise<string> {
    const id = `payment_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const timestamp = Date.now();

    const fullPayment: CrossChainPaymentRecord = {
      ...payment,
      id,
      timestamp,
      initiatedAt: timestamp,
    };

    this.payments.set(id, fullPayment);

    // Index by user
    const userPayments = this.userPayments.get(payment.fromAddress) || [];
    userPayments.push(id);
    this.userPayments.set(payment.fromAddress, userPayments);

    // Index by agent
    const agentPayments = this.agentPayments.get(payment.agentId) || [];
    agentPayments.push(id);
    this.agentPayments.set(payment.agentId, agentPayments);

    console.log("📊 Payment recorded:", id, fullPayment);
    return id;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: CrossChainPaymentRecord["status"],
    additionalData?: Partial<CrossChainPaymentRecord>
  ): Promise<void> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const updatedPayment: CrossChainPaymentRecord = {
      ...payment,
      status,
      ...additionalData,
    };

    // Update timing based on status
    const now = Date.now();
    switch (status) {
      case "ccip_sent":
        updatedPayment.ccipSentAt = now;
        break;
      case "completed":
        updatedPayment.completedAt = now;
        break;
    }

    this.payments.set(paymentId, updatedPayment);
    console.log("📊 Payment status updated:", paymentId, status);
  }

  async getPayment(paymentId: string): Promise<CrossChainPaymentRecord | null> {
    return this.payments.get(paymentId) || null;
  }

  async getPaymentsByUser(
    userAddress: string,
    limit: number = 10
  ): Promise<CrossChainPaymentRecord[]> {
    const paymentIds = this.userPayments.get(userAddress) || [];
    return paymentIds
      .slice(-limit) // Get most recent
      .reverse()
      .map((id) => this.payments.get(id)!)
      .filter(Boolean);
  }

  async getPaymentsByAgent(
    agentId: string,
    limit: number = 10
  ): Promise<CrossChainPaymentRecord[]> {
    const paymentIds = this.agentPayments.get(agentId) || [];
    return paymentIds
      .slice(-limit) // Get most recent
      .reverse()
      .map((id) => this.payments.get(id)!)
      .filter(Boolean);
  }

  async getPaymentStats(timeframe: "day" | "week" | "month" = "day"): Promise<{
    totalPayments: number;
    totalVolume: number;
    crossChainPayments: number;
    sameChainPayments: number;
    averageFee: number;
    popularRoutes: Array<{
      source: string;
      destination: string;
      count: number;
    }>;
  }> {
    const now = Date.now();
    const timeframMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const cutoff = now - timeframMs;
    const recentPayments = Array.from(this.payments.values()).filter(
      (payment) => payment.timestamp >= cutoff
    );

    const totalPayments = recentPayments.length;
    const totalVolume = recentPayments.reduce(
      (sum, payment) => sum + payment.totalCost,
      0
    );
    const crossChainPayments = recentPayments.filter(
      (p) => p.paymentType === "cross_chain"
    ).length;
    const sameChainPayments = recentPayments.filter(
      (p) => p.paymentType === "same_chain"
    ).length;
    const averageFee =
      totalPayments > 0
        ? recentPayments.reduce((sum, payment) => sum + payment.ccipFee, 0) /
          totalPayments
        : 0;

    // Calculate popular routes
    const routeCount = new Map<string, number>();
    recentPayments.forEach((payment) => {
      if (payment.paymentType === "cross_chain") {
        const route = `${payment.sourceNetwork}->${payment.destinationNetwork}`;
        routeCount.set(route, (routeCount.get(route) || 0) + 1);
      }
    });

    const popularRoutes = Array.from(routeCount.entries())
      .map(([route, count]) => {
        const [source, destination] = route.split("->");
        return { source, destination, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalPayments,
      totalVolume,
      crossChainPayments,
      sameChainPayments,
      averageFee,
      popularRoutes,
    };
  }

  // Development helper methods
  getAllPayments(): CrossChainPaymentRecord[] {
    return Array.from(this.payments.values());
  }

  clearAll(): void {
    this.payments.clear();
    this.userPayments.clear();
    this.agentPayments.clear();
    console.log("📊 Payment tracking cleared");
  }
}

/**
 * Database-backed implementation (template for production)
 */
export class DatabasePaymentTracker implements PaymentTrackingService {
  // TODO: Implement with your database (Supabase, PostgreSQL, etc.)

  async recordPayment(
    payment: Omit<CrossChainPaymentRecord, "id" | "timestamp" | "initiatedAt">
  ): Promise<string> {
    // INSERT INTO cross_chain_payments ...
    throw new Error("Database implementation not yet available");
  }

  async updatePaymentStatus(
    paymentId: string,
    status: CrossChainPaymentRecord["status"],
    additionalData?: Partial<CrossChainPaymentRecord>
  ): Promise<void> {
    // UPDATE cross_chain_payments SET status = ? WHERE id = ?
    throw new Error("Database implementation not yet available");
  }

  async getPayment(paymentId: string): Promise<CrossChainPaymentRecord | null> {
    // SELECT * FROM cross_chain_payments WHERE id = ?
    throw new Error("Database implementation not yet available");
  }

  async getPaymentsByUser(
    userAddress: string,
    limit: number = 10
  ): Promise<CrossChainPaymentRecord[]> {
    // SELECT * FROM cross_chain_payments WHERE from_address = ? ORDER BY timestamp DESC LIMIT ?
    throw new Error("Database implementation not yet available");
  }

  async getPaymentsByAgent(
    agentId: string,
    limit: number = 10
  ): Promise<CrossChainPaymentRecord[]> {
    // SELECT * FROM cross_chain_payments WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?
    throw new Error("Database implementation not yet available");
  }

  async getPaymentStats(timeframe: "day" | "week" | "month" = "day"): Promise<{
    totalPayments: number;
    totalVolume: number;
    crossChainPayments: number;
    sameChainPayments: number;
    averageFee: number;
    popularRoutes: Array<{
      source: string;
      destination: string;
      count: number;
    }>;
  }> {
    // Complex SQL query with aggregations
    throw new Error("Database implementation not yet available");
  }
}

// Export singleton instances
export const paymentTracker = new InMemoryPaymentTracker();
export const databasePaymentTracker = new DatabasePaymentTracker();

export default paymentTracker;
