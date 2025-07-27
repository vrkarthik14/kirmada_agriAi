import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  actionText: string;
}

export const FeatureCard = ({
  title,
  description,
  icon: Icon,
  features,
  actionText,
}: FeatureCardProps) => {
  const { toast } = useToast();

  const handleActionClick = () => {
    // Different actions based on the feature type
    switch (title) {
      case "AI Crop Planner":
        toast({
          title: "🌱 AI Crop Planner",
          description: "Advanced crop planning with AI recommendations is coming soon! This will include yield predictions, optimal planting schedules, and investment analysis.",
        });
        break;
      case "Crop Health Support":
        toast({
          title: "🔬 Crop Health Support",
          description: "AI-powered disease detection through photo analysis is in development! Upload crop photos to get instant health assessments.",
        });
        break;
      case "Schemes Matcher":
        toast({
          title: "📋 Government Schemes Matcher",
          description: "Personalized government scheme recommendations are coming soon! Get matched with subsidies and programs you're eligible for.",
        });
        break;
      case "Voice Support":
        toast({
          title: "🎤 Voice Support",
          description: "Multilingual voice assistance is under development! Soon you'll be able to interact with AGRI-AI using voice commands in your native language.",
        });
        break;
      default:
        toast({
          title: `${title} Feature`,
          description: "This exciting feature is coming soon! Stay tuned for updates.",
        });
    }
  };

  return (
    <Card className="group hover:shadow-earth transition-all duration-300 border-border/50 hover:border-primary/20 h-full">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm text-muted-foreground">
              <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full mt-6 bg-gradient-primary hover:shadow-earth transition-all duration-300 group-hover:scale-105"
          size="sm"
          onClick={handleActionClick}
        >
          {actionText}
        </Button>
      </CardContent>
    </Card>
  );
};