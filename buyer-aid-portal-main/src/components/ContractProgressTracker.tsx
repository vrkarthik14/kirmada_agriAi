import React, { useState } from "react";
import { Check, DollarSign, Sprout, Wheat, Droplets, Scissors, Truck } from "lucide-react";

interface ContractProgressTrackerProps {
  currentStage: string;
  contractStatus?: "active" | "completed" | "upcoming";
  onStageUpdate?: (newStage: string) => void;
  isEditable?: boolean;
}

const stages = [
  { 
    id: "initial_payment", 
    label: "Initial Payment", 
    icon: DollarSign, 
    color: "bg-blue-500",
    description: "First payment to start the contract",
    details: "Usually 30% of total contract value"
  },
  { 
    id: "soil_prep", 
    label: "Soil Preparation", 
    icon: Sprout, 
    color: "bg-green-500",
    description: "Land preparation and soil testing",
    details: "Plowing, fertilizing, and preparing fields"
  },
  { 
    id: "sowing", 
    label: "Sowing", 
    icon: Wheat, 
    color: "bg-yellow-500",
    description: "Planting seeds in prepared soil",
    details: "Quality seeds planted at optimal timing"
  },
  { 
    id: "fertilizing", 
    label: "Fertilizing", 
    icon: Sprout, 
    color: "bg-orange-500",
    description: "Application of nutrients and fertilizers",
    details: "Organic and chemical fertilizers as needed"
  },
  { 
    id: "second_payment", 
    label: "Second Payment", 
    icon: DollarSign, 
    color: "bg-blue-500",
    description: "Mid-contract payment milestone",
    details: "Usually 40% of total contract value"
  },
  { 
    id: "irrigation", 
    label: "Irrigation", 
    icon: Droplets, 
    color: "bg-cyan-500",
    description: "Water management and irrigation",
    details: "Scheduled watering for optimal growth"
  },
  { 
    id: "harvesting", 
    label: "Harvesting", 
    icon: Scissors, 
    color: "bg-amber-500",
    description: "Crop harvesting and collection",
    details: "Timely harvest ensuring quality standards"
  },
  { 
    id: "final_payment", 
    label: "Final Payment", 
    icon: DollarSign, 
    color: "bg-blue-500",
    description: "Final payment upon completion",
    details: "Remaining 30% after quality verification"
  },
  { 
    id: "delivery", 
    label: "Delivery", 
    icon: Truck, 
    color: "bg-purple-500",
    description: "Product delivery to buyer",
    details: "Transportation and handover of produce"
  }
];

export const ContractProgressTracker: React.FC<ContractProgressTrackerProps> = ({
  currentStage,
  contractStatus = "active",
  onStageUpdate,
  isEditable = false
}) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.id === currentStage);
  };

  const isStageCompleted = (stageIndex: number) => {
    if (contractStatus === "completed") {
      return true;
    }
    return stageIndex < getCurrentStageIndex();
  };

  const isCurrentStage = (stageIndex: number) => {
    // If contract is completed, no stage is "current" (all are completed)
    if (contractStatus === "completed") {
      return false;
    }
    return stageIndex === getCurrentStageIndex();
  };

  const handleStageClick = (stageId: string) => {
    if (isEditable && onStageUpdate) {
      onStageUpdate(stageId);
    }
  };

  const handleStageHover = (stageId: string | null) => {
    setHoveredStage(stageId);
  };

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Contract Progress</h4>
        <span className="text-xs text-gray-500">
          {contractStatus === "completed" 
            ? <span className="text-green-600 font-medium">✅ Completed</span>
            : `Stage ${getCurrentStageIndex() + 1} of ${stages.length}`
          }
        </span>
      </div>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-3 left-2 right-2 h-0.5 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700 ease-in-out"
            style={{ 
              width: contractStatus === "completed" 
                ? "100%" 
                : `${(getCurrentStageIndex() / (stages.length - 1)) * 100}%` 
            }}
          />
        </div>

        {/* Stage Icons */}
        <div className="relative flex justify-between gap-1 px-1">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const completed = isStageCompleted(index);
            const current = isCurrentStage(index);
            const isHovered = hoveredStage === stage.id;
            
            return (
              <div
                key={stage.id}
                className={`flex flex-col items-center group cursor-help min-w-0 flex-1 relative`}
                onClick={() => handleStageClick(stage.id)}
                onMouseEnter={() => handleStageHover(stage.id)}
                onMouseLeave={() => handleStageHover(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                    <div className="font-semibold">{stage.description}</div>
                    <div className="text-gray-300 text-[10px] mt-1">{stage.details}</div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}

                {/* Icon Circle */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2
                    ${completed 
                      ? 'bg-green-500 text-white shadow-lg border-green-300 transform scale-105' 
                      : current 
                        ? `${stage.color} text-white shadow-lg border-white animate-pulse transform scale-105`
                        : 'bg-gray-200 text-gray-400 border-gray-300'
                    }
                    ${isHovered ? 'transform scale-125 shadow-xl ring-2 ring-blue-300 ring-opacity-50' : ''}
                  `}
                >
                  {completed ? (
                    <Check className="h-3 w-3 animate-in fade-in duration-300" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>

                {/* Stage Label */}
                <span 
                  className={`
                    text-[10px] mt-1 text-center leading-tight truncate w-full transition-colors duration-200
                    ${completed 
                      ? 'text-green-600 font-medium' 
                      : current 
                        ? 'text-gray-800 font-medium'
                        : 'text-gray-400'
                    }
                    ${isHovered ? 'text-blue-600 font-semibold' : ''}
                  `}
                >
                  {stage.label}
                </span>

                {/* Current Stage Indicator */}
                {current && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 animate-pulse shadow-sm" />
                )}

                {/* Hover Ring Effect */}
                {isHovered && (
                  <div className="absolute inset-0 top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 border-2 border-blue-400 rounded-full animate-ping opacity-30"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Groups */}
      <div className="mt-3 flex justify-between text-[10px] text-gray-500 px-2">
        <span className="text-center font-medium">Initial</span>
        <span className="text-center font-medium">Growing</span>
        <span className="text-center font-medium">Complete</span>
      </div>
    </div>
  );
}; 