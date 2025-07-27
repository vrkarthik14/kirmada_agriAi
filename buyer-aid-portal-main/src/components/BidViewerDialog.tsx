import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, DollarSign, Users, TrendingUp, CheckCircle, X, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateBidForm } from "./forms/CreateBidForm";
import { CounterOfferDialog } from "./CounterOfferDialog";

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
  counterAmount?: string; // For counter offers
  actionNotes?: string; // For action-specific notes
}

interface BidViewerDialogProps {
  campaignId: string;
  campaignTitle: string;
  trigger?: React.ReactNode;
  currentUserType?: "buyer" | "farmer"; // Add user type to know who is viewing
}

export const BidViewerDialog = ({ 
  campaignId, 
  campaignTitle, 
  trigger,
  currentUserType = "buyer" // Default to buyer since this is buyer portal
}: BidViewerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch bids when dialog opens and set up auto-refresh
  useEffect(() => {
    if (open) {
      fetchBids();
      
      // Auto-refresh every 3 seconds when dialog is open
      const interval = setInterval(fetchBids, 3000);
      return () => clearInterval(interval);
    }
  }, [open, campaignId]);

  const fetchBids = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8002/api/bids/?campaign_id=${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch bids");
      
      const result = await response.json();
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

  const handleBidAction = async (bidId: string, action: "accept" | "reject", counterAmount?: string) => {
    setProcessingBidId(bidId);
    try {
      const response = await fetch(`http://localhost:8002/api/bids/${bidId}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          counterAmount,
          notes: action === "accept" ? "Bid accepted by buyer" : 
                 action === "reject" ? "Bid rejected by buyer" : 
                 "Counter offer from buyer"
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

  const pendingBids = bids.filter(bid => bid.status === "pending");
  const acceptedBids = bids.filter(bid => bid.status === "accepted");
  const rejectedBids = bids.filter(bid => bid.status === "rejected");
  
  // Separate farmer and buyer bids for better organization
  const farmerBids = bids.filter(bid => bid.bidderType === "farmer");
  const buyerBids = bids.filter(bid => bid.bidderType === "buyer");
  const pendingFarmerBids = farmerBids.filter(bid => bid.status === "pending");
  const pendingBuyerBids = buyerBids.filter(bid => bid.status === "pending");

  const BidCard = ({ bid }: { bid: Bid }) => (
    <Card className={`hover:shadow-md transition-shadow ${
      bid.bidderType === "farmer" ? "border-l-4 border-l-green-500 bg-green-50/30" : "border-l-4 border-l-blue-500 bg-blue-50/30"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              {bid.bidderType === "farmer" ? "🚜" : "🏢"} {bid.bidderName}
              {bid.bidderType === "farmer" && (
                <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800 border-green-300">
                  Farmer Bid
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {bid.bidderType === "farmer" ? "🌾 Farmer" : "🏢 Buyer"} • {formatDate(bid.createdAt)}
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
              <span className="text-muted-foreground">Original Bid:</span>
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
              <strong>Original Note:</strong> {bid.notes}
            </p>
          </div>
        )}

        {bid.actionNotes && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <MessageCircle className="h-4 w-4 inline mr-1" />
              <strong>Counter Offer Note:</strong> {bid.actionNotes}
            </p>
          </div>
        )}

        {bid.status === "counter_offered" && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 font-medium">
              💬 Counter offer made - Current negotiation price: <strong>{bid.counterAmount}</strong>
            </p>
          </div>
        )}

        {bid.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className={
                bid.bidderType === "buyer" 
                  ? "flex-1 bg-gray-400 cursor-not-allowed" 
                  : "flex-1 bg-green-600 hover:bg-green-700"
              }
              onClick={() => handleBidAction(bid.id, "accept")}
              disabled={processingBidId === bid.id || bid.bidderType === "buyer"}
              title={
                bid.bidderType === "buyer" 
                  ? "You cannot accept your own bid" 
                  : "Accept this farmer's bid"
              }
            >
              {processingBidId === bid.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              {bid.bidderType === "buyer" ? "Own Bid" : "Accept Bid"}
            </Button>
            {/* Only show counter offer for farmer bids */}
            {bid.bidderType === "farmer" && (
              <CounterOfferDialog
                bidId={bid.id}
                bidderName={bid.bidderName}
                originalAmount={bid.bidAmount}
                quantity={bid.quantity}
                onCounterOfferSubmitted={fetchBids}
                trigger={
                  <Button size="sm" variant="outline" className="flex-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Counter Offer
                  </Button>
                }
              />
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleBidAction(bid.id, "reject")}
              disabled={processingBidId === bid.id}
              title={bid.bidderType === "buyer" ? "Reject your own bid" : "Reject this farmer's bid"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {bid.status === "accepted" && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium">
              ✅ Bid accepted - Contract automatically created
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
            View Bids
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Bids for "{campaignTitle}"</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading bids...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{farmerBids.length}</div>
                <div className="text-sm text-green-600">Farmer Bids</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{buyerBids.length}</div>
                <div className="text-sm text-blue-600">Buyer Bids</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{pendingBids.length}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{acceptedBids.length}</div>
                <div className="text-sm text-green-600">Accepted</div>
              </div>
            </div>

            {bids.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No bids yet</h3>
                <p className="text-muted-foreground">
                  Farmers and buyers haven't submitted any bids for this request yet. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Farmer Bids Section */}
                {farmerBids.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      🚜 Farmer Bids ({farmerBids.length}) - Ready to Accept
                    </h3>
                    <div className="grid gap-3">
                      {farmerBids.map((bid) => (
                        <BidCard key={bid.id} bid={bid} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer Bids Section */}
                {buyerBids.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        🏢 Your Bids ({buyerBids.length}) - Reference Only
                      </h3>
                      <div className="grid gap-3">
                        {buyerBids.map((bid) => (
                          <BidCard key={bid.id} bid={bid} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Accepted Bids */}
                {acceptedBids.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                        ✅ Accepted Bids ({acceptedBids.length})
                      </h3>
                      <div className="grid gap-3">
                        {acceptedBids.map((bid) => (
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