import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingUp, Calculator, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CounterOfferDialogProps {
  bidId: string;
  bidderName: string;
  originalAmount: string;
  quantity?: string; // Add quantity prop
  onCounterOfferSubmitted: () => void;
  trigger?: React.ReactNode;
}

export const CounterOfferDialog = ({
  bidId,
  bidderName,
  originalAmount,
  quantity = "1 unit", // Default quantity
  onCounterOfferSubmitted,
  trigger
}: CounterOfferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [counterAmountPerKg, setCounterAmountPerKg] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  // Calculate total amount in real-time
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    const calculateTotal = () => {
      try {
        const pricePerKg = parseFloat(counterAmountPerKg.replace(/[₹,]/g, ''));
        const quantityInKg = parseFloat(quantity.replace(/[a-zA-Z\s]/g, ''));
        
        if (!isNaN(pricePerKg) && !isNaN(quantityInKg) && pricePerKg > 0 && quantityInKg > 0) {
          // Convert quantity to kg if needed
          let finalQuantity = quantityInKg;
          if (quantity.toLowerCase().includes('ton')) {
            finalQuantity = quantityInKg * 1000; // Convert tons to kg
          } else if (quantity.toLowerCase().includes('quintal')) {
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
  }, [counterAmountPerKg, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterAmountPerKg.trim() || totalAmount === 0) return;

    // Validate that counter offer is not greater than farmer's original bid
    if (!isValidCounterOffer()) {
      toast({
        title: "Invalid Counter Offer",
        description: "Your counter offer cannot be higher than the farmer's bid. Please enter a lower amount.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const finalCounterAmount = `₹${totalAmount.toLocaleString()}`;
      
      const response = await fetch(`http://localhost:8002/api/bids/${bidId}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "counter_offer",
          counterAmount: finalCounterAmount,
          counterAmountPerKg: counterAmountPerKg,
          notes: notes || "Counter offer from buyer"
        }),
      });

      if (!response.ok) throw new Error("Failed to submit counter offer");

      const result = await response.json();
      
      toast({
        title: "Counter Offer Submitted! 💬",
        description: `Your counter offer of ₹${totalAmount.toLocaleString()} (₹${counterAmountPerKg}/kg) has been sent to ${bidderName}`,
        variant: "default",
      });

      // Reset form and close dialog
      setCounterAmountPerKg("");
      setNotes("");
      setOpen(false);

      // Notify parent to refresh
      onCounterOfferSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit counter offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidCounterOffer = () => {
    if (!originalAmount || !totalAmount) return false;
    
    try {
      const originalValue = parseFloat(originalAmount.replace(/[₹,]/g, ''));
      
      // Counter offer should be LESS than farmer's original bid (buyer negotiating down)
      return totalAmount < originalValue;
    } catch {
      return false;
    }
  };

  const getValidationMessage = () => {
    if (!originalAmount || !totalAmount) return "";
    
    try {
      const originalValue = parseFloat(originalAmount.replace(/[₹,]/g, ''));
      
      if (totalAmount >= originalValue) {
        return "❌ Counter offer must be lower than farmer's bid";
      }
      return "✅ Valid counter offer";
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="flex-1">
            <DollarSign className="h-4 w-4 mr-1" />
            Counter Offer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span>Counter Offer to {bidderName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Farmer's Bid:</span>
              <span className="font-bold text-primary">{originalAmount}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-medium">Quantity:</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Submit a lower amount to negotiate down
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counterAmountPerKg">Your Counter Offer (per kg)</Label>
            <div className="relative">
              <Input
                id="counterAmountPerKg"
                placeholder="e.g., ₹24/kg"
                value={counterAmountPerKg}
                onChange={(e) => setCounterAmountPerKg(e.target.value)}
                required
                className={
                  isValidCounterOffer() ? "border-green-500" : 
                  totalAmount > 0 && !isValidCounterOffer() ? "border-red-500" : ""
                }
              />
              {isValidCounterOffer() && (
                <TrendingUp className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
              {totalAmount > 0 && !isValidCounterOffer() && (
                <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
              )}
            </div>
            {totalAmount > 0 && (
              <p className={`text-xs ${isValidCounterOffer() ? 'text-green-600' : 'text-red-600'}`}>
                {getValidationMessage()}
              </p>
            )}
          </div>

          {/* Total Amount Calculator */}
          {totalAmount > 0 && (
            <div className={`p-4 rounded-lg border ${
              isValidCounterOffer() ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium flex items-center ${
                  isValidCounterOffer() ? 'text-green-900' : 'text-red-900'
                }`}>
                  <Calculator className="h-4 w-4 mr-1" />
                  Total Counter Offer:
                </span>
                <span className={`text-xl font-bold ${
                  isValidCounterOffer() ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
              <p className={`text-xs mt-1 ${
                isValidCounterOffer() ? 'text-green-700' : 'text-red-700'
              }`}>
                {counterAmountPerKg}/kg × {quantity} = ₹{totalAmount.toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Message (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add a message to the farmer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 This will update the existing negotiation instead of creating a new bid
            </p>
          </div>

          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !counterAmountPerKg.trim() || totalAmount === 0 || !isValidCounterOffer()}
            >
              {isLoading ? "Submitting..." : "Submit Counter Offer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 