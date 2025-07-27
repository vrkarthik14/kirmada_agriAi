import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignApi, contractApi, orderApi, healthApi, bidsApi } from "@/services/api";
import { CampaignCreate, ContractCreate, OrderCreate, Order } from "@/types/api";

// Query Keys
export const QUERY_KEYS = {
  campaigns: ["campaigns"] as const,
  campaignById: (id: string) => ["campaigns", id] as const,
  campaignsByStatus: (status: string) => ["campaigns", "status", status] as const,
  contracts: ["contracts"] as const,
  contractById: (id: string) => ["contracts", id] as const,
  contractsByStatus: (status: string) => ["contracts", "status", status] as const,
  orders: ["orders"] as const,
  orderById: (id: string) => ["orders", id] as const,
  ordersByStatus: (status: string) => ["orders", "status", status] as const,
  bids: ["bids"] as const,
  bidsByCampaign: (campaignId: string) => ["bids", "campaign", campaignId] as const,
  bidById: (id: string) => ["bids", id] as const,
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
    mutationFn: orderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
};

// Bids Hooks
export const useBids = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bids,
    queryFn: bidsApi.getAll,
  });
};

export const useBidsByCampaign = (campaignId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bidsByCampaign(campaignId),
    queryFn: () => bidsApi.getByCampaignId(campaignId),
    enabled: !!campaignId,
  });
};

export const useBid = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bidById(id),
    queryFn: () => bidsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateBid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: bidsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bids });
    },
  });
};

export const useBidAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bidId, action }: { bidId: string; action: any }) => 
      bidsApi.handleAction(bidId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bids });
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