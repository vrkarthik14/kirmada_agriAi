import React from "react";
import { X, CheckCircle, Clock, FileText, Users, DollarSign, Calendar, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SchemeData {
  name: string;
  description: string;
  benefits: string[];
  eligibility: string;
  documents: string[];
  processingTime: string;
}

interface SchemeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeData: SchemeData | null;
  schemeKey: string;
}

export const SchemeInfoModal: React.FC<SchemeInfoModalProps> = ({
  isOpen,
  onClose,
  schemeData,
  schemeKey
}) => {
  if (!schemeData) return null;

  const getSchemeColor = (key: string) => {
    const colors = {
      "raita-shakthi": "bg-green-100 text-green-800 border-green-200",
      "agricultural-mechanization": "bg-blue-100 text-blue-800 border-blue-200",
      "raita-samruddhi": "bg-purple-100 text-purple-800 border-purple-200",
      "krishi-bhagya": "bg-orange-100 text-orange-800 border-orange-200",
      "karnataka-raita-vidya-nidhi": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "pm-kisan": "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
    return colors[key as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-green-800 flex items-center">
              <CheckCircle className="mr-3 h-6 w-6 text-green-600" />
              Application Submitted Successfully!
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${getSchemeColor(schemeKey)}`}>
            <h3 className="text-xl font-semibold mb-2">{schemeData.name}</h3>
            <p className="text-sm opacity-90">{schemeData.description}</p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Processing Timeline */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Processing Timeline</h4>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  <Calendar className="h-3 w-3 mr-1" />
                  {schemeData.processingTime}
                </Badge>
                <span className="text-sm text-blue-600">
                  You'll receive updates on your registered mobile number
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Scheme Benefits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center text-foreground">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              Scheme Benefits
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schemeData.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-green-800">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Eligibility Criteria */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center text-foreground">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              Eligibility Criteria
            </h4>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800">{schemeData.eligibility}</p>
            </div>
          </div>

          {/* Required Documents */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center text-foreground">
              <FileText className="h-5 w-5 text-orange-600 mr-2" />
              Required Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {schemeData.documents.map((document, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <FileText className="h-3 w-3 text-orange-600" />
                  <span className="text-sm text-orange-800">{document}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Next Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center text-foreground">
              <Info className="h-5 w-5 text-purple-600 mr-2" />
              What Happens Next?
            </h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium text-purple-800">Application Review</p>
                  <p className="text-sm text-purple-600">Your application will be verified by the concerned department officials</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium text-purple-800">Document Verification</p>
                  <p className="text-sm text-purple-600">You may be contacted for additional documents or clarifications</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium text-purple-800">Approval & Disbursement</p>
                  <p className="text-sm text-purple-600">Once approved, benefits will be disbursed as per scheme guidelines</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <h5 className="font-semibold text-gray-800 mb-2">Need Help?</h5>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• Visit your nearest Agriculture Department office</p>
                <p>• Call the Farmer Helpline: <span className="font-medium text-green-600">18001801551</span></p>
                <p>• Check status online at: <span className="font-medium text-blue-600">agri.kar.gov.in</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Application ID will be sent via SMS within 24 hours
          </p>
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Got it, Thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 