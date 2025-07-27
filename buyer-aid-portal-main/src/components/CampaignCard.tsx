import { MapPin, Calendar, TrendingUp, DollarSign, Users, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteCampaign } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface CampaignCardProps {
  id?: string;
  title: string;
  crop: string;
  cropType: string;
  location: string;
  duration: string;
  status: "active" | "completed" | "upcoming";
  estimatedYield: string;
  minimumQuotation: string;
  currentBid: string;
  totalBids: number;
  createdAt?: string;
  updatedAt?: string;
}

export const CampaignCard = ({
  id,
  title,
  crop,
  cropType,
  location,
  duration,
  status,
  estimatedYield,
  minimumQuotation,
  currentBid,
  totalBids,
  createdAt,
  updatedAt,
}: CampaignCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const deleteCampaign = useDeleteCampaign();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "upcoming":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleDelete = async () => {
    if (!id) {
      toast({
        title: "Error",
        description: "Campaign ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteCampaign.mutateAsync(id);
      toast({
        title: "Campaign Deleted",
        description: `${title} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getCurrentStatus = () => {
    if (status === "active") {
      return "Active";
    } else if (status === "completed") {
      return "Completed";
    } else if (status === "upcoming") {
      return "Upcoming";
    }
    return "Unknown";
  };

  return (
    <Card className="group hover:shadow-earth transition-all duration-300 border-border/50 hover:border-primary/20 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(status)} variant="outline">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {crop}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Campaign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Campaign
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{cropType}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{location}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{duration}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <div>
              <span className="text-muted-foreground">Est. Yield:</span>
              <span className="font-semibold text-accent block">{estimatedYield}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <div>
              <span className="text-muted-foreground">Min. Quote:</span>
              <span className="font-semibold text-foreground block">{minimumQuotation}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{totalBids} bids</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Current Status</span>
              <span className="text-lg font-bold text-primary block">
                {getCurrentStatus()}
              </span>
            </div>
          </div>
        </div>

        <Button 
          size="sm" 
          variant="outline" 
          className="w-full hover:bg-primary/10 hover:text-primary"
          onClick={() => setDetailsOpen(true)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Campaign Details
        </Button>
      </CardContent>

      {/* Campaign Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <Badge className={getStatusColor(status)} variant="outline">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </DialogTitle>
            <DialogDescription>{cropType} Campaign Details</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Basic Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Crop:</span> {crop}</div>
                  <div><span className="text-muted-foreground">Type:</span> {cropType}</div>
                  <div><span className="text-muted-foreground">Location:</span> {location}</div>
                  <div><span className="text-muted-foreground">Duration:</span> {duration}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Financial Details</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Estimated Yield:</span> {estimatedYield}</div>
                  <div><span className="text-muted-foreground">Minimum Quote:</span> {minimumQuotation}</div>
                  <div><span className="text-muted-foreground">Current Bid:</span> <span className="font-semibold text-primary">{currentBid}</span></div>
                  <div><span className="text-muted-foreground">Total Bids:</span> {totalBids}</div>
                </div>
              </div>
            </div>

            {(createdAt || updatedAt) && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Timeline</h4>
                <div className="space-y-1 text-sm">
                  {createdAt && <div><span className="text-muted-foreground">Created:</span> {formatDate(createdAt)}</div>}
                  {updatedAt && <div><span className="text-muted-foreground">Last Updated:</span> {formatDate(updatedAt)}</div>}
                  {id && <div><span className="text-muted-foreground">Campaign ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{id}</code></div>}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button className="flex-1" variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Campaign
              </Button>
              <Button className="flex-1" variant="outline">
                Share Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};