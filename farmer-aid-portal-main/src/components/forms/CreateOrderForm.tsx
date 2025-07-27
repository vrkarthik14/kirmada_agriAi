import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateOrder } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

// Form validation schema
const orderSchema = z.object({
  product: z.string().min(1, "Product is required").min(3, "Product must be at least 3 characters"),
  quantity: z.string().min(1, "Quantity is required"),
  supplier: z.string().min(1, "Supplier is required"),
  orderDate: z.string().min(1, "Order date is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  status: z.enum(["pending", "shipped", "delivered", "cancelled"]),
  amount: z.string().min(1, "Amount is required"),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface CreateOrderFormProps {
  trigger?: React.ReactNode;
}

export const CreateOrderForm = ({ trigger }: CreateOrderFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      product: "",
      quantity: "",
      supplier: "",
      orderDate: "",
      deliveryDate: "",
      status: "pending",
      amount: "",
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    try {
      await createOrder.mutateAsync(data as any);
      toast({
        title: "Order Created",
        description: `Order for ${data.product} has been created successfully.`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const productOptions = [
    "Organic Fertilizer", "Pesticide Spray", "Herbicide", "Fungicide", "Insecticide",
    "Seeds - Wheat", "Seeds - Rice", "Seeds - Corn", "Seeds - Barley",
    "Farm Equipment", "Irrigation Supplies", "Soil Testing Kit",
    "Harvesting Tools", "Plowing Equipment", "Tractor Parts"
  ];

  const supplierOptions = [
    "GreenGrow Supplies", "AgroChem Ltd", "SeedTech Solutions", "FarmTech Industries",
    "AgriSupply Co", "CropCare Solutions", "FarmLife Products", "AgriTools Inc",
    "GrowMore Supplies", "CropMaster Ltd", "FarmEssentials Co", "AgriCare Solutions"
  ];

  // Helper to format today's date for date input
  const today = new Date().toISOString().split('T')[0];
  
  // Helper to format a date 7 days from now
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const defaultDeliveryDate = nextWeek.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="bg-gradient-earth text-accent-foreground hover:shadow-warm">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Place a new order for agricultural supplies and equipment.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product */}
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productOptions.map((product) => (
                          <SelectItem key={product} value={product}>
                            {product}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other (specify in quantity)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 500 kg, 50 liters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supplier */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supplierOptions.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Order Date */}
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        defaultValue={today}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delivery Date */}
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        min={today}
                        defaultValue={defaultDeliveryDate}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ₹12,500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createOrder.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrder.isPending}
                className="bg-gradient-earth text-accent-foreground hover:shadow-warm"
              >
                {createOrder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 