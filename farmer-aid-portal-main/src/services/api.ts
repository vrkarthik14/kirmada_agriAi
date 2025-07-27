import {
  Campaign,
  CampaignCreate,
  Contract,
  ContractCreate,
  Order,
  OrderCreate,
  ApiResponse,
  MessageResponse,
  ApiError,
} from "@/types/api";

// API Configuration
const API_BASE_URL = "http://localhost:8001";
const BUYER_API_BASE_URL = "http://localhost:8002"; // Buyer backend for buyer requests

// Generic API function with error handling
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Generic API function for buyer backend
async function buyerApiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BUYER_API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Buyer API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Campaign API functions
export const campaignApi = {
  // Get all campaigns
  getAll: (): Promise<ApiResponse<Campaign>> =>
    apiRequest("/api/campaigns/"),

  // Get campaign by ID
  getById: (id: string): Promise<Campaign> =>
    apiRequest(`/api/campaigns/${id}`),

  // Create new campaign
  create: (campaign: CampaignCreate): Promise<Campaign> =>
    apiRequest("/api/campaigns/", {
      method: "POST",
      body: JSON.stringify(campaign),
    }),

  // Update campaign
  update: (id: string, campaign: CampaignCreate): Promise<Campaign> =>
    apiRequest(`/api/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(campaign),
    }),

  // Delete campaign
  delete: (id: string): Promise<MessageResponse> =>
    apiRequest(`/api/campaigns/${id}`, {
      method: "DELETE",
    }),

  // Get campaigns by status
  getByStatus: (status: string): Promise<ApiResponse<Campaign>> =>
    apiRequest(`/api/campaigns/status/${status}`),
};

// Buyer Request API functions (from buyer backend)
export const buyerRequestApi = {
  // Get all buyer requests
  getAll: (): Promise<ApiResponse<Campaign>> =>
    buyerApiRequest("/api/campaigns/"),

  // Get buyer request by ID
  getById: (id: string): Promise<Campaign> =>
    buyerApiRequest(`/api/campaigns/${id}`),

  // Get buyer requests by status
  getByStatus: (status: string): Promise<ApiResponse<Campaign>> =>
    buyerApiRequest(`/api/campaigns/status/${status}`),
};

// Contract API functions
export const contractApi = {
  // Get all contracts
  getAll: (): Promise<ApiResponse<Contract>> =>
    apiRequest("/api/contracts/"),

  // Get contract by ID
  getById: (id: string): Promise<Contract> =>
    apiRequest(`/api/contracts/${id}`),

  // Create new contract
  create: (contract: ContractCreate): Promise<Contract> =>
    apiRequest("/api/contracts/", {
      method: "POST",
      body: JSON.stringify(contract),
    }),

  // Update contract
  update: (id: string, contract: ContractCreate): Promise<Contract> =>
    apiRequest(`/api/contracts/${id}`, {
      method: "PUT",
      body: JSON.stringify(contract),
    }),

  // Delete contract
  delete: (id: string): Promise<MessageResponse> =>
    apiRequest(`/api/contracts/${id}`, {
      method: "DELETE",
    }),

  // Get contracts by status
  getByStatus: (status: string): Promise<ApiResponse<Contract>> =>
    apiRequest(`/api/contracts/status/${status}`),
};

// Order API functions
export const orderApi = {
  // Get all orders
  getAll: (): Promise<ApiResponse<Order>> =>
    apiRequest("/api/orders/"),

  // Get order by ID
  getById: (id: string): Promise<Order> =>
    apiRequest(`/api/orders/${id}`),

  // Create new order
  create: (order: OrderCreate): Promise<Order> =>
    apiRequest("/api/orders/", {
      method: "POST",
      body: JSON.stringify(order),
    }),

  // Update order
  update: (id: string, order: OrderCreate): Promise<Order> =>
    apiRequest(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    }),

  // Delete order
  delete: (id: string): Promise<MessageResponse> =>
    apiRequest(`/api/orders/${id}`, {
      method: "DELETE",
    }),

  // Get orders by status
  getByStatus: (status: string): Promise<ApiResponse<Order>> =>
    apiRequest(`/api/orders/status/${status}`),

  // Update order status only
  updateStatus: (id: string, status: Order["status"]): Promise<Order> =>
    apiRequest(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// Health check
export const healthApi = {
  check: (): Promise<{ status: string; database: string }> =>
    apiRequest("/health"),
};

// Debug API (for development)
export const debugApi = {
  getDatabase: (): Promise<any> =>
    apiRequest("/debug/database"),
}; 