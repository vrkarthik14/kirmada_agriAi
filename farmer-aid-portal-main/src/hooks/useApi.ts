import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignApi, contractApi, orderApi, healthApi, buyerRequestApi } from "@/services/api";
import { CampaignCreate, ContractCreate, OrderCreate, Order } from "@/types/api";

// Query Keys
export const QUERY_KEYS = {
  campaigns: ["campaigns"] as const,
  buyerRequests: ["buyer-requests"] as const,
  campaignById: (id: string) => ["campaigns", id] as const,
  campaignsByStatus: (status: string) => ["campaigns", "status", status] as const,
  contracts: ["contracts"] as const,
  contractById: (id: string) => ["contracts", id] as const,
  contractsByStatus: (status: string) => ["contracts", "status", status] as const,
  orders: ["orders"] as const,
  orderById: (id: string) => ["orders", id] as const,
  ordersByStatus: (status: string) => ["orders", "status", status] as const,
  health: ["health"] as const,
};

// Campaign Hooks
export const useCampaigns = () => {
  return useQuery({
    queryKey: QUERY_KEYS.campaigns,
    queryFn: campaignApi.getAll,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.campaignById(id),
    queryFn: () => campaignApi.getById(id),
    enabled: !!id,
  });
};

export const useCampaignsByStatus = (status: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.campaignsByStatus(status),
    queryFn: () => campaignApi.getByStatus(status),
    enabled: !!status,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (campaign: CampaignCreate) => campaignApi.create(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.campaigns });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, campaign }: { id: string; campaign: CampaignCreate }) =>
      campaignApi.update(id, campaign),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.campaigns });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.campaignById(id) });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.campaigns });
    },
  });
};

// Contract Hooks
export const useContracts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.contracts,
    queryFn: contractApi.getAll,
  });
};

export const useContract = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.contractById(id),
    queryFn: () => contractApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contract: ContractCreate) => contractApi.create(contract),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts });
    },
  });
};

// Order Hooks
export const useOrders = () => {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: orderApi.getAll,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.orderById(id),
    queryFn: () => orderApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (order: OrderCreate) => orderApi.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) =>
      orderApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderById(id) });
    },
  });
};

// Health Check Hook
export const useHealth = () => {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: healthApi.check,
    refetchInterval: 30000, // Check every 30 seconds
  });
}; 

// Buyer Requests Hook (from buyer backend)
export const useBuyerRequests = () => {
  return useQuery({
    queryKey: QUERY_KEYS.buyerRequests,
    queryFn: buyerRequestApi.getAll,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}; 