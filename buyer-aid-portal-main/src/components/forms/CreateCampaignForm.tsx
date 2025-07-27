import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const CreateCampaignForm = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    crop: "",
    cropType: "",
    location: "",
    duration: "",
    estimatedYield: "", // Quantity needed
    contractType: "", // Changed from qualityRequirements to contractType
    additionalNotes: "", // Additional requirements
    totalBids: 0,
    status: "active" as const,
    userType: "buyer" as const,
    userId: "buyer_001" // In a real app, this would come from authentication
  });

  const cropOptions = [
    { value: "Wheat", label: "Wheat" },
    { value: "Rice", label: "Rice" },
    { value: "Corn", label: "Corn" },
    { value: "Barley", label: "Barley" },
    { value: "Soybeans", label: "Soybeans" },
    { value: "Cotton", label: "Cotton" },
    { value: "Tomatoes", label: "Tomatoes" },
    { value: "Potatoes", label: "Potatoes" },
    { value: "Onions", label: "Onions" },
    { value: "Other", label: "Other" }
  ];

  const contractTypeOptions = [
    { value: "Supervised", label: "Supervised" },
    { value: "Unsupervised", label: "Unsupervised" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8002/api/campaigns/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${formData.crop} - ${formData.estimatedYield} - ${formData.location}`, // Auto-generate title
          crop: formData.crop,
          cropType: formData.cropType,
          location: formData.location,
          duration: formData.duration,
          estimatedYield: formData.estimatedYield,
          minimumQuotation: "", // Empty - farmers will set prices
          currentBid: "", // Empty - will be set when farmers bid
          totalBids: 0,
          userType: "buyer",
          userId: formData.userId,
          status: formData.status,
          // Store buyer requirements as additional data
          notes: `Contract Type: ${formData.contractType || 'Standard'}\nAdditional: ${formData.additionalNotes || 'None'}`
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create crop demand listing");
      }

      const result = await response.json();
      
      toast({
        title: "Crop Demand Listing Created",
        description: "Your crop demand listing has been posted. Farmers can now bid on your requirements.",
        variant: "default",
      });

      // Reset form and close dialog
      setFormData({
        crop: "",
        cropType: "",
        location: "",
        duration: "",
        estimatedYield: "",
        contractType: "",
        additionalNotes: "",
        totalBids: 0,
        status: "active",
        userType: "buyer",
        userId: "buyer_001"
      });
      setOpen(false);

      // Refresh the campaigns list
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create crop demand listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <ShoppingCart className="h-4 w-4" />
          <span>Crop Demand Listing</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <span>Create New Crop Demand Listing</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crop">Crop Type</Label>
              <Select value={formData.crop} onValueChange={(value) => setFormData({ ...formData, crop: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crop type" />
                </SelectTrigger>
                <SelectContent>
                  {cropOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cropType">Specific Variety</Label>
              <Input
                id="cropType"
                placeholder="e.g., Basmati Rice, Winter Wheat"
                value={formData.cropType}
                onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Preferred Location</Label>
              <Input
                id="location"
                placeholder="e.g., Punjab, Maharashtra"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Required Timeline</Label>
              <Input
                id="duration"
                placeholder="e.g., Next 2 months, Jan 2025"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedYield">Quantity Needed</Label>
              <Input
                id="estimatedYield"
                placeholder="e.g., 50 tons, 100 quintals"
                value={formData.estimatedYield}
                onChange={(e) => setFormData({ ...formData, estimatedYield: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type</Label>
              <Select value={formData.contractType} onValueChange={(value) => setFormData({ ...formData, contractType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Requirements</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Specify any special requirements, payment terms, certifications needed, etc."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Your listing will be visible to farmers who can then submit bids
            </div>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Post Demand Listing"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 