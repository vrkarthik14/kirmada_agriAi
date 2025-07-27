import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, X, RefreshCw, AlertTriangle, MessageCircle } from "lucide-react";
import { CounterOfferDialog } from "./CounterOfferDialog";

interface StatusTrackerProps {
  campaignId: string;
  campaignTitle: string;
  quantity?: string;
  onStatusUpdate?: () => void;
}

interface BidStatus {
  id: string;
  bidderName: string;
  bidderType: "farmer" | "buyer";
  status: "pending" | "accepted" | "rejected" | "counter_offered";
  bidAmount: string;
  actionNotes?: string;
  rejectedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const StatusTracker = ({ campaignId, campaignTitle, quantity, onStatusUpdate }: StatusTrackerProps) => {
  const [bidStatuses, setBidStatuses] = useState<BidStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("Awaiting farmer bids");

  useEffect(() => {
    if (campaignId) {
      fetchBidStatuses();
      // Auto-refresh every 2 seconds for real-time updates
      const interval = setInterval(fetchBidStatuses, 2000);
      return () => clearInterval(interval);
    }
  }, [campaignId]);

  const fetchBidStatuses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8002/api/bids/?campaign_id=${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch bid statuses");
      
      const result = await response.json();
      const bids = result.data || [];
      setBidStatuses(bids);
      
      // Calculate current status
      calculateCurrentStatus(bids);
    } catch (error) {
      console.error("Error fetching bid statuses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCurrentStatus = (bids: BidStatus[]) => {
    if (bids.length === 0) {
      setCurrentStatus("Awaiting farmer bids");
      return;
    }

    const farmerBids = bids.filter(bid => bid.bidderType === "farmer");
    const buyerCounters = bids.filter(bid => bid.bidderType === "buyer");
    
    // Check for accepted bids
    const acceptedBids = bids.filter(bid => bid.status === "accepted");
    if (acceptedBids.length > 0) {
      setCurrentStatus("✅ Deal finalized");
      return;
    }

    // Check for farmer rejections - look for buyer counter offers rejected by farmer
    const rejectedByFarmer = bids.filter(bid => 
      bid.status === "rejected" && 
      (bid.rejectedBy === "farmer" || bid.actionNotes?.includes("rejected by farmer"))
    );
    
    if (rejectedByFarmer.length > 0) {
      setCurrentStatus("❌ Rejected by farmer");
      return;
    }

    // Check for pending farmer bids (awaiting buyer response)
    const pendingFarmerBids = farmerBids.filter(bid => bid.status === "pending");
    if (pendingFarmerBids.length > 0) {
      setCurrentStatus(`💰 ${pendingFarmerBids.length} farmer bid(s) awaiting your response`);
      return;
    }

    // Check for counter offers from buyer (awaiting farmer response)
    const buyerCounterOffers = buyerCounters.filter(bid => bid.status === "counter_offered");
    if (buyerCounterOffers.length > 0) {
      const latestCounter = buyerCounterOffers[buyerCounterOffers.length - 1];
      setCurrentStatus(`💬 Counter offer sent (${latestCounter.bidAmount}) - Awaiting farmer response`);
      return;
    }

    // Default status
    setCurrentStatus("Awaiting farmer bids");
  };

  const getStatusColor = (status: string) => {
    if (status.includes("✅")) return "bg-green-100 text-green-800 border-green-200";
    if (status.includes("❌")) return "bg-red-100 text-red-800 border-red-200";
    if (status.includes("💬")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (status.includes("💰")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    if (status.includes("✅")) return <CheckCircle className="h-4 w-4" />;
    if (status.includes("❌")) return <AlertTriangle className="h-4 w-4" />;
    if (status.includes("💬")) return <MessageCircle className="h-4 w-4" />;
    if (status.includes("💰")) return <Clock className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const canReinitiateBid = () => {
    return currentStatus.includes("❌ Rejected by farmer");
  };

  const getLatestRejectedBid = () => {
    const rejectedBids = bidStatuses.filter(bid => 
      bid.status === "rejected" && 
      (bid.rejectedBy === "farmer" || bid.actionNotes?.includes("rejected by farmer"))
    );
    return rejectedBids.length > 0 ? rejectedBids[rejectedBids.length - 1] : null;
  };

  return (
    <div className="space-y-3">
      {/* Main Status Display */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(currentStatus)}
            <span className="text-sm font-medium">Current Status</span>
            {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
          </div>
          <Badge className={getStatusColor(currentStatus)} variant="outline">
            {currentStatus}
          </Badge>
        </div>
      </div>

      {/* Rejection Handler - Show Reinitiate Option */}
      {canReinitiateBid() && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">
                Your offer was rejected by the farmer
              </p>
              <p className="text-xs text-red-600">
                You can submit a new counter offer to restart negotiations
              </p>
            </div>
            <CounterOfferDialog
              bidId={getLatestRejectedBid()?.id || ""}
              bidderName="Farmer"
              originalAmount={getLatestRejectedBid()?.bidAmount || "₹0"}
              quantity={quantity || "1 unit"}
              onCounterOfferSubmitted={() => {
                fetchBidStatuses();
                onStatusUpdate?.();
              }}
              trigger={
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reinitiate Negotiation
                </Button>
              }
            />
          </div>
        </div>
      )}

      {/* Detailed Status Breakdown */}
      {bidStatuses.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
            <div className="text-xs text-yellow-600">Pending</div>
            <div className="font-bold text-yellow-700">
              {bidStatuses.filter(bid => bid.status === "pending").length}
            </div>
          </div>
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <div className="text-xs text-blue-600">Negotiating</div>
            <div className="font-bold text-blue-700">
              {bidStatuses.filter(bid => bid.status === "counter_offered").length}
            </div>
          </div>
          <div className="bg-red-50 p-2 rounded border border-red-200">
            <div className="text-xs text-red-600">Rejected</div>
            <div className="font-bold text-red-700">
              {bidStatuses.filter(bid => bid.status === "rejected").length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 