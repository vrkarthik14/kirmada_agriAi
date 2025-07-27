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
import { Textarea } from "@/components/ui/textarea";
import { useCreateCampaign } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

// Form validation schema
const campaignSchema = z.object({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  crop: z.string().min(1, "Crop is required"),
  cropType: z.string().min(1, "Crop type is required"),
  location: z.string().min(1, "Location is required"),
  duration: z.string().min(1, "Duration is required"),
  status: z.enum(["active", "completed", "upcoming"]),
  estimatedYield: z.string().min(1, "Estimated yield is required"),
  minimumQuotation: z.string().min(1, "Minimum quotation is required"),
  currentBid: z.string().min(1, "Current bid is required"),
  totalBids: z.number().min(0, "Total bids must be 0 or greater"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CreateCampaignFormProps {
  trigger?: React.ReactNode;
}

export const CreateCampaignForm = ({ trigger }: CreateCampaignFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createCampaign = useCreateCampaign();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      crop: "",
      cropType: "",
      location: "",
      duration: "",
      status: "active",
      estimatedYield: "",
      minimumQuotation: "",
      currentBid: "",
      totalBids: 0,
    },
  });

  const onSubmit = async (data: CampaignFormData) => {
    try {
      await createCampaign.mutateAsync(data as any);
      toast({
        title: "Campaign Created",
        description: `${data.title} has been created successfully.`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cropOptions = [
    "Wheat", "Rice", "Corn", "Barley", "Oats", "Soybean", "Cotton", "Sugarcane",
    "Potato", "Tomato", "Onion", "Garlic", "Carrot", "Cabbage", "Cauliflower"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="bg-gradient-earth text-accent-foreground hover:shadow-warm">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a new crop campaign to advertise your produce and receive bids from buyers.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Campaign Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Wheat Harvest 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Crop */}
              <FormField
                control={form.control}
                name="crop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cropOptions.map((crop) => (
                          <SelectItem key={crop} value={crop}>
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Crop Type */}
              <FormField
                control={form.control}
                name="cropType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Organic Basmati" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., North Field, Punjab" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jan 2025 - May 2025" {...field} />
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Yield */}
              <FormField
                control={form.control}
                name="estimatedYield"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Yield</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 4.2 tons/hectare" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Minimum Quotation */}
              <FormField
                control={form.control}
                name="minimumQuotation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Quotation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ₹25,000/ton" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Bid */}
              <FormField
                control={form.control}
                name="currentBid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Bid</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ₹28,500/ton" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Bids */}
              <FormField
                control={form.control}
                name="totalBids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Bids</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
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
                disabled={createCampaign.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCampaign.isPending}
                className="bg-gradient-earth text-accent-foreground hover:shadow-warm"
              >
                {createCampaign.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Campaign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 