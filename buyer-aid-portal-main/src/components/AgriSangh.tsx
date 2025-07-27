import { Button } from "@/components/ui/button";
import { Plus, FileText, Users } from "lucide-react";
import ActivityCard from "./ActivityCard";

const AgriSangh = () => {
  const activities = [
    {
      title: "Mandi Announcement - Fresh Wheat Available",
      agenda: "announcement" as const,
      details: "Fresh premium wheat available at competitive rates. Quality tested and certified organic wheat ready for immediate pickup.",
      contactPerson: "Rajesh Kumar",
      contactNumber: "+91 98765 43210",
      date: "Oct 2024 - Nov 2024",
      location: "North Field, Punjab",
      category: "Wheat - Premium Winter Wheat"
    },
    {
      title: "Labour Requirement for Harvesting",
      agenda: "requirement" as const,
      details: "Need experienced workers for rice harvesting. Accommodation and meals provided. Fair wages and timely payment guaranteed.",
      contactPerson: "Sunita Devi",
      contactNumber: "+91 87654 32109",
      date: "May 2024 - Sep 2024",
      location: "East Field, Punjab",
      category: "Rice - Organic Basmati"
    },
    {
      title: "Agri Machinery Requirement - Tractor Rental",
      agenda: "requirement" as const,
      details: "Looking for tractor rental for corn field preparation. Need for 3-4 days with operator. Prefer modern equipment.",
      contactPerson: "Amit Singh",
      contactNumber: "+91 76543 21098",
      date: "Mar 2025 - Jul 2025",
      location: "South Field, Haryana",
      category: "Corn - Premium Sweet Corn"
    },
    {
      title: "Organic Farming Workshop",
      agenda: "workshop" as const,
      details: "Learn sustainable organic farming techniques from experts. Free workshop covering soil health, natural pesticides, and crop rotation.",
      contactPerson: "Dr. Priya Sharma",
      contactNumber: "+91 65432 10987",
      date: "Nov 15, 2024",
      location: "Agricultural College, Ludhiana",
      category: "Educational Workshop"
    },
    {
      title: "Unlock AGRI-AI Premium Features Workshop",
      agenda: "workshop" as const,
      details: "Discover advanced AI-powered tools for crop planning, disease detection, and yield optimization. Interactive hands-on session.",
      contactPerson: "Tech Support Team",
      contactNumber: "+91 54321 09876",
      date: "Dec 5, 2024",
      location: "Online & Regional Centers",
      category: "Technology Training"
    },
    {
      title: "Seed Exchange Program Announcement",
      agenda: "announcement" as const,
      details: "High-quality seeds exchange program for diverse crop varieties. Exchange your surplus seeds for different varieties.",
      contactPerson: "Farming Cooperative",
      contactNumber: "+91 43210 98765",
      date: "Ongoing",
      location: "Multiple Locations",
      category: "Community Initiative"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to <span className="text-blue-600">AgriSangh</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your collaborative farming community platform for connecting with fellow farmers and sharing agricultural resources
          </p>
        </div>

        {/* Action Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Community Activities</h2>
            <p className="text-sm text-muted-foreground">
              Connect, share, and collaborate with fellow farmers in your area
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>My Activities</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>My Contacts</span>
            </Button>
            <Button 
              size="sm" 
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Activity</span>
            </Button>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, index) => (
            <ActivityCard
              key={index}
              title={activity.title}
              agenda={activity.agenda}
              details={activity.details}
              contactPerson={activity.contactPerson}
              contactNumber={activity.contactNumber}
              date={activity.date}
              location={activity.location}
              category={activity.category}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 p-6 bg-card rounded-lg border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">150+</div>
              <div className="text-sm text-muted-foreground">Active Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">75+</div>
              <div className="text-sm text-muted-foreground">Community Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">25+</div>
              <div className="text-sm text-muted-foreground">Successful Collaborations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgriSangh; 