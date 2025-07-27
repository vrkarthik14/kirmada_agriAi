import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, DollarSign, Users, TrendingUp, CheckCircle, X, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateBidForm } from "./forms/CreateBidForm";

interface Bid {
  id: string;
  bidderName: string;
  bidderType: "farmer" | "buyer";
  bidAmount: string;
  quantity: string;
  qualityGrade: string;
  deliveryTerms?: string;
  notes?: string;
  status: "pending" | "accepted" | "rejected" | "counter_offered";
  createdAt: string;
  counterAmount?: string;
  actionNotes?: string;
}

interface BidViewerDialogProps {
  campaignId: string;
  campaignTitle: string;
  trigger?: React.ReactNode;
  campaignStatus?: "active" | "completed" | "upcoming";
  campaignQuantity?: string;
}

export const BidViewerDialog = ({ campaignId, campaignTitle, trigger, campaignStatus = "active", campaignQuantity }: BidViewerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch bids when dialog opens
  useEffect(() => {
    if (open) {
      fetchBids();
    }
  }, [open, campaignId]);

  // Check for new buyer responses and show notifications
  useEffect(() => {
    if (bids.length > 0) {
      const newBuyerResponses = bids.filter(bid => 
        bid.bidderType === "buyer" && bid.status === "counter_offered"
      );
      
      if (newBuyerResponses.length > 0) {
        toast({
          title: "💬 New Buyer Response!",
          description: `You have ${newBuyerResponses.length} new response(s) from buyers. Check the Buyer Responses section below.`,
          variant: "default",
        });
      }
    }
  }, [bids, toast]);

  const fetchBids = async () => {
    setIsLoading(true);
    try {
      // Fetch from buyer backend (port 8000) where farmer bids are stored
      const response = await fetch(`http://localhost:8002/api/bids/?campaign_id=${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch bids");
      
      const result = await response.json();
      console.log("🔍 Farmer View - All bids for campaign:", result.data);
      setBids(result.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bids. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBidAction = async (bidId: string, action: "accept" | "reject") => {
    setProcessingBidId(bidId);
    try {
      // Send bid actions to buyer backend (port 8000) where bids are stored
      const response = await fetch(`http://localhost:8002/api/bids/${bidId}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: action === "accept" ? "Bid accepted by farmer" : "Bid rejected by farmer"
        }),
      });

      if (!response.ok) throw new Error("Failed to process bid action");

      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.message,
        variant: "default",
      });

      // Refresh bids
      await fetchBids();
      
      if (action === "accept") {
        toast({
          title: "Contract Created! 🎉",
          description: "A new contract has been automatically created from this accepted bid.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bid action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingBidId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "counter_offered": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const myBids = bids.filter(bid => bid.bidderType === "farmer");
  const buyerCounters = bids.filter(bid => bid.bidderType === "buyer" || bid.status === "counter_offered");

  const BidCard = ({ bid }: { bid: Bid }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{bid.bidderName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {bid.bidderType === "farmer" ? "🚜 My Bid" : "🏢 Buyer Counter"} • {formatDate(bid.createdAt)}
            </p>
            {/* DEBUG INFO - Remove this later */}
            <p className="text-xs text-gray-400 bg-gray-100 p-1 rounded mt-1">
              DEBUG: Type={bid.bidderType}, Status={bid.status}, ID={bid.id}
            </p>
          </div>
          <Badge className={getStatusColor(bid.status)} variant="outline">
            {bid.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original Amount:</span>
              <span className="font-bold text-green-600">{bid.bidAmount}</span>
            </div>
            {bid.counterAmount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Counter Offer:</span>
                <span className="font-bold text-blue-600">{bid.counterAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{bid.quantity}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quality:</span>
              <span className="font-medium">{bid.qualityGrade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery:</span>
              <span className="font-medium">{bid.deliveryTerms || "Standard"}</span>
            </div>
          </div>
        </div>

        {bid.notes && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 inline mr-1" />
              <strong>Note:</strong> {bid.notes}
            </p>
          </div>
        )}

        {bid.actionNotes && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <MessageCircle className="h-4 w-4 inline mr-1" />
              <strong>Buyer's Message:</strong> {bid.actionNotes}
            </p>
          </div>
        )}

        {bid.status === "counter_offered" && bid.bidderType === "farmer" && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 font-medium">
              💬 You have a counter offer: <strong>{bid.counterAmount}</strong>
            </p>
          </div>
        )}

        {/* Show rejected status for farmer's own bids */}
        {bid.status === "rejected" && bid.bidderType === "farmer" && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-medium">
              {bid.rejectedBy === "farmer" ? 
                "❌ You rejected this counter offer" : 
                "❌ Your bid was rejected by the buyer"
              }
            </p>
            {bid.actionNotes && (
              <p className="text-xs text-red-600 mt-1">
                {bid.rejectedBy === "farmer" ? 
                  "You rejected the buyer's counter offer" : 
                  `Buyer's reason: ${bid.actionNotes}`
                }
              </p>
            )}
          </div>
        )}

        {/* Show rejected status for buyer counter offers */}
        {bid.status === "rejected" && bid.bidderType === "buyer" && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-medium">
              ❌ You rejected this counter offer
            </p>
          </div>
        )}

        {/* Action buttons for counter offers - Farmer can accept/reject BUYER counter offers */}
        {bid.status === "counter_offered" && bid.bidderType === "buyer" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleBidAction(bid.id, "accept")}
              disabled={processingBidId === bid.id}
            >
              {processingBidId === bid.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Accept Counter Offer
            </Button>
            <CreateBidForm
              campaignId={campaignId}
              campaignTitle={campaignTitle}
              currentHighestBid={bid.counterAmount}
              userType="farmer"
              campaignStatus={campaignStatus}
              campaignQuantity={campaignQuantity}
              trigger={
                <Button size="sm" variant="outline" className="flex-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Counter Back
                </Button>
              }
            />
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleBidAction(bid.id, "reject")}
              disabled={processingBidId === bid.id}
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}

        {/* Action buttons for FARMER'S OWN bids that received counter offers from buyer */}
        {bid.status === "counter_offered" && bid.bidderType === "farmer" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleBidAction(bid.id, "accept")}
              disabled={processingBidId === bid.id}
            >
              {processingBidId === bid.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Accept Counter Offer
            </Button>
            <CreateBidForm
              campaignId={campaignId}
              campaignTitle={campaignTitle}
              currentHighestBid={bid.counterAmount}
              userType="farmer"
              campaignStatus={campaignStatus}
              campaignQuantity={campaignQuantity}
              trigger={
                <Button size="sm" variant="outline" className="flex-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Counter Back
                </Button>
              }
            />
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
              onClick={() => handleBidAction(bid.id, "reject")}
              disabled={processingBidId === bid.id}
            >
              <X className="h-4 w-4 mr-1" />
              Reject Counter
            </Button>
          </div>
        )}

        {/* Status for pending farmer bids (original farmer bids awaiting buyer response) */}
        {bid.status === "pending" && bid.bidderType === "farmer" && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium">
              ⏳ Your bid is pending - Awaiting buyer response
            </p>
          </div>
        )}

        {/* This section removed - now handled by action buttons above */}

        {bid.status === "accepted" && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium">
              ✅ Deal confirmed - Contract automatically created
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Negotiations
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span>Negotiations for "{campaignTitle}"</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading negotiations...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{myBids.length}</div>
                <div className="text-sm text-green-600">My Bids</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{buyerCounters.length}</div>
                <div className="text-sm text-blue-600">Buyer Responses</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">
                  {bids.filter(b => b.status === "counter_offered").length}
                </div>
                <div className="text-sm text-yellow-600">Active Negotiations</div>
              </div>
            </div>

            {bids.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No negotiations yet</h3>
                <p className="text-muted-foreground">
                  Start by submitting a bid on this buyer request!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* My Bids */}
                {myBids.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      My Bids ({myBids.length})
                    </h3>
                    <div className="grid gap-3">
                      {myBids.map((bid) => (
                        <BidCard key={bid.id} bid={bid} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer Counter Offers */}
                {buyerCounters.length > 0 && myBids.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                        Buyer Responses ({buyerCounters.length})
                      </h3>
                      <div className="grid gap-3">
                        {buyerCounters.map((bid) => (
                          <BidCard key={bid.id} bid={bid} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 