import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingUp, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CreateBidFormProps {
  campaignId: string;
  campaignTitle: string;
  currentHighestBid?: string;
  userType: "farmer" | "buyer";
  trigger?: React.ReactNode;
  campaignStatus?: "active" | "completed" | "upcoming";
  campaignQuantity?: string; // Locked quantity from campaign
  campaignContractType?: string; // Contract type from buyer's listing
}

export const CreateBidForm = ({
  campaignId,
  campaignTitle,
  currentHighestBid,
  userType,
  trigger,
  campaignStatus = "active",
  campaignQuantity,
  campaignContractType
}: CreateBidFormProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    campaignId: campaignId,
    bidderType: userType,
    bidderId: `${userType}_001`, // In a real app, this would come from authentication
    bidderName: userType === "farmer" ? "Local Farmer" : "Verified Buyer",
    bidAmountPerKg: "", // Changed to per kg pricing
    quantity: campaignQuantity || "", // Lock to campaign quantity if provided
    contractType: campaignContractType || "Standard", // Prefilled from campaign
    deliveryTerms: "",
    notes: "",
    status: "pending"
  });

  // Calculate total amount in real-time
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    const calculateTotal = () => {
      try {
        const pricePerKg = parseFloat(formData.bidAmountPerKg.replace(/[₹,]/g, ''));
        const quantityInKg = parseFloat(formData.quantity.replace(/[a-zA-Z\s]/g, ''));
        
        if (!isNaN(pricePerKg) && !isNaN(quantityInKg) && pricePerKg > 0 && quantityInKg > 0) {
          // Convert quantity to kg if needed (assuming tons, convert to kg)
          let finalQuantity = quantityInKg;
          if (formData.quantity.toLowerCase().includes('ton')) {
            finalQuantity = quantityInKg * 1000; // Convert tons to kg
          } else if (formData.quantity.toLowerCase().includes('quintal')) {
            finalQuantity = quantityInKg * 100; // Convert quintals to kg
          }
          
          setTotalAmount(pricePerKg * finalQuantity);
        } else {
          setTotalAmount(0);
        }
      } catch {
        setTotalAmount(0);
      }
    };

    calculateTotal();
  }, [formData.bidAmountPerKg, formData.quantity]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Calculate final total amount for submission
      const finalBidAmount = totalAmount > 0 ? `₹${totalAmount.toLocaleString()}` : formData.bidAmountPerKg;

      const response = await fetch("http://localhost:8002/api/bids/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignId,
          bidderName: formData.bidderName,
          bidderType: "farmer",
          bidAmount: finalBidAmount, // Submit calculated total
          bidAmountPerKg: formData.bidAmountPerKg, // Also store per kg rate
          quantity: formData.quantity,
          contractType: formData.contractType, // Use contract type instead of quality grade
          deliveryTerms: formData.deliveryTerms,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit bid");
      }

      const result = await response.json();
      
      toast({
        title: "Bid Submitted Successfully",
        description: `Your bid of ₹${totalAmount.toLocaleString()} total (₹${formData.bidAmountPerKg}/kg) has been submitted for ${campaignTitle}`,
        variant: "default",
      });

      // Reset form and close dialog
      setFormData({
        campaignId: campaignId,
        bidderType: userType,
        bidderId: `${userType}_001`,
        bidderName: userType === "farmer" ? "Local Farmer" : "Verified Buyer",
        bidAmountPerKg: "",
        quantity: campaignQuantity || "",
        contractType: campaignContractType || "Standard",
        deliveryTerms: "",
        notes: "",
        status: "pending"
      });
      setOpen(false);

      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["bids"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCompetitiveBid = () => {
    if (!formData.bidAmountPerKg) return false;
    
    // If no current bid, any valid bid amount is competitive
    if (!currentHighestBid) {
      try {
        const bidAmount = parseFloat(formData.bidAmountPerKg.replace(/[₹,]/g, ''));
        return bidAmount > 0;
      } catch {
        return false;
      }
    }
    
    try {
      const currentAmount = parseFloat(currentHighestBid.replace(/[₹,]/g, ''));
      const bidAmount = totalAmount || parseFloat(formData.bidAmountPerKg.replace(/[₹,]/g, ''));
      
      // For farmers: bid should be competitive but not too low compared to buyer counter offers
      if (userType === "farmer") {
        // Farmer's bid should be greater than buyer's counter offer
        return bidAmount >= currentAmount;
      } else {
        // For buyers: bid should be higher than current
        return bidAmount > currentAmount;
      }
    } catch {
      return false;
    }
  };

  const getValidationMessage = () => {
    if (!currentHighestBid || !totalAmount) return "";
    
    try {
      const currentAmount = parseFloat(currentHighestBid.replace(/[₹,]/g, ''));
      
      if (userType === "farmer") {
        if (totalAmount < currentAmount) {
          return "❌ Your bid cannot be lower than buyer's counter offer";
        }
        return "✅ Valid bid amount";
      }
      return "";
    } catch {
      return "";
    }
  };

  // Don't allow bidding on completed campaigns
  if (campaignStatus === "completed") {
    return (
      <div className="opacity-50 cursor-not-allowed">
        {trigger || (
          <Button disabled className="flex items-center space-x-2" size="sm">
            <DollarSign className="h-4 w-4" />
            <span>Campaign Completed</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center space-x-2" size="sm">
            <DollarSign className="h-4 w-4" />
            <span>{userType === "farmer" ? "Submit Bid" : "Counter Bid"}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>
              {userType === "farmer" ? "Submit Your Bid" : "Submit Counter Bid"} for {campaignTitle}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentHighestBid && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current {userType === "farmer" ? "Highest" : "Target"} Price:</span>
                <span className="text-lg font-bold text-primary">{currentHighestBid}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {userType === "farmer" 
                  ? "Submit a competitive bid below this amount" 
                  : "Consider bidding higher to secure this deal"
                }
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bidAmountPerKg">Your Bid Price (per kg)</Label>
              <div className="relative">
                <Input
                  id="bidAmountPerKg"
                  placeholder="e.g., ₹26/kg"
                  value={formData.bidAmountPerKg}
                  onChange={(e) => setFormData({ ...formData, bidAmountPerKg: e.target.value })}
                  required
                  className={isCompetitiveBid() ? "border-green-500" : ""}
                />
                {isCompetitiveBid() && (
                  <TrendingUp className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {totalAmount > 0 && userType === "farmer" && (
                <p className={`text-xs ${isCompetitiveBid() ? 'text-green-600' : 'text-red-600'}`}>
                  {getValidationMessage()}
                </p>
              )}
              {isCompetitiveBid() && userType !== "farmer" && (
                <p className="text-xs text-green-600">Competitive bid!</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {campaignQuantity ? "Required Quantity (Fixed)" : "Quantity You Can Supply"}
              </Label>
              <Input
                id="quantity"
                placeholder="e.g., 50 tons, 100 quintals"
                value={formData.quantity}
                onChange={(e) => campaignQuantity ? null : setFormData({ ...formData, quantity: e.target.value })}
                readOnly={!!campaignQuantity}
                className={campaignQuantity ? "bg-muted cursor-not-allowed" : ""}
                required
              />
              {campaignQuantity && (
                <p className="text-xs text-muted-foreground">
                  🔒 Quantity is fixed by the buyer's requirement and cannot be changed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type (From Buyer)</Label>
              <Input
                id="contractType"
                value={formData.contractType}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                🔒 Contract type is set by the buyer and cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryTerms">Delivery Timeline</Label>
              <Input
                id="deliveryTerms"
                placeholder="e.g., Within 15 days, Next month"
                value={formData.deliveryTerms}
                onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
              />
            </div>
          </div>

          {/* Total Amount Calculator */}
          {totalAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900 flex items-center">
                  <Calculator className="h-4 w-4 mr-1" />
                  Total Bid Amount:
                </span>
                <span className="text-xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {formData.bidAmountPerKg}/kg × {formData.quantity} = ₹{totalAmount.toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Terms & Conditions</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional terms, conditions, or information about your bid..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          {userType === "farmer" && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🚜 Farmer Benefits</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Direct connection with verified buyers</li>
                <li>• No middleman commission - keep full profits</li>
                <li>• Secure payment guarantee</li>
                <li>• Fair price negotiation</li>
                <li>• Build long-term buyer relationships</li>
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {userType === "farmer" 
                ? "Your bid will be visible to the buyer immediately"
                : "Your counter-bid will notify the farmer"
              }
            </div>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || totalAmount === 0}>
                {isLoading ? "Submitting..." : 
                 userType === "farmer" ? "Submit My Bid" : "Submit Counter Bid"
                }
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 