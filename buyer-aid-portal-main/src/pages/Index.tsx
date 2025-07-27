import React from "react";
import { ShoppingCart, TrendingUp, FileText, Handshake, Package, DollarSign, Plus, FileCheck, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { CampaignCard } from "@/components/CampaignCard";
import { ContractCard } from "@/components/ContractCard";
import { OrderCard } from "@/components/OrderCard";
import { FeatureCard } from "@/components/FeatureCard";
import { BidViewerDialog } from "@/components/BidViewerDialog";
import { CreateBidForm } from "@/components/forms/CreateBidForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useCampaigns, useContracts, useOrders, useBids } from "@/hooks/useApi";
import { CreateCampaignForm } from "@/components/forms/CreateCampaignForm";
import { CreateOrderForm } from "@/components/forms/CreateOrderForm";
import { CounterOfferDialog } from "@/components/CounterOfferDialog";
import { StatusTracker } from "@/components/StatusTracker";

const Index = () => {
  // API calls to get real data
  const { 
    data: campaignsResponse, 
    isLoading: campaignsLoading, 
    error: campaignsError 
  } = useCampaigns();

  const { 
    data: contractsResponse, 
    isLoading: contractsLoading, 
    error: contractsError 
  } = useContracts();

  const { 
    data: ordersResponse, 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useOrders();

  const { 
    data: bidsResponse, 
    isLoading: bidsLoading, 
    error: bidsError 
  } = useBids();

  // Extract data arrays from API responses
  const allCampaigns = campaignsResponse?.data || [];
  const contracts = contractsResponse?.data || [];
  const orders = ordersResponse?.data || [];
  const allBids = bidsResponse?.data || [];
  
  // Filter active campaigns (remove completed ones)
  const campaigns = allCampaigns.filter(campaign => campaign.status === "active");

  // Get campaign IDs that have farmer bids (these should be in Active Bids, not My Listing)
  const campaignsWithFarmerBids = new Set(
    allBids
      .filter(bid => bid.bidderType === "farmer" && (bid.status === "pending" || bid.status === "rejected" || bid.status === "counter_offered"))
      .map(bid => bid.campaignId)
  );

  // Filter buyer requests (campaigns created by buyers) - exclude those with farmer bids
  const buyerRequests = allCampaigns.filter(campaign => 
    campaign.userType === "buyer" && 
    campaign.status === "active" &&
    !campaignsWithFarmerBids.has(campaign.id) // Only show campaigns WITHOUT farmer bids
  );

  // Helper function to extract contract type from notes
  const extractContractType = (notes?: string): string => {
    if (!notes) return "Standard";
    const match = notes.match(/Contract Type:\s*([^\n]+)/);
    return match ? match[1].trim() : "Standard";
  };

  // Get campaigns that have farmer activity (should be in Active Bids section)
  const activeBidCampaigns = allCampaigns.filter(campaign => 
    campaign.userType === "buyer" && 
    campaign.status === "active" &&
    campaignsWithFarmerBids.has(campaign.id) // Only campaigns WITH farmer bids
  ).map(campaign => {
    // Find the latest farmer bid for this campaign
    const farmerBids = allBids.filter(bid => 
      bid.campaignId === campaign.id && bid.bidderType === "farmer"
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const latestBid = farmerBids[0];
    
    return {
      ...campaign,
      farmer_name: latestBid?.bidderName || "Farmer",
      bid_amount: latestBid?.bidAmount || "No bid",
      bid_status: latestBid?.status || "unknown",
      quantity: latestBid?.quantity || campaign.estimatedYield,
      qualityGrade: latestBid?.qualityGrade || "Standard",
      deliveryTerms: latestBid?.deliveryTerms || "Standard",
      bidderType: "farmer",
      latestBidId: latestBid?.id,
      type: "campaign_with_bids"
    };
  });

  // Buyer-specific features
  const buyerFeatures = [
    {
      title: "Smart Sourcing",
      description: "Find the best agricultural products",
      icon: ShoppingCart,
      features: [
        "Direct farmer connections",
        "Quality assured products",
        "Competitive pricing through bidding",
        "Seasonal availability tracking",
        "Bulk purchase discounts",
      ],
      actionText: "Start Sourcing",
    },
    {
      title: "Market Analysis",
      description: "Real-time market insights",
      icon: TrendingUp,
      features: [
        "Price trend analysis",
        "Demand forecasting",
        "Regional price comparisons",
        "Quality vs price metrics",
        "Supplier performance tracking",
      ],
      actionText: "View Market",
    },
    {
      title: "Contract Management",
      description: "Streamlined purchasing agreements",
      icon: FileText,
      features: [
        "Digital contract creation",
        "Payment milestone tracking",
        "Quality assurance clauses",
        "Delivery scheduling",
        "Dispute resolution support",
      ],
      actionText: "Manage Contracts",
    },
    {
      title: "Bidding Platform",
      description: "Transparent negotiation process",
      icon: Handshake,
      features: [
        "Real-time bidding system",
        "Multiple farmer responses",
        "Automated best price alerts",
        "Negotiation history tracking",
        "Fair deal guarantees",
      ],
      actionText: "Start Bidding",
    },
  ];

  // Loading component
  const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );

  // Error component
  const ErrorAlert = ({ title, error }: { title: string; error: any }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>
        Error loading {title}: {error?.message || 'Unknown error occurred'}
      </AlertDescription>
    </Alert>
  );

  // Buyer Request Card Component
  const BuyerRequestCard = ({ request }: { request: any }) => (
    <div className="bg-card border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{request.crop} - {request.estimatedYield} - {request.location}</h3>
          <p className="text-sm text-muted-foreground">{request.cropType}</p>
        </div>
        <Badge variant={request.status === 'active' ? 'default' : 'secondary'}>
          {request.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Quantity Needed:</span>
          <span className="font-medium">{request.estimatedYield}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Budget Range:</span>
          <span className="font-medium">{request.minimumQuotation} - {request.currentBid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Contract Type:</span>
          <span className="font-medium">{extractContractType(request.notes)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Farmer Bids:</span>
          <span className="font-medium text-primary">{request.farmer_bids} bids</span>
        </div>
      </div>

      <div className="flex gap-2">
        <BidViewerDialog
          campaignId={request.id || ""}
          campaignTitle={request.title}
          trigger={
            <Button variant="outline" size="sm" className="flex-1">
              View Bids
            </Button>
          }
        />
        {request.status === "completed" ? (
          <div className="bg-green-50 p-2 rounded border border-green-200 flex-1 text-center">
            <span className="text-sm text-green-700 font-medium">✅ Contract Created</span>
          </div>
        ) : (
          <CreateBidForm
            campaignId={request.id || ""}
            campaignTitle={request.title}
            currentHighestBid={request.currentBid}
            userType="buyer"
            campaignQuantity={request.estimatedYield} // Lock quantity
            campaignContractType={extractContractType(request.notes)} // Pass contract type
            trigger={
              <Button size="sm" className="flex-1">
                Negotiate
              </Button>
            }
          />
        )}
      </div>
    </div>
  );

  // Active Bid Card Component  
  const ActiveBidCard = ({ bid }: { bid: any }) => (
    <div className="bg-card border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">🚜 {bid.title}</h3>
          <p className="text-sm text-muted-foreground">
            <strong>{bid.farmer_name}</strong> • {bid.location}
          </p>
          {bid.notes && (
            <p className="text-xs text-gray-500 mt-1 italic">"{bid.notes}"</p>
          )}
        </div>
        <Badge 
          variant={
            bid.bid_status === 'accepted' ? 'default' : 
            bid.bid_status === 'counter_offered' ? 'secondary' : 
            'outline'
          }
          className="bg-green-100 text-green-800"
        >
          {bid.bid_status.replace('_', ' ')}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">🌾 Farmer's Bid:</span>
          <span className="font-bold text-green-600 text-lg">{bid.bid_amount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">📦 Quantity:</span>
          <span className="font-medium">{bid.quantity || bid.estimatedYield}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">⭐ Quality Grade:</span>
          <span className="font-medium">{bid.qualityGrade || "Standard"}</span>
        </div>
        {bid.deliveryTerms && (
          <div className="flex justify-between">
            <span className="text-sm">🚛 Delivery:</span>
            <span className="font-medium text-xs">{bid.deliveryTerms}</span>
          </div>
        )}
      </div>

      {/* Status Tracker for this bid */}
      <StatusTracker 
        campaignId={bid.campaignId || bid.id}
        campaignTitle={bid.title}
        quantity={bid.quantity || bid.estimatedYield}
        onStatusUpdate={() => window.location.reload()}
      />

      <div className="flex gap-2">
        <BidViewerDialog
          campaignId={bid.id || bid.campaignId}
          campaignTitle={bid.title}
          trigger={
            <Button 
              variant={bid.bid_status === 'accepted' ? 'default' : 'outline'} 
              size="sm" 
              className="flex-1"
            >
              {bid.bid_status === 'accepted' ? 'View Contract' : 
               bid.bid_status === 'rejected' ? 'View Negotiations' : 'Accept This Bid'}
            </Button>
          }
        />
        {bid.bid_status === "accepted" ? (
          <div className="bg-green-50 p-2 rounded border border-green-200 flex-1 text-center">
            <span className="text-sm text-green-700 font-medium">✅ Bid Accepted</span>
          </div>
        ) : (
          <CounterOfferDialog
            bidId={bid.latestBidId || bid.id}
            bidderName={bid.farmer_name || "Farmer"}
            originalAmount={bid.bid_amount}
            quantity={bid.quantity || bid.estimatedYield}
            onCounterOfferSubmitted={() => {
              // Refresh bids when counter offer is submitted
              window.location.reload(); // Simple refresh for now
            }}
            trigger={
              <Button variant="outline" size="sm" className="flex-1">
                💬 Counter Offer
              </Button>
            }
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Welcome to <span className="text-blue-600">BUYER</span> <span className="text-green-600">PORTAL</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect directly with farmers and source quality agricultural products at the best prices
          </p>
        </div>

        {/* Purchase Requests and Active Bids Section */}
        <div id="buyer-dashboard" className="space-y-6">
          <Tabs defaultValue="requests" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-foreground">
                Manage Your <span className="text-blue-600">Purchases</span>
              </h2>
              <TabsList className="grid w-96 grid-cols-3">
                <TabsTrigger value="requests" className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span>My Listings</span>
                </TabsTrigger>
                <TabsTrigger value="bids" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Active Bids</span>
                </TabsTrigger>
                <TabsTrigger value="contracts" className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4" />
                  <span>Contracts</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="requests" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  Crop Demand Listings ({buyerRequests.length})
                </h3>
                <CreateCampaignForm />
              </div>

              {campaignsError && <ErrorAlert title="purchase requests" error={campaignsError} />}
              
              {campaignsLoading ? (
                <LoadingSpinner text="Loading your requests..." />
              ) : buyerRequests.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No crop demand listings found. Create your first listing!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {buyerRequests.map((request, index) => (
                    <BuyerRequestCard key={index} request={request} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bids" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  Active Negotiations ({activeBidCampaigns.length})
                </h3>
                <Button variant="outline">
                  View All Farmers
                </Button>
              </div>

              {campaignsError && <ErrorAlert title="active bids" error={campaignsError} />}
              {bidsError && <ErrorAlert title="farmer bids" error={bidsError} />}
              
              {campaignsLoading || bidsLoading ? (
                <LoadingSpinner text="Loading negotiations..." />
              ) : activeBidCampaigns.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No active negotiations. Start by creating a purchase request!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                  {activeBidCampaigns.map((campaign, index) => (
                  <ActiveBidCard key={index} bid={campaign} />
                ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="contracts" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  Purchase Contracts ({contracts.length})
                </h3>
              </div>

              {contractsError && <ErrorAlert title="contracts" error={contractsError} />}
              
              {contractsLoading ? (
                <LoadingSpinner text="Loading contracts..." />
              ) : contracts.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No contracts yet. Contracts are automatically created when you accept farmer bids!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {contracts.map((contract) => (
                    <ContractCard key={contract.id || contract.title} {...contract} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Buyer Features Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Optimize Your <span className="text-blue-600">Sourcing</span> Strategy
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Discover how our buyer platform helps you source quality agricultural products efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {buyerFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;


