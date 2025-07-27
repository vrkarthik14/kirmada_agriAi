import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ContractProgressTracker } from "./ContractProgressTracker";
import jsPDF from 'jspdf';
import { 
  FileText, 
  User, 
  MapPin, 
  Calendar, 
  Package, 
  DollarSign, 
  Truck,
  Award,
  MessageCircle,
  Eye,
  CheckCircle,
  Edit,
  Download
} from "lucide-react";

interface ContractProps {
  id?: string;
  title: string;
  crop: string;
  cropType: string;
  location: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  estimatedYield: string;
  currentBid?: string;
  agreedPrice?: string;
  farmerName?: string;
  buyerName?: string;
  deliveryTerms?: string;
  qualityGrade?: string;
  contractNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  farmerId?: string;
  buyerId?: string;
  originalBidId?: string;
  currentStage?: string;
}

const contractStages = [
  { value: "initial_payment", label: "Initial Payment" },
  { value: "soil_prep", label: "Soil Preparation" },
  { value: "sowing", label: "Sowing" },
  { value: "fertilizing", label: "Fertilizing" },
  { value: "second_payment", label: "Second Payment" },
  { value: "irrigation", label: "Irrigation" },
  { value: "harvesting", label: "Harvesting" },
  { value: "final_payment", label: "Final Payment" },
  { value: "delivery", label: "Delivery" }
];

export const ContractCard = (contract: ContractProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  // Set default currentStage if none exists
  const [currentStage, setCurrentStage] = useState(contract.currentStage || "sowing");
  const [tempStage, setTempStage] = useState(contract.currentStage || "sowing");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  // Load progress from localStorage when component mounts
  useEffect(() => {
    const contractProgressKey = `contract_progress_${contract.id}`;
    const savedProgress = localStorage.getItem(contractProgressKey);
    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress);
        setCurrentStage(progressData.currentStage);
        setTempStage(progressData.currentStage);
      } catch (error) {
        console.error("Error loading saved progress:", error);
      }
    }
  }, [contract.id]);

  // Use currentStage to determine if contract should show as completed
  // If there's a currentStage set, treat as "active" regardless of API status
  const contractStatus = currentStage ? "active" : (contract.status || "active");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "upcoming": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStageUpdate = async (newStage: string) => {
    try {
      setCurrentStage(newStage);
      setTempStage(newStage);
      setIsEditingProgress(false);
      
      // Save progress to API so buyer can see the updates
      const progressData = {
        contractId: contract.id,
        currentStage: newStage,
        updatedAt: new Date().toISOString(),
        updatedBy: "farmer"
      };
      
      try {
        const response = await fetch(`http://localhost:8001/api/contract-progress/${contract.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(progressData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.error("Failed to save progress to API");
        }
      } catch (apiError) {
        console.error("API Error:", apiError);
        // Fallback to localStorage if API fails
        localStorage.setItem(`contract_progress_${contract.id}`, JSON.stringify(progressData));
      }
      
    } catch (error) {
      console.error("Failed to update contract stage:", error);
    }
  };

  const handleTempStageChange = (newStage: string) => {
    setTempStage(newStage); // Only update temp stage, not the actual current stage
  };

  const handleEditToggle = () => {
    if (isEditingProgress) {
      // If canceling edit, reset temp stage to current stage
      setTempStage(currentStage);
    } else {
      // If starting edit, set temp stage to current stage
      setTempStage(currentStage);
    }
    setIsEditingProgress(!isEditingProgress);
  };

  const handleSaveProgress = () => {
    handleStageUpdate(tempStage);
  };

  const generateDummyData = () => {
    return {
      farmerName: contract.farmerName || "Rajesh Kumar",
      farmerAddress: "789 Test Lane, Indiranagar, Bangalore, Karnataka, 560038",
      buyerName: "Buyer",
      buyerAddress: "Cyber Heights, 1st, Rd Number 2, Banjara Hills, Hyderabad, Telangana 500034, India",
      contractDate: new Date().toLocaleDateString(),
      cropName: contract.crop || "Wheat",
      quantity: contract.estimatedYield || "100 kg",
      pricePerKg: contract.agreedPrice || "₹50/kg",
      totalAmount: contract.agreedPrice || "₹5,000",
      deliveryDate: contract.duration || "30 days from signing",
      qualitySpecifications: `Grade A ${contract.crop || "Wheat"} - Premium quality with moisture content below 12%`
    };
  };

  const downloadContract = (language: string) => {
    const data = generateDummyData();
    const userType = "farmer"; // Since this is farmer portal
    
    try {
      if (language === "english") {
        generateEnglishContract(data, userType);
      }
      setSelectedLanguage("");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const generateEnglishContract = (data: any, userType: string) => {
    try {
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 8;
      let currentY = 20;
      
      // Helper function to add text with word wrap
      const addText = (text: string, fontSize = 12, isBold = false, indent = 0) => {
        if (isBold) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.setFontSize(fontSize);
        
        const maxWidth = pageWidth - margin * 2 - indent;
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
          if (currentY > 280) { // Add new page if needed
            doc.addPage();
            currentY = 20;
          }
          doc.text(line, margin + indent, currentY);
          currentY += lineHeight;
        });
        currentY += 2; // Extra spacing
      };
      
      // Title
      addText("DIGITAL CONTRACT AGREEMENT", 16, true);
      currentY += 5;
      
      // Section 1: Parties to the Agreement
      addText("1. Parties to the Agreement", 14, true);
      currentY += 2;
      
      addText("Farmer Details", 12, true);
      addText(`- Name: ${data.farmerName}`, 10, false, 5);
      addText(`- Address: ${data.farmerAddress}`, 10, false, 5);
      addText(`- Contact Number: ${data.farmerPhone}`, 10, false, 5);
      addText(`- Farmer ID: ${data.farmerId}`, 10, false, 5);
      currentY += 3;
      
      addText("Buyer Details", 12, true);
      addText(`- Name: ${data.buyerName}`, 10, false, 5);
      addText(`- Address: ${data.buyerAddress}`, 10, false, 5);
      addText(`- Contact Number: ${data.buyerPhone}`, 10, false, 5);
      addText(`- Buyer ID: ${data.buyerId}`, 10, false, 5);
      currentY += 5;
      
      // Section 2: Crop Transaction Details
      addText("2. Crop Transaction Details", 14, true);
      addText(`- Crop: ${data.cropName}`, 10, false, 5);
      addText(`- Crop Type: ${data.cropVariety}`, 10, false, 5);
      addText(`- Estimated Yield: ${data.quantity}`, 10, false, 5);
      addText(`- Harvest Duration: 20 days from date of sowing`, 10, false, 5);
      addText(`- Minimum Quotation (per unit): ${data.ratePerQuintal}`, 10, false, 5);
      addText(`- Expected Delivery Window: ${data.deliveryDate}`, 10, false, 5);
      currentY += 5;
      
      // Section 3: Payment Elections
      addText("3. Payment Elections", 14, true);
      addText("The buyer agrees to disburse funds to the farmer in milestone-based installments, as per the following schedule:", 10);
      addText("1. 25% at time of sowing verification", 10, false, 5);
      addText("2. 25% at mid-growth inspection", 10, false, 5);
      addText("3. 40% upon successful harvest and quality approval", 10, false, 5);
      addText("4. 10% upon final delivery confirmation", 10, false, 5);
      addText("All payments will be transferred via Bank Transfer / UPI, to the farmer's registered account.", 10);
      currentY += 5;
      
      // Section 4: Logistics and Quality Assurance
      addText("4. Logistics and Quality Assurance", 14, true);
      addText("Transportation logistics for pickup and delivery of the produce will be handled and arranged by the buyer.", 10);
      addText("Produce Quality Check will be conducted using AI-powered image processing tools to validate grading and freshness before final acceptance.", 10);
      currentY += 5;
      
      // Section 5: Crop Insurance Clause
      addText("5. Crop Insurance Clause", 14, true);
      addText("In case of natural calamities (drought, flood, hailstorm, etc.) or severe weather disruptions affecting the crop:", 10);
      addText("- The farmer is eligible to claim compensation under the linked government crop insurance scheme (e.g., PMFBY).", 10, false, 5);
      addText("- Buyer and farmer agree to cooperate for claim verification and documentation.", 10, false, 5);
      addText("- In the event of total crop failure, the buyer will not be liable to disburse further payments beyond the last verified stage.", 10, false, 5);
      currentY += 5;
      
      // Section 6: Additional Clauses
      addText("6. Additional Clauses", 14, true);
      addText("Both parties agree to fulfill their obligations in good faith and maintain transparency in communication.", 10);
      addText("Any disputes arising from this contract will be settled through mutual negotiation or as per laws applicable in [State Jurisdiction].", 10);
      currentY += 10;
      
      // Section 7: Signatures
      addText("7. Signatures", 14, true);
      addText("I, the undersigned, agree to the terms outlined in this Digital Contract:", 10);
      currentY += 10;
      
      // Signature boxes
      const col1X = margin;
      const col2X = pageWidth / 2 + 10;
      const sigY = currentY;
      
      // Farmer signature
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Farmer Signature", col1X, sigY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${data.farmerName}`, col1X, sigY + 15);
      doc.text(`Date: ${data.contractDate}`, col1X, sigY + 25);
      doc.text("Signature: _____________________", col1X, sigY + 35);
      
      // Buyer signature
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Buyer Signature", col2X, sigY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${data.buyerName}`, col2X, sigY + 15);
      doc.text(`Date: ${data.contractDate}`, col2X, sigY + 25);
      doc.text("Signature: _____________________", col2X, sigY + 35);
      
      // Footer
      currentY = sigY + 50;
      addText(`Contract Number: ${data.contractNumber}`, 8);
      addText(`Generated on: ${data.contractDate}`, 8);
      addText("This is a digitally generated contract. For original copy, please contact the respective parties.", 8);
      
      // Save the PDF
      doc.save(`Contract_${data.contractNumber}_English.pdf`);
    } catch (error) {
      console.error("Error in English PDF generation:", error);
      throw error;
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg leading-tight">{contract.title}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center">
                <Package className="h-4 w-4 mr-1" />
                {contract.crop} • {contract.cropType}
              </p>
            </div>
            <Badge className={getStatusColor(contractStatus)} variant="outline">
              {contractStatus.charAt(0).toUpperCase() + contractStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Farmer Information */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Contracted Farmer</span>
              </div>
              <span className="text-sm font-bold text-green-700">
                {contract.farmerName || "Unknown Farmer"}
              </span>
            </div>
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Agreed Price:
                </span>
                <span className="font-bold text-green-600">{contract.agreedPrice || contract.currentBid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  Quantity:
                </span>
                <span className="font-medium">{contract.estimatedYield}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Quality:
                </span>
                <span className="font-medium">{contract.qualityGrade || "Standard"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Truck className="h-3 w-3 mr-1" />
                  Delivery:
                </span>
                <span className="font-medium text-xs">{contract.deliveryTerms || "Standard"}</span>
              </div>
            </div>
          </div>

          {/* Location and Duration */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {contract.location}
            </span>
            <span className="text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {contract.duration}
            </span>
          </div>

          {/* Contract Progress Tracker */}
          {(contractStatus === "active" || contractStatus === "completed") && (
            <div className="pt-4">
              <ContractProgressTracker 
                key={currentStage} // Force re-render when currentStage changes
                currentStage={currentStage} 
                contractStatus={contractStatus}
                isEditable={false} // Remove click-to-edit on tracker itself
                onStageUpdate={handleStageUpdate}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 hover:bg-primary/10 hover:text-primary"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Contract Details
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Contract Active
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Contract Details</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contract Header */}
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <h3 className="text-xl font-bold text-gray-800">{contract.title}</h3>
              <p className="text-gray-600 mt-1">{contract.crop} • {contract.cropType}</p>
              <Badge className={getStatusColor(contractStatus)} variant="outline">
                {contractStatus.charAt(0).toUpperCase() + contractStatus.slice(1)}
              </Badge>
            </div>

            {/* Parties Involved */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Farmer (Supplier)
                </h4>
                <p className="text-green-700 font-medium">{contract.farmerName || "Unknown Farmer"}</p>
                <p className="text-xs text-green-600 mt-1">ID: {contract.farmerId || "N/A"}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Buyer (Purchaser)
                </h4>
                <p className="text-blue-700 font-medium">{contract.buyerName || "Buyer"}</p>
                <p className="text-xs text-blue-600 mt-1">ID: {contract.buyerId || "N/A"}</p>
              </div>
            </div>

            <Separator />

            {/* Contract Terms */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Contract Terms
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agreed Price:</span>
                    <span className="font-bold text-green-600 text-lg">{contract.agreedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{contract.estimatedYield}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Grade:</span>
                    <span className="font-medium">{contract.qualityGrade || "Standard"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{contract.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{contract.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Terms:</span>
                    <span className="font-medium text-sm">{contract.deliveryTerms || "Standard delivery"}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contract Notes */}
            {contract.contractNotes && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contract History
                </h4>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700">{contract.contractNotes}</p>
                </div>
              </div>
            )}

            {/* Contract Dates */}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Created: {formatDate(contract.createdAt)}</span>
              <span>Last Updated: {formatDate(contract.updatedAt)}</span>
            </div>

            <Separator />

            {/* Contract Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Contract Progress
                  <span className="ml-2 text-sm text-blue-600 font-medium">
                    ({contractStages.find(s => s.value === currentStage)?.label || currentStage})
                  </span>
                </h4>
                {/* Edit/Save/Cancel buttons */}
                <div className="flex gap-2">
                  {isEditingProgress ? (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSaveProgress}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Save Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditToggle}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditToggle}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Progress
                    </Button>
                  )}
                </div>
              </div>
              
              {isEditingProgress && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Update Contract Stage:
                  </label>
                  <Select value={tempStage} onValueChange={handleTempStageChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select contract stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractStages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-600 mt-1">
                    Select the current stage of the contract. Click "Save Progress" to confirm.
                  </p>
                  
                  {/* Debug info */}
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <strong>Debug:</strong> Current: {currentStage} | Temp: {tempStage}
                  </div>
                </div>
              )}
              
              <ContractProgressTracker 
                key={currentStage} // Force re-render when currentStage changes
                currentStage={currentStage} 
                contractStatus={contractStatus}
                isEditable={false} // Remove click-to-edit on tracker itself
                onStageUpdate={handleStageUpdate}
              />
            </div>

            <Separator />

            {/* Download Contract Section */}
            <div className="space-y-3">
              <Button 
                onClick={() => downloadContract("english")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Contract
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};