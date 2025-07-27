import React, { useState } from "react";
import { Sprout, TrendingUp, FileText, Handshake, Package, DollarSign, Plus, Loader2, Users, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { CampaignCard } from "@/components/CampaignCard";
import { ContractCard } from "@/components/ContractCard";
import { OrderCard } from "@/components/OrderCard";
import { FeatureCard } from "@/components/FeatureCard";
import { BidViewerDialog } from "@/components/BidViewerDialog";
import { CreateBidForm } from "@/components/forms/CreateBidForm";
import { GovernmentSchemesForm } from "@/components/forms/GovernmentSchemesForm";
import { SchemeInfoModal } from "@/components/SchemeInfoModal";
import AgriSangh from "@/components/AgriSangh";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useCampaigns, useContracts, useOrders, useBuyerRequests } from "@/hooks/useApi";
import { CreateCampaignForm } from "@/components/forms/CreateCampaignForm";
import { CreateOrderForm } from "@/components/forms/CreateOrderForm";

const Index = () => {
  // State for scheme modal
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [selectedSchemeData, setSelectedSchemeData] = useState<any>(null);
  const [selectedSchemeKey, setSelectedSchemeKey] = useState("");

  // API calls to get real data
  const { 
    data: campaignsResponse, 
    isLoading: campaignsLoading, 
    error: campaignsError 
  } = useCampaigns();

  // Separate API call for buyer requests
  const { 
    data: buyerRequestsResponse, 
    isLoading: buyerRequestsLoading, 
    error: buyerRequestsError 
  } = useBuyerRequests();

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

  // Extract data arrays from API responses
  const allCampaigns = campaignsResponse?.data || [];
  const contracts = contractsResponse?.data || [];
  const orders = ordersResponse?.data || [];

  // Handler for opening scheme info modal
  const handleSchemeInfoOpen = (schemeKey: string, schemeData: any) => {
    setSelectedSchemeKey(schemeKey);
    setSelectedSchemeData(schemeData);
    setSchemeModalOpen(true);
  };

  const handleSchemeInfoClose = () => {
    setSchemeModalOpen(false);
    setSelectedSchemeData(null);
    setSelectedSchemeKey("");
  };

  // Separate farmer campaigns from buyer requests
  const farmerCampaigns = allCampaigns.filter(campaign => 
    !campaign.userType || campaign.userType === "farmer"
  );
  
  // Get buyer requests from separate API call
  const buyerRequests = buyerRequestsResponse?.data?.filter(campaign =>
    campaign.userType === "buyer" && campaign.status === "active"  // Only show active buyer requests
  ) || [];

  // Features data (this stays static as it's feature descriptions)
  const features = [
    {
      title: "AI Crop Planner",
      description: "Smart crop planning with AI recommendations",
      icon: Sprout,
      features: [
        "Past yield data analysis with historical crop prices",
        "Local weather trends integration",
        "Soil health analysis through NPK values",
        "Optimal crop types and sowing schedules",
        "Investment planning and profit estimation",
      ],
      actionText: "Start Planning",
    },
    {
      title: "Crop Health Support",
      description: "Early disease detection using AI",
      icon: TrendingUp,
      features: [
        "Predicts crop diseases early using Vertex AI",
        "Photo-based disease identification",
        "Actionable prevention advice",
        "Economically suited pesticide suggestions",
        "Nearby Agri-Clinic locations",
      ],
      actionText: "Scan Crop",
    },
    {
      title: "Schemes Matcher",
      description: "Government schemes and subsidies",
      icon: FileText,
      features: [
        "Eligible state/central schemes",
        "Subsidies and crop insurance programs",
        "Local Agri-Clinic highlights",
        "Agri-Business Centers information",
        "Application assistance",
      ],
      actionText: "Find Schemes",
    },
    {
      title: "Voice Support",
      description: "Multilingual voice assistance",
      icon: MessageCircle,
      features: [
        "Native language support for farmers",
        "Voice-based solution for non-tech users",
        "Trust-driven communication",
        "Enhanced farmer experience",
        "Audio guidance and tutorials",
      ],
      actionText: "Try Voice Help",
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

  return (
    <div className="min-h-screen bg-gradient-field">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Welcome to <span className="text-primary">AGRI-AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your intelligent farming companion for smarter agriculture decisions
          </p>
        </div>

        {/* Campaigns and Buyer Requests Section */}
        <div id="campaigns" className="space-y-6">
          <Tabs defaultValue="campaigns" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-foreground">
                Manage Your <span className="text-primary">Farm Business</span>
              </h2>
              <TabsList className="grid w-96 grid-cols-3">
                <TabsTrigger value="campaigns" className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>My Campaigns</span>
                </TabsTrigger>
                <TabsTrigger value="buyer-requests" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Buyer Requests</span>
                </TabsTrigger>
                <TabsTrigger value="contracts" className="flex items-center space-x-2">
                  <Handshake className="h-4 w-4" />
                  <span>My Contracts</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  My Campaigns ({farmerCampaigns.length})
                </h3>
                <CreateCampaignForm />
              </div>

              {campaignsError && <ErrorAlert title="campaigns" error={campaignsError} />}
              
              {campaignsLoading ? (
                <LoadingSpinner text="Loading your campaigns..." />
              ) : farmerCampaigns.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No campaigns found. Create your first campaign!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {farmerCampaigns.map((campaign) => (
                    <CampaignCard key={campaign.id || campaign.title} {...campaign} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="buyer-requests" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  My Buyer Requests ({buyerRequests.length})
                </h3>
                <CreateCampaignForm />
              </div>

              {buyerRequestsError && <ErrorAlert title="buyerRequests" error={buyerRequestsError} />}
              
              {buyerRequestsLoading ? (
                <LoadingSpinner text="Loading buyer requests..." />
              ) : buyerRequests.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No buyer requests found. Create your first one!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {buyerRequests.map((campaign) => (
                    <CampaignCard key={campaign.id || campaign.title} {...campaign} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="contracts" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  My Contracts ({contracts.length})
                </h3>
                <CreateCampaignForm />
              </div>

              {contractsError && <ErrorAlert title="contracts" error={contractsError} />}
              
              {contractsLoading ? (
                <LoadingSpinner text="Loading contracts..." />
              ) : contracts.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No contracts found. Create your first one!</p>
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

        {/* AgriSangh Community Section */}
        <div id="agrisangh" className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              <Users className="inline-block mr-3 h-8 w-8 text-primary" />
              AgriSangh <span className="text-primary">Community</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Connect with fellow farmers, share knowledge, and build stronger agricultural communities together
            </p>
          </div>
          
          <AgriSangh />
        </div>

        {/* Orders Section */}
        <div id="orders" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <Package className="mr-3 h-6 w-6 text-primary" />
              My Orders
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">
              My Orders ({orders.length})
            </h3>
            <CreateOrderForm />
          </div>

          {ordersError && <ErrorAlert title="orders" error={ordersError} />}
          
          {ordersLoading ? (
            <LoadingSpinner text="Loading orders..." />
          ) : orders.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No orders found. Place your first order!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.filter(order => order.id).map((order) => (
                <OrderCard key={order.id} {...order} id={order.id!} />
              ))}
            </div>
          )}
        </div>

        {/* Government Schemes Section */}
        <div id="govt-schemes" className="space-y-6 scroll-mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              <span className="text-primary">Government Schemes</span> & Subsidies
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Apply for various agricultural schemes and get financial support for your farming business
            </p>
          </div>
          
          <GovernmentSchemesForm onSchemeInfoOpen={handleSchemeInfoOpen} />
        </div>

        {/* Features Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Explore Our <span className="text-primary">AI-Powered</span> Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Discover how AGRI-AI can transform your farming with cutting-edge technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Scheme Info Modal */}
        <SchemeInfoModal
          isOpen={schemeModalOpen}
          onClose={handleSchemeInfoClose}
          schemeData={selectedSchemeData}
          schemeKey={selectedSchemeKey}
        />
      </main>
    </div>
  );
};

export default Index;
