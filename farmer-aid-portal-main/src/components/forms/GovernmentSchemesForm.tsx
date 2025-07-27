import React, { useState } from "react";
import { FileText, User, MapPin, Phone, Building, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Scheme information data
const GOVERNMENT_SCHEMES = {
  "raita-shakthi": {
    name: "Raita Shakthi Scheme",
    description: "Empowerment scheme for farmers with subsidies on seeds, fertilizers, and farming equipment.",
    benefits: [
      "50% subsidy on certified seeds",
      "25% subsidy on fertilizers",
      "Up to ₹50,000 support for farm equipment",
      "Free soil testing facility"
    ],
    eligibility: "Marginal and small farmers with land holding up to 5 acres",
    documents: ["Land ownership documents", "Aadhaar card", "Bank account details"],
    processingTime: "15-30 days"
  },
  "agricultural-mechanization": {
    name: "Agricultural Mechanization Scheme",
    description: "Modernize farming with subsidized agricultural machinery and equipment.",
    benefits: [
      "40-50% subsidy on tractors",
      "60% subsidy on power tillers",
      "Custom hiring center establishment support",
      "Training on modern farming techniques"
    ],
    eligibility: "Individual farmers, Self Help Groups, and Farmer Producer Organizations",
    documents: ["Income certificate", "Land records", "Category certificate"],
    processingTime: "30-45 days"
  },
  "raita-samruddhi": {
    name: "Raita Samruddhi Scheme",
    description: "Comprehensive prosperity scheme focusing on sustainable farming and income enhancement.",
    benefits: [
      "Interest-free loans up to ₹3 lakh",
      "Crop insurance premium support",
      "Drip irrigation system subsidy",
      "Market linkage support"
    ],
    eligibility: "Active farmers with minimum 1 acre of agricultural land",
    documents: ["Farmer ID card", "Land ownership proof", "Income affidavit"],
    processingTime: "20-35 days"
  },
  "krishi-bhagya": {
    name: "Krishi Bhagya Scheme",
    description: "Fortune scheme for agriculture focusing on water conservation and irrigation support.",
    benefits: [
      "Borewell drilling subsidy up to ₹1.5 lakh",
      "Micro irrigation system support",
      "Water harvesting structure subsidy",
      "Solar pump installation support"
    ],
    eligibility: "Farmers in drought-prone areas with valid land documents",
    documents: ["Survey settlement records", "Water source availability certificate"],
    processingTime: "45-60 days"
  },
  "karnataka-raita-vidya-nidhi": {
    name: "Karnataka Raita Vidya Nidhi Scholarship",
    description: "Educational scholarship for children of farmers pursuing agricultural studies.",
    benefits: [
      "₹25,000 annual scholarship for graduation",
      "₹50,000 for post-graduation students",
      "Free hostel accommodation",
      "Study material allowance"
    ],
    eligibility: "Children of farmers enrolled in agricultural courses",
    documents: ["Academic transcripts", "Farmer parent's land records", "Income certificate"],
    processingTime: "10-15 days"
  },
  "pm-kisan": {
    name: "PM-KISAN Scheme",
    description: "Direct income support of ₹6,000 per year to small and marginal farmers.",
    benefits: [
      "₹2,000 per installment (3 times a year)",
      "Direct bank transfer",
      "No paperwork for eligible farmers",
      "Coverage for all small & marginal farmers"
    ],
    eligibility: "Small and marginal farmers with cultivable land",
    documents: ["Aadhaar card", "Bank account details", "Land ownership records"],
    processingTime: "7-15 days"
  }
};

interface GovernmentSchemesFormProps {
  onSchemeInfoOpen: (schemeKey: string, schemeData: any) => void;
}

export const GovernmentSchemesForm: React.FC<GovernmentSchemesFormProps> = ({ onSchemeInfoOpen }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    farmerName: "",
    mobileNumber: "",
    aadhaarNumber: "",
    address: "",
    district: "",
    taluka: "",
    village: "",
    landHolding: "",
    cropType: "",
    selectedScheme: "",
    additionalInfo: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.farmerName || !formData.mobileNumber || !formData.selectedScheme) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);

    // Show scheme information popup
    const schemeData = GOVERNMENT_SCHEMES[formData.selectedScheme as keyof typeof GOVERNMENT_SCHEMES];
    if (schemeData) {
      onSchemeInfoOpen(formData.selectedScheme, schemeData);
    }

    // Success message
    toast({
      title: "Application Submitted Successfully!",
      description: `Your application for ${schemeData?.name} has been submitted. You'll receive updates on your registered mobile number.`,
    });

    // Reset form
    setFormData({
      farmerName: "",
      mobileNumber: "",
      aadhaarNumber: "",
      address: "",
      district: "",
      taluka: "",
      village: "",
      landHolding: "",
      cropType: "",
      selectedScheme: "",
      additionalInfo: ""
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border border-green-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200">
        <CardTitle className="flex items-center text-2xl text-green-800">
          <FileText className="mr-3 h-6 w-6" />
          Government Schemes Application
        </CardTitle>
        <CardDescription className="text-green-600">
          Apply for various agricultural schemes and subsidies to grow your farming business
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmerName">Full Name *</Label>
                <Input
                  id="farmerName"
                  placeholder="Enter your full name"
                  value={formData.farmerName}
                  onChange={(e) => handleInputChange("farmerName", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input
                  id="mobileNumber"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                <Input
                  id="aadhaarNumber"
                  placeholder="Enter 12-digit Aadhaar number"
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleInputChange("aadhaarNumber", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="landHolding">Land Holding (in acres)</Label>
                <Input
                  id="landHolding"
                  placeholder="e.g., 2.5 acres"
                  value={formData.landHolding}
                  onChange={(e) => handleInputChange("landHolding", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              Address Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="Enter district"
                  value={formData.district}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taluka">Taluka</Label>
                <Input
                  id="taluka"
                  placeholder="Enter taluka"
                  value={formData.taluka}
                  onChange={(e) => handleInputChange("taluka", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="village">Village</Label>
                <Input
                  id="village"
                  placeholder="Enter village"
                  value={formData.village}
                  onChange={(e) => handleInputChange("village", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Complete Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your complete address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Farming Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              Farming Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cropType">Primary Crop Type</Label>
                <Select value={formData.cropType} onValueChange={(value) => handleInputChange("cropType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="sugarcane">Sugarcane</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                    <SelectItem value="pulses">Pulses</SelectItem>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="mixed">Mixed Farming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="selectedScheme">Select Government Scheme *</Label>
                <Select value={formData.selectedScheme} onValueChange={(value) => handleInputChange("selectedScheme", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raita-shakthi">Raita Shakthi Scheme</SelectItem>
                    <SelectItem value="agricultural-mechanization">Agricultural Mechanization</SelectItem>
                    <SelectItem value="raita-samruddhi">Raita Samruddhi Scheme</SelectItem>
                    <SelectItem value="krishi-bhagya">Krishi Bhagya Scheme</SelectItem>
                    <SelectItem value="karnataka-raita-vidya-nidhi">Karnataka Raita Vidya Nidhi Scholarship</SelectItem>
                    <SelectItem value="pm-kisan">PM-KISAN Scheme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Any specific requirements or queries?</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Share any additional information that might help with your application..."
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Calendar className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 