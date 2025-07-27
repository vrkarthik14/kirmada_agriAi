// API Response Types
export interface ApiResponse<T> {
  data: T[];
  count: number;
  success: boolean;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

// Campaign Types
export interface Campaign {
  id?: string;
  title: string;
  crop: string;
  cropType: string;
  location: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  estimatedYield: string;
  minimumQuotation: string;
  currentBid: string;
  totalBids: number;
  userType?: string; // Added to identify buyer vs farmer campaigns
  userId?: string; // Added to identify campaign creator
  notes?: string; // Added for additional campaign details
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignCreate {
  title: string;
  crop: string;
  cropType: string;
  location: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  estimatedYield: string;
  minimumQuotation: string;
  currentBid: string;
  totalBids: number;
}

// Contract Types
export interface Contract {
  id?: string;
  title: string;
  crop: string;
  cropType: string;
  location: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  estimatedYield: string;
  minimumQuotation: string;
  currentBid: string;
  agreedPrice?: string;
  totalBids: number;
  farmerName?: string;
  buyerName?: string;
  currentStage?: string;
  qualityGrade?: string;
  deliveryTerms?: string;
  contractNotes?: string;
  farmerId?: string;
  buyerId?: string;
  originalBidId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractCreate {
  title: string;
  crop: string;
  cropType: string;
  location: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  estimatedYield: string;
  minimumQuotation: string;
  currentBid: string;
  totalBids: number;
}

// Order Types
export interface Order {
  id?: string;
  product: string;
  quantity: string;
  supplier: string;
  orderDate: string;
  deliveryDate: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  amount: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderCreate {
  product: string;
  quantity: string;
  supplier: string;
  orderDate: string;
  deliveryDate: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  amount: string;
}

// API Error Type
export interface ApiError {
  detail: string;
} 