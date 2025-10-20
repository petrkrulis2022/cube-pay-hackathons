/**
 * API Client for AR Cube Pay Frontend
 * Connects to Agentsphere Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Request failed',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Revolut API
  async createRevolutPayment(data: any) {
    return this.request('/api/revolut/create-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRevolutPaymentStatus(paymentId: string) {
    return this.request(`/api/revolut/payment/${paymentId}`);
  }

  async createVirtualCard(data: any) {
    return this.request('/api/revolut/create-virtual-card', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listVirtualCards() {
    return this.request('/api/revolut/virtual-cards');
  }

  async fundVirtualCard(cardId: string, amount: number) {
    return this.request(`/api/revolut/virtual-cards/${cardId}/fund`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Crypto API
  async createCryptoPayment(data: any) {
    return this.request('/api/crypto/create-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Agent Virtual Card API
  async createAgentCard(data: any) {
    return this.request('/api/agents/create-card', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payment Orders API
  async createPaymentOrder(data: any) {
    return this.request('/api/payment-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentOrder(orderId: string) {
    return this.request(`/api/payment-orders/${orderId}`);
  }

  async listPaymentOrders() {
    return this.request('/api/payment-orders');
  }

  // Webhooks API
  async registerWebhook(data: any) {
    return this.request('/api/webhooks/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Utility for fetching public key
  async getPublicKey() {
    return this.request('/api/public-key');
  }

  // Example for fetching AR Cube data
  async getArCubeData(cubeId: string) {
    return this.request(`/api/ar-cubes/${cubeId}`);
  }

  // Example for sending AR interaction
  async sendArInteraction(data: any) {
    return this.request('/api/ar-interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Example for fetching user profile
  async getUserProfile(userId: string) {
    return this.request(`/api/users/${userId}/profile`);
  }

  // Example for updating user profile
  async updateUserProfile(userId: string, data: any) {
    return this.request(`/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
