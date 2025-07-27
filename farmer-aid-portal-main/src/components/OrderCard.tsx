import { Package, Truck, CheckCircle, Clock, DollarSign, Eye, MoreHorizontal, X } from "lucide-react";
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
} from "@/components/ui/dialog";
import { useUpdateOrderStatus } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface OrderCardProps {
  id: string;
  product: string;
  quantity: string;
  supplier: string;
  orderDate: string;
  deliveryDate: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  amount: string;
  createdAt?: string;
  updatedAt?: string;
}

export const OrderCard = ({
  id,
  product,
  quantity,
  supplier,
  orderDate,
  deliveryDate,
  status,
  amount,
  createdAt,
  updatedAt,
}: OrderCardProps) => {
  const [trackingOpen, setTrackingOpen] = useState(false);
  const updateOrderStatus = useUpdateOrderStatus();
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return Clock;
      case "shipped":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "cancelled":
        return X;
      default:
        return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCancelOrder = async () => {
    try {
      await updateOrderStatus.mutateAsync({ id, status: "cancelled" });
      toast({
        title: "Order Cancelled",
        description: `Order for ${product} has been cancelled successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (newStatus: "pending" | "shipped" | "delivered" | "cancelled") => {
    try {
      await updateOrderStatus.mutateAsync({ id, status: newStatus });
      toast({
        title: "Order Updated",
        description: `Order status updated to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const StatusIcon = getStatusIcon(status);

  return (
    <Card className="group hover:shadow-earth transition-all duration-300 border-border/50 hover:border-primary/20 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(status)} variant="outline">
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {id.slice(0, 8)}...
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTrackingOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Track Order
              </DropdownMenuItem>
              {status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusUpdate("shipped")}>
                    <Truck className="mr-2 h-4 w-4" />
                    Mark as Shipped
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel Order
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this order for "{product}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Order</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelOrder}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {status === "shipped" && (
                <DropdownMenuItem onClick={() => handleStatusUpdate("delivered")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {product}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{supplier}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-semibold text-foreground block">{quantity}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Supplier:</span>
            <span className="font-semibold text-foreground block">{supplier}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Order Date:</span>
            <span className="font-semibold text-foreground block">{orderDate}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Delivery Date:</span>
            <span className="font-semibold text-foreground block">{deliveryDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="text-lg font-bold text-accent">{amount}</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="hover:bg-primary/10 hover:text-primary"
              onClick={() => setTrackingOpen(true)}
            >
              <Eye className="mr-1 h-3 w-3" />
              Track
            </Button>
            {status === "pending" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="hover:bg-destructive/10 hover:text-destructive">
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this order for "{product}"?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelOrder}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>

      {/* Order Tracking Dialog */}
      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Order Tracking</span>
            </DialogTitle>
            <DialogDescription>Track your order for {product}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Order Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Order ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{id}</code></div>
                  <div><span className="text-muted-foreground">Product:</span> {product}</div>
                  <div><span className="text-muted-foreground">Quantity:</span> {quantity}</div>
                  <div><span className="text-muted-foreground">Supplier:</span> {supplier}</div>
                  <div><span className="text-muted-foreground">Amount:</span> <span className="font-semibold text-accent">{amount}</span></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Delivery Schedule</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Order Date:</span> {orderDate}</div>
                  <div><span className="text-muted-foreground">Expected Delivery:</span> {deliveryDate}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(status)} variant="outline">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Order Timeline</h4>
              <div className="space-y-3">
                <div className={`flex items-center space-x-3 p-2 rounded-lg ${status === "pending" || status === "shipped" || status === "delivered" ? "bg-green-50 text-green-800" : "bg-muted"}`}>
                  <Clock className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">Order Placed</div>
                    <div className="text-xs text-muted-foreground">{orderDate}</div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                
                <div className={`flex items-center space-x-3 p-2 rounded-lg ${status === "shipped" || status === "delivered" ? "bg-blue-50 text-blue-800" : "bg-muted"}`}>
                  <Truck className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">Order Shipped</div>
                    <div className="text-xs text-muted-foreground">
                      {status === "shipped" || status === "delivered" ? "In transit" : "Pending"}
                    </div>
                  </div>
                  {(status === "shipped" || status === "delivered") && <CheckCircle className="h-4 w-4 text-blue-600" />}
                </div>
                
                <div className={`flex items-center space-x-3 p-2 rounded-lg ${status === "delivered" ? "bg-green-50 text-green-800" : "bg-muted"}`}>
                  <CheckCircle className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">Order Delivered</div>
                    <div className="text-xs text-muted-foreground">
                      {status === "delivered" ? deliveryDate : `Expected: ${deliveryDate}`}
                    </div>
                  </div>
                  {status === "delivered" && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
              </div>
            </div>

            {(createdAt || updatedAt) && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">System Information</h4>
                <div className="space-y-1 text-sm">
                  {createdAt && <div><span className="text-muted-foreground">Created:</span> {formatDate(createdAt)}</div>}
                  {updatedAt && <div><span className="text-muted-foreground">Last Updated:</span> {formatDate(updatedAt)}</div>}
                </div>
              </div>
            )}

            {status === "pending" && (
              <div className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => handleStatusUpdate("shipped")}
                  disabled={updateOrderStatus.isPending}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Mark as Shipped
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-1" variant="destructive">
                      <X className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this order? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Order</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelOrder}>
                        Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};