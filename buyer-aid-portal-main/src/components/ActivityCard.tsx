import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Phone, User, Heart } from "lucide-react";
import { useState } from "react";

interface ActivityCardProps {
  title: string;
  agenda: "announcement" | "requirement" | "workshop";
  details: string;
  contactPerson: string;
  contactNumber: string;
  date: string;
  location?: string;
  category?: string;
}

const ActivityCard = ({
  title,
  agenda,
  details,
  contactPerson,
  contactNumber,
  date,
  location,
  category
}: ActivityCardProps) => {
  const [showInterest, setShowInterest] = useState(false);

  const getAgendaBadgeVariant = (agenda: string) => {
    switch (agenda) {
      case "announcement":
        return "bg-green-100 text-green-800 border-green-200";
      case "requirement":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "workshop":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-200 border border-border">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-foreground text-sm leading-tight">{title}</h3>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getAgendaBadgeVariant(agenda)}`}
            >
              {agenda}
            </Badge>
          </div>
          {category && (
            <p className="text-xs text-muted-foreground">{category}</p>
          )}
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{date}</span>
        </div>

        {/* Details */}
        <p className="text-sm text-foreground line-clamp-2">{details}</p>

        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{contactPerson}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{contactNumber}</span>
          </div>
        </div>

        {/* Show Interest Button */}
        <Button
          variant={showInterest ? "default" : "outline"}
          size="sm"
          className="w-full flex items-center space-x-2"
          onClick={() => setShowInterest(!showInterest)}
        >
          <Heart className={`w-3 h-3 ${showInterest ? "fill-current" : ""}`} />
          <span>{showInterest ? "Interest Shown" : "Show Interest"}</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActivityCard; 